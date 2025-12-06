/**
 * WordPress Configuration API
 * GET: Fetch current WordPress configuration
 * POST: Save or update WordPress configuration
 */

import { NextRequest, NextResponse } from 'next/server'
import { getWordPressConfig, saveWordPressConfig } from '@/lib/db/wordpress'
import { WordPressDatabaseError } from '@/lib/wordpress/errors'

/**
 * GET /api/admin/wordpress/config
 * Fetch current WordPress configuration (credentials decrypted)
 */
export async function GET() {
  try {
    const config = await getWordPressConfig()

    if (!config) {
      return NextResponse.json(
        { error: 'No WordPress configuration found' },
        { status: 404 }
      )
    }

    // Return config without sensitive fields for security
    const { password, api_token, password_encrypted, api_token_encrypted, ...safeConfig } = config

    return NextResponse.json({ config: safeConfig })
  } catch (error) {
    console.error('[WordPress Config GET Error]', error)

    // If tables don't exist yet, return 404 instead of 500
    if (error instanceof WordPressDatabaseError) {
      const errorMessage = error.message || ''
      if (errorMessage.includes('relation') || errorMessage.includes('does not exist') || errorMessage.includes('schema')) {
        return NextResponse.json(
          { error: 'WordPress tables not yet created. Please run the setup SQL script.' },
          { status: 404 }
        )
      }
      
      return NextResponse.json(
        { error: 'Database error fetching configuration', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to fetch WordPress configuration' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/wordpress/config
 * Save or update WordPress configuration
 * 
 * Body:
 * {
 *   site_url: string,
 *   site_name?: string,
 *   auth_method: 'password' | 'token',
 *   username?: string,
 *   password?: string,
 *   api_token?: string,
 *   created_by: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validation
    if (!body.site_url || !body.auth_method || !body.created_by) {
      return NextResponse.json(
        { error: 'Missing required fields: site_url, auth_method, created_by' },
        { status: 400 }
      )
    }

    // Validate auth method credentials
    if (body.auth_method === 'password' && (!body.username || !body.password)) {
      return NextResponse.json(
        { error: 'Username and password required for password authentication' },
        { status: 400 }
      )
    }

    if (body.auth_method === 'token' && !body.api_token) {
      return NextResponse.json(
        { error: 'API token required for token authentication' },
        { status: 400 }
      )
    }

    // Validate URL format
    try {
      const url = new URL(body.site_url)
      if (url.protocol !== 'https:') {
        return NextResponse.json(
          { error: 'WordPress site URL must use HTTPS' },
          { status: 400 }
        )
      }
    } catch {
      return NextResponse.json(
        { error: 'Invalid WordPress site URL format' },
        { status: 400 }
      )
    }

    const config = await saveWordPressConfig(body)

    // Return without sensitive fields
    const { password, api_token, password_encrypted, api_token_encrypted, ...safeConfig } = config

    return NextResponse.json({ config: safeConfig }, { status: 201 })
  } catch (error) {
    console.error('[WordPress Config POST Error]', error)

    if (error instanceof WordPressDatabaseError) {
      return NextResponse.json(
        { error: 'Database error saving configuration', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to save WordPress configuration' },
      { status: 500 }
    )
  }
}
