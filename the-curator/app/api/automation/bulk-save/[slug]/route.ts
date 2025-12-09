import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/db/supabase';
import { load } from 'cheerio';
import type { ScraperCategory } from '@/lib/types/database';
import { getNextScraperCategoryForSource, updateScraperCategoryLastRun } from '@/lib/repositories/scraperCategories';

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36';

interface ArticleCandidate {
  articleId: string;
  category?: string;
  title?: string;
  url: string;
}

interface RouteParams {
  slug: string;
}

async function fetchHtml(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT },
      cache: 'no-store',
    });
    if (!response.ok) {
      console.warn('[BulkSave] Failed to fetch', url, response.status);
      return null;
    }
    return await response.text();
  } catch (error) {
    console.warn('[BulkSave] fetchHtml error', url, error);
    return null;
  }
}

async function scrapeHK01Articles(zoneUrl?: string): Promise<ArticleCandidate[]> {
  const zoneIds = Array.from({ length: 12 }, (_, i) => i + 1);
  const zoneUrls = zoneUrl ? [zoneUrl] : zoneIds.map((zoneId) => `https://www.hk01.com/zone/${zoneId}`);
  const htmlChunks = await Promise.all(zoneUrls.map((url) => fetchHtml(url)));
  const articles = new Map<string, ArticleCandidate>();
  for (const html of htmlChunks) {
    if (!html) continue;
    const $ = load(html);
    $('a').each((_, elem) => {
      const href = $(elem).attr('href');
      if (!href) return;
      const match = href.match(/^\/([\w%\-]+)\/(\d+)\/(.*)/);
      if (!match) return;
      if (href.startsWith('/channel/') || href.startsWith('/issue/') || href.startsWith('/zone/')) {
        return;
      }
      const category = decodeURIComponent(match[1]);
      const articleId = match[2];
      const titleSlug = match[3]?.replace(/-/g, ' ') || '';
      if (!articleId || articles.has(articleId)) return;
      const absoluteUrl = new URL(href, 'https://www.hk01.com').toString();
      articles.set(articleId, {
        articleId,
        category,
        title: decodeURIComponent(titleSlug),
        url: absoluteUrl,
      });
    });
  }
  return Array.from(articles.values()).sort((a, b) => b.articleId.localeCompare(a.articleId));
}

