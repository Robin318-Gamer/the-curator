import { NextRequest } from 'next/server';
import { ArticleScraper } from '@/lib/scrapers/ArticleScraper';
import { hk01SourceConfig } from '@/lib/constants/sources';
import type { NewsSource } from '@/lib/types/database';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

// For demo: only HK01 supported. Add more sources as needed.
const SCRAPER_CONFIGS: Record<string, NewsSource> = {
  hk01: hk01SourceConfig,
};

export async function POST(req: NextRequest) {
  let browser;
  try {
    const { url, sourceKey = 'hk01' } = await req.json();
    if (!url || typeof url !== 'string') {
      return Response.json({ success: false, error: 'Missing or invalid URL.' }, { status: 400 });
    }
    const config = SCRAPER_CONFIGS[sourceKey] || hk01SourceConfig;
    
    // Timeout protection for Vercel (8 second limit for this function)
    const startTime = Date.now();
    const MAX_TIME = 8000;
    
    // Launch Puppeteer with Vercel/serverless optimization using @sparticuz/chromium
    // Detect if we're on Vercel/serverless (no local Chrome)
    const isVercel = process.env.VERCEL === '1' || !process.env.PUPPETEER_EXECUTABLE_PATH;
    
    let launchOptions: any;
    
    if (isVercel) {
      // On Vercel: use @sparticuz/chromium
      launchOptions = {
        args: chromium.args,
        executablePath: await chromium.executablePath(),  // No path parameter needed
        headless: 'new' as any,
      };
    } else {
      // Local development: use local Chrome/Chromium
      const puppeteerRegular = await import('puppeteer');
      browser = await puppeteerRegular.default.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
    }

    // Launch browser if not already launched (local dev case)
    if (!browser && launchOptions) {
      try {
        browser = await puppeteer.launch(launchOptions);
      } catch (launchErr) {
        const errorMsg = launchErr instanceof Error ? launchErr.message : String(launchErr);
        console.error('[Scraper] Failed to launch browser:', errorMsg);
        
        return Response.json({ 
          success: false, 
          error: 'Browser not available on this server',
          details: errorMsg,
          hint: 'For Vercel: ensure @sparticuz/chromium v143+ is installed. For local: run npx puppeteer browsers install chrome'
        }, { status: 503 });
      }
    }

    if (!browser) {
      return Response.json({ 
        success: false, 
        error: 'Failed to launch browser' 
      }, { status: 503 });
    }
    const page = await browser.newPage();
    
    // Block unnecessary resources to speed up loading
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      const resourceType = request.resourceType();
      if (['font', 'stylesheet', 'media'].includes(resourceType)) {
        request.abort();
      } else {
        request.continue();
      }
    });
    
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    // Navigate to the URL - use 'domcontentloaded' instead of 'networkidle2'
    console.log('[Scraper] Navigating to:', url);
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 12000 });
    } catch (navErr) {
      console.error('[Scraper] Navigation error:', navErr instanceof Error ? navErr.message : String(navErr));
      return Response.json({ 
        success: false, 
        error: 'Failed to load article page',
        details: navErr instanceof Error ? navErr.message : String(navErr)
      }, { status: 503 });
    }
    
    // Wait for the main content to be present (with fallback)
    try {
      await page.waitForSelector('[data-testid="article-top-section"]', { timeout: 3000 });
      console.log('[Scraper] Article section found');
    } catch {
      console.warn('[Scraper] Main section not found, attempting content extraction anyway');
    }
    
    // Scroll to trigger lazy loading
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    
    // Wait 2 seconds for lazy-loaded images (reduced from 3)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check time remaining
    const elapsed = Date.now() - startTime;
    if (elapsed > MAX_TIME * 0.75) {
      console.warn('[Scraper] Approaching timeout, skipping additional processing');
    }
    
    // Get the fully rendered HTML
    const html = await page.content();
    
    if (!html || html.length < 100) {
      return Response.json({ 
        success: false, 
        error: 'Failed to extract page content',
        details: 'Page HTML is empty or too short'
      }, { status: 503 });
    }
    
    // Run scraper, passing URL for ID extraction
    console.log('[Scraper] Starting article parsing...');
    const scraper = new ArticleScraper(config);
    const result = await scraper.scrapeArticle(html, url);
    
    if (!result.success) {
      console.error('[Scraper] Parsing failed:', result.error);
      return Response.json({ success: false, error: result.error }, { status: 422 });
    }
    
    console.log('[Scraper] Successfully scraped article:', result.data?.title || 'unknown');
    return Response.json({ success: true, data: result.data });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[Scraper] Caught error:', errorMsg);
    return Response.json({ success: false, error: errorMsg }, { status: 500 });
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (closeErr) {
        console.error('[Scraper] Error closing browser:', closeErr);
      }
    }
  }
}
