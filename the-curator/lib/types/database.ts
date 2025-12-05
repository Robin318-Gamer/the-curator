/**
 * Database Type Definitions
 * Matches optimized schema in lib/db/migrations.sql
 * Aligned with HK01 scraper extraction
 */

// ===== NEWS SOURCE =====
export interface NewsSource {
  id: string;
  source_key: string; // 'hk01', 'mingpao', 'orientaldaily'
  name: string; // 'HK01', 'Ming Pao'
  base_url: string; // 'https://www.hk01.com'
  scraper_config: {
    selectors: {
      title: string;
      author?: string;
      breadcrumb_zone?: string;
      breadcrumb_channel?: string;
      published_date?: string;
      updated_date?: string;
      tags?: string;
      main_image?: string;
      images?: string;
      content?: string;
    };
  };
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ===== NEWSLIST ENTRY =====
export type NewslistStatus = 'pending' | 'queued' | 'processing' | 'extracted' | 'failed';

export interface NewslistEntry {
  id: string;
  source_id: string;
  source_article_id?: string | null;
  url: string;
  status: NewslistStatus;
  meta?: Record<string, unknown> | null;
  error_log?: string | null;
  resolved_article_id?: string | null;
  attempt_count: number;
  last_processed_at?: string | null;
  created_at: string;
  updated_at: string;
  source?: Pick<NewsSource, 'name' | 'source_key'>;
}

// ===== ARTICLE (CORE) =====
/**
 * Article database entity
 * Matches HK01 scraper extraction + future source compatibility
 * 
 * Key fields extracted by HK01 scraper:
 * - articleId (from data-article-id or URL)
 * - title, author, category, sub_category
 * - published_date, updated_date
 * - content (JSONB structured blocks)
 * - images (1-to-many in article_images table)
 * - tags (comma-separated)
 */
export interface Article {
  id: string; // UUID
  
  // Source & Deduplication
  source_id: string; // UUID reference to news_sources
  source_article_id: string; // HK01's 8-digit ID (e.g., '60300150')
  source_url: string; // Original URL on source
  
  // Core Metadata (from scraper)
  title: string;
  author?: string;
  category?: string; // e.g., '娛樂'
  sub_category?: string; // e.g., '即時娛樂'
  tags?: string; // Comma-separated: 'tag1,tag2,tag3'
  
  // Dates
  published_date?: string; // ISO timestamp
  updated_date?: string; // ISO timestamp
  
  // Content
  content: Array<{
    type: 'heading' | 'paragraph';
    text: string;
  }>;
  excerpt?: string; // First 200 chars summary
  
  // Main Image
  main_image_url?: string;
  main_image_caption?: string;
  
  // Extensibility
  metadata?: Record<string, unknown>; // Source-specific fields
  
  // Scraping Status
  scraped_at: string;
  last_updated_at: string;
  scrape_status: 'pending' | 'success' | 'failed';
  error_log?: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

// ===== ARTICLE IMAGE =====
export interface ArticleImage {
  id: string;
  article_id: string; // UUID reference to articles
  image_url: string; // Full URL
  caption?: string;
  display_order: number; // Sort order
  is_main_image: boolean; // Flag for hero image
  created_at: string;
}

// ===== SCRAPED ARTICLE (from scraper) =====
/**
 * Data returned from HK01 scraper
 * Converted to Article entity before database insert
 */
export interface ScrapedArticle {
  articleId?: string; // 8-digit ID (60300150)
  title: string;
  author?: string;
  category?: string; // '娛樂'
  subCategory?: string; // '即時娛樂'
  tags?: string[]; // Array of tags
  publishedDate?: string;
  updatedDate?: string;
  content: Array<{ type: 'heading' | 'paragraph'; text: string }>;
  excerpt?: string;
  mainImageUrl?: string;
  mainImageCaption?: string;
  articleImageList?: Array<{ url?: string; src?: string; caption?: string }>;
}

// ===== API RESPONSE =====
export interface ScrapeResult {
  success: boolean;
  data?: ScrapedArticle;
  error?: string;
  executionTime?: number;
}

export interface ApiArticleResponse {
  success: boolean;
  data?: Article;
  error?: string;
  metadata?: {
    timestamp: string;
    version: string;
  };
}

// ===== VALIDATION =====
export interface ValidationResult {
  field: string;
  expected: string;
  actual: string;
  match: boolean;
}

export interface ScraperCategory {
  id: string;
  source_id: string;
  slug: string;
  name: string;
  priority: number;
  is_enabled: boolean;
  last_run_at?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  source?: {
    source_key: string;
    name: string;
    base_url: string;
    scraper_config?: Record<string, unknown> | null;
  };
}

export type AutomationHistoryStatus = 'running' | 'completed' | 'failed';

export interface AutomationHistoryEntry {
  id: string;
  run_id: string;
  category_slug: string;
  source_id?: string | null;
  status: AutomationHistoryStatus;
  articles_processed: number;
  errors: Array<string> | null;
  notes?: string | null;
  started_at: string;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
}