async function scrapeMingPaoArticles(sectionUrl?: string): Promise<ArticleCandidate[]> {
  // If sectionUrl provided, use it; otherwise fallback to hardcoded list for backward compatibility
  const sectionUrls = sectionUrl ? [sectionUrl] : [
    'https://news.mingpao.com/pns/%E8%A6%81%E8%81%9E/section/latest/s00001',
    'https://news.mingpao.com/pns/%E6%B8%AF%E8%81%9E/section/latest/s00002',
    'https://news.mingpao.com/pns/%E7%B6%93%E6%BF%9F/section/latest/s00004',
    'https://news.mingpao.com/pns/%E5%A8%9A%E6%A8%82/section/latest/s00016',
    'https://news.mingpao.com/pns/%E5%89%AF%E5%88%8A/section/latest/s00005',
    'https://news.mingpao.com/pns/%E7%A4%BE%E8%A9%95/section/latest/s00003',
    'https://news.mingpao.com/pns/%E8%A7%80%E9%BB%9E/section/latest/s00012',
    'https://news.mingpao.com/pns/%E4%B8%AD%E5%9C%8B/section/latest/s00013',
    'https://news.mingpao.com/pns/%E5%9C%8B%E9%9A%9B/section/latest/s00014',
    'https://news.mingpao.com/pns/%E6%95%99%E8%82%B2/section/latest/s00011',
    'https://news.mingpao.com/pns/%E9%AB%94%E8%82%B2/section/latest/s00015',
    'https://news.mingpao.com/pns/%E8%8B%B1%E6%96%87/section/latest/s00017',
    'https://news.mingpao.com/pns/%E4%BD%9C%E5%AE%B6%E5%B0%88%E6%AC%84/section/latest/s00018',
    'https://news.mingpao.com/ins/%E5%A4%A7%E7%81%A3%E5%8D%80/section/latest/special',
    'https://news.mingpao.com/ins/%E6%B8%AF%E8%81%9E/section/latest/s00001',
    'https://news.mingpao.com/ins/%E7%86%B1%E9%BB%9E/section/latest/s00024',
    'https://news.mingpao.com/ins/%E5%A4%A9%E5%AF%8C%E7%94%B7%E5%AD%90/section/latest/s00022',
  ];
  const htmlChunks = await Promise.all(sectionUrls.map((url) => fetchHtml(url)));
  const articles = new Map<string, ArticleCandidate>();
  for (const html of htmlChunks) {
    if (!html) continue;
    const $ = load(html);
    $('a').each((_, elem) => {
      let href = $(elem).attr('href');
      if (!href || !href.includes('/article/')) return;
      if (!href.startsWith('http')) {
        href = new URL(href, 'https://news.mingpao.com').toString();
      }
      const urlObj = new URL(href);
      const segments = urlObj.pathname.split('/').filter(Boolean);
      let articleId = '';
      let category = segments[1] ? decodeURIComponent(segments[1]) : '';
      if (segments.includes('special')) {
        const specialIndex = segments.indexOf('special');
        if (specialIndex !== -1 && segments.length > specialIndex + 1) {
          articleId = segments[specialIndex + 1];
        }
      } else {
        const articleIndex = segments.indexOf('article');
        if (articleIndex !== -1 && segments.length > articleIndex + 3) {
          articleId = segments[articleIndex + 3];
        }
      }
      if (!articleId) return;
      if (articles.has(articleId)) return;
      const titleFragment = segments[segments.length - 1] || '';
      articles.set(articleId, {
        articleId,
        category,
        title: decodeURIComponent(titleFragment).replace(/-/g, ' '),
        url: href,
      });
    });
  }
  return Array.from(articles.values()).sort((a, b) => b.articleId.localeCompare(a.articleId));
}

function resolveSource(slug: string): { key: 'hk01' | 'mingpao'; name: string } | null {
  const normalized = slug.trim().toLowerCase();
  if (normalized === 'hk01') {
    return { key: 'hk01', name: 'HK01' };
  }
  if (normalized === 'mingpao' || slug === '明報') {
    return { key: 'mingpao', name: '明報' };
  }
  return null;
}

