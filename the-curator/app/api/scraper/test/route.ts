import { NextRequest, NextResponse } from 'next/server';
import { ArticleScraper } from '@/lib/scrapers/ArticleScraper';
import { ScraperValidator, type ExpectedArticleData } from '@/lib/scrapers/ScraperValidator';
import { supabase } from '@/lib/db/supabase';
import type { NewsSource } from '@/lib/types/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sourceId, html, expectedData } = body;

    if (!sourceId || !html || !expectedData) {
      return NextResponse.json(
        { error: 'Missing required fields: sourceId, html, expectedData' },
        { status: 400 }
      );
    }

    // Fetch source configuration
    const { data: source, error: sourceError } = await supabase
      .from('news_sources')
      .select('*')
      .eq('id', sourceId)
      .single();

    if (sourceError || !source) {
      return NextResponse.json(
        { error: 'News source not found' },
        { status: 404 }
      );
    }

    // Initialize scraper
    const scraper = new ArticleScraper(source as NewsSource);

    // Scrape the HTML
    const scrapeResult = await scraper.scrapeArticle(html);

    if (!scrapeResult.success) {
      return NextResponse.json({
        success: false,
        error: scrapeResult.error,
        executionTime: scrapeResult.executionTime,
      });
    }

    // Validate against expected data
    const validationResults = ScraperValidator.validate(
      expectedData as ExpectedArticleData,
      scrapeResult.data
    );

    const validationStatus = ScraperValidator.getOverallStatus(validationResults);

    return NextResponse.json({
      success: true,
      scrapedData: scrapeResult.data,
      validationResults,
      validationStatus,
      executionTime: scrapeResult.executionTime,
    });
  } catch (error) {
    console.error('Scraper test error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
