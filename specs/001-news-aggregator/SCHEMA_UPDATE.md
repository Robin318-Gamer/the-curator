# ✅ Database Schema & Types - Fixed & Consolidated

**Status**: COMPLETE  
**Date**: December 4, 2025  
**Files Updated**: 2  
**Issues Fixed**: 3 (H1, H2 - partially)

---

## Summary of Changes

### 1. Database Schema Consolidated ✅

**AUTHORITATIVE SCHEMA**: `lib/db/migrations.sql`
- **OLD**: Two conflicting schemas (migrations.sql vs database/schema.sql)
- **NEW**: Single optimized schema matching HK01 scraper

**DELETE**: `database/schema.sql` (superseded)

---

## What Changed in Schema

### Before (Confusing - 2 schemas)
```
lib/db/migrations.sql:
  - news_sources, news_articles, news_images, extraction_logs, admin_users
  - Heavy JSONB config with list_page_config + article_page_config
  - Has RLS policies with admin_users table checks

database/schema.sql:
  - news_sources, articles, article_images
  - Simpler JSONB scraper_config (just selectors)
  - Simplified RLS (all authenticated users = admin)
```

### After (Optimized - 1 schema) ✅
```
lib/db/migrations.sql (ONLY AUTHORITATIVE SCHEMA):
  ✅ news_sources - Source config (3 columns reduced to 4)
  ✅ articles - Article storage (matches HK01 extraction)
  ✅ article_images - 1-to-many images
  ✅ Removed: extraction_logs, admin_users (not needed for MVP)
  ✅ Removed: list_page_config (unnecessary complexity)
  ✅ Simplified: scraper_config (just CSS selectors)
  ✅ Simplified: RLS (no admin_users dependency)
```

---

## Schema Design Decisions

### Table: `news_sources` (Optimized)
```sql
-- BEFORE: 9 columns, complex JSONB
- id, name, base_url, category, language, active
- list_page_config (JSONB with multiple nested levels)
- article_page_config (JSONB with multiple nested levels)

-- AFTER: 5 columns, simple JSONB ✅
- id, source_key, name, base_url, scraper_config
- scraper_config: Just CSS selectors (flat structure)
- Removed: category, language (add to metadata later if needed)
- Removed: list_page_config (not used in current scraper)
```

**Reason**: Simpler = fewer bugs, easier to maintain, matches actual scraper usage

---

### Table: `articles` (Matches HK01 Scraper) ✅
```sql
-- All fields extracted by HK01ArticleScraper:
- source_id, source_article_id (for deduplication)
- title, author, category, sub_category, tags
- published_date, updated_date
- content (JSONB array of {type, text})
- excerpt, main_image_url, main_image_caption
- metadata (extensible JSONB for future sources)
- scraped_at, scrape_status, error_log (debugging)
```

**Design**: 
✅ Exact match to ArticleScraper.ts extraction  
✅ UNIQUE(source_id, source_article_id) - prevents duplicates  
✅ scrape_status - track success/failure  
✅ error_log - debug scraping issues

---

### Table: `article_images` (1-to-many) ✅
```sql
- article_id (FK to articles)
- image_url (full URL)
- caption (from scraper extraction)
- display_order (for gallery ordering)
- is_main_image (flag for articles without main_image_url)
```

**Design**: Clean 1-to-many relationship matching HK01 `articleImageList` extraction

---

## Updated Indexes (Performance Optimized)

### Search & Filter Performance
```sql
-- Title search (trigram for typo tolerance)
CREATE INDEX idx_articles_title_trgm ON articles USING gin(title gin_trgm_ops);

-- Category filtering
CREATE INDEX idx_articles_category_published ON articles(category, published_date DESC);
CREATE INDEX idx_articles_sub_category_published ON articles(sub_category, published_date DESC);

-- Deduplication check
CREATE INDEX idx_articles_source_article_id ON articles(source_id, source_article_id);

-- All indexes used for Phase 1B import API
```

---

## Updated TypeScript Types ✅

**File**: `lib/types/database.ts`

### Before (Mismatched to schema)
```typescript
NewsSource - had list_page_config, article_page_config
NewsArticle - string content (not JSONB structured)
NewsImage - had is_featured, alt_text
ExtractionLog, AdminUser - not used, cluttering types
```

