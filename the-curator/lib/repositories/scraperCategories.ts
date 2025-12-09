import { supabaseAdmin } from '@/lib/db/supabase';
import type { ScraperCategory } from '@/lib/types/database';

const CATEGORIES_TABLE = 'scraper_categories';
const NEWS_SOURCES_TABLE = 'news_sources';
const FALLBACK_SOURCE_KEY = 'hk01';
const FALLBACK_CATEGORY_SLUG = 'hk01-auto';
const FALLBACK_CATEGORY_NAME = 'HK01 Default Scheduler';

function ensureAdminClient() {
  if (!supabaseAdmin) {
    throw new Error('Supabase service role client is required for scheduler operations.');
  }
  return supabaseAdmin;
}

const CATEGORY_SOURCE_RELATION = 'source:news_sources(source_key, name, base_url, scraper_config)';

async function ensureDefaultCategory(): Promise<ScraperCategory | null> {
  const client = ensureAdminClient();

  try {
    const existingCategoryResult = await client
      .from(CATEGORIES_TABLE)
      .select(`*, ${CATEGORY_SOURCE_RELATION}`)
      .eq('slug', FALLBACK_CATEGORY_SLUG)
      .limit(1);

    if (existingCategoryResult.error && existingCategoryResult.error.code !== 'PGRST116') {
      throw existingCategoryResult.error;
    }

    const existingCategory = (existingCategoryResult.data?.[0] as ScraperCategory) ?? null;
    if (existingCategory) {
      return existingCategory;
    }

    const sourceResult = await client
      .from(NEWS_SOURCES_TABLE)
      .select('id, source_key, name, base_url, scraper_config')
      .eq('source_key', FALLBACK_SOURCE_KEY)
      .limit(1);

    if (sourceResult.error && sourceResult.error.code !== 'PGRST116') {
      throw sourceResult.error;
    }

    let sourceRecord = sourceResult.data?.[0] as
      | { id: string; source_key: string; name: string; base_url: string; scraper_config: Record<string, unknown> | null }
      | null;

    if (!sourceRecord) {
      const { data: insertedSource, error: insertSourceError } = await client
        .from(NEWS_SOURCES_TABLE)
        .insert({
          source_key: FALLBACK_SOURCE_KEY,
          name: 'HK01',
          base_url: 'https://www.hk01.com',
          scraper_config: {
            selectors: {
              title: 'h1#articleTitle',
              author: '[data-testid="article-author"]',
              breadcrumb_zone: '[data-testid="article-breadcrumb-zone"]',
              breadcrumb_channel: '[data-testid="article-breadcrumb-channel"]',
              published_date: '[data-testid="article-publish-date"]',
              updated_date: '[data-testid="article-update-date"]',
              tags: '[data-testid="article-tag"]',
              main_image: '[data-testid="article-top-section"] img',
              images: '.article-grid__content-section .lazyload-wrapper img',
              content: '.article-grid__content-section',
            },
          },
          is_active: true,
        })
        .select('id, source_key, name, base_url, scraper_config')
        .single();

      if (insertSourceError) {
        console.error('[ensureDefaultCategory] Error creating news source:', insertSourceError);
        throw insertSourceError;
      }

      sourceRecord = insertedSource;
    }

    const { data: categoryData, error: upsertError } = await client
      .from(CATEGORIES_TABLE)
      .upsert(
        {
          source_id: sourceRecord.id,
          slug: FALLBACK_CATEGORY_SLUG,
          name: FALLBACK_CATEGORY_NAME,
          priority: 10,
          is_enabled: true,
        },
        { onConflict: 'source_id,slug' }
      )
      .select(`*, ${CATEGORY_SOURCE_RELATION}`)
      .single();

    if (upsertError) {
      console.error('[ensureDefaultCategory] Error upserting category:', upsertError);
      throw upsertError;
    }

    return (categoryData as ScraperCategory) ?? null;
  } catch (err) {
    console.error('[ensureDefaultCategory] Unexpected error:', err);
    throw err;
  }
}

