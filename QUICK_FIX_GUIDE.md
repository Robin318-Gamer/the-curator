# The Curator - Quick Fix Guide
**Purpose**: Code snippets to fix identified issues  
**Last Updated**: December 4, 2025

---

## CRITICAL Fixes (Do First)

### Fix #1: Missing React Hook in article-list-scraper/page.tsx

**Location**: `app/admin/article-list-scraper/page.tsx`  
**Line**: After line 15 (after `setCategoriesScanned`)

**Add this line**:
```typescript
  const [selectedCategory, setSelectedCategory] = useState('');
```

**Full context** (lines 10-20):
```typescript
export default function ArticleListScraperPage() {
  const [loading, setLoading] = useState(false);
  const [articles, setArticles] = useState<Article[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [categoriesScanned, setCategoriesScanned] = useState<number>(0);
  const [selectedCategory, setSelectedCategory] = useState('');  // ADD THIS LINE

  async function handleFetchArticles() {
```

---

## HIGH Priority Fixes

### Fix #2: Create Unified API Response Type

**Location**: Create new file `lib/api/response.ts`

```typescript
// lib/api/response.ts
import { NextResponse } from 'next/server';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Standardized success response
 */
export function apiSuccess<T>(data: T, status = 200) {
  return Response.json(
    { success: true, data } as ApiResponse<T>,
    { status }
  );
}

/**
 * Standardized error response
 */
export function apiError(error: string, status = 500) {
  return Response.json(
    { success: false, error } as ApiResponse,
    { status }
  );
}

/**
 * Standardized validation error response
 */
export function apiValidationError(errors: Record<string, string>, status = 422) {
  return Response.json(
    { success: false, error: 'Validation failed', errors } as any,
    { status }
  );
}
```

**Update all API routes** to use these helpers:

```typescript
// OLD - app/api/scraper/url/route.ts
return Response.json({ success: true, data: result.data });

// NEW
import { apiSuccess, apiError } from '@/lib/api/response';
return apiSuccess(result.data);
```

---

### Fix #3: Create Centralized Type Definitions

**Location**: Create new file `lib/types/scraper.ts`

```typescript
// lib/types/scraper.ts
import type { NewsSource, ScrapedArticle, ScrapeResult, ValidationResult } from './database';

/**
 * Scraper-specific types
 */
export interface ExpectedArticleData {
  title: string;
  content: string;
  author?: string;
  category?: string;
  publishedDate: string;
  images?: string[];
}

/**
 * Article discovery result (from list scraper)
 */
export interface DiscoveredArticle {
  articleId: string;
  url: string;
  category: string;
  titleSlug: string;
}

/**
 * Scraper configuration
 */
export interface ScraperConfig {
  sourceKey: string;
  url?: string;
  html?: string;
  expectedData?: ExpectedArticleData;
}

// Re-export from database for convenience
export type { NewsSource, ScrapedArticle, ScrapeResult, ValidationResult };
```

**Update barrel export** `lib/types/index.ts`:

```typescript
// lib/types/index.ts
export * from './database';
export * from './scraper';
```

**Update imports** across codebase:

```typescript
// Before
import type { ExpectedArticleData } from '@/lib/scrapers/ScraperValidator';
import { ScraperValidator } from '@/lib/scrapers/ScraperValidator';

// After
import { ScraperValidator, type ExpectedArticleData } from '@/lib/types';
```

---

### Fix #4: Extract Hardcoded Constants

**Location**: Create new file `lib/config/scraper.ts`

```typescript
// lib/config/scraper.ts
/**
 * Scraper configuration constants
 */
export const SCRAPER_CONFIG = {
  // Timeouts (in milliseconds)
  timeout: {
    navigation: 15000,      // How long to wait for page to load
    selector: 5000,         // How long to wait for element to appear
    navigation_short: 10000, // For subsequent navigations
  },

  // Delays (in milliseconds)
  delays: {
    lazy_load: 3000,  // Wait after scroll for images to load
    scroll_wait: 1500, // Wait between scroll actions
  },

  // Request headers
  userAgent:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',

  // Resource blocking (don't load these for performance)
  blockedResourceTypes: ['font', 'stylesheet', 'media', 'image'] as const,

  // For article list scraper
  articleList: {
    maxRetries: 3,
    articlesPerPage: 20,
  },
};

/**
 * Validate timeout configuration
 */
export function getTimeout(key: keyof typeof SCRAPER_CONFIG.timeout): number {
  return SCRAPER_CONFIG.timeout[key];
}

/**
 * Validate delay configuration
 */
export function getDelay(key: keyof typeof SCRAPER_CONFIG.delays): number {
  return SCRAPER_CONFIG.delays[key];
}
```

