import { NextRequest, NextResponse } from 'next/server';
import { ArticleScraper } from '@/lib/scrapers/ArticleScraper';
import { CategoryScheduler } from '@/lib/scrapers/categoryScheduler';
import { createAutomationHistory, updateAutomationHistory } from '@/lib/services/automationHistory';
import { appendAutomationLog } from '@/lib/utils/automationLogger';
import { supabaseAdmin } from '@/lib/db/supabase';
import { hk01SourceConfig } from '@/lib/constants/sources';
import { importArticle } from '@/lib/supabase/articlesClient';
import type { ScraperCategory, ScrapedArticle } from '@/lib/types/database';
import puppeteer from 'puppeteer';
import { randomUUID } from 'crypto';

const NEWSLIST_TABLE = 'newslist';

interface ArticleRunRequest {
  categorySlug?: string;
  limit?: number;
  force?: boolean;
}

interface ArticleEntry {
  id: string;
  url: string;
  status: string;
  source_id: string;
  attempt_count: number;
  last_processed_at?: string;
  error_log?: string;
  resolved_article_id?: string;
}

async function fetchPageHtml(url: string): Promise<string> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });
  const page = await browser.newPage();

  await page.setRequestInterception(true);
  page.on('request', (request) => {
    const resourceType = request.resourceType();
    if (['font', 'stylesheet', 'media', 'image'].includes(resourceType)) {
      request.abort();
    } else {
      request.continue();
    }
  });

  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36');
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {});
  await new Promise((resolve) => setTimeout(resolve, 1500));
  const html = await page.content();
  await browser.close();
  return html;
}

function buildScraperSource(category: ScraperCategory) {
  const baseSource = category.source ?? hk01SourceConfig;
  const baseSourceAny = baseSource as Record<string, unknown>;
  const selectors =
    (category.source?.scraper_config as { selectors?: Record<string, string> })?.selectors ??
    // if baseSource doesn't expose article_page_config, fall back safely
    ((baseSourceAny?.article_page_config as Record<string, unknown>)?.selectors ?? hk01SourceConfig.article_page_config?.selectors ?? {});

  return {
    ...hk01SourceConfig,
    id: category.source_id,
    source_key: baseSource.source_key,
    name: baseSource.name,
    base_url: baseSource.base_url,
    article_page_config: {
      selectors,
    },
  };
}

async function fetchPendingEntries(category: ScraperCategory, limit: number, force: boolean): Promise<ArticleEntry[]> {
  if (!supabaseAdmin) {
    throw new Error('Supabase service role client is required.');
  }

  const statuses = force ? ['pending', 'failed'] : ['pending'];
  const { data, error } = await supabaseAdmin
    .from(NEWSLIST_TABLE)
    .select('*')
    .eq('source_id', category.source_id)
    .in('status', statuses)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    throw error;
  }

  return (data ?? []) as ArticleEntry[];
}

async function updateNewslistEntry(entryId: string, patch: Partial<ArticleEntry>) {
  if (!supabaseAdmin) {
    throw new Error('Supabase service role client unavailable');
  }

  await supabaseAdmin
    .from(NEWSLIST_TABLE)
    .update(patch)
    .eq('id', entryId)
    .select('id');
}

export async function POST(request: NextRequest) {
  try {
    const body: ArticleRunRequest = await request.json().catch(() => ({}));
    const limit = body.limit && body.limit > 0 ? Math.min(body.limit, 10) : 4;
    let category: ScraperCategory | null = null;

    try {
      category = await CategoryScheduler.selectCategory(body.categorySlug);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('[Scraper Article] Failed to load scheduler category', errorMessage);
      return NextResponse.json(
        { success: false, error: `Category selection failed: ${errorMessage}` },
        { status: 500 }
      );
    }

    if (!category) {
      return NextResponse.json({ success: false, error: 'No enabled category found for scheduling.' }, { status: 404 });
    }

    const runId = randomUUID();
    await createAutomationHistory({
      runId,
      categorySlug: category.slug,
      sourceId: category.source_id,
    });

    const entries = await fetchPendingEntries(category, limit, Boolean(body.force));
    const errors: string[] = [];
    let processed = 0;
    const startedAt = new Date().toISOString();

    const sourceForScraper = buildScraperSource(category);

    for (const entry of entries) {
      const attemptTimestamp = new Date().toISOString();
      await updateNewslistEntry(entry.id, {
        status: 'processing',
        attempt_count: entry.attempt_count + 1,
        last_processed_at: attemptTimestamp,
      });

      try {
        const html = await fetchPageHtml(entry.url);
        const scraper = new ArticleScraper(sourceForScraper as any);
        const result = await scraper.scrapeArticle(html, entry.url);

        if (!result.success) {
          throw new Error(result.error ?? 'Scraper returned failure.');
        }

        const importOutcome = await importArticle(result.data as ScrapedArticle, entry.url, {
          skipProcessingStatus: true,
        });

        if (!importOutcome.success) {
          throw new Error(importOutcome.error ?? importOutcome.message);
        }

        processed += 1;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        errors.push(message);
        await updateNewslistEntry(entry.id, {
          status: 'failed',
          error_log: message,
          last_processed_at: new Date().toISOString(),
        });
      }
    }

    const completedAt = new Date().toISOString();
    await updateAutomationHistory(runId, {
      status: 'completed',
      completedAt,
      articlesProcessed: processed,
      errors,
    });

    await CategoryScheduler.refreshLastRun(category.id, completedAt);

    await appendAutomationLog({
      runId,
      categorySlug: category.slug,
      status: 'completed',
      articlesProcessed: processed,
      errors,
      startedAt,
      completedAt,
    });

    return NextResponse.json({ success: true, data: { runId, processed, errors } });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[Scraper Article] Unexpected error:', errorMessage);
    return NextResponse.json(
      { success: false, error: `Internal server error: ${errorMessage}` },
      { status: 500 }
    );
  }
}