export async function getEnabledScraperCategories(): Promise<ScraperCategory[]> {
  const client = ensureAdminClient();
  const { data, error } = await client
    .from(CATEGORIES_TABLE)
    .select(`*, ${CATEGORY_SOURCE_RELATION}`)
    .eq('is_enabled', true)
    .order('priority', { ascending: true })
    .order('last_run_at', { ascending: true })
    .limit(20);

  if (error) {
    throw error;
  }

  return (data ?? []) as ScraperCategory[];
}

export async function getScraperCategoryBySlug(slug: string): Promise<ScraperCategory | null> {
  const client = ensureAdminClient();
  const { data, error } = await client
    .from(CATEGORIES_TABLE)
    .select(`*, ${CATEGORY_SOURCE_RELATION}`)
    .eq('slug', slug)
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return (data as ScraperCategory) ?? null;
}

export async function getNextScraperCategory(): Promise<ScraperCategory | null> {
  const client = ensureAdminClient();
  try {
    const { data, error } = await client
      .from(CATEGORIES_TABLE)
      .select(`*, ${CATEGORY_SOURCE_RELATION}`)
      .eq('is_enabled', true)
      .order('last_run_at', { ascending: true, nullsFirst: true })
      .order('priority', { ascending: true })
      .limit(1);

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    const category = (data?.[0] as ScraperCategory) ?? null;
    if (category) {
      return category;
    }

    return ensureDefaultCategory();
  } catch (err) {
    console.error('[CategoryScheduler] Error in getNextScraperCategory:', err);
    // Try fallback: ensure default category exists and return it
    try {
      return await ensureDefaultCategory();
    } catch (fallbackErr) {
      console.error('[CategoryScheduler] Fallback also failed:', fallbackErr);
      throw err;
    }
  }
}

export async function getNextScraperCategoryForSource(sourceKey: string): Promise<ScraperCategory | null> {
  const client = ensureAdminClient();

  if (sourceKey === FALLBACK_SOURCE_KEY) {
    await ensureDefaultCategory();
  }

  const { data: sourceRecord, error: sourceError } = await client
    .from(NEWS_SOURCES_TABLE)
    .select('id')
    .eq('source_key', sourceKey)
    .limit(1)
    .maybeSingle();

  if (sourceError && sourceError.code !== 'PGRST116') {
    throw sourceError;
  }

  const sourceId = sourceRecord?.id;
  if (!sourceId) {
    return null;
  }

  const { data, error } = await client
    .from(CATEGORIES_TABLE)
    .select(`*, ${CATEGORY_SOURCE_RELATION}`)
    .eq('is_enabled', true)
    .eq('source_id', sourceId)
    .order('last_run_at', { ascending: true, nullsFirst: true })
    .order('priority', { ascending: true })
    .limit(20);

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  const categories = (data ?? []) as ScraperCategory[];
  const categoryWithUrl = categories.find((category) => {
    const metadata = (category.metadata as { zoneUrl?: string; sectionUrl?: string } | null) ?? null;
    // Support both zoneUrl (HK01) and sectionUrl (MingPao)
    return (
      (typeof metadata?.zoneUrl === 'string' && metadata.zoneUrl.length > 0) ||
      (typeof metadata?.sectionUrl === 'string' && metadata.sectionUrl.length > 0)
    );
  });

  if (categoryWithUrl) {
    return categoryWithUrl;
  }

  if (sourceKey === FALLBACK_SOURCE_KEY) {
    return ensureDefaultCategory();
  }

  return null;
}

export async function updateScraperCategoryLastRun(
  categoryId: string,
  timestamp: string
): Promise<void> {
  const client = ensureAdminClient();
  const { error } = await client
    .from(CATEGORIES_TABLE)
    .update({ last_run_at: timestamp })
    .eq('id', categoryId)
    .select('id');

  if (error) {
    throw error;
  }
}
