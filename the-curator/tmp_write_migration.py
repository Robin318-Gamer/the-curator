from pathlib import Path

content = '''-- The Curator - Optimized Database Schema
-- Latest: 2025-12-04
-- Database: PostgreSQL (Supabase)
-- Matches: HK01 Scraper Implementation
--
-- This is the AUTHORITATIVE schema. All tables are freshly designed
-- to match the current HK01 scraper and support multi-source expansion.

DROP FUNCTION IF EXISTS public.reset_curator_schema();

CREATE OR REPLACE FUNCTION public.reset_curator_schema()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  EXECUTE $ddl$
    -- ============================================================================
    -- DROP EXISTING TABLES (complete clean slate)
    -- ============================================================================
    DROP TABLE IF EXISTS article_images CASCADE;
    DROP TABLE IF EXISTS articles CASCADE;
    DROP TABLE IF EXISTS news_sources CASCADE;
    DROP TABLE IF EXISTS scraper_categories CASCADE;
    DROP TABLE IF EXISTS automation_history CASCADE;
    DROP TABLE IF EXISTS newslist CASCADE;

    -- Enable required extensions
    CREATE EXTENSION IF NOT EXISTS pg_trgm;

    -- ============================================================================
    -- TABLE: newslist
    -- Tracks discovered article URLs and their ingestion status
    -- ============================================================================
    CREATE TABLE newslist (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      source_id UUID NOT NULL,
      source_article_id VARCHAR(100),
      url TEXT NOT NULL UNIQUE,
      status VARCHAR(20) NOT NULL DEFAULT 'pending',
      meta JSONB,
      error_log TEXT,
      attempt_count INTEGER NOT NULL DEFAULT 0,
      last_processed_at TIMESTAMPTZ,
      resolved_article_id UUID,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(source_id, source_article_id)
    );

    -- ============================================================================
    -- TABLE: news_sources
    -- Stores configuration for each news source
    -- ============================================================================
    CREATE TABLE news_sources (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      source_key VARCHAR(50) UNIQUE NOT NULL,
      name VARCHAR(100) NOT NULL,
      base_url VARCHAR(255) NOT NULL,
      scraper_config JSONB NOT NULL,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- ============================================================================
    -- TABLE: scraper_categories
    -- Scheduler configuration per source
    -- ============================================================================
    CREATE TABLE scraper_categories (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      source_id UUID NOT NULL REFERENCES news_sources(id) ON DELETE CASCADE,
      slug VARCHAR(150) NOT NULL,
      name VARCHAR(255) NOT NULL,
      priority INTEGER NOT NULL DEFAULT 100,
      is_enabled BOOLEAN DEFAULT true,
      last_run_at TIMESTAMPTZ,
      metadata JSONB,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(source_id, slug)
    );

    -- ============================================================================
    -- TABLE: articles
    -- Core article storage matching HK01 extraction
    -- ============================================================================
    CREATE TABLE articles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      source_id UUID NOT NULL REFERENCES news_sources(id) ON DELETE CASCADE,
      source_article_id VARCHAR(100) NOT NULL,
      source_url TEXT NOT NULL,
      title TEXT NOT NULL,
      author VARCHAR(255),
      category VARCHAR(100),
      sub_category VARCHAR(100),
      tags TEXT,
      published_date TIMESTAMPTZ,
      updated_date TIMESTAMPTZ,
      content JSONB NOT NULL,
      excerpt TEXT,
      main_image_url TEXT,
      main_image_caption TEXT,
      metadata JSONB,
      scraped_at TIMESTAMPTZ DEFAULT NOW(),
      last_updated_at TIMESTAMPTZ DEFAULT NOW(),
      scrape_status VARCHAR(20) DEFAULT 'success',
      error_log TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(source_id, source_article_id)
    );

    -- ============================================================================
    -- TABLE: article_images
    -- All images associated with articles
    -- ============================================================================
    CREATE TABLE article_images (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
      image_url TEXT NOT NULL,
      caption TEXT,
      display_order INTEGER DEFAULT 0,
      is_main_image BOOLEAN DEFAULT false,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    -- ============================================================================
    -- TABLE: automation_history
    -- Stores automation execution log
    -- ============================================================================
    CREATE TABLE automation_history (
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

    -- ============================================================================
    -- INDEXES
    -- ============================================================================
    CREATE INDEX IF NOT EXISTS idx_newslist_source_id ON newslist(source_id);
    CREATE INDEX IF NOT EXISTS idx_newslist_status ON newslist(status);
    CREATE INDEX IF NOT EXISTS idx_newslist_created_at ON newslist(created_at DESC);

    CREATE INDEX IF NOT EXISTS idx_articles_source_id ON articles(source_id);
    CREATE INDEX IF NOT EXISTS idx_articles_source_article_id ON articles(source_id, source_article_id);
    CREATE INDEX IF NOT EXISTS idx_articles_published_date ON articles(published_date DESC);
    CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);
    CREATE INDEX IF NOT EXISTS idx_articles_sub_category ON articles(sub_category);
    CREATE INDEX IF NOT EXISTS idx_articles_scrape_status ON articles(scrape_status);
    CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_articles_title_trgm ON articles USING gin(title gin_trgm_ops);
    CREATE INDEX IF NOT EXISTS idx_articles_category_published ON articles(category, published_date DESC);
    CREATE INDEX IF NOT EXISTS idx_articles_sub_category_published ON articles(sub_category, published_date DESC);

    CREATE INDEX IF NOT EXISTS idx_article_images_article_id ON article_images(article_id);
    CREATE INDEX IF NOT EXISTS idx_article_images_display_order ON article_images(display_order);

    CREATE INDEX IF NOT EXISTS idx_scraper_categories_source_id ON scraper_categories(source_id);
    CREATE INDEX IF NOT EXISTS idx_scraper_categories_priority ON scraper_categories(priority, last_run_at);

    CREATE UNIQUE INDEX IF NOT EXISTS uq_automation_history_run_id ON automation_history(run_id);
    CREATE INDEX IF NOT EXISTS idx_automation_history_category ON automation_history(category_slug, status);

    -- ============================================================================
    -- TRIGGER FUNCTION
    -- ============================================================================
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $_upd$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $_upd$ LANGUAGE plpgsql;

    -- ============================================================================
    -- TRIGGERS
    -- ============================================================================
    DROP TRIGGER IF EXISTS trg_newslist_updated_at ON newslist;
    CREATE TRIGGER trg_newslist_updated_at
      BEFORE UPDATE ON newslist
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();

    DROP TRIGGER IF EXISTS trg_news_sources_updated_at ON news_sources;
    CREATE TRIGGER trg_news_sources_updated_at
      BEFORE UPDATE ON news_sources
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();

    DROP TRIGGER IF EXISTS trg_articles_updated_at ON articles;
    CREATE TRIGGER trg_articles_updated_at
      BEFORE UPDATE ON articles
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();

    DROP TRIGGER IF EXISTS trg_article_images_updated_at ON article_images;
    CREATE TRIGGER trg_article_images_updated_at
      BEFORE UPDATE ON article_images
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();

    DROP TRIGGER IF EXISTS trg_scraper_categories_updated_at ON scraper_categories;
    CREATE TRIGGER trg_scraper_categories_updated_at
      BEFORE UPDATE ON scraper_categories
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();

    DROP TRIGGER IF EXISTS trg_automation_history_updated_at ON automation_history;
    CREATE TRIGGER trg_automation_history_updated_at
      BEFORE UPDATE ON automation_history
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();

    -- ============================================================================
    -- ROW LEVEL SECURITY
    -- ============================================================================
    ALTER TABLE newslist ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Public read newslist" ON newslist;
    DROP POLICY IF EXISTS "Admin write newslist" ON newslist;
    CREATE POLICY "Public read newslist"
      ON newslist FOR SELECT
      TO anon, authenticated
      USING (true);
    CREATE POLICY "Admin write newslist"
      ON newslist FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
    DROP POLICY IF EXISTS "Dev allow anon write newslist" ON newslist;
    CREATE POLICY "Dev allow anon write newslist"
      ON newslist FOR ALL
      TO anon
      USING (true)
      WITH CHECK (true);

    ALTER TABLE news_sources ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Public read active sources"
      ON news_sources FOR SELECT
      TO anon, authenticated
      USING (is_active = true);
    CREATE POLICY "Admin write news_sources"
      ON news_sources FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);

    ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Public read all articles"
      ON articles FOR SELECT
      TO anon, authenticated
      USING (scrape_status = 'success');
    CREATE POLICY "Admin write articles"
      ON articles FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
    DROP POLICY IF EXISTS "Dev allow anon write articles" ON articles;
    CREATE POLICY "Dev allow anon write articles"
      ON articles FOR ALL
      TO anon
      USING (true)
      WITH CHECK (true);

    ALTER TABLE article_images ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Public read all images"
      ON article_images FOR SELECT
      TO anon, authenticated
      USING (true);
    CREATE POLICY "Admin write article_images"
      ON article_images FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
    DROP POLICY IF EXISTS "Dev allow anon write article_images" ON article_images;
    CREATE POLICY "Dev allow anon write article_images"
      ON article_images FOR ALL
      TO anon
      USING (true)
      WITH CHECK (true);

    ALTER TABLE scraper_categories ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Public read scraper categories"
      ON scraper_categories FOR SELECT
      TO anon, authenticated
      USING (is_enabled = true);
    CREATE POLICY "Admin write scraper categories"
      ON scraper_categories FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);
    DROP POLICY IF EXISTS "Dev allow anon write scraper categories" ON scraper_categories;
    CREATE POLICY "Dev allow anon write scraper categories"
      ON scraper_categories FOR ALL
      TO anon
      USING (true)
      WITH CHECK (true);

    ALTER TABLE automation_history ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Select automation history"
      ON automation_history FOR SELECT
      TO authenticated
      USING (true);
    CREATE POLICY "Insert automation history"
      ON automation_history FOR INSERT
      TO authenticated
      USING (true)
      WITH CHECK (true);
    DROP POLICY IF EXISTS "Dev allow anon write automation history" ON automation_history;
    CREATE POLICY "Dev allow anon write automation history"
      ON automation_history FOR ALL
      TO anon
      USING (true)
      WITH CHECK (true);

    -- ============================================================================
    -- LINKING\n    -- ============================================================================
    ALTER TABLE newslist
      ADD CONSTRAINT newslist_source_fk
      FOREIGN KEY (source_id)
      REFERENCES news_sources(id)
      ON DELETE CASCADE;

    ALTER TABLE newslist
      ADD CONSTRAINT newslist_resolved_article_fk
      FOREIGN KEY (resolved_article_id)
      REFERENCES articles(id)
      ON DELETE SET NULL;

    -- ============================================================================
    -- SEED DATA
    -- ============================================================================
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
          "main_image": "[data-testid=\"article-top-section\"] img",
          "images": ".article-grid__content-section .lazyload-wrapper img",
          "content": ".article-grid__content-section"
        }
      }'::jsonb,
      true
    )
    ON CONFLICT (source_key) DO NOTHING;

    -- ============================================================================
    -- COMMENTS
    -- ============================================================================
    COMMENT ON TABLE newslist IS 'Tracks all discovered URLs and their processing status.';
    COMMENT ON COLUMN newslist.status IS 'Status machine for newslist entries.';
    COMMENT ON TABLE news_sources IS 'Configuration for each news source and its selectors.';
    COMMENT ON TABLE scraper_categories IS 'Scheduler categories for automation runs.';
    COMMENT ON COLUMN scraper_categories.last_run_at IS 'Last run timestamp for the scheduler category.';
    COMMENT ON TABLE articles IS 'Core article storage with metadata and content.';
    COMMENT ON COLUMN articles.content IS 'JSONB array of structured content blocks.';
    COMMENT ON COLUMN articles.metadata IS 'Source-specific metadata stored as JSONB.';
    COMMENT ON TABLE article_images IS 'Images attached to each article.';
    COMMENT ON COLUMN article_images.is_main_image IS 'Flag identifying the hero image.';
    COMMENT ON TABLE automation_history IS 'Audit trail for automation executions.';
    COMMENT ON COLUMN automation_history.errors IS 'JSON array of error messages during automation.';

    -- ============================================================================
    -- END OF SCHEMA
    -- ============================================================================
  $ddl$;
END;
$$;

GRANT EXECUTE ON FUNCTION public.reset_curator_schema() TO service_role;

SELECT public.reset_curator_schema();'''

Path('lib/db/migrations.sql').write_text(content, encoding='utf-8')