**Usage in routes**:

```typescript
// OLD - app/api/scraper/url/route.ts
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });

// NEW
import { getTimeout } from '@/lib/config/scraper';
await page.goto(url, { 
  waitUntil: 'domcontentloaded', 
  timeout: getTimeout('navigation') 
});
```

---

### Fix #5: Centralize HTML Selectors

**Location**: Create new file `lib/config/selectors.ts`

```typescript
// lib/config/selectors.ts
/**
 * CSS selectors for HK01.com article scraping
 * Update these if HK01 changes their HTML structure
 */
export const HK01_SELECTORS = {
  // Article page selectors
  article: {
    title: 'h1#articleTitle',
    content: 'article#article-content-section p',
    author: '[data-testid="article-author"]',
    publishDate: 'time[datetime]',
    category: '[data-testid="article-breadcrumb-channel"]',
    
    // Images
    topSection: '[data-testid="article-top-section"]',
    contentSection: '.article-grid__content-section',
    lazyloadWrapper: '.lazyload-wrapper',
    contentContainer: '#article-content-section',
    publishInfo: '[data-testid="article-publish-info"]',
    tags: '[data-testid="article-tag"] a',
  },

  // List page selectors
  list: {
    articleLinks: 'a[data-testid="article-link"]',
    articleId: 'data-article-id',
    channel: 'a[href*="/channel/"]',
  },
} as const;

/**
 * Validate selector exists
 */
export function getSelector(
  section: keyof typeof HK01_SELECTORS,
  key: string
): string {
  const selector = (HK01_SELECTORS as any)[section]?.[key];
  if (!selector) {
    throw new Error(`Selector not found: ${section}.${key}`);
  }
  return selector;
}

/**
 * Update selectors if needed (for testing or when site changes)
 */
export function updateSelectors(
  section: keyof typeof HK01_SELECTORS,
  updates: Record<string, string>
) {
  Object.assign((HK01_SELECTORS as any)[section], updates);
}
```

**Usage in ArticleScraper**:

```typescript
// OLD
const titleElement = $(selectors.title).first();

// NEW
import { HK01_SELECTORS } from '@/lib/config/selectors';
const titleElement = $(HK01_SELECTORS.article.title).first();
```

---

## MEDIUM Priority Fixes

### Fix #6: Update Environment Variables Documentation

**Location**: `.env.local.example`

Replace entire file with:
```dotenv
# ============================================================================
# The Curator - Environment Configuration
# ============================================================================

# SUPABASE CONFIGURATION
# Get these from your Supabase project dashboard
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ADMIN CREDENTIALS
# Change these to your desired admin email and password
ADMIN_EMAIL=admin@thecurator.hk
ADMIN_PASSWORD=your-secure-password-here

# OPENAI CONFIGURATION (Optional)
# Required only if using AI summary features
# Get from https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-...

# APPLICATION CONFIGURATION
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NODE_ENV=development

# ============================================================================
# OPTIONAL: Advanced Configuration
# ============================================================================

# Puppeteer Configuration (if using custom values)
# PUPPETEER_TIMEOUT=15000
# PUPPETEER_USER_AGENT=Mozilla/5.0...

# Logging
# LOG_LEVEL=debug
```

---

### Fix #7: Document Service Role Key Requirement

**Location**: Update `lib/db/supabase.ts`

```typescript
// lib/db/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing required Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Service role client for admin operations
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceRoleKey) {
  console.warn(
    '[Supabase] ⚠️  SUPABASE_SERVICE_ROLE_KEY is not set. Admin operations will be unavailable. ' +
    'Add this to your .env.local file to enable admin features.'
  );
}

export const supabaseAdmin = supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;
```

---

### Fix #8: Update Article List Type

**Location**: Update `app/admin/article-list-scraper/page.tsx`

