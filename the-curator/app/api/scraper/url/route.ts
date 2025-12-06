import { NextRequest } from 'next/server';
import { ArticleScraper } from '@/lib/scrapers/ArticleScraper';
import { hk01SourceConfig } from '@/lib/constants/sources';
import type { NewsSource } from '@/lib/types/database';
import puppeteer from 'puppeteer';

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
    
    // Launch Puppeteer to fetch and render the page with JavaScript
    // Use connectBrowserWSEndpoint for serverless environments or install chrome first
    const launchOptions: any = {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    };

    // For Vercel/serverless: use chrome-aws-lambda or similar
    // For local/Docker: ensure Chrome is installed via: npx puppeteer browsers install chrome
    // Alternative: use remote browser endpoint if available
    if (process.env.BROWSERLESS_TOKEN) {
      // Use browserless.io service
      browser = await puppeteer.connect({
        browserWSEndpoint: `wss://chrome.browserless.io?token=${process.env.BROWSERLESS_TOKEN}`
      });
    } else {
      // Try to launch locally (requires Chrome/Chromium installed)
      try {
        browser = await puppeteer.launch(launchOptions);
      } catch (launchErr) {
        // Chrome not found - provide helpful error message
        const errorMsg = launchErr instanceof Error ? launchErr.message : String(launchErr);
        if (errorMsg.includes('Could not find Chrome')) {
          console.error('[Scraper] Chrome not found. Solutions:');
          console.error('1. Local: Run: npx puppeteer browsers install chrome');
          console.error('2. Vercel: Install chrome-aws-lambda package');
          console.error('3. Docker: Add Chrome to Dockerfile');
          console.error('4. Serverless: Use browserless.io (set BROWSERLESS_TOKEN env var)');
          
          return Response.json({ 
            success: false, 
            error: 'Browser not available. Please install Chrome/Chromium or configure a remote browser service.',
            hint: 'Set BROWSERLESS_TOKEN environment variable to use browserless.io service'
          }, { status: 503 });
        }
        throw launchErr;
      }
    }

    // Ensure browser was launched
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
