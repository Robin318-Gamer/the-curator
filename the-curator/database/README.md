# Database Schema Documentation

## Overview
This database schema supports a multi-source news aggregator with the following key features:
- Support for multiple news sources (HK01, future sources)
- Article deduplication by source + article ID
- Flexible content storage for different article formats
- 1-to-many image relationships with main image flagging
- Scraping status tracking and error logging

## Tables

### 1. `news_sources`
Stores configuration for each news source.

**Key Fields:**
- `source_key`: Unique identifier (e.g., 'hk01')
- `scraper_config`: JSONB containing CSS selectors and scraping rules
- `is_active`: Enable/disable sources without deletion

**Use Case:** When adding a new news source, insert a row with its configuration.

---

### 2. `articles`
Core table storing all article metadata and content.

**Deduplication:**
- Unique constraint on (`source_id`, `source_article_id`)
- Prevents duplicate articles from the same source

**Content Storage:**
- `content`: JSONB array of structured content blocks
  ```json
  [
    {"type": "heading", "text": "Main Heading"},
    {"type": "paragraph", "text": "Article paragraph..."}
  ]
  ```
- `excerpt`: Auto-generated or custom summary (first 200 chars)

**Images:**
- `main_image_url`: Primary hero image (if article has dedicated main image)
- See `article_images` table for all other images

**Scraping Metadata:**
- `scraped_at`: When article was first scraped
- `last_updated_at`: When article was re-scraped (for updates)
- `scrape_status`: 'pending', 'success', 'failed'
- `error_log`: Error messages if scraping failed

**Extensibility:**
- `metadata`: JSONB field for source-specific data
- Example: `{"views": 1000, "likes": 50}` for sources that provide engagement metrics

---

### 3. `article_images`
Stores all images associated with an article (1-to-many relationship).

**Key Fields:**
- `article_id`: Foreign key to articles table
- `image_url`: URL to the image
- `caption`: Image caption/description
- `display_order`: Integer for sorting images (0, 1, 2, ...)
- `is_main_image`: Boolean flag for main image

**Design Decision:**
- Some articles don't have a dedicated "main image" but have multiple content images
- Use `is_main_image = true` to mark which image should be the hero image
- If article has `articles.main_image_url`, that takes precedence

---

## Indexes

Performance indexes created on:
- `articles.published_date DESC` - For "latest news first" queries
- `articles.category` - For filtering by category
- `articles.source_article_id` - For deduplication checks
- `article_images.article_id` - For fetching all images for an article

---

## Setup Instructions

### 1. Run Schema in Supabase

1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy contents of `schema.sql`
4. Execute the SQL

### 2. Verify Tables Created

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('news_sources', 'articles', 'article_images');
```

### 3. Check HK01 Source Inserted

```sql
SELECT * FROM news_sources WHERE source_key = 'hk01';
```

---

## Search & Filter Queries

### Search by Title (Fuzzy Match)

```sql
-- Search articles by title (case-insensitive, fuzzy)
SELECT id, title, category, published_date, main_image_url
FROM articles
WHERE title ILIKE '%search term%'
  AND scrape_status = 'success'
ORDER BY published_date DESC
LIMIT 20;

-- Better fuzzy search using trigram similarity
SELECT id, title, category, published_date, 
       similarity(title, 'search term') as relevance
FROM articles
WHERE title % 'search term'  -- Uses pg_trgm
  AND scrape_status = 'success'
ORDER BY relevance DESC, published_date DESC
LIMIT 20;
```

### Filter by Category

```sql
SELECT id, title, category, sub_category, published_date, main_image_url
FROM articles
WHERE category = '娛樂'
  AND scrape_status = 'success'
ORDER BY published_date DESC
LIMIT 20;
```

### Filter by Sub-Category

```sql
SELECT id, title, category, sub_category, published_date, main_image_url
FROM articles
WHERE sub_category = '即時娛樂'
  AND scrape_status = 'success'
ORDER BY published_date DESC
LIMIT 20;
```

### Filter by Date Range

```sql
-- Articles from last 7 days
SELECT id, title, category, published_date, main_image_url
FROM articles
WHERE published_date >= NOW() - INTERVAL '7 days'
  AND scrape_status = 'success'
ORDER BY published_date DESC;

-- Articles between specific dates
SELECT id, title, category, published_date, main_image_url
FROM articles
WHERE published_date BETWEEN '2025-12-01' AND '2025-12-31'
  AND scrape_status = 'success'
ORDER BY published_date DESC;
```

### Combined Search & Filters

```sql
-- Search with all filters (title, category, sub-category, date range)
SELECT id, title, category, sub_category, published_date, 
       main_image_url, excerpt, author
FROM articles
WHERE 
  (title ILIKE '%search term%' OR :search_term IS NULL)
  AND (category = :category OR :category IS NULL)
  AND (sub_category = :sub_category OR :sub_category IS NULL)
  AND (published_date >= :start_date OR :start_date IS NULL)
  AND (published_date <= :end_date OR :end_date IS NULL)
  AND scrape_status = 'success'
ORDER BY published_date DESC
LIMIT 20 OFFSET :offset;
```

---

## Example Queries

### Insert Article with Images

```sql
-- 1. Insert article
INSERT INTO articles (
  source_id, source_article_id, source_url, title, author,
  category, sub_category, tags, published_date, content,
  main_image_url, main_image_caption, excerpt
) VALUES (
  (SELECT id FROM news_sources WHERE source_key = 'hk01'),
  '60300150',
  'https://www.hk01.com/...',
  'Article Title',
  'Reporter Name',
  '娛樂',
  '即時娛樂',
  'tag1,tag2,tag3',
  '2025-12-04T10:00:00Z',
  '[{"type":"paragraph","text":"Content..."}]'::jsonb,
  'https://image.url/main.jpg',
  'Main image caption',
  'Article summary...'
) RETURNING id;

-- 2. Insert images
INSERT INTO article_images (article_id, image_url, caption, display_order)
VALUES 
  ('<article-id>', 'https://image.url/1.jpg', 'Caption 1', 1),
  ('<article-id>', 'https://image.url/2.jpg', 'Caption 2', 2);
```

### Get Latest Articles with Images

```sql
SELECT 
  a.id, a.title, a.category, a.author, a.published_date,
  a.main_image_url, a.excerpt,
  json_agg(
    json_build_object(
      'url', ai.image_url,
      'caption', ai.caption,
      'order', ai.display_order
    ) ORDER BY ai.display_order
  ) as images
FROM articles a
LEFT JOIN article_images ai ON ai.article_id = a.id
WHERE a.scrape_status = 'success'
GROUP BY a.id
ORDER BY a.published_date DESC
LIMIT 20;
```

---

## Migration Strategy

When adding new sources:

1. Insert source configuration:
```sql
INSERT INTO news_sources (source_key, name, base_url, scraper_config)
VALUES ('mingpao', 'Ming Pao', 'https://mingpao.com', '{...}'::jsonb);
```

2. Update scraper to support new source selectors
3. Articles automatically link via `source_id`

---

## Future Enhancements

- Add `article_status` (draft, published, archived) for editorial workflow
- Add `user_interactions` table for likes, bookmarks
- Add full-text search index on `title` and `content`
- Add `related_articles` many-to-many relationship
