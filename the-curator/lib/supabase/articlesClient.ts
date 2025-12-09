/**
 * Supabase Articles Client
 * Handles all database operations for articles and article images
 * 
 * Database Design:
 * - articles: Core article storage with deduplication by (source_id, source_article_id)
 * - article_images: 1-to-many relationship with articles
 */

import { supabase, supabaseAdmin } from '@/lib/db/supabase';
import { Article, ArticleImage, ScrapedArticle } from '@/lib/types/database';

const dbClient = supabaseAdmin ?? supabase;

/**
 * Get news source UUID by source key
 * Caches results to avoid repeated queries
 */
const cachedSourceIds = new Map<string, string>();

async function getSourceId(sourceKey: string = 'hk01'): Promise<string> {
  if (cachedSourceIds.has(sourceKey)) {
    return cachedSourceIds.get(sourceKey)!;
  }

  const { data, error } = await dbClient
    .from('news_sources')
    .select('id')
    .eq('source_key', sourceKey)
    .single();

  if (error || !data) {
    throw new Error(`News source '${sourceKey}' not found in database`);
  }

  cachedSourceIds.set(sourceKey, data.id);
  return data.id;
}

/**
 * Check if an article already exists in the database
 * Uses (source_id, source_article_id) as unique key for deduplication
 * 
 * @param sourceArticleId - The article ID (source-specific identifier)
 * @param sourceKey - The source key (e.g., 'hk01', 'mingpao'). Defaults to 'hk01'
 * @returns true if article exists, false otherwise
 */
export async function checkArticleExists(sourceArticleId: string, sourceKey: string = 'hk01'): Promise<boolean> {
  try {
    const sourceId = await getSourceId(sourceKey);

    const { data, error } = await dbClient
      .from('articles')
      .select('id')
      .eq('source_id', sourceId)
      .eq('source_article_id', sourceArticleId)
      .single();

    if (error && error.code === 'PGRST116') {
      // No rows found = article doesn't exist
      return false;
    }

    if (error) {
      throw error;
    }

    return !!data;
  } catch (error) {
    console.error('Error checking article existence:', error);
    throw error;
  }
}

/**
 * Create a new article in the database
 * Converts ScrapedArticle (from scraper) to Article (database format)
 * 
 * @param scrapedArticle - Article data from scraper
 * @param sourceUrl - Original URL from source
 * @param sourceKey - The source key (e.g., 'hk01', 'mingpao'). Defaults to 'hk01'
 * @returns Created article with database ID
 */
