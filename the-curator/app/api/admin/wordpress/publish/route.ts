/**
 * WordPress Publish API
 * POST: Publish an article to WordPress
 */

import { NextRequest, NextResponse } from 'next/server'
import { getWordPressConfig } from '@/lib/db/wordpress'
import { publishArticle, addAuditLog } from '@/lib/db/wordpress'
import { WordPressClient } from '@/lib/wordpress/client'
import { WordPressXMLRPCClient } from '@/lib/wordpress/xmlrpc-client'
import { WordPressError } from '@/lib/wordpress/errors'

/**
 * POST /api/admin/wordpress/publish
 * Publish article to WordPress and record in database
 * 
 * Body:
 * {
 *   title: string,
 *   content: string,
 *   excerpt?: string,
 *   featured_image_url?: string,
 *   categories?: number[],
 *   tags?: number[],
 *   status?: 'draft' | 'publish',
 *   published_by: string
 * }
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  let body: any = {}

  try {
    body = await request.json()

    // Validation
    if (!body.title || !body.content || !body.published_by) {
      return NextResponse.json(
        { error: 'Missing required fields: title, content, published_by' },
        { status: 400 }
      )
    }

    // Fetch WordPress configuration
    const config = await getWordPressConfig()

    if (!config) {
      return NextResponse.json(
        { error: 'No WordPress configuration found. Please configure WordPress first.' },
        { status: 404 }
      )
    }

    // Create WordPress client
    const authContext: any = {
      method: config.auth_method,
    }

    if (config.auth_method === 'password') {
      authContext.username = config.username
      authContext.password = config.password
    } else if (config.auth_method === 'token') {
      authContext.token = config.api_token
    }

    // Check if this is a WordPress.com site (use XML-RPC for free accounts)
    const isWordPressCom = config.site_url.includes('.wordpress.com')

    // Prepare post data
    const postData = {
      title: body.title,
      content: body.content,
      excerpt: body.excerpt || '',
      status: body.status || 'publish',
      ...(body.categories && body.categories.length > 0 && { categories: body.categories }),
      ...(body.tags && body.tags.length > 0 && { tags: body.tags }),
    }

    // Publish to WordPress
    let wpResponse: any
    try {
      if (isWordPressCom && config.auth_method === 'password') {
        // Use XML-RPC for WordPress.com free accounts
        const xmlrpcClient = new WordPressXMLRPCClient(config.site_url, {
          username: config.username!,
          password: config.password!,
        })
        wpResponse = await xmlrpcClient.createPost(postData)
        console.log('[XML-RPC Response]', wpResponse)
      } else {
        // Use REST API for self-hosted or premium WordPress.com accounts
        const client = new WordPressClient(config.site_url, authContext)
        wpResponse = await client.post('posts', postData)
        console.log('[REST API Response]', wpResponse)
      }
      
      // Ensure wpResponse has required fields
      if (!wpResponse || !wpResponse.id) {
        throw new Error('WordPress did not return a valid post ID')
      }
      
      if (!wpResponse.link) {
        console.warn('[Warning] WordPress did not return a link, using fallback')
        wpResponse.link = `${config.site_url}/?p=${wpResponse.id}`
      }
      
      console.log('[Final wpResponse]', { id: wpResponse.id, link: wpResponse.link })
    } catch (wpError) {
      console.error('[WordPress Post Error]', wpError)
      throw wpError
    }

    // Record in database
    const article = await publishArticle({
      title: body.title,
      content: body.content,
      excerpt: body.excerpt,
      featured_image_url: body.featured_image_url,
      wp_post_id: wpResponse.id,
      wp_post_url: wpResponse.link,
      wp_site_config_id: config.id,
      wp_categories: body.categories,
      wp_tags: body.tags,
      published_by: body.published_by,
    })

    // Add audit log
    await addAuditLog({
      article_id: article.id,
      action: 'publish',
      admin_user_id: body.published_by,
      new_data: postData,
      wp_response: wpResponse,
      status: 'success',
      environment: process.env.NODE_ENV as 'development' | 'production',
    })

    const duration = Date.now() - startTime

    return NextResponse.json({
      success: true,
      article,
      wordpress: {
        id: wpResponse.id,
        link: wpResponse.link,
        status: wpResponse.status,
      },
      duration_ms: duration,
    }, { status: 201 })
  } catch (error) {
    console.error('[WordPress Publish Error]', error)

    // Add failed audit log
    try {
      // Use the body variable from outer scope
      if (body && Object.keys(body).length > 0) {
        await addAuditLog({
          action: 'publish',
          admin_user_id: body.published_by || 'unknown',
          new_data: body,
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          environment: process.env.NODE_ENV as 'development' | 'production',
        })
      }
    } catch (logError) {
      console.error('[Audit Log Error]', logError)
    }

    if (error instanceof WordPressError) {
      console.error('[WordPressError Details]', {
        message: error.message,
        code: error.code,
        details: error.details,
      })
      
      let errorMessage = error.message
      if (error.message.includes('not allowed to post') || error.message.includes('403')) {
        errorMessage = 'WordPress.com free accounts do not support publishing via API. Please upgrade to WordPress Business plan or use a self-hosted WordPress site. Visit https://wordpress.com/pricing/ for upgrade options.'
      }
      
      return NextResponse.json(
        {
          success: false,
          error: errorMessage,
          details: error.details,
          code: error.code,
        },
        { status: 500 }
      )
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('[Publishing Error Details]', { errorMessage, error })

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to publish article',
        details: errorMessage,
      },
      { status: 500 }
    )
  }
}
