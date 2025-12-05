# 03. Database Schema Specification

> **Project**: The Curator (Global News Aggregator)
> **Status**: Draft
> **Last Updated**: 2025-12-01

## 1. Overview
The database schema supports all four user stories and ensures module isolation:

- Storage of scraped news articles from multiple sources
- Metadata for each article (title, summary, author, publish date, images)
- Tracking of article rewrite status and WordPress export status
- API endpoints provide all access; direct DB access by modules is prohibited

The database is hosted on **Supabase (PostgreSQL)**. This document defines the strict schema required to support the application.

## 2. Tables

### 2.1 `news_sources`
Registry of supported news websites.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `int4` | PK, Identity | Unique ID |
| `name` | `text` | NOT NULL | Display name (e.g., "Oriental Daily") |
| `scraper_key` | `text` | UNIQUE, NOT NULL | Internal key mapping to Scraper Class (e.g., "oriental_daily") |
| `base_url` | `text` | NOT NULL | Main URL of the source |
| `is_active` | `bool` | DEFAULT true | Soft delete/disable flag |
| `created_at` | `timestamptz` | DEFAULT now() | |

### 2.2 `news_articles`
The central repository of news content.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK, DEFAULT gen_random_uuid() | Unique System ID |
| `source_id` | `int4` | FK -> `news_sources.id` | Origin source |
| `source_article_id` | `text` | NOT NULL | ID/Slug from the source website |
| `url` | `text` | NOT NULL | Original Article URL |
| `title` | `text` | NOT NULL | Headline |
| `summary` | `text` | | Brief description/lead |
| `content` | `text` | | **Original** Sanitized HTML content |
| `ai_rewritten_content` | `text` | | **Rewritten** content (if AI processed) |
| `published_at` | `timestamptz` | NOT NULL | Original publication time |
| `authors` | `text[]` | | Array of author names |
| `category` | `text` | | Primary category |
| `tags` | `text[]` | | Array of keywords |
| `is_exported_to_wp` | `bool` | DEFAULT false | Sync status flag |
| `wp_post_id` | `int4` | | ID of the post in WordPress (if exported) |
| `created_at` | `timestamptz` | DEFAULT now() | System ingestion time |
| `updated_at` | `timestamptz` | DEFAULT now() | Last update time |

**Indexes**:
*   `idx_news_articles_source_unique`: UNIQUE(`source_id`, `source_article_id`) - Prevents duplicates.
*   `idx_news_articles_published_at`: For sorting by date.

### 2.3 `news_images`
Images extracted from articles.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | `uuid` | PK, DEFAULT gen_random_uuid() | |
| `article_id` | `uuid` | FK -> `news_articles.id` (CASCADE) | Parent article |
| `url` | `text` | NOT NULL | Absolute URL of the image |
| `caption` | `text` | | Image caption |
| `is_featured` | `bool` | DEFAULT false | Is this the main header image? |
| `created_at` | `timestamptz` | DEFAULT now() | |

## 3. Relationships
*   **One-to-Many**: `news_sources` (1) -> `news_articles` (N)
*   **One-to-Many**: `news_articles` (1) -> `news_images` (N)

## 4. Security (RLS)
*   **Public Access**: `SELECT` allowed on `news_articles` (where published), `news_sources`, `news_images`.
*   **Admin Access**: `ALL` operations allowed for authenticated users with `role = 'admin'`.
