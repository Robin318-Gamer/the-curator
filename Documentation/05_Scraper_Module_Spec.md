# 05. Scraper Module Specification

> **Project**: The Curator (Global News Aggregator)
> **Status**: Partially Implemented
> **Last Updated**: 2025-12-04
> **Implementation Progress**: HK01 Scraper ✅ Complete | Oriental Daily & Ming Pao: Pending

## 1. Overview
The Scraper Module is responsible for collecting news articles from supported sources and extracting relevant metadata for storage in the database. It is mapped to User Story 3 and must operate independently.
## 1.1 Workflow & Isolation

1. Collect unique article URLs from each source.
2. For each URL, fetch and parse HTML.
3. Extract metadata: title, summary, content, images, publish date, author.
4. Standardize data into common format (`ArticleMetadata`).
5. Store results in database via API (no direct DB access).

**Isolation Requirement:**
The Scraper logic must be isolated and independently testable. It should not depend on other modules except for the API interface. All integration points must be documented and testable in isolation.

## 2. Core Interface (`ScraperInterface`)

Every source scraper MUST implement this interface:

```typescript
export interface ArticleMetadata {
  sourceArticleId: string;
  url: string;
  title: string;
  summary: string;
  content: string; // Sanitized HTML
  publishedAt: string; // ISO 8601
  authors: string[];
  category: string;
  tags: string[];
  images: {
    url: string;
    caption?: string;
    isFeatured: boolean;
  }[];
}

export interface ScraperInterface {
  /** Unique key for the source (e.g., 'oriental_daily') */
  key: string;
  
  /** Display name */
  name: string;
  
  /** Main entry point: Scrape a URL */
  scrape(url: string): Promise<ArticleMetadata>;
  
  /** Parse HTML directly (useful for testing) */
  extractFromHtml(html: string, url: string): ArticleMetadata;
}
```

## 3. Base Scraper Logic (`BaseScraper`)

A shared abstract class should handle common tasks:
1.  **HTTP Requests**: Use `axios` with User-Agent rotation.
2.  **Encoding**: Handle charset decoding (e.g., Big5 for older HK sites).
3.  **URL Normalization**: Convert relative URLs (`/images/1.jpg`) to absolute (`https://site.com/images/1.jpg`).
4.  **HTML Sanitization**:
    *   Remove `<script>`, `<style>`, `<iframe>`, `<object>`.
    *   Remove event handlers (`onclick`, `onload`).
    *   Preserve semantic tags (`p`, `h1-h6`, `ul`, `ol`, `li`, `blockquote`, `img`).

## 4. Source-Specific Rules

### 4.1 Oriental Daily (`oriental_daily`)
*   **Domain**: `orientaldaily.on.cc`
*   **Title Selector**: `h1.title` or `title`
*   **Content Selector**: `.paragraph` (Iterate and join)
*   **Date Selector**: `meta[name="articleDate"]`
*   **Image Selector**: `div.photo img.original`

### 4.2 Ming Pao (`ming_pao`)
*   **Domain**: `news.mingpao.com`
*   **Title Selector**: `h1`
*   **Content Selector**: `.article_content`
*   **Special Handling**: Ming Pao often splits content into pages or uses complex layouts. Scraper must handle pagination if present (or just take page 1).

### 4.3 HK01 (`hk01`) ✅ COMPLETED
*   **Domain**: `hk01.com`
*   **Title Selector**: `h1#articleTitle`
*   **Content Selector**: `#article-content-section`
*   **Implementation Status**: ✅ Complete (Commit c15ce76)
*   **Special Handling**: HK01 is a Single Page App (SPA) with lazy-loaded images
    - **Solution**: Integrated Puppeteer for headless browser rendering
    - **Image Extraction**: Main image from `[data-testid="article-top-section"]`, article images from `.article-grid__content-section .lazyload-wrapper`
    - **Captions**: Extracted from `img.title` / `img.alt` attributes or `.img-caption` spans
    - **Content Structure**: Preserves `h3` headings and `p` paragraphs with markdown prefix (`### `) for heading detection
    - **Update Date**: Extracted from `[data-testid="article-publish-info"]` with "更新：" prefix
    - **Tags**: Extracted from `[data-testid="article-tag"] a span`
    - **Author**: Extracted from `[data-testid="article-author"]` with "撰文：" prefix handling
    - **API Endpoint**: `/api/scraper/url` - accepts POST with `url` parameter
    - **Admin Interface**: `/admin/scraper-url-test` - live URL testing and metadata display
*   **Key Files**:
    - `lib/scrapers/ArticleScraper.ts` - Main scraper class with Puppeteer integration
    - `lib/constants/sources.ts` - HK01 selector configuration
    - `app/api/scraper/url/route.ts` - API endpoint with Puppeteer for JS rendering
    - `app/admin/scraper-url-test/page.tsx` - Admin test UI with metadata display
*   **Extracted Data Fields**:
    - Title, Author, Category, Tags
    - Main Image & Article Image List (with captions)
    - Publish Date & Update Date (ISO 8601 format)
    - Article Content (with structure preservation)
    - Summary (first 200 chars of content)

## 5. Error Handling
*   **NetworkError**: If the site is unreachable (Retry 3 times).
*   **ParseError**: If critical selectors (Title, Content) return null.
*   **ValidationError**: If the extracted data fails schema validation (e.g., missing ID).
