-- News Aggregator Database Schema
-- Author: GitHub Copilot
-- Date: 2025-12-04
-- Database: PostgreSQL (Supabase)

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm; -- For fuzzy text search on title

-- =====================================================
-- 1. NEWS SOURCES TABLE
-- Stores configuration for each news source (HK01, future sources)
-- =====================================================
CREATE TABLE IF NOT EXISTS news_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_key VARCHAR(50) UNIQUE NOT NULL, -- 'hk01', 'mingpao', etc.
  name VARCHAR(100) NOT NULL, -- 'HK01', 'Ming Pao'
  base_url VARCHAR(255) NOT NULL, -- 'https://www.hk01.com'
  scraper_config JSONB, -- Store selectors and scraping rules
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. SCRAPER CATEGORIES TABLE
-- Stores schedulable categories per source
-- =====================================================
CREATE TABLE IF NOT EXISTS scraper_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID REFERENCES news_sources(id) ON DELETE CASCADE,
  slug VARCHAR(150) NOT NULL,
  name VARCHAR(255) NOT NULL,
  priority INTEGER DEFAULT 100,
  is_enabled BOOLEAN DEFAULT true,
  last_run_at TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(source_id, slug)
);

-- =====================================================
-- 3. ARTICLES TABLE
-- Core article metadata and content
-- =====================================================
CREATE TABLE IF NOT EXISTS articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Source & Deduplication
  source_id UUID REFERENCES news_sources(id) ON DELETE CASCADE,
  source_article_id VARCHAR(100) NOT NULL, -- HK01's article ID (e.g., '60300150')
  source_url TEXT NOT NULL, -- Original article URL
  
  -- Core Metadata
  title TEXT NOT NULL,
  author VARCHAR(255),
  category VARCHAR(100), -- e.g., '娛樂'
  sub_category VARCHAR(100), -- e.g., '即時娛樂'
  tags TEXT, -- Comma-separated tags
  
  -- Dates
  published_date TIMESTAMPTZ, -- When article was published on source
  updated_date TIMESTAMPTZ, -- When article was last updated on source
  
  -- Content
  content JSONB NOT NULL, -- Array of {type: 'heading'|'paragraph', text: '...'}
  excerpt TEXT, -- Short summary (first 200 chars or custom)
  
  -- Main Image
  main_image_url TEXT,
  main_image_caption TEXT,
  
  -- Source-Specific Data (extensible for future sources)
  metadata JSONB, -- Additional fields specific to each source
  
  -- Scraping Metadata
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  scrape_status VARCHAR(20) DEFAULT 'success', -- 'pending', 'success', 'failed'
  error_log TEXT,
  
  -- Indexes & Constraints
  CONSTRAINT unique_source_article UNIQUE(source_id, source_article_id),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. ARTICLE IMAGES TABLE
-- 1-to-many relationship for article images
-- =====================================================
CREATE TABLE IF NOT EXISTS article_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
  
  image_url TEXT NOT NULL,
  caption TEXT,
  display_order INTEGER DEFAULT 0, -- Order to display images
  is_main_image BOOLEAN DEFAULT false, -- Flag for main image
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 5. AUTOMATION HISTORY TABLE
-- Stores automation run logs for scheduler visibility
-- =====================================================
CREATE TABLE IF NOT EXISTS automation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL DEFAULT gen_random_uuid(),
  category_slug VARCHAR(150) NOT NULL,
  source_id UUID REFERENCES news_sources(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'running',
  articles_processed INTEGER DEFAULT 0,
  errors JSONB DEFAULT '[]',
  notes TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Article queries
CREATE INDEX idx_articles_source_id ON articles(source_id);
CREATE INDEX idx_articles_published_date ON articles(published_date DESC);
CREATE INDEX idx_articles_category ON articles(category);
CREATE INDEX idx_articles_sub_category ON articles(sub_category);
CREATE INDEX idx_articles_scrape_status ON articles(scrape_status);
CREATE INDEX idx_articles_source_article_id ON articles(source_article_id);

-- Search indexes
CREATE INDEX idx_articles_title_trgm ON articles USING gin(title gin_trgm_ops);
CREATE INDEX idx_articles_category_published ON articles(category, published_date DESC);
CREATE INDEX idx_articles_sub_category_published ON articles(sub_category, published_date DESC);

-- Image queries
CREATE INDEX idx_article_images_article_id ON article_images(article_id);
CREATE INDEX idx_article_images_display_order ON article_images(article_id, display_order);
-- Scraper scheduler indexes
CREATE INDEX IF NOT EXISTS idx_scraper_categories_source_id ON scraper_categories(source_id);
CREATE INDEX IF NOT EXISTS idx_scraper_categories_priority ON scraper_categories(priority, last_run_at);
-- Automation history indexes
CREATE UNIQUE INDEX IF NOT EXISTS uq_automation_history_run_id ON automation_history(run_id);
CREATE INDEX IF NOT EXISTS idx_automation_history_category ON automation_history(category_slug, status);

-- =====================================================
-- SAMPLE DATA - Insert HK01 as default source
-- =====================================================
INSERT INTO news_sources (source_key, name, base_url, scraper_config, is_active)
VALUES (
  'hk01',
  'HK01',
  'https://www.hk01.com',
  '{
    "selectors": {
      "title": "h1#articleTitle",
      "author": "[data-testid=\"article-author\"]",
      "breadcrumb_zone": "[data-testid=\"article-breadcrumb-zone\"]",
      "breadcrumb_channel": "[data-testid=\"article-breadcrumb-channel\"]",
      "published_date": "[data-testid=\"article-publish-date\"]",
      "updated_date": "[data-testid=\"article-update-date\"]",
      "tags": "[data-testid=\"article-tag\"]",
      "main_image": "[data-testid=\"article-image\"] img",
      "images": ".article-grid__content-section .lazyload-wrapper img",
      "content": ".article-grid__content-section"
    }
  }'::jsonb,
  true
)
ON CONFLICT (source_key) DO NOTHING;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE news_sources IS 'Configuration for each news source';
COMMENT ON TABLE articles IS 'Core article data with metadata and content';
COMMENT ON TABLE article_images IS 'Images associated with articles (1-to-many)';
COMMENT ON COLUMN articles.content IS 'JSON array of content blocks: [{type: "heading", text: "..."}, {type: "paragraph", text: "..."}]';
COMMENT ON COLUMN articles.metadata IS 'Source-specific fields stored as JSON for extensibility';
COMMENT ON COLUMN article_images.is_main_image IS 'Flag to identify main/hero image (for articles without dedicated main image)';
COMMENT ON TABLE scraper_categories IS 'Scheduler categories for automation. Tracks slug, priority, and last run time per source.';
COMMENT ON COLUMN scraper_categories.last_run_at IS 'Timestamp of last automation run for the category (null if never run).';
COMMENT ON TABLE automation_history IS 'Automation execution log. Stores run ID, category, article counts, and errors.';
COMMENT ON COLUMN automation_history.errors IS 'JSON array of error messages captured during the automation run.';