export async function createArticle(
  scrapedArticle: ScrapedArticle,
  sourceUrl: string,
  sourceKey: string = 'hk01'
): Promise<Article> {
  try {
    const sourceId = await getSourceId(sourceKey);

    // Content is already in JSONB array format from scraper
    const contentArray = scrapedArticle.content || [];
    
    // Extract first 200 characters for excerpt
    let excerpt = '';
    if (contentArray.length > 0) {
      const firstTextBlock = contentArray.find((block) => block.text);
      if (firstTextBlock) {
        excerpt = firstTextBlock.text.substring(0, 200);
      }
    }

    // Prepare article data for database
    const articleData = {
      source_id: sourceId,
      source_article_id: scrapedArticle.articleId,
      source_url: sourceUrl,
      title: scrapedArticle.title,
      author: scrapedArticle.author || null,
      category: scrapedArticle.category || null,
      sub_category: scrapedArticle.subCategory || null,
      tags: scrapedArticle.tags?.join(',') || null,
      published_date: scrapedArticle.publishedDate || null,
      updated_date: scrapedArticle.updatedDate || null,
      content: contentArray,
      excerpt: excerpt || null,
      main_image_url: scrapedArticle.mainImageUrl || null,
      main_image_caption: scrapedArticle.mainImageCaption || null,
      scrape_status: 'success',
    };

    // Insert article
    const { data, error } = await dbClient
      .from('articles')
      .insert([articleData])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create article: ${error.message}`);
    }

    if (!data) {
      throw new Error('Article created but no data returned');
    }

    return data as Article;
  } catch (error) {
    console.error('Error creating article:', error);
    throw error;
  }
}

/**
 * Create article images (1-to-many relationship)
 * Stores all images associated with an article
 * 
 * @param articleId - Database ID of the article
 * @param images - Array of images from scraper
 */
export async function createArticleImages(
  articleId: string,
  images: ScrapedArticle['articleImageList']
): Promise<ArticleImage[]> {
  try {
    if (!images || images.length === 0) {
      return [];
    }

    // Convert scraped images to database format
    const imagesToInsert = images
      .map((img, index) => {
        const imageUrl = (img as any).url || (img as any).src;
        if (!imageUrl) {
          return null;
        }

        return {
          article_id: articleId,
          image_url: imageUrl,
          caption: img.caption || null,
          display_order: index,
          is_main_image: false, // Main image is stored in articles.main_image_url
        };
      })
      .filter(Boolean) as Array<{
        article_id: string;
        image_url: string;
        caption: string | null;
        display_order: number;
        is_main_image: boolean;
      }>;

    const { data, error } = await dbClient
      .from('article_images')
      .insert(imagesToInsert)
      .select();

    if (error) {
      throw new Error(`Failed to create article images: ${error.message}`);
    }

    return (data || []) as ArticleImage[];
  } catch (error) {
    console.error('Error creating article images:', error);
    throw error;
  }
}

/**
 * Import a complete article with all its images
 * Handles deduplication, article creation, and image creation atomically
 * 
 * @param scrapedArticle - Article data from HK01 scraper
 * @param sourceUrl - Original URL from HK01
 * @returns Object with success status and article data or error
 */
async function markNewslistProcessing(sourceArticleId?: string) {
  if (!sourceArticleId) return;

  try {
    const { data, error } = await dbClient
      .from('newslist')
      .select('attempt_count')
      .eq('source_article_id', sourceArticleId)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn('Failed to fetch newslist attempt count:', error.message);
      return;
    }

    const attemptCount = (data?.attempt_count ?? 0) + 1;

    const { error: updateError } = await dbClient
      .from('newslist')
      .update({
        status: 'processing',
        attempt_count: attemptCount,
        error_log: null,
        last_processed_at: new Date().toISOString(),
      })
      .eq('source_article_id', sourceArticleId);

    if (updateError) {
      console.warn('Failed to mark newslist entry processing:', updateError.message);
    }
  } catch (err) {
    console.warn('Unexpected error updating newslist status (processing):', err);
  }
}

async function markNewslistSuccess(sourceArticleId: string | undefined, articleId: string) {
  if (!sourceArticleId) return;

  try {
    const { error } = await dbClient
      .from('newslist')
      .update({
        status: 'extracted',
        resolved_article_id: articleId,
        error_log: null,
        last_processed_at: new Date().toISOString(),
      })
      .eq('source_article_id', sourceArticleId);

    if (error) {
      console.warn('Failed to mark newslist entry success:', error.message);
    }
  } catch (err) {
    console.warn('Unexpected error updating newslist status (success):', err);
  }
}

async function markNewslistExisting(sourceArticleId?: string) {
  if (!sourceArticleId) return;

  try {
    const { error } = await dbClient
      .from('newslist')
      .update({
        status: 'extracted',
        last_processed_at: new Date().toISOString(),
      })
      .eq('source_article_id', sourceArticleId);

    if (error) {
      console.warn('Failed to mark newslist entry existing:', error.message);
    }
  } catch (err) {
    console.warn('Unexpected error updating newslist status (existing):', err);
  }
}

async function markNewslistFailed(sourceArticleId: string | undefined, errorMessage: string) {
  if (!sourceArticleId) return;

  try {
    const { error } = await dbClient
      .from('newslist')
      .update({
        status: 'failed',
        error_log: errorMessage,
        last_processed_at: new Date().toISOString(),
      })
      .eq('source_article_id', sourceArticleId);

    if (error) {
      console.warn('Failed to mark newslist entry failed:', error.message);
    }
  } catch (err) {
    console.warn('Unexpected error updating newslist status (failed):', err);
  }
}

interface ImportArticleOptions {
  manageNewslistStatus?: boolean;
  skipProcessingStatus?: boolean;
  sourceKey?: string;
}

export async function importArticle(
  scrapedArticle: ScrapedArticle,
  sourceUrl: string,
  options?: ImportArticleOptions
): Promise<{
  success: boolean;
  articleId?: string;
  isNew: boolean;
  message: string;
  error?: string;
}> {
  const manageStatus = options?.manageNewslistStatus !== false;
  const skipProcessingStatus = options?.skipProcessingStatus === true;
  const sourceKey = options?.sourceKey ?? 'hk01';
  const articleId = scrapedArticle.articleId ?? '';
  
  try {
    if (manageStatus && !skipProcessingStatus && articleId) {
      await markNewslistProcessing(articleId);
    }

    // Check if article already exists
    const exists = articleId ? await checkArticleExists(articleId, sourceKey) : false;

    if (exists) {
      if (manageStatus && articleId) {
        await markNewslistExisting(articleId);
      }
      return {
        success: true,
        isNew: false,
        message: `Article ${articleId} already exists in database`,
      };
    }

    // Create article
    const article = await createArticle(scrapedArticle, sourceUrl, sourceKey);

    // Create associated images
    if (scrapedArticle.articleImageList && scrapedArticle.articleImageList.length > 0) {
      await createArticleImages(article.id, scrapedArticle.articleImageList);
    }

    if (manageStatus) {
      await markNewslistSuccess(scrapedArticle.articleId, article.id);
    }

    return {
      success: true,
      articleId: article.id,
      isNew: true,
      message: `Article ${scrapedArticle.articleId} imported successfully`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error importing article:', errorMessage);

    if (manageStatus && articleId) {
      await markNewslistFailed(articleId, errorMessage);
    }

    return {
      success: false,
      isNew: false,
      message: 'Failed to import article',
      error: errorMessage,
    };
  }
}

/**
 * Batch import multiple articles
 * Useful for importing from article list scraper
 * 
 * @param articles - Array of articles to import with their URLs
 * @returns Summary of import results
 */
export async function batchImportArticles(
  articles: Array<{ scrapedArticle: ScrapedArticle; sourceUrl: string }>
): Promise<{
  total: number;
  imported: number;
  existing: number;
  failed: number;
  errors: Array<{ articleId: string; error: string }>;
}> {
  const results = {
    total: articles.length,
    imported: 0,
    existing: 0,
    failed: 0,
    errors: [] as Array<{ articleId: string; error: string }>,
  };

  for (const { scrapedArticle, sourceUrl } of articles) {
    const result = await importArticle(scrapedArticle, sourceUrl);

    if (result.success) {
      if (result.isNew) {
        results.imported++;
      } else {
        results.existing++;
      }
    } else {
      results.failed++;
      results.errors.push({
        articleId: scrapedArticle.articleId ?? 'unknown',
        error: result.error || 'Unknown error',
      });
    }
  }

  return results;
}

/**
 * Get article count statistics from database
 * Useful for dashboard/admin pages
 */
export async function getArticleStats(): Promise<{
  total: number;
  byCategory: Record<string, number>;
  byStatus: Record<string, number>;
}> {
  try {
    const { data, error } = await dbClient.from('articles').select('category, scrape_status');

    if (error) {
      throw error;
    }

    const stats = {
      total: data?.length || 0,
      byCategory: {} as Record<string, number>,
      byStatus: {} as Record<string, number>,
    };

    data?.forEach((article: any) => {
      // Count by category
      if (article.category) {
        stats.byCategory[article.category] = (stats.byCategory[article.category] || 0) + 1;
      }

      // Count by status
      stats.byStatus[article.scrape_status] = (stats.byStatus[article.scrape_status] || 0) + 1;
    });

    return stats;
  } catch (error) {
    console.error('Error getting article stats:', error);
    throw error;
  }
}
