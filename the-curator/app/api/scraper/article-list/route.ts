import { NextRequest } from 'next/server';
import puppeteer from 'puppeteer';
import { supabase, supabaseAdmin } from '@/lib/db/supabase';

// HK01 article URL pattern: /category/articleId/title-slug
const HK01_ARTICLE_PATTERN = /^https?:\/\/www\.hk01\.com\/([^\/]+)\/(\d{8})\/(.+)$/;
const HK01_CHANNEL_PATTERN = /^https?:\/\/www\.hk01\.com\/channel\/(\d+)\/(.+)$/;

export async function POST(req: NextRequest) {
  let browser;
  try {
    const db = supabaseAdmin ?? supabase;
    // Launch Puppeteer
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    const page = await browser.newPage();
    
    // Block unnecessary resources
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      const resourceType = request.resourceType();
      if (['font', 'stylesheet', 'media', 'image'].includes(resourceType)) {
        request.abort();
      } else {
        request.continue();
      }
    });
    
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    // Step 1: Navigate to HK01 homepage to discover categories
    console.log('[ArticleList] Navigating to HK01 homepage...');
    await page.goto('https://www.hk01.com/', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForSelector('a[href]', { timeout: 5000 }).catch(() => {});
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Extract all category/channel URLs
    const allLinks = await page.evaluate(() => {
      const anchors = Array.from(document.querySelectorAll('a[href]'));
      return anchors.map(a => (a as HTMLAnchorElement).href).filter(Boolean);
    });
    
    const categoryUrls = new Set<string>();
    for (const link of allLinks) {
      const match = link.match(HK01_CHANNEL_PATTERN);
      if (match) {
        categoryUrls.add(link);
      }
    }
    
    console.log('[ArticleList] Found categories:', categoryUrls.size);
    
    // Step 2: Fetch articles from all categories
    const articlesMap = new Map<string, any>();
    
    for (const categoryUrl of categoryUrls) {
      try {
        console.log('[ArticleList] Fetching from:', categoryUrl);
        await page.goto(categoryUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await page.waitForSelector('a[href]', { timeout: 5000 }).catch(() => {});
        
        // Scroll to load more articles
        await page.evaluate(() => {
          window.scrollTo(0, document.body.scrollHeight / 2);
        });
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Extract article links
        const links = await page.evaluate(() => {
          const anchors = Array.from(document.querySelectorAll('a[href]'));
          return anchors.map(a => (a as HTMLAnchorElement).href).filter(Boolean);
        });
        
        // Parse and deduplicate articles
        for (const link of links) {
          const match = link.match(HK01_ARTICLE_PATTERN);
          if (match) {
            const [, categoryEncoded, articleId, titleSlug] = match;
            
            // Deduplicate by article ID
            if (!articlesMap.has(articleId)) {
              articlesMap.set(articleId, {
                articleId,
                url: link,
                category: decodeURIComponent(categoryEncoded),
                titleSlug: decodeURIComponent(titleSlug).replace(/-/g, ' '),
              });
            }
          }
        }
        
        console.log('[ArticleList] Total unique articles so far:', articlesMap.size);
      } catch (err) {
        console.error('[ArticleList] Error fetching category:', categoryUrl, err);
        // Continue with next category
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
      const { data: hk01Source, error: sourceError } = await db
        .from('news_sources')
        .select('id')
        .eq('source_key', 'hk01')
        .single();

      if (sourceError) {
        console.warn('[ArticleList] Unable to load HK01 source id:', sourceError.message);
      } else if (hk01Source?.id && articles.length > 0) {
        const payload = articles.map(article => ({
          source_id: hk01Source.id,
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
              onConflict: ['source_id', 'source_article_id'],
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
        categoriesScanned: categoryUrls.size
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
