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
 * Get the HK01 news source UUID
 * Caches the result to avoid repeated queries
 */
let cachedSourceId: string | null = null;

async function getHK01SourceId(): Promise<string> {
  if (cachedSourceId) return cachedSourceId;

  const { data, error } = await dbClient
    .from('news_sources')
    .select('id')
    .eq('source_key', 'hk01')
    .single();

  if (error || !data) {
    throw new Error('HK01 news source not found in database');
  }

  cachedSourceId = data.id;
  return data.id;
}

/**
 * Check if an article already exists in the database
 * Uses (source_id, source_article_id) as unique key for deduplication
 * 
 * @param sourceArticleId - The article ID from HK01 (8-digit number as string)
 * @returns true if article exists, false otherwise
 */
export async function checkArticleExists(sourceArticleId: string): Promise<boolean> {
  try {
    const sourceId = await getHK01SourceId();

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
 * Convert content string format (from scraper) to JSONB array format (for database)
 * Scraper returns: "### Heading1\n\nParagraph text\n\n### Heading2\n\nMore text"
 * Database expects: [{type: 'heading', text: '...'}, {type: 'paragraph', text: '...'}]
 */
function parseContentToJSON(contentString: string): Array<{type: string; text: string}> {
  if (!contentString) return [];
  
  const blocks: Array<{type: string; text: string}> = [];
  const parts = contentString.split('\n\n').filter(p => p.trim());
  
  for (const part of parts) {
    if (part.startsWith('### ')) {
      // Heading
      const headingText = part.replace('### ', '').trim();
      if (headingText) {
        blocks.push({ type: 'heading', text: headingText });
      }
    } else if (part.trim()) {
      // Paragraph
      blocks.push({ type: 'paragraph', text: part.trim() });
    }
  }
  
  return blocks;
}

/**
 * Create a new article in the database
 * Converts ScrapedArticle (from scraper) to Article (database format)
 * 
 * @param scrapedArticle - Article data from HK01 scraper
 * @param sourceUrl - Original URL from HK01
 * @returns Created article with database ID
 */
export async function createArticle(
  scrapedArticle: ScrapedArticle,
  sourceUrl: string
): Promise<Article> {
  try {
    const sourceId = await getHK01SourceId();

    // Convert content string to JSONB array format
    const contentArray = parseContentToJSON(scrapedArticle.content || '');
    
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
  try {
    const manageStatus = options?.manageNewslistStatus !== false;
    const skipProcessingStatus = options?.skipProcessingStatus === true;

    if (manageStatus && !skipProcessingStatus) {
      await markNewslistProcessing(scrapedArticle.articleId);
    }

    // Check if article already exists
    const exists = await checkArticleExists(scrapedArticle.articleId);

    if (exists) {
      if (manageStatus) {
        await markNewslistExisting(scrapedArticle.articleId);
      }
      return {
        success: true,
        isNew: false,
        message: `Article ${scrapedArticle.articleId} already exists in database`,
      };
    }

    // Create article
    const article = await createArticle(scrapedArticle, sourceUrl);

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

    if (manageStatus) {
      await markNewslistFailed(scrapedArticle.articleId, errorMessage);
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
        articleId: scrapedArticle.articleId,
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