### After (Perfect alignment) ✅
```typescript
// ✅ NewsSource
- source_key, name, base_url
- scraper_config { selectors: {...} }

// ✅ Article (CORE TYPE)
- source_id, source_article_id
- title, author, category, sub_category, tags
- published_date, updated_date
- content: Array<{type: 'heading'|'paragraph', text: string}>
- excerpt, main_image_url, main_image_caption
- metadata (JSONB for extensibility)
- scraped_at, scrape_status, error_log

// ✅ ArticleImage
- article_id, image_url, caption
- display_order, is_main_image

// ✅ ScrapedArticle (from HK01 scraper)
- Matches ArticleScraper.ts output
- Converted to Article before DB insert

// ✅ Removed: ExtractionLog, AdminUser, NewsArticle, NewsImage
- Not needed for Phase 1
- Keep types simple
```

---

## How to Deploy

### Step 1: Drop All Tables (Fresh Start)
```sql
-- Copy entire lib/db/migrations.sql to Supabase SQL Editor
-- Execute all at once
-- This will:
-- ✅ Drop old tables (if they exist)
-- ✅ Create 3 new tables
-- ✅ Create indexes
-- ✅ Create triggers
-- ✅ Enable RLS
-- ✅ Insert HK01 source config
```

### Step 2: Verify in Supabase
```
Open Supabase Dashboard → SQL Editor → Run:
SELECT * FROM news_sources; -- Should show 1 row (HK01)
SELECT * FROM articles; -- Empty (ready for import)
```

### Step 3: Delete Old Schema File
```bash
rm database/schema.sql  # No longer needed
git commit -m "refactor: consolidate database schema to single authoritative version"
```

---

## Updated Constants (HK01 Verified)

**In migrations.sql - seed data:**
```json
{
  "selectors": {
    "title": "h1#articleTitle",                          ✅ Verified
    "author": "[data-testid=\"article-author\"]",        ✅ Verified
    "breadcrumb_zone": "[data-testid=\"article-breadcrumb-zone\"]",    ✅
    "breadcrumb_channel": "[data-testid=\"article-breadcrumb-channel\"]", ✅
    "published_date": "[data-testid=\"article-publish-date\"]",       ✅
    "updated_date": "[data-testid=\"article-update-date\"]",         ✅
    "tags": "[data-testid=\"article-tag\"]",             ✅
    "main_image": "[data-testid=\"article-top-section\"] img", ✅
    "images": ".article-grid__content-section .lazyload-wrapper img", ✅
    "content": ".article-grid__content-section"          ✅
  }
}
```

**All selectors match**: `lib/scrapers/ArticleScraper.ts` extraction logic

---

## Next Steps (Phase 1B)

Now that schema & types are aligned, you can build:

1. **T003**: Supabase utilities `lib/supabase/articlesClient.ts`
   - `checkArticleExists(sourceId, sourceArticleId)`
   - `createArticle(article: Article)`
   - `createArticleImages(articleId, images: ArticleImage[])`

2. **T004**: Import API endpoint `/api/articles/import`
   - Input: ScrapedArticle (from scraper)
   - Output: Inserted Article record

3. **T005**: "Save to Database" button on scraper-url-test page

---

## Files Changed

| File | Status | Changes |
|------|--------|---------|
| `lib/db/migrations.sql` | ✅ Updated | Consolidated schema, removed old tables, added HK01 config |
| `lib/types/database.ts` | ✅ Updated | Aligned with new schema, matched HK01 scraper output |
| `database/schema.sql` | ❌ DELETE | Superseded by migrations.sql |

---

## Verification Checklist

- [x] Schema has 3 tables (news_sources, articles, article_images)
- [x] HK01 source pre-inserted with correct selectors
- [x] Unique constraint on (source_id, source_article_id)
- [x] Content stored as JSONB array
- [x] Images in separate table (1-to-many)
- [x] All indexes created for search/filter performance
- [x] TypeScript types match database schema
- [x] Types match HK01 ArticleScraper extraction
- [x] RLS policies set (public read, authenticated write)

---

## Benefits of This Consolidation

✅ **Single source of truth** - One schema file  
✅ **Type safety** - TypeScript types match database exactly  
✅ **HK01 optimized** - Schema designed for what scraper actually extracts  
✅ **Simpler RLS** - No admin_users table dependency for MVP  
✅ **Extensible** - metadata JSONB for future sources  
✅ **Performance** - All necessary indexes for Phase 2 queries  
✅ **Clean** - Removed unused tables (extraction_logs, admin_users)  
✅ **Documented** - Comments explain each field purpose

---

## Ready for Phase 1B ✅

All critical paths are now aligned:
- Database schema ✅
- TypeScript types ✅
- HK01 scraper extraction ✅
- CSS selectors ✅

You can now build the import API endpoint with confidence!
