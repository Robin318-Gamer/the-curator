# 04. API Specification

> **Project**: The Curator (Global News Aggregator)
> **Status**: Draft
> **Last Updated**: 2025-12-01

## 1. General Standards
*   **Base URL**: `/api`
*   **Content-Type**: `application/json`
*   **Auth**: Admin endpoints require Supabase Session Cookie.

## 2. Admin Endpoints

### 2.1 Trigger Scrape
**POST** `/api/admin/scrape`

Triggers a manual extraction for a specific URL.

**Request**:
```json
{
  "sourceKey": "oriental_daily",
  "url": "https://example.com/news/123"
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "articleId": "uuid-of-saved-article"
}
```

### 2.2 Trigger AI Rewrite
**POST** `/api/admin/rewrite`

Triggers the AI service to rewrite an existing article.

**Request**:
```json
{
  "articleId": "uuid-of-article"
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "rewrittenContent": "..."
}
```

### 2.3 Export to WordPress
**POST** `/api/admin/export-wp`

Pushes an article to the configured WordPress site.

**Request**:
```json
{
  "articleId": "uuid-of-article"
}
```

**Response (200 OK)**:
```json
{
  "success": true,
  "wpPostId": 1045
}
```

## 3. Public Endpoints

### 3.1 List Articles
**GET** `/api/news`

Retrieves a paginated list of articles for the public reader.

**Query Params**:
*   `page`: number (default 1)
*   `limit`: number (default 20)
*   `category`: string (optional)

**Response (200 OK)**:
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "Headline",
      "summary": "...",
      "publishedAt": "ISO-Date",
      "source": { "name": "Oriental Daily" },
      "featuredImage": "https://..."
    }
  ],
  "meta": {
    "total": 100,
    "page": 1,
    "lastPage": 5
  }
}
```

### 3.2 Get Article Details
**GET** `/api/news/[id]`

Retrieves full details for a single article.

**Response (200 OK)**:
```json
{
  "id": "uuid",
  "title": "Headline",
  "content": "HTML Content...",
  "authors": ["Name"],
  "tags": ["Tag1", "Tag2"],
  "images": [...]
}
```