Remove local type definition (lines 5-8):
```typescript
// DELETE THESE LINES
interface Article {
  articleId: string;
  url: string;
  category: string;
  titleSlug: string;
}
```

Add import at top:
```typescript
import type { DiscoveredArticle } from '@/lib/types';
```

Update references:
```typescript
// OLD
const [articles, setArticles] = useState<Article[]>([]);

// NEW
const [articles, setArticles] = useState<DiscoveredArticle[]>([]);
```

---

### Fix #9: Create Admin Layout Component

**Location**: Create new file `components/admin/AdminLayout.tsx`

```typescript
// components/admin/AdminLayout.tsx
'use client';

import Link from 'next/link';
import { ReactNode } from 'react';

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export default function AdminLayout({
  children,
  title,
  subtitle,
}: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            </div>
            <div className="flex gap-4">
              <Link
                href="/admin/dashboard"
                className="text-gray-600 hover:text-gray-900"
              >
                Dashboard
              </Link>
              <Link
                href="/admin/scraper-test"
                className="text-gray-600 hover:text-gray-900"
              >
                Scraper
              </Link>
              <Link
                href="/admin/article-list-scraper"
                className="text-gray-600 hover:text-gray-900"
              >
                Articles
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">{title}</h2>
          {subtitle && (
            <p className="mt-2 text-gray-600">{subtitle}</p>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
```

**Usage**:
```typescript
// In app/admin/scraper-test/page.tsx
import AdminLayout from '@/components/admin/AdminLayout';

export default function ScraperTestPage() {
  return (
    <AdminLayout 
      title="Scraper Test" 
      subtitle="Test scraper configuration and selectors"
    >
      {/* existing content */}
    </AdminLayout>
  );
}
```

---

## LOW Priority Fixes

### Fix #10: Update Test Imports

**Location**: `lib/scrapers/__tests__/scraper.test.ts`

```typescript
// OLD (lines 3-4)
import { ArticleScraper } from '../ArticleScraper.js';
import type { NewsSource } from '../../types/database.js';

// NEW
import { ArticleScraper } from '@/lib/scrapers/ArticleScraper';
import type { NewsSource } from '@/lib/types/database';
```

Do the same for `lib/scrapers/__tests__/scraper-all-articles.test.ts`

---

### Fix #11: Document Incomplete Scrapers

**Location**: Create new file `docs/SCRAPERS.md`

```markdown
# News Source Scrapers

## Implemented Scrapers

### ✅ HK01 (hk01.com)
- **Status**: Fully Implemented
- **Config**: `lib/constants/sources.ts` - `hk01SourceConfig`
- **Route**: `/api/scraper/url` (POST)
- **Supported Fields**: title, author, content, category, publishDate, images
- **Last Updated**: 2025-12-04

## Planned Scrapers

### ⏳ Ming Pao (mingpao.com)
- **Status**: Not Implemented
- **Database Seed**: YES (created but not functional)
- **Note**: Requires selector investigation and implementation
- **Priority**: Medium

### ⏳ Oriental Daily (orientaldaily.on.cc)
- **Status**: Not Implemented
- **Database Seed**: YES (created but not functional)
- **Note**: Requires selector investigation and implementation
- **Priority**: Medium

## Migration Path

To implement a new scraper:
1. Create source config in `lib/constants/sources.ts`
2. Test selectors on actual website
3. Add to `SCRAPER_CONFIGS` in `/api/scraper/url/route.ts`
4. Create admin test page
5. Update this documentation

```

---

## Verification Checklist

After applying fixes, verify with:

```bash
# 1. Type checking
npm run type-check

# 2. Linting
npm run lint

# 3. Dev server starts without errors
npm run dev

# 4. Test critical pages load:
# - http://localhost:3000/admin/article-list-scraper
# - http://localhost:3000/admin/scraper-test
# - http://localhost:3000/admin/scraper-url-test

# 5. Test API endpoints:
curl -X GET http://localhost:3000/api/scraper/sources
```

---

## Notes for Implementation

- Apply CRITICAL fixes first (Fix #1)
- Test each fix individually before moving to next
- Update imports progressively to avoid breaking changes
- Keep backup of working code before major refactoring
- Add unit tests for new centralized configuration files

