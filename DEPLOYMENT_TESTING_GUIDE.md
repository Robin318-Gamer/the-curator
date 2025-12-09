# Deployment & Testing Guide

## Quick Deploy

1. **Push to GitHub:**
   ```powershell
   cd "C:\Users\RHung\OneDrive - SIRVA\Documents\Personal project\the-curator\the-curator"
   git push origin main
   ```

2. **Vercel auto-deploys** - Check dashboard at https://vercel.com/rhung/the-curator-silk

3. **Expected deployment time:** 2-3 minutes

---

## After Deployment - Testing Checklist

### Test 1: Root Redirect ✓
**URL:** https://the-curator-silk.vercel.app/

**Expected:** Browser automatically redirects to https://the-curator-silk.vercel.app/news

**Status:** ✓ Fixed in this commit

---

### Test 2: Admin Dashboard Metrics ✓
**URL:** https://the-curator-silk.vercel.app/admin

**Check:**
- [ ] "pending newslist rows" shows realistic number (should change when scraper runs)
- [ ] Number reflects both:
  - Items with `status='pending'` 
  - Items with `status='failed'` AND `attempt_count < 3`
- [ ] Metric updates every 30 seconds

**Previous Issue:** Always showed 33 (hardcoded)  
**Status:** ✓ Fixed in this commit

---

### Test 3: Article Scraper Stability ✓
**Trigger:** Click "Scrape next article" button on admin dashboard

**Check:**
- [ ] Request completes without "Chrome could not be found" error
- [ ] Response: `{ "status": "success" }` 
- [ ] Check Vercel function logs for errors
  - Look for `[Scraper]` prefixed logs
  - Should see: `Using Vercel chromium` or `Using system Chrome/Chromium`

**Previous Issue:** Intermittent "Could not find Chrome (ver. 143.0.7499.40)" errors  
**Status:** ✓ Fixed in this commit

---

### Test 4: Date Range Filtering ✓
**URL:** https://the-curator-silk.vercel.app/news

**Steps:**
1. [ ] Find "開始日期" (From Date) and "結束日期" (To Date) inputs
2. [ ] Select date range: e.g., Dec 1 - Dec 7, 2025
3. [ ] Articles list updates to show only articles within that date range
4. [ ] Try combining with other filters:
   - [ ] + Search filter
   - [ ] + Category filter
   - [ ] + Tag filter
5. [ ] Date filters persist in URL (shareable)

**Previous Status:** Feature didn't exist  
**Status:** ✅ New feature in this commit

---

## If Issues Occur

### Issue: "Chrome not found" error returns
1. Check Vercel function logs:
   ```
   https://vercel.com/rhung/the-curator-silk/deployments
   → Click latest deployment → Function Logs
   ```
2. Look for `[Scraper]` logs - what does it show?
3. If error: Report with full error message from logs

### Issue: Date filtering not working
1. Check if date inputs appear on `/news` page
2. Check browser console for errors (F12 → Console)
3. Verify `/api/news/list?dateFrom=2025-12-01&dateTo=2025-12-07` works directly

### Issue: Metrics still wrong
1. Go to `/admin` 
2. Check browser console for errors
3. Try refresh (Ctrl+Shift+R)
4. Check if Supabase connection is working

---

## HK01 Categories Setup (Separate Task)

**Status:** SQL file generated (`hk01_categories_insert.sql`) but NOT yet inserted into database

**To complete:**
1. Go to Supabase dashboard → SQL Editor
2. Copy content of `hk01_categories_insert.sql`
3. Paste into SQL Editor
4. Click "RUN"
5. Verify 94 rows inserted into `scraper_categories`

**Note:** This is separate from the current fixes and can be done anytime.

---

## Rollback Plan (if needed)

If deployment breaks something:

```powershell
# Revert to previous commit
git revert HEAD

# Or go back one commit
git reset --hard HEAD~1
git push origin main --force  # Caution: only if needed
```

---

## Logs to Check

**Vercel Deployment Logs:**
- https://vercel.com/rhung/the-curator-silk/deployments

**Function Logs (after requests):**
- https://vercel.com/rhung/the-curator-silk/functions

**Look for patterns:**
```
[Scraper] Vercel environment detected ✓
[Scraper] Chromium executable path: /path/to/chrome ✓
[Metrics] Dashboard metrics fetched ✓
```

---

## Performance Notes

- **Root redirect:** Should be instant (client-side)
- **Admin metrics:** Updates every 30 seconds
- **Date filtering:** Should be fast (<500ms)
- **Article scraping:** May take 15-30 seconds per article

If any of these are significantly slower, check:
1. Vercel function logs
2. Supabase connection status
3. Network tab in browser (F12)

---

## Success Criteria

All of these should work after deployment:

✓ `/` redirects to `/news` automatically  
✓ `/admin` shows accurate pending row count  
✓ Article scraper works without Chrome errors  
✓ `/news` has date filter inputs  
✓ Date filters work with other filters  
✓ No TypeScript or build errors  

---

**Estimated testing time:** 10-15 minutes  
**Deployment time:** 2-3 minutes