export async function POST(_request: NextRequest, { params }: { params: RouteParams }) {
  const sourceConfig = resolveSource(params.slug);
  if (!sourceConfig) {
    return NextResponse.json({ success: false, error: 'Invalid source slug, use hk01 or mingpao.' }, { status: 400 });
  }

  const db = supabaseAdmin ?? supabase;
  let candidates: ArticleCandidate[] = [];
  let selectedCategory: ScraperCategory | null = null;
  let zoneContext: { slug: string; name: string; url: string } | null = null;

  try {
    if (sourceConfig.key === 'hk01') {
      selectedCategory = await getNextScraperCategoryForSource(sourceConfig.key);
      if (!selectedCategory) {
        return NextResponse.json(
          { success: false, error: 'No enabled HK01 scheduler category was found.' },
          { status: 404 }
        );
      }

      const metadata = (selectedCategory.metadata as { zoneUrl?: string } | null) ?? null;
      const zoneUrl = metadata?.zoneUrl;
      
      // If category doesn't have zoneUrl, use zone number based on category slug or fetch all zones
      let url = zoneUrl;
      if (!url) {
        // Try to extract zone ID from slug (e.g., "3" from "3-體育")
        const zoneMatch = selectedCategory.slug?.match(/^(\d+)/);
        if (zoneMatch) {
          url = `https://www.hk01.com/zone/${zoneMatch[1]}`;
        } else {
          // Fallback to fetch all zones
          url = undefined;
        }
      }

      zoneContext = { slug: selectedCategory.slug, name: selectedCategory.name, url: url || 'all-zones' };
      console.log('[BulkSave] Fetching HK01 zone', url || 'all zones', '(', selectedCategory.slug, ')');
      candidates = await scrapeHK01Articles(url);
      console.log('[BulkSave] Completed fetch for', url || 'all zones', '— discovered', candidates.length, 'articles');
    } else if (sourceConfig.key === 'mingpao') {
      // Use scheduler for MingPao too
      selectedCategory = await getNextScraperCategoryForSource(sourceConfig.key);
      if (!selectedCategory) {
        // Fallback to all sections if no scheduler category found
        console.log('[BulkSave] No MingPao scheduler category, fetching all sections');
        candidates = await scrapeMingPaoArticles();
      } else {
        const metadata = (selectedCategory.metadata as { sectionUrl?: string } | null) ?? null;
        const sectionUrl = metadata?.sectionUrl;
        
        // If category doesn't have sectionUrl, try to use slug or fetch all
        let url = sectionUrl;
        if (!url) {
          // For MingPao, without sectionUrl, fetch all sections
          url = undefined;
        }

        zoneContext = { slug: selectedCategory.slug, name: selectedCategory.name, url: url || 'all-sections' };
        console.log('[BulkSave] Fetching MingPao section', url || 'all sections', '(', selectedCategory.slug, ')');
        candidates = await scrapeMingPaoArticles(url);
        console.log('[BulkSave] Completed fetch for', url || 'all sections', '— discovered', candidates.length, 'articles');
      }
    } else {
      // Other sources - use hardcoded approach
      candidates = await scrapeMingPaoArticles();
    }
  } catch (error) {
    console.error('[BulkSave] Scraping error', error);
    return NextResponse.json({ success: false, error: 'Failed to scrape article URLs.' }, { status: 500 });
  }

  if (candidates.length === 0) {
    return NextResponse.json({ success: false, error: 'No articles were discovered.' }, { status: 404 });
  }

  const { data: source } = await db
    .from('news_sources')
    .select('id')
    .eq('source_key', sourceConfig.key)
    .single();

  if (!source?.id) {
    return NextResponse.json({ success: false, error: `Source ${sourceConfig.name} is not configured.` }, { status: 404 });
  }

  let savedCount = 0;
  let duplicateCount = 0;
  for (const article of candidates) {
    const { data: existing } = await db
      .from('newslist')
      .select('id')
      .eq('source_id', source.id)
      .eq('source_article_id', article.articleId)
      .limit(1)
      .maybeSingle();

    if (existing) {
      duplicateCount++;
      continue;
    }

    const { error } = await db.from('newslist').insert({
      source_id: source.id,
      source_article_id: article.articleId,
      url: article.url,
      status: 'pending',
      meta: {
        category: article.category ?? null,
        title: article.title ?? null,
        scheduler_category_slug: zoneContext?.slug ?? null,
        scheduler_category_name: zoneContext?.name ?? null,
      },
    });

    if (!error) {
      savedCount++;
    }
  }

  console.log(
    '[BulkSave] Finished inserting newslist rows — saved',
    savedCount,
    'duplicates',
    duplicateCount,
    zoneContext ? `for ${zoneContext.slug}` : ''
  );

  // Update last_run_at for any source that used scheduler
  if (selectedCategory) {
    try {
      await updateScraperCategoryLastRun(selectedCategory.id, new Date().toISOString());
      if (zoneContext) {
        console.log('[BulkSave] Updated last_run_at for', zoneContext.slug, zoneContext.url);
      }
    } catch (error) {
      console.error('[BulkSave] Failed to update scheduler last_run_at', error);
      return NextResponse.json(
        { success: false, error: 'Inserted URLs but failed to update scheduler last run timestamp.' },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({
    success: true,
    source: sourceConfig.name,
    discoveredCount: candidates.length,
    savedCount,
    duplicateCount,
    category: zoneContext
      ? {
          slug: zoneContext.slug,
          name: zoneContext.name,
          zoneUrl: zoneContext.url,
        }
      : null,
  });
}
