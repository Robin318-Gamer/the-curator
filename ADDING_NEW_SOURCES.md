# Adding New News Sources - Developer Guide

This guide explains how to add support for new news sources to the multi-source scraper architecture.

## Quick Overview

The scraper supports multiple news sources through a **registry pattern**. Adding a new source requires:
1. Adding source configuration to the registry
2. Adding URL patterns for article detection
3. (Optional) Creating source-specific extraction logic

**Time to add a new source: ~15-30 minutes**

---

## Step-by-Step Instructions

### Step 1: Add Source Configuration

**File:** `lib/constants/sourceRegistry.ts`

Add your source configuration following this template:

```typescript
// Example: Apple Daily Configuration
export const appleDailyConfig: NewsSource = {
  id: 'appledaily',
  source_key: 'appledaily',
  name: 'Apple Daily 蘋果日報',
  base_url: 'https://www.appledaily.com.tw',
  category: 'General',
  language: 'zh-TW',
  is_active: true,
  
  // Configuration for list/category pages
  list_page_config: {
    listUrl: 'https://www.appledaily.com.tw/realtime/latest/', // Main article listing page
    selectors: {
      articleLinks: 'a.article-link', // CSS selector for article links
      articleId: 'data-article-id',  // Attribute containing article ID (or 'href' to extract from URL)
    },
  },
  
  // Configuration for individual article pages
  article_page_config: {
    selectors: {
      title: 'h1.article-title, h1.headline',           // REQUIRED: Article title
      content: '.article-body p, .content-text p',      // REQUIRED: Article paragraphs
      author: '.author-name, .byline',                  // Optional: Author name
      publishDate: 'time[datetime], .publish-date',     // Optional: Publication date
      category: '.category-label, .breadcrumb a',       // Optional: Category/section
    },
  },
  
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};
```

**Key Points:**
- `source_key`: Unique identifier (lowercase, no spaces)
- `selectors`: Use comma-separated CSS selectors as fallbacks (tries left to right)
- `listUrl`: The main page to discover articles (category page, homepage, etc.)
- `articleLinks`: Selector to find article URLs on list pages

**Then register it:**

```typescript
export const SOURCE_REGISTRY: Record<string, NewsSource> = {
  hk01: hk01Config,
  mingpao: mingPaoConfig,
  appledaily: appleDailyConfig, // ← Add your new source here
};
```

**And add hostname mapping for auto-detection:**

```typescript
export function detectSourceFromUrl(url: string): string | null {
  try {
    const hostname = new URL(url).hostname.replace('www.', '');
    
    const hostnameMap: Record<string, string> = {
      'hk01.com': 'hk01',
      'mingpao.com': 'mingpao',
      'appledaily.com.tw': 'appledaily', // ← Add hostname mapping
    };
    
    return hostnameMap[hostname] || null;
  } catch {
    return null;
  }
}
```

---

### Step 2: Add URL Patterns

**File:** `app/api/scraper/article-list/route.ts`

Add regex patterns to identify article and category URLs:

```typescript
// Source-specific URL patterns
const ARTICLE_PATTERNS: Record<string, RegExp> = {
  hk01: /^https?:\/\/www\.hk01\.com\/([^\/]+)\/(\d{8})\/(.+)$/,
  mingpao: /^https?:\/\/(?:www\.)?mingpao\.com\/(?:ins|pns|news)\/([^\/]+)\/article\/(\d{8}(?:s\d+)?)\/(.+)$/,
  // Add your pattern - captures: [full_url, category, articleId, title_slug]
  appledaily: /^https?:\/\/www\.appledaily\.com\.tw\/realtime\/([^\/]+)\/(\d+)\/(.+)$/,
};

const CHANNEL_PATTERNS: Record<string, RegExp> = {
  hk01: /^https?:\/\/www\.hk01\.com\/channel\/(\d+)\/(.+)$/,
  mingpao: /^https?:\/\/(?:www\.)?mingpao\.com\/(?:ins|pns)\/([^\/]+)\/?$/,
  // Add category/channel pattern if the source has category pages
  appledaily: /^https?:\/\/www\.appledaily\.com\.tw\/realtime\/([^\/]+)\/?$/,
};
```

