/**
 * WordPress List API
 * GET: List published articles with pagination and filtering
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPublishedArticles } from '@/lib/db/wordpress'
import { WordPressDatabaseError } from '@/lib/wordpress/errors'

/**
 * GET /api/admin/wordpress/list
 * List published articles
 * 
 * Query params:
 * - page: number (default: 1)
 * - limit: number (default: 20, max: 100)
 * - search: string (optional)
 * - include_deleted: boolean (default: false)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100)
    const search = searchParams.get('search') || undefined
    const includeDeleted = searchParams.get('include_deleted') === 'true'

    // Validation
    if (page < 1) {
      return NextResponse.json(
        { error: 'Page must be >= 1' },
        { status: 400 }
      )
    }

    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Limit must be between 1 and 100' },
        { status: 400 }
      )
    }

    // Fetch articles
    const articles = await getPublishedArticles({
      page,
      limit,
      search,
      includeDeleted,
    })

    return NextResponse.json({
      articles,
      pagination: {
        page,
        limit,
        total: articles.length,
        has_more: articles.length === limit,
      },
      filters: {
        search: search || null,
        include_deleted: includeDeleted,
      },
    })
  } catch (error) {
    console.error('[WordPress List Error]', error)

    if (error instanceof WordPressDatabaseError) {
      return NextResponse.json(
        {
          error: 'Database error fetching articles',
          details: error.message,
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        error: 'Failed to fetch articles',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
