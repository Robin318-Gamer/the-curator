import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import { supabaseAdmin, supabase } from "@/lib/db/supabase";
import { ArticleScraper } from "@/lib/scrapers/ArticleScraper";
import { hk01SourceConfig } from "@/lib/constants/sources";
import { getSourceConfig } from "@/lib/constants/sourceRegistry";
import { importArticle } from "@/lib/supabase/articlesClient";
import type { ScrapedArticle } from "@/lib/types/database";
import { logException, extractErrorDetails } from "@/lib/services/exceptionLogger";

const MAX_BATCH = 25;
const FALLBACK_SOURCE_CONFIG = hk01SourceConfig;

// Check if running in production (Vercel)
const isProduction = process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production';

export async function POST(request: NextRequest) {
  const dbClient = supabaseAdmin ?? supabase;
  if (!dbClient) {
    return NextResponse.json(
      { success: false, message: "Supabase admin client not configured" },
      { status: 500 }
    );
  }

  let requestBody: any;
  try {
    requestBody = await request.json().catch(() => ({}));
  } catch (parseError) {
    const errorDetails = extractErrorDetails(parseError);
    await logException(dbClient, {
      errorType: errorDetails.type,
      errorMessage: errorDetails.message,
      errorStack: errorDetails.stack,
      endpoint: '/api/admin/newslist/process',
      operation: 'parse_request_body',
      requestMethod: 'POST',
      requestUrl: request.url,
      severity: 'error',
    });
    return NextResponse.json(
      { success: false, message: "Invalid request body" },
      { status: 400 }
    );
  }

  const body = requestBody;
  const ids = Array.isArray(body?.ids) ? (body.ids as string[]).filter(Boolean) : [];
  const processAllPending = Boolean(body?.processAllPending);
  const requestedLimit = typeof body?.limit === "number" ? Math.max(1, body.limit) : MAX_BATCH;
  const limit = Math.min(MAX_BATCH, requestedLimit);

  if (!processAllPending && ids.length === 0) {
    await logException(dbClient, {
      errorType: 'ValidationError',
      errorMessage: 'Missing required parameters: ids[] or processAllPending=true',
      endpoint: '/api/admin/newslist/process',
      operation: 'validate_request',
      requestMethod: 'POST',
      requestUrl: request.url,
      requestBody: body,
      severity: 'warning',
    });
    return NextResponse.json(
      { success: false, message: "Provide ids[] or set processAllPending=true" },
      { status: 400 }
    );
  }

  let query = dbClient
    .from("newslist")
    .select(
      "id, source_article_id, url, status, attempt_count, meta, source:news_sources(source_key, name)"
    )
    .order("created_at", { ascending: true });

  if (ids.length > 0) {
    query = query.in("id", ids);
  } else {
    query = query.eq("status", "pending").limit(limit);
  }

  const { data: entries, error } = await query;

  if (error) {
    await logException(dbClient, {
      errorType: 'DatabaseError',
      errorMessage: error.message,
      endpoint: '/api/admin/newslist/process',
      operation: 'fetch_newslist_entries',
      requestMethod: 'POST',
      requestUrl: request.url,
      requestBody: body,
      severity: 'error',
      metadata: { errorDetails: error },
    });
    return NextResponse.json(
      { success: false, message: "Failed to load newslist entries", error: error.message },
      { status: 500 }
    );
  }

  if (!entries || entries.length === 0) {
    return NextResponse.json(
      { success: false, message: "No newslist entries matched the criteria" },
      { status: 404 }
    );
  }

  let browser;
  try {
    if (isProduction) {
      // Use chromium for serverless environment (Vercel)
      browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: { width: 1920, height: 1080 },
        executablePath: await chromium.executablePath(),
        headless: true,
      });
    } else {
      // Use local puppeteer for development - uses local Chrome/Chromium
      const puppeteerLocal = await import("puppeteer");
      browser = await puppeteerLocal.default.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
      });
    }
  } catch (launchError) {
    const errorDetails = extractErrorDetails(launchError);
    
    // For development, provide helpful error message about Chrome installation
    let helpfulMessage = errorDetails.message;
    if (!isProduction && errorDetails.message.includes('spawn')) {
      helpfulMessage = 'Chrome not found. Run: npx puppeteer browsers install chrome';
    }
    
    await logException(dbClient, {
      errorType: errorDetails.type,
      errorMessage: helpfulMessage,
      errorStack: errorDetails.stack,
      endpoint: '/api/admin/newslist/process',
      operation: 'launch_browser',
      requestMethod: 'POST',
      requestUrl: request.url,
      severity: 'critical',
      metadata: { isProduction, environment: process.env.NODE_ENV },
    });
    return NextResponse.json(
      { success: false, message: "Failed to launch browser", error: helpfulMessage },
      { status: 500 }
    );
  }

  const results: Array<{
    id: string;
    sourceArticleId?: string | null;
    status: "imported" | "existing" | "failed";
    message: string;
    articleId?: string;
  }> = [];
  let imported = 0;
  let existing = 0;
  let failed = 0;

  try {
    for (const entry of entries) {
      const page = await browser.newPage();
      try {
        await page.setRequestInterception(true);
        page.on("request", requestEvent => {
          const resourceType = requestEvent.resourceType();
          if (["font", "stylesheet", "media"].includes(resourceType)) {
            requestEvent.abort();
          } else {
            requestEvent.continue();
          }
        });
        await page.setUserAgent(
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36"
        );
        await page.goto(entry.url, { waitUntil: "domcontentloaded", timeout: 15000 });
        await page.waitForSelector('[data-testid="article-top-section"]', { timeout: 5000 }).catch(() => {
          /* continue even if selector missing */
        });
        await (page.evaluate as any)(() => {
          window.scrollTo(0, document.body.scrollHeight);
        });
        await new Promise(resolve => setTimeout(resolve, 2500));
        const html = await page.content();

        // Normalize entry.source whether DB returned an object or an array
        let sourceKey = "hk01";
        const srcCandidate = Array.isArray(entry.source) ? entry.source[0] : entry.source;
        if (srcCandidate && typeof srcCandidate === "object") {
          // use a type assertion to avoid TS narrowing to `never` for unknown DB shapes
          sourceKey = (srcCandidate as any)?.source_key ?? "hk01";
        }
        
        // Get source config using sourceRegistry (supports both HK01 and MingPao)
        const sourceConfig = getSourceConfig(sourceKey) ?? FALLBACK_SOURCE_CONFIG;
        const scraper = new ArticleScraper(sourceConfig);
        const scrapeResult = await scraper.scrapeArticle(html, entry.url);

        if (!scrapeResult.success || !scrapeResult.data) {
          throw new Error(scrapeResult.error || "Scraper failed to return article data");
        }

        const importResult = await importArticle(scrapeResult.data as ScrapedArticle, entry.url, {
          sourceKey: sourceKey,
        });

        if (!importResult.success) {
          failed++;
          results.push({
            id: entry.id,
            sourceArticleId: scrapeResult.data.articleId,
            status: "failed",
            message: importResult.error || importResult.message,
          });
          continue;
        }

        if (importResult.isNew) {
          imported++;
        } else {
          existing++;
        }

        results.push({
          id: entry.id,
          sourceArticleId: scrapeResult.data.articleId,
          articleId: importResult.articleId,
          status: importResult.isNew ? "imported" : "existing",
          message: importResult.message,
        });
      } catch (entryError) {
        failed++;
        const errorMessage = entryError instanceof Error ? entryError.message : String(entryError);
        results.push({
          id: entry.id,
          sourceArticleId: entry.source_article_id,
          status: "failed",
          message: errorMessage,
        });
        await dbClient
          .from("newslist")
          .update({
            status: "failed",
            error_log: errorMessage,
            attempt_count: (entry.attempt_count ?? 0) + 1,
            last_processed_at: new Date().toISOString(),
          })
          .eq("id", entry.id);
      } finally {
        await page.close();
      }
    }
  } catch (globalError) {
    const errorDetails = extractErrorDetails(globalError);
    await logException(dbClient, {
      errorType: errorDetails.type,
      errorMessage: errorDetails.message,
      errorStack: errorDetails.stack,
      endpoint: '/api/admin/newslist/process',
      operation: 'process_articles',
      requestMethod: 'POST',
      requestUrl: request.url,
      requestBody: body,
      severity: 'critical',
      metadata: { processedCount: results.length, imported, existing, failed },
    });
    
    await browser?.close();
    
    return NextResponse.json({
      success: false,
      message: "Processing failed with critical error",
      error: errorDetails.message,
      processed: results.length,
      imported,
      existing,
      failed,
      results,
    }, { status: 500 });
  } finally {
    await browser.close();
  }

  return NextResponse.json({
    success: true,
    processed: entries.length,
    imported,
    existing,
    failed,
    results,
  });
}
