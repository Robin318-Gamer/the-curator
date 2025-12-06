/**
 * WordPress Update API
 * PUT: Update an existing WordPress post
 */

import { NextRequest, NextResponse } from 'next/server'
import { getWordPressConfig, getPublishedArticleById, updatePublishedArticle, addAuditLog } from '@/lib/db/wordpress'
import { WordPressClient } from '@/lib/wordpress/client'
import { WordPressError } from '@/lib/wordpress/errors'

/**
 * PUT /api/admin/wordpress/update
 * Update existing WordPress post
 * 
 * Body:
 * {
 *   article_id: string,
 *   title?: string,
 *   content?: string,
 *   excerpt?: string,
 *   categories?: number[],
 *   tags?: number[],
 *   status?: 'draft' | 'publish',
 *   updated_by: string
 * }
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()

    // Validation
    if (!body.article_id || !body.updated_by) {
      return NextResponse.json(
        { error: 'Missing required fields: article_id, updated_by' },
        { status: 400 }
      )
    }

    // Fetch existing article
    const existingArticle = await getPublishedArticleById(body.article_id)

    if (!existingArticle) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      )
    }

    // Fetch WordPress configuration
    const config = await getWordPressConfig()

    if (!config) {
      return NextResponse.json(
        { error: 'No WordPress configuration found' },
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

    const client = new WordPressClient(config.site_url, authContext)

    // Prepare update data
    const updateData: Record<string, any> = {}
    if (body.title) updateData.title = body.title
    if (body.content) updateData.content = body.content
    if (body.excerpt) updateData.excerpt = body.excerpt
    if (body.categories) updateData.categories = body.categories
    if (body.tags) updateData.tags = body.tags
    if (body.status) updateData.status = body.status

    // Update on WordPress
    const wpResponse = await client.put(`/posts/${existingArticle.wp_post_id}`, updateData)

    // Update in database
    const updatedArticle = await updatePublishedArticle({
      id: body.article_id,
      title: body.title,
      content: body.content,
      excerpt: body.excerpt,
      wp_categories: body.categories,
      wp_tags: body.tags,
      sync_status: 'synced',
    })

    // Add audit log
    await addAuditLog({
      article_id: body.article_id,
      action: 'update',
      admin_user_id: body.updated_by,
      old_data: {
        title: existingArticle.title,
        content: existingArticle.content,
        excerpt: existingArticle.excerpt,
      },
      new_data: updateData,
      wp_response: wpResponse,
      status: 'success',
      environment: process.env.NODE_ENV as 'development' | 'production',
    })

    return NextResponse.json({
      success: true,
      article: updatedArticle,
      wordpress: {
        id: wpResponse.id,
        link: wpResponse.link,
        modified: wpResponse.modified,
      },
    })
  } catch (error) {
    console.error('[WordPress Update Error]', error)

    // Add failed audit log
    try {
      const body = await request.json().catch(() => ({}))
      await addAuditLog({
        article_id: body.article_id,
        action: 'update',
        admin_user_id: body.updated_by || 'unknown',
        new_data: body,
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        environment: process.env.NODE_ENV as 'development' | 'production',
      })
    } catch (logError) {
      console.error('[Audit Log Error]', logError)
    }

    if (error instanceof WordPressError) {
      return NextResponse.json(
        {
          success: false,
          error: 'WordPress API error',
          details: error.message,
          code: error.code,
        },
        { status: error.statusCode || 500 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update article',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
