# Fixes Applied - Production Stability Update

**Date:** December 7, 2025  
**Commit:** `ea86c54`

## Issues Addressed

### 1. ❌ Root redirect not working on Vercel
**Problem:** `https://the-curator-silk.vercel.app/` did not automatically redirect to `/news`

**Root Cause:** Server-side `redirect()` function doesn't work reliably on Vercel for client-side navigation

**Solution Applied:**
- Changed `app/page.tsx` from server-side `redirect()` to client-side `useRouter().push()`
- Now uses `'use client'` directive and React hooks for navigation
- Properly handles client-side redirect on Vercel environment

**File:** [app/page.tsx](app/page.tsx)

```typescript
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    router.push('/news');
  }, [router]);

  return null;
}
```

---

### 2. 📊 Pending newslist rows always showing 33 (incorrect metric)
**Problem:** Admin dashboard showing "pending newslist rows: 33" regardless of actual pending items

**Root Cause:** Metrics query only counted `status='pending'` items, ignoring `status='failed'` items with `attempt_count < 3` which ARE eligible for retry/processing

**Solution Applied:**
- Updated `/api/admin/metrics` endpoint to match scraper retry logic
- Now correctly counts:
  - `status='pending'` (never processed)
  - `status='failed' AND attempt_count < 3` (eligible for retry)
- Uses Supabase `.or()` filter for composite condition

**File:** [app/api/admin/metrics/route.ts](app/api/admin/metrics/route.ts)

```typescript
// Get pending newslist rows that are either:
// 1. Status = 'pending' (never processed)
// 2. Status = 'failed' AND attempt_count < 3 (eligible for retry)
const { data: pendingData, error: pendingError } = await db
  .from('newslist')
  .select('id', { count: 'exact' })
  .or('status.eq.pending,and(status.eq.failed,attempt_count.lt.3)');

const pendingRows = pendingData?.length ?? 0;
```

**Expected Impact:**
- Dashboard metrics now accurately reflect the queue state
- Helps monitor actual pending work (not just first-pass items)

---

### 3. 🐛 Puppeteer Chrome detection unstable on Vercel (intermittent failures)
**Problem:** 
```
Error: Could not find Chrome (ver. 143.0.7499.40).
Error: /tmp/.cache/puppeteer cache path is incorrectly configured.
```

Occurs intermittently when calling `/api/scraper/article`

**Root Cause:** 
1. `puppeteer-core` was not properly using `@sparticuz/chromium` executable path
2. Browser/page cleanup wasn't guaranteed (missing try-finally)
3. Environment detection for Vercel not comprehensive

**Solution Applied:**
- Enhanced Vercel environment detection (check `VERCEL_ENV` values)
- Added explicit validation of `chromium.executablePath()`
- Implemented try-finally for guaranteed browser/page cleanup
- Better error logging to distinguish Vercel vs local failures
- Improved null safety for browser instance

**File:** [app/api/scraper/article/route.ts](app/api/scraper/article/route.ts)

```typescript
async function fetchPageHtml(url: string): Promise<string> {
  const isVercel = process.env.VERCEL === '1' || 
                   process.env.VERCEL_ENV === 'production' || 
                   process.env.VERCEL_ENV === 'preview';
  
  let launchOptions: any;
  let browser;
  
  if (isVercel) {
    console.log('[Scraper] Vercel environment detected, using @sparticuz/chromium');
    try {
      const execPath = await chromium.executablePath();
      console.log('[Scraper] Chromium executable path:', execPath);
      
      if (!execPath) {
        throw new Error('chromium.executablePath() returned empty');
      }
      
      launchOptions = {
        args: chromium.args,
        executablePath: execPath,
        headless: 'new' as any,
      };
      
      browser = await puppeteer.launch(launchOptions);
    } catch (chromiumErr) {
      const errorMsg = chromiumErr instanceof Error ? chromiumErr.message : String(chromiumErr);
      console.error('[Scraper] Chromium launch failed on Vercel:', errorMsg);
      throw new Error(`Chromium unavailable on Vercel: ${errorMsg}`);
    }
  } else {
    // Local development fallback
    launchOptions = {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    };
    
    try {
      browser = await puppeteer.launch(launchOptions);
    } catch (launchErr) {
      const errorMsg = launchErr instanceof Error ? launchErr.message : String(launchErr);
      console.error('[Scraper] Local browser launch failed:', errorMsg);
      throw launchErr;
    }
  }
  
  const page = await browser!.newPage();

  try {
    // Page operations...
    const html = await page.content();
    return html;
  } finally {
    await page.close();
    await browser!.close();
  }
}
```

