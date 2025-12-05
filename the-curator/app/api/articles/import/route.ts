/**
 * API Endpoint: POST /api/articles/import
 * 
 * Imports a scraped article into the database
 * - Handles deduplication by (source_id, source_article_id)
 * - Saves article metadata and content
 * - Saves all article images to article_images table
 * - Returns status and imported article ID
 * 
 * Request Body:
 * {
 *   scrapedArticle: ScrapedArticle (from HK01ArticleScraper),
 *   sourceUrl: string (original HK01 URL)
 * }
 * 
 * Response:
 * {
 *   success: boolean,
 *   articleId?: string (database ID if imported),
 *   isNew: boolean (true if newly imported, false if already exists),
 *   message: string,
 *   error?: string (if failed)
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { importArticle } from '@/lib/supabase/articlesClient';
import { ScrapedArticle } from '@/lib/types/database';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { scrapedArticle, sourceUrl } = body;

    // Validate input
    if (!scrapedArticle) {
      return NextResponse.json(
        { success: false, message: 'Missing scrapedArticle in request body' },
        { status: 400 }
      );
    }

    if (!sourceUrl) {
      return NextResponse.json(
        { success: false, message: 'Missing sourceUrl in request body' },
        { status: 400 }
      );
    }

    // Validate required fields in scrapedArticle
    if (!scrapedArticle.articleId) {
      return NextResponse.json(
        { success: false, message: 'Missing articleId in scrapedArticle' },
        { status: 400 }
      );
    }

    if (!scrapedArticle.title) {
      return NextResponse.json(
        { success: false, message: 'Missing title in scrapedArticle' },
        { status: 400 }
      );
    }

    // Import article
    const result = await importArticle(scrapedArticle as ScrapedArticle, sourceUrl);

    // Return result
    if (result.success) {
      return NextResponse.json(result, { status: result.isNew ? 201 : 200 });
    } else {
      return NextResponse.json(result, { status: 400 });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Import API error:', errorMessage);

    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for checking if an article exists
 * Query: ?articleId=60300150
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const articleId = searchParams.get('articleId');

    if (!articleId) {
      return NextResponse.json(
        { success: false, message: 'Missing articleId query parameter' },
        { status: 400 }
      );
    }

    // Check if article exists
    const { checkArticleExists } = await import('@/lib/supabase/articlesClient');
    const exists = await checkArticleExists(articleId);

    return NextResponse.json({
      success: true,
      articleId,
      exists,
      message: exists ? 'Article already in database' : 'Article not found in database',
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Check article API error:', errorMessage);

    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