**Pattern Guidelines:**
- Capture groups: `(category, articleId, titleSlug)`
- Use `\d{8}` for date-based IDs (YYYYMMDD)
- Use `(?:...)` for non-capturing groups
- Test patterns at [regex101.com](https://regex101.com/)

---

### Step 3: Add Source-Specific Logic (Optional)

**File:** `lib/scrapers/sourceStrategies.ts`

If your source has unique HTML structures requiring special handling, create a source-specific scraper class:

```typescript
export class AppleDailyScraper {
  /**
   * Extract article ID from Apple Daily URL or HTML
   */
  static extractArticleId($: cheerio.CheerioAPI, url?: string): string {
    // Try meta tag
    const articleIdMeta = $('meta[property="article:id"]').attr('content');
    if (articleIdMeta) return articleIdMeta;
    
    // Extract from URL: /realtime/category/articleId/title-slug
    if (url) {
      const match = url.match(/\/realtime\/[^\/]+\/(\d+)\//);
      if (match) return match[1];
    }
    
    return '';
  }

  /**
   * Extract author with Apple Daily-specific logic
   */
  static extractAuthor($: cheerio.CheerioAPI): string {
    const authorElement = $('.author-name, .reporter-name').first();
    let author = authorElement.text().trim();
    
    // Clean up prefixes (記者: Reporter:)
    author = author.replace(/^記者：|^Reporter:\s*/, '').trim();
    
    return author;
  }

  /**
   * Extract main image with caption
   */
  static extractMainImage($: cheerio.CheerioAPI) {
    const img = $('.article-hero-image img, .main-image img').first();
    const imgSrc = img.attr('src') || img.attr('data-src') || '';
    
    const mainImage = imgSrc.split('?')[0]; // Remove query params
    const mainImageFull = imgSrc;
    
    // Get caption
    let mainImageCaption = img.attr('alt') || '';
    const figcaption = img.closest('figure').find('figcaption').text().trim();
    if (figcaption) mainImageCaption = figcaption;
    
    return { mainImage, mainImageFull, mainImageCaption };
  }
}

// Register the strategy
export function getSourceStrategy(sourceKey: string) {
  const strategies: Record<string, any> = {
    hk01: HK01Scraper,
    mingpao: MingPaoScraper,
    appledaily: AppleDailyScraper, // ← Add your scraper
  };
  
  return strategies[sourceKey] || null;
}
```

**When to create custom logic:**
- Complex date parsing
- Special author name formats
- Unique image structures
- Multi-language content handling

---

### Step 4: Add to Admin UI

**File:** `app/admin/scraper-url-test/page.tsx`

Add dropdown option:

```typescript
<select value={sourceKey} onChange={(e) => setSourceKey(e.target.value)}>
  <option value="auto">Auto-detect from URL</option>
  <option value="hk01">HK01 (香港01)</option>
  <option value="mingpao">Ming Pao (明報)</option>
  <option value="appledaily">Apple Daily (蘋果日報)</option> {/* ← Add here */}
</select>
```

**File:** `app/admin/article-list-scraper/page.tsx`

Add dropdown option:

```typescript
<select value={sourceKey} onChange={(e) => setSourceKey(e.target.value)}>
  <option value="hk01">HK01 (香港01)</option>
  <option value="mingpao">Ming Pao (明報)</option>
  <option value="appledaily">Apple Daily (蘋果日報)</option> {/* ← Add here */}
</select>
```

**And update the auto-detection display:**

```typescript
{detectedSource && sourceKey === 'auto' && (
  <div className="mt-1 text-sm text-blue-600">
    ℹ️ Detected: {
      detectedSource === 'hk01' ? 'HK01' : 
      detectedSource === 'mingpao' ? 'Ming Pao' :
      detectedSource === 'appledaily' ? 'Apple Daily' : // ← Add here
      detectedSource
    }
  </div>
)}
```

---

## Testing Your New Source

### 1. Test Auto-Detection

Visit: `http://localhost:3000/admin/scraper-url-test`

1. Keep source dropdown on "Auto-detect from URL"
2. Paste an article URL from your new source
3. Verify the detection indicator shows correct source name
4. Click "Run Scraper"
5. Verify metadata is extracted correctly

### 2. Test Manual Selection

1. Change dropdown to your new source
2. Paste an article URL
3. Click "Run Scraper"
4. Verify results match auto-detection

### 3. Test Article List Scanner

Visit: `http://localhost:3000/admin/article-list-scraper`

1. Select your new source from dropdown
2. Click "Scan Articles"
3. Verify articles are discovered
4. Click "Test in URL Scraper" on a few articles
5. Verify scraping works correctly

### 4. Common Issues & Debugging

**No articles found:**
- Check `listUrl` in source config
- Verify `articleLinks` selector matches actual HTML
- Inspect the list page HTML in browser DevTools

**Missing metadata:**
- Check selectors in `article_page_config`
- Try multiple fallback selectors (comma-separated)
- Use browser DevTools to find correct selectors

**Article ID extraction fails:**
- Check URL pattern in `ARTICLE_PATTERNS`
- Verify regex captures correct groups
- Create custom `extractArticleId()` method if needed

**Date parsing issues:**
- Check for `<time datetime="...">` elements
- Look for meta tags: `<meta property="article:published_time">`
- Create custom `extractPublishDate()` method

---

## Checklist

Before deploying:

- [ ] Source config added to `sourceRegistry.ts`
- [ ] Hostname mapping added for auto-detection
- [ ] URL patterns added to `article-list/route.ts`
- [ ] Dropdown options added to both admin pages
- [ ] Auto-detection display updated
- [ ] Tested on at least 5 different articles
- [ ] Article list scanner works
- [ ] Save to database works
- [ ] (Optional) Source-specific strategies created
- [ ] Selectors validated with real HTML

---

## Architecture Overview

```
┌─────────────────────────────────────────────┐
│  Admin UI (scraper-url-test)                │
│  - Source dropdown (auto/manual)            │
│  - Auto-detection from URL                  │
└───────────────┬─────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────┐
│  API Route (/api/scraper/url)               │
│  - Validates source key                     │
│  - Loads config from registry               │
│  - Launches Puppeteer browser               │
└───────────────┬─────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────┐
│  Source Registry (sourceRegistry.ts)        │
│  - getSourceConfig(key)                     │
│  - detectSourceFromUrl(url)                 │
│  - Returns NewsSource config                │
└───────────────┬─────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────┐
│  ArticleScraper (ArticleScraper.ts)         │
│  - Uses config selectors                    │
│  - Extracts: title, author, content, etc.   │
│  - Calls source-specific strategies         │
└───────────────┬─────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────┐
│  Source Strategies (sourceStrategies.ts)    │
│  - Optional: Source-specific logic          │
│  - HK01Scraper, MingPaoScraper, etc.        │
└─────────────────────────────────────────────┘
```

---

## Example: Complete New Source Addition

Here's a complete example for adding **Stand News** (已停刊示例):

```typescript
// 1. sourceRegistry.ts
export const standNewsConfig: NewsSource = {
  id: 'standnews',
  source_key: 'standnews',
  name: 'Stand News 立場新聞',
  base_url: 'https://www.thestandnews.com',
  category: 'General',
  language: 'zh-HK',
  is_active: true,
  list_page_config: {
    listUrl: 'https://www.thestandnews.com/latest/',
    selectors: {
      articleLinks: 'a.article-card__link',
      articleId: 'href',
    },
  },
  article_page_config: {
    selectors: {
      title: 'h1.article-title',
      content: '.article-content p',
      author: '.author-name',
      publishDate: 'time.published',
      category: '.category-tag',
    },
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const SOURCE_REGISTRY: Record<string, NewsSource> = {
  hk01: hk01Config,
  mingpao: mingPaoConfig,
  standnews: standNewsConfig,
};

export function detectSourceFromUrl(url: string): string | null {
  try {
    const hostname = new URL(url).hostname.replace('www.', '');
    const hostnameMap: Record<string, string> = {
      'hk01.com': 'hk01',
      'mingpao.com': 'mingpao',
      'thestandnews.com': 'standnews',
    };
    return hostnameMap[hostname] || null;
  } catch {
    return null;
  }
}

// 2. article-list/route.ts
const ARTICLE_PATTERNS: Record<string, RegExp> = {
  hk01: /^https?:\/\/www\.hk01\.com\/([^\/]+)\/(\d{8})\/(.+)$/,
  mingpao: /^https?:\/\/(?:www\.)?mingpao\.com\/(?:ins|pns|news)\/([^\/]+)\/article\/(\d{8}(?:s\d+)?)\/(.+)$/,
  standnews: /^https?:\/\/www\.thestandnews\.com\/([^\/]+)\/([^\/]+)$/,
};

// 3. Admin UI dropdowns (both pages)
<option value="standnews">Stand News (立場新聞)</option>

// 4. Auto-detection display
detectedSource === 'standnews' ? 'Stand News' :
```

Done! The new source is fully integrated.

---

## Support & Troubleshooting

**Need help?**
- Check existing source configs (HK01, MingPao) as reference
- Use browser DevTools to inspect HTML structure
- Test regex patterns at regex101.com
- Review Puppeteer logs in terminal for scraping issues

**Common selector tips:**
- Use multiple fallbacks: `'h1.title, h1.headline, article h1'`
- Prefer specific classes over generic tags
- Test selectors in browser console: `document.querySelector('h1.title')`
- Check for dynamic content (may need JavaScript rendering)
