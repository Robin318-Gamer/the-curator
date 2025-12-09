import { NextRequest } from 'next/server';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import { supabase, supabaseAdmin } from '@/lib/db/supabase';
import { getSourceConfig, isSourceSupported } from '@/lib/constants/sourceRegistry';
import { mingpaoSections } from '@/lib/constants/mingpaoSections';

// Source-specific URL patterns
const ARTICLE_PATTERNS: Record<string, RegExp> = {
  hk01: /^https?:\/\/www\.hk01\.com\/([^\/]+)\/(\d{8})\/(.+)$/,
  // MingPao pattern: /pns/category/article/20251209/s00001/articleId/title-slug
  mingpao: /^https?:\/\/(?:www\.)?(?:news\.)?mingpao\.com\/(?:ins|pns|news)\/([^\/]+)\/article\/(\d{8})\/([^\/]+)\/([^\/]+)\/(.+)$/,
};

const CHANNEL_PATTERNS: Record<string, RegExp> = {
  hk01: /^https?:\/\/www\.hk01\.com\/channel\/(\d+)\/(.+)$/,
  mingpao: /^https?:\/\/(?:www\.)?mingpao\.com\/(?:ins|pns)\/([^\/]+)\/?$/,
};

export async function POST(req: NextRequest) {
  let browser;
  try {
    const { sourceKey = 'hk01', customUrl } = await req.json().catch(() => ({}));
    
    // Validate source
    if (!isSourceSupported(sourceKey)) {
      return Response.json({ 
        success: false, 
        error: `Unsupported source: ${sourceKey}` 
      }, { status: 400 });
    }
    
    const config = getSourceConfig(sourceKey);
    if (!config) {
      return Response.json({ 
        success: false, 
        error: `Failed to load configuration for source: ${sourceKey}` 
      }, { status: 500 });
    }
    
    const articlePattern = ARTICLE_PATTERNS[sourceKey];
    const channelPattern = CHANNEL_PATTERNS[sourceKey];
    
    const db = supabaseAdmin ?? supabase;
    
    // ENVIRONMENT-BASED TIMEOUT PROTECTION
    // On Vercel: Limit to 3 categories (10s timeout limit)
    // Locally: No limit (feature toggle for testing)
    const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV === 'production' || process.env.VERCEL_ENV === 'preview';
    const MAX_CATEGORIES = isVercel ? 3 : 999; // 999 = effectively unlimited locally
    const MAX_EXECUTION_TIME = isVercel ? 9000 : 120000; // 9s on Vercel, 2min locally
    const startTime = Date.now();
    
    // Launch Puppeteer with Vercel/serverless optimization using @sparticuz/chromium
    // Better Vercel detection - check for Vercel runtime environment
    const isVercelBrowser = process.env.VERCEL === '1' || process.env.VERCEL_ENV === 'production' || process.env.VERCEL_ENV === 'preview';
    
    
    let launchOptions: any;
    
    if (isVercelBrowser) {
      // On Vercel: use @sparticuz/chromium
      try {
        const execPath = await chromium.executablePath();
        console.log('[ArticleList] Using Vercel chromium at:', execPath);
        launchOptions = {
          args: chromium.args,
          executablePath: execPath,  // No path parameter needed
          headless: 'new' as any,
        };
      } catch (chromiumErr) {
        console.error('[ArticleList] Failed to get chromium executable path:', chromiumErr instanceof Error ? chromiumErr.message : String(chromiumErr));
        return Response.json({ 
          success: false, 
          error: 'Chromium initialization failed on Vercel',
          details: chromiumErr instanceof Error ? chromiumErr.message : String(chromiumErr)
        }, { status: 503 });
      }
    } else {
      // Local development: use local Chrome/Chromium
      console.log('[ArticleList] Local development mode - launching browser');
      const puppeteerRegular = await import('puppeteer');
      try {
        browser = await puppeteerRegular.default.launch({
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu'
          ],
          timeout: 30000
        });
        console.log('[ArticleList] Browser launched successfully');
      } catch (launchErr) {
        console.error('[ArticleList] Browser launch failed:', launchErr instanceof Error ? launchErr.message : String(launchErr));
        return Response.json({
          success: false,
          error: 'Failed to launch browser',
          details: launchErr instanceof Error ? launchErr.message : String(launchErr),
          hint: 'Run: npx puppeteer browsers install chrome'
        }, { status: 503 });
      }
    }

    // Verify browser launched
    if (!browser) {
      return Response.json({
        success: false,
        error: 'Browser not initialized'
      }, { status: 503 });
    }
    const page = await browser.newPage();
    
    // Set a more realistic user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Enable request interception to block heavy resources
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      // Only block heavy resources, not all of them
      const resourceType = request.resourceType();
      if (['font', 'stylesheet', 'media'].includes(resourceType)) {
        request.abort();
      } else {
        request.continue();
      }
    });
    
    // Step 1: Navigate to source homepage or list page to discover categories
    const categoryUrls = new Set<string>();
    
    // If custom URL is provided, use only that URL
    if (customUrl && typeof customUrl === 'string' && customUrl.trim()) {
      console.log('[ArticleList] Using custom URL:', customUrl);
      categoryUrls.add(customUrl.trim());
    } else {
      // Otherwise, discover categories from the main page
      const listUrl = config.list_page_config?.listUrl || config.base_url;
      console.log(`[ArticleList] Navigating to ${sourceKey} list page:`, listUrl);
      await page.goto(listUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForSelector('a[href]', { timeout: 5000 }).catch(() => {});
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Extract all category/channel URLs
      const allLinks = await page.evaluate(() => {
        const anchors = Array.from(document.querySelectorAll('a[href]'));
        return anchors.map(a => (a as HTMLAnchorElement).href).filter(Boolean);
      });
      
      const directArticleUrls = new Set<string>();
      
      // For MingPao, use predefined sections list instead of scraping
      if (sourceKey === 'mingpao') {
        console.log('[ArticleList] Using predefined MingPao sections');
        for (const section of mingpaoSections) {
          if (section.type === 'section') {
            categoryUrls.add(section.url);
          }
        }
      } else {
        // For other sources, extract from page
        for (const link of allLinks) {
          // Check for category/channel links
          const channelMatch = link.match(channelPattern);
          if (channelMatch) {
            categoryUrls.add(link);
          }
          
          // Also collect direct article links (for sources like MingPao)
          const articleMatch = link.match(articlePattern);
          if (articleMatch) {
            directArticleUrls.add(link);
          }
        }
      }
      
      console.log('[ArticleList] Found categories:', categoryUrls.size, 'Direct articles:', directArticleUrls.size);
    }
    
    // LIMIT CATEGORIES to prevent timeout on Vercel free tier
    const limitedCategories = Array.from(categoryUrls).slice(0, MAX_CATEGORIES);
    console.log(`[ArticleList] Processing ${limitedCategories.length} of ${categoryUrls.size} categories (timeout protection)`);
    
    // Step 2: Fetch articles from all categories
    const articlesMap = new Map<string, any>();
    
    for (const categoryUrl of limitedCategories) {
      // Check timeout
      if (Date.now() - startTime > MAX_EXECUTION_TIME) {
        console.warn('[ArticleList] Approaching timeout, stopping early');
        break;
      }
      
      try {
        console.log('[ArticleList] Fetching from:', categoryUrl);
        // Increase timeout and add retry with exponential backoff
        await page.goto(categoryUrl, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(async (err) => {
          console.warn('[ArticleList] First attempt failed, retrying:', err.message);
          await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s before retry
          return page.goto(categoryUrl, { waitUntil: 'networkidle2', timeout: 30000 });
        });
        
        // For MingPao, wait for the specific headline container
        if (sourceKey === 'mingpao') {
          await page.waitForSelector('.headline', { timeout: 10000 }).catch(() => {
            console.warn('[MingPao] .headline container not found, continuing anyway');
          });
          // Wait a bit more for dynamic content to load
          await new Promise(resolve => setTimeout(resolve, 3000));
        } else {
          await page.waitForSelector('a[href]', { timeout: 5000 }).catch(() => {});
        }
        
        // Scroll to load more articles
        await page.evaluate(() => {
          window.scrollTo(0, document.body.scrollHeight / 2);
        });
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Debug: Dump the entire page HTML structure to understand what we're dealing with
        const pageInfo = await page.evaluate(() => {
          return {
            title: document.title,
            bodyLength: document.body.innerHTML.length,
            hasHeadline: !!document.querySelector('.headline'),
            hasNews2023Headline: !!document.querySelector('.news2023_headline'),
            hasContentwrapper: !!document.querySelector('.contentwrapper'),
            headlineCount: document.querySelectorAll('.headline').length,
            news2023Count: document.querySelectorAll('.news2023_headline').length,
            contentwrapperCount: document.querySelectorAll('.contentwrapper').length,
            allDivsWithClass: Array.from(document.querySelectorAll('div[class*="news"]'))
              .slice(0, 10)
              .map(d => d.className),
          };
        });
        console.log('[ArticleList] Page Structure:', JSON.stringify(pageInfo, null, 2));
        
        // Extract article links
        console.log('[ArticleList] About to evaluate page for source:', sourceKey);
        let links: string[] = [];
        try {
          links = await page.evaluate((srcKey) => {
            const anchors = Array.from(document.querySelectorAll('a[href]'));
            
            // For MingPao, look for all article links within the headline section
            if (srcKey === 'mingpao') {
              const headlineLinks: string[] = [];
              
              // Get main headline links
              const mainHeadlines = document.querySelectorAll('.news2023_headline a[href]');
              mainHeadlines.forEach(a => {
                const elem = a as HTMLAnchorElement;
                const href = elem.href;
                if (href && href.includes('/article/')) {
                  headlineLinks.push(href);
                }
              });
              
              // Get links from bullet list items (contentwrapper)
              const bulletLinks = document.querySelectorAll('.contentwrapper h2 a[href], .contentwrapper figure a[href]');
              bulletLinks.forEach(a => {
                const elem = a as HTMLAnchorElement;
                const href = elem.href;
                if (href && href.includes('/article/') && !headlineLinks.includes(href)) {
                  headlineLinks.push(href);
                }
              });
              
              return headlineLinks;
            }
            
            // For other sources, use all links
            return anchors.map(a => (a as HTMLAnchorElement).href).filter(Boolean);
          }, sourceKey);
          console.log('[ArticleList] Successfully evaluated page, found', links.length, 'links');
        } catch (evalErr) {
          console.error('[ArticleList] Error during page.evaluate:', evalErr instanceof Error ? evalErr.message : String(evalErr));
          links = [];
        }
        
        // Debug: Log extraction results
        console.log('[ArticleList] Extracted links count:', links.length);
        if (links.length > 0) {
          console.log('[ArticleList] Sample URLs:', links.slice(0, 3));
        }
        
        // Parse and deduplicate articles
        for (const link of links) {
          const match = link.match(articlePattern);
          if (match) {
            let category, articleId, titleSlug;
            
            if (sourceKey === 'mingpao') {
              // MingPao: [fullUrl, category, date, sectionCode, articleId, titleSlug]
              const [, categoryEncoded, date, sectionCode, artId, slug] = match;
              category = decodeURIComponent(categoryEncoded);
              articleId = artId; // Use the actual article ID
              titleSlug = decodeURIComponent(slug).replace(/-/g, ' ');
            } else {
              // Other sources
              const [, categoryEncoded, artId, slug] = match;
              category = decodeURIComponent(categoryEncoded);
              articleId = artId;
              titleSlug = decodeURIComponent(slug).replace(/-/g, ' ');
            }
            
            // Deduplicate by article ID
            if (!articlesMap.has(articleId)) {
              articlesMap.set(articleId, {
                articleId,
                url: link,
                category,
                titleSlug,
              });
            }
          } else if (sourceKey === 'mingpao') {
            // Debug: Log URLs that don't match for MingPao
            console.log('[MingPao] URL did not match pattern:', link.substring(0, 100));
          }
        }
        
        console.log('[ArticleList] Total unique articles so far:', articlesMap.size);
      } catch (err) {
        console.error('[ArticleList] Error fetching category:', categoryUrl, err instanceof Error ? err.message : String(err));
        // Continue with next category instead of failing
        continue;
      }
    }
    
    // Convert to array and sort by articleId descending (newest first)
    const articles = Array.from(articlesMap.values()).sort((a, b) => {
      const idA = parseInt(a.articleId, 10);
      const idB = parseInt(b.articleId, 10);
      return idB - idA; // Descending order
    });
    console.log('[ArticleList] Final unique articles:', articles.length);

    // Insert/update newslist records so URLs are tracked in the database
    try {
      const { data: sourceData, error: sourceError } = await db
        .from('news_sources')
        .select('id')
        .eq('source_key', sourceKey)
        .single();

      if (sourceError) {
        console.warn(`[ArticleList] Unable to load ${sourceKey} source id:`, sourceError.message);
      } else if (sourceData?.id && articles.length > 0) {
        const payload = articles.map(article => ({
          source_id: sourceData.id,
          source_article_id: article.articleId,
          url: article.url,
          status: 'pending',
          meta: {
            category: article.category,
            title: article.titleSlug,
          },
        }));

        const chunkSize = 100;
        for (let i = 0; i < payload.length; i += chunkSize) {
          const chunk = payload.slice(i, i + chunkSize);
          const { error: insertError } = await db
            .from('newslist')
            .upsert(chunk, {
              onConflict: 'source_id,source_article_id',
              ignoreDuplicates: true,
            });

          if (insertError) {
            console.warn('[ArticleList] Failed to upsert newslist chunk:', insertError.message);
            break;
          }
        }
      }
    } catch (listError) {
      console.warn('[ArticleList] Failed to upsert newslist entries:', listError);
    }
    
    return Response.json({ 
      success: true, 
      data: {
        articles,
        total: articles.length,
        categoriesScanned: limitedCategories.length,
        totalCategoriesFound: categoryUrls.size,
        limitApplied: categoryUrls.size > MAX_CATEGORIES,
        timeoutProtection: true
      }
    });
    
  } catch (err) {
    console.error('[ArticleList] Error:', err);
    return Response.json({ 
      success: false, 
      error: err instanceof Error ? err.message : String(err) 
    }, { status: 500 });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