**Expected Impact:**
- More stable Puppeteer operation on Vercel
- Better error diagnostics for debugging
- Guaranteed resource cleanup (no orphaned browser processes)

---

### 4. ✨ Added date range filtering to news page
**Feature Request:** Filter articles by date on `/news`

**Solution Applied:**
- Added two date input fields: "開始日期" (From Date) and "結束日期" (To Date)
- Integrated date filters into query parameters (URL-based)
- Updated API endpoint to support date range filtering
- Proper date boundary handling (full-day inclusive)

**Files Modified:**
- [components/news/NewsList.tsx](components/news/NewsList.tsx) - UI state & filter logic
- [app/api/news/list/route.ts](app/api/news/list/route.ts) - Backend date filtering

**Frontend Changes:**
```typescript
// Added to state
const [dateFrom, setDateFrom] = useState(appliedDateFrom);
const [dateTo, setDateTo] = useState(appliedDateTo);

// Filter updates include date parameters
if (appliedDateFrom) params.set('dateFrom', appliedDateFrom);
if (appliedDateTo) params.set('dateTo', appliedDateTo);

// UI: Two date input fields
<input type="date" value={dateFrom} onChange={...} />
<input type="date" value={dateTo} onChange={...} />
```

**Backend Changes:**
```typescript
const dateFrom = searchParams.get('dateFrom');
const dateTo = searchParams.get('dateTo');

if (dateFrom) {
  query = query.gte('published_date', dateFrom);
}

if (dateTo) {
  // Add 1 day to include full day
  const dateToEnd = new Date(dateTo);
  dateToEnd.setDate(dateToEnd.getDate() + 1);
  const dateToEndStr = dateToEnd.toISOString().split('T')[0];
  query = query.lt('published_date', dateToEndStr);
}
```

**Expected Impact:**
- Users can now filter articles by date range
- Date filters work with other filters (search, category, tags)
- Persisted in URL for shareable links

---

## Build Status
✅ **Production build: SUCCESSFUL**
- All TypeScript checks passed
- No compilation errors
- ESLint warnings: ~60 (pre-existing, non-blocking patterns in codebase)

## Deployment Notes

1. **Deploy to Vercel:**
   ```bash
   git push origin main
   ```
   Vercel will auto-deploy; changes go live immediately

2. **Test After Deployment:**
   - [ ] Navigate to https://the-curator-silk.vercel.app/ (should redirect to /news)
   - [ ] Check admin dashboard metrics (should show dynamic pending rows)
   - [ ] Try date filtering on /news page
   - [ ] Trigger article scraper (test Puppeteer fix)

3. **Monitor:**
   - Watch Vercel function logs for Puppeteer errors
   - Verify metrics update correctly
   - Check that date filters work across categories/tags

---

## Related Issues

- **HK01 Categories SQL:** Separately generated 94 categories with metadata (in `hk01_categories_insert.sql`)
  - Still needs to be run in Supabase SQL Editor
  - File includes all zones and channels with proper metadata format

---

## Testing Checklist

- [x] Build compiles without errors
- [x] No TypeScript issues
- [x] Root redirect logic implemented
- [x] Metrics query logic fixed
- [x] Puppeteer error handling improved
- [x] Date filter UI added
- [x] Date filter API support added
- [ ] Deploy to Vercel
- [ ] Manual test root redirect
- [ ] Manual test admin metrics
- [ ] Manual test date filtering
- [ ] Manual test article scraper

