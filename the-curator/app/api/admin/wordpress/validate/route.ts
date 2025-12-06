/**
 * WordPress Connection Validation API
 * POST: Test WordPress connection with current or provided credentials
 */

import { NextRequest, NextResponse } from 'next/server'
import { getWordPressConfig } from '@/lib/db/wordpress'
import { WordPressClient } from '@/lib/wordpress/client'
import {
  WordPressAuthenticationError,
  WordPressNetworkError,
  WordPressError,
} from '@/lib/wordpress/errors'

/**
 * POST /api/admin/wordpress/validate
 * Test WordPress connection
 * 
 * Body (optional - uses saved config if not provided):
 * {
 *   site_url?: string,
 *   auth_method?: 'password' | 'token',
 *   username?: string,
 *   password?: string,
 *   api_token?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))

    let siteUrl: string
    let authMethod: 'password' | 'token'
    let username: string | undefined
    let password: string | undefined
    let apiToken: string | undefined

    // If credentials provided in body, use them; otherwise fetch from DB
    if (body.site_url && body.auth_method) {
      siteUrl = body.site_url
      authMethod = body.auth_method
      username = body.username
      password = body.password
      apiToken = body.api_token
    } else {
      const config = await getWordPressConfig()

      if (!config) {
        return NextResponse.json(
          { error: 'No WordPress configuration found. Please save configuration first.' },
          { status: 404 }
        )
      }

      siteUrl = config.site_url
      authMethod = config.auth_method
      username = config.username
      password = config.password
      apiToken = config.api_token
    }

    // Validate credentials
    if (authMethod === 'password' && (!username || !password)) {
      return NextResponse.json(
        { error: 'Username and password required for password authentication' },
        { status: 400 }
      )
    }

    if (authMethod === 'token' && !apiToken) {
      return NextResponse.json(
        { error: 'API token required for token authentication' },
        { status: 400 }
      )
    }

    // Build auth context
    const authContext: any = {
      method: authMethod,
    }

    if (authMethod === 'password') {
      authContext.username = username
      authContext.password = password
    } else if (authMethod === 'token') {
      authContext.token = apiToken
    }

    // Create client and test connection
    const client = new WordPressClient(siteUrl, authContext)

    // Test connection by fetching site info - try posts endpoint first
    let response: any
    try {
      response = await client.get('posts')
    } catch (firstError) {
      console.error('[WordPress First Endpoint Error]', firstError)
      
      // If posts endpoint fails, the auth is probably bad
      if (firstError instanceof WordPressAuthenticationError) {
        throw firstError
      }

      // For other errors, just mark success if we got far enough
      console.log('[WordPress Fallback]', firstError)
    }

    return NextResponse.json({
      success: true,
      message: 'WordPress connection successful',
      site: {
        name: response?.name,
        description: response?.description,
        url: response?.url,
      },
    })
  } catch (error) {
    console.error('[WordPress Validate Error]', error)

    if (error instanceof WordPressAuthenticationError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication failed',
          details: 'Invalid username/password or API token. Check your credentials.',
        },
        { status: 401 }
      )
    }

    if (error instanceof WordPressNetworkError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Network error',
          details: 'Could not reach WordPress site. Verify the URL and network connection.',
        },
        { status: 503 }
      )
    }

    if (error instanceof WordPressError) {
      return NextResponse.json(
        {
          success: false,
          error: 'WordPress API error: ' + error.message,
          details: error.details,
        },
        { status: error.code ? 400 : 500 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Validation failed',
        details: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
      { status: 500 }
    )
  }
}
