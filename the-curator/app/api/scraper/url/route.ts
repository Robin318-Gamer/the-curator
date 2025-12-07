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
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    
    // Wait for the main content to be present
    await page.waitForSelector('[data-testid="article-top-section"]', { timeout: 5000 }).catch(() => {
      console.log('[Scraper] Main section not found, continuing anyway');
    });
    
    // Scroll to trigger lazy loading
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    
    // Wait 3 seconds for lazy-loaded images to populate
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Get the fully rendered HTML
    const html = await page.content();
    
    // Run scraper, passing URL for ID extraction
    const scraper = new ArticleScraper(config);
    const result = await scraper.scrapeArticle(html, url);
    if (!result.success) {
      return Response.json({ success: false, error: result.error }, { status: 422 });
    }
    return Response.json({ success: true, data: result.data });
  } catch (err) {
    return Response.json({ success: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
