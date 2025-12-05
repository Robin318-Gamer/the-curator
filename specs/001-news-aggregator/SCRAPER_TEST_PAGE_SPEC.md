# Scraper Test Page Specification

**Route**: `/admin/scraper-test`  
**Purpose**: Admin-only tool for validating scraper parsing logic using sample HTML data  
**Status**: Production-ready; admin-authenticated; can be repurposed as manual scraping tool  
**Last Updated**: 2025-12-04  

---

## Overview

The scraper test page is built directly into the existing `the-curator/` application as an admin-only tool. It validates article extraction logic against known-good sample data before deploying scrapers to production. This reduces risk of broken selectors and enables rapid iteration during development.

**Key Benefits**:
- ✅ Reuses existing admin authentication (no separate dev environment needed)
- ✅ Leverages existing database connection and UI components
- ✅ No risk of leaking test pages (admin-only route)
- ✅ Can be repurposed as production admin tool for manual URL scraping
- ✅ Single application deployment (no separate temp app)

---

## Integration with Existing App

### Existing Infrastructure (Already Built)
- Admin authentication at `/admin/login`
- Database connection (Supabase) configured in `.env.local`
- Admin layout and components in `the-curator/components/admin/`
- Admin routes in `the-curator/app/admin/`
- API routes in `the-curator/app/api/`

### New Components to Add
- **Route**: `the-curator/app/admin/scraper-test/page.tsx`
- **API**: `the-curator/app/api/admin/scraper-test/parse/route.ts`
- **Scrapers**: `the-curator/lib/scrapers/` (hk01.ts, mingPao.ts, orientalDaily.ts, baseScraper.ts)
- **Config**: `the-curator/lib/constants/sources.ts`
- **Navigation**: Add link to existing admin sidebar/menu

---

## Sample Data Structure

All sample data is located in `speckitproject/SampleDate/` folder:

| File | Source | Purpose |
|------|--------|---------|
| `Article1Data.md` | HK01 | Expected extraction output (title, author, date, category, etc.) |
| `Article1SourceCode.txt` | HK01 | Raw HTML source code for parsing |
| `Article2Data.md` | Ming Pao | Expected extraction output |
| `Article2SourceCode.txt` | Ming Pao | Raw HTML source code |
| `Article3Data.md` | Oriental Daily | Expected extraction output |
| `Article3SourceCode.txt` | Oriental Daily | Raw HTML source code |

---

## Sample Data Field Mapping (HK01 Example)

From `Article1Data.md`, the following fields must be extracted:

| Field | Selector/Pattern | Expected Value |
|-------|------------------|----------------|
| **URL** | N/A (provided) | `https://www.hk01.com/眾樂迷/60300002/seventeen演唱會2026香港-門票優先-公售攻略-購票連結-座位表` |
| **Category** | `data-testid="article-breadcrumb-zone"` text | `娛樂` |
| **Sub Category** | `data-testid="article-breadcrumb-channel"` text | `眾樂迷` |
| **Title** | `h1#articleTitle[data-testid="article-title"]` text | `SEVENTEEN演唱會2026香港｜門票優先/公售攻略＋購票連結＋座位表` |
| **Author** | `div[data-testid="article-author"] span:nth-child(2)` text | `多娜 薯條` |
| **Published Date** | `time[datetime]` attribute (first occurrence) | `2025-12-03T11:31:54+08:00` → `2025-12-03 11:31` |
| **Summary** | `meta[name="description"]` content | `SEVENTEEN WORLD TOUR [NEW_] 將於2026年2月28日...` |
| **Main Image** | `img` src with highest resolution from srcset | Extract from srcset or src attribute |

---

## Page Layout & Features

### UI Components

**1. Source Tabs**
- Tab 1: **HK01** (Article1)
- Tab 2: **Ming Pao** (Article2)
- Tab 3: **Oriental Daily** (Article3)

**2. Split View (per tab)**
```
┌─────────────────────────────────────────────────────────────┐
│ [HK01] [Ming Pao] [Oriental Daily]                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Left Panel: Raw HTML Source                                 │
│ ┌─────────────────────────────┐                             │
│ │ <html lang="zh-HK">        │  Right Panel: Parsed Output │
│ │   <head>                   │  ┌───────────────────────┐  │
│ │     <title>SEVENTEEN...</  │  │ ✅ Title: SEVENTEEN... │  │
│ │   </head>                  │  │ ✅ Author: 多娜 薯條   │  │
│ │   <body>                   │  │ ✅ Date: 2025-12-03... │  │
│ │     <h1 id="articleTitle"> │  │ ✅ Category: 娛樂      │  │
│ │       SEVENTEEN演唱會...    │  │ ✅ Sub Cat: 眾樂迷    │  │
│ │     </h1>                  │  │ ✅ URL: https://...    │  │
│ │     ...                    │  │ ✅ Image: https://...  │  │
│ │ </html>                    │  │ ✅ Summary: SEVENTEEN..│  │
│ └─────────────────────────────┘  └───────────────────────┘  │
│                                                              │
│ [Run Scraper] [Export JSON] [Reset]                         │
│                                                              │
│ Validation Results:                                         │
│ ✅ All 8 fields extracted successfully                       │
│ ✅ Title matches expected: "SEVENTEEN演唱會2026香港｜..."    │
│ ✅ Author matches expected: "多娜 薯條"                       │
│ ✅ Date matches expected: "2025-12-03 11:31"                 │
│ ✅ Category matches expected: "娛樂"                         │
│ ✅ Subcategory matches expected: "眾樂迷"                    │
│ ✅ URL matches expected                                      │
│ ✅ Image URL extracted and valid                             │
│ ✅ Summary extracted (first 50 chars match)                  │
│                                                              │
│ Pass Rate: 8/8 (100%)                                        │
└─────────────────────────────────────────────────────────────┘
```

**3. Action Buttons**
- **Run Scraper**: Execute parsing logic on loaded HTML; display extracted fields
- **Export JSON**: Download parsed article data as JSON (for manual database insertion testing)
- **Reset**: Clear parsed output; reload original HTML

**4. Validation Checklist**
- Compare each extracted field vs. expected value from `ArticleXData.md`
- Display ✅ (pass) or ❌ (fail) with diff if mismatch
- Show pass rate percentage (e.g., "8/8 fields matched (100%)")

---

## API Endpoint

**POST** `/api/dev/scraper-test/parse`

**Purpose**: Execute scraper parsing logic without saving to database

**Request Body**:
```json
{
  "source": "hk01" | "mingpao" | "orientaldaily",
  "html": "<html>...</html>",
  "expectedData": {
    "title": "SEVENTEEN演唱會2026香港｜...",
    "author": "多娜 薯條",
    "publishedDate": "2025-12-03 11:31",
    "category": "娛樂",
    "subCategory": "眾樂迷",
    "url": "https://www.hk01.com/...",
    "summary": "SEVENTEEN WORLD TOUR...",
    "imageUrl": "https://cdn.hk01.com/..."
  }
}
```

**Response**:
```json
{
  "success": true,
  "extractedData": {
    "title": "SEVENTEEN演唱會2026香港｜...",
    "author": "多娜 薯條",
    "publishedDate": "2025-12-03T11:31:54+08:00",
    "category": "娛樂",
    "subCategory": "眾樂迷",
    "url": "https://www.hk01.com/...",
    "summary": "SEVENTEEN WORLD TOUR...",
    "imageUrl": "https://cdn.hk01.com/di/media/images/..."
  },
  "validation": {
    "titleMatch": true,
    "authorMatch": true,
    "publishedDateMatch": true,
    "categoryMatch": true,
    "subCategoryMatch": true,
    "urlMatch": true,
    "summaryMatch": true,
    "imageUrlMatch": true
  },
  "passRate": "8/8 (100%)",
  "errors": []
}
```

**Error Response**:
```json
{
  "success": false,
  "extractedData": { ... },
  "validation": {
    "titleMatch": false,
    "authorMatch": true,
    ...
  },
  "passRate": "7/8 (87.5%)",
  "errors": [
    {
      "field": "title",
      "expected": "SEVENTEEN演唱會2026香港｜...",
      "actual": "SEVENTEEN演唱會...",
      "message": "Title does not match expected value"
    }
  ]
}
```

---

## Scraper Configuration (HK01 Example)

Based on `Article1Data.md` and `Article1SourceCode.txt`, the HK01 scraper must extract:

```typescript
// src/lib/scrapers/hk01.ts
export class HK01Scraper extends BaseScraper {
  async parse(html: string, url: string): Promise<Article> {
    const $ = cheerio.load(html);
    
    return {
      url: url,
      title: $('h1#articleTitle[data-testid="article-title"]').text().trim(),
      author: $('div[data-testid="article-author"] span:nth-child(2)').text().trim(),
      publishedDate: $('time[datetime]').first().attr('datetime') || '',
      category: $('a[data-testid="article-breadcrumb-zone"]').text().trim(),
      subCategory: $('a[data-testid="article-breadcrumb-channel"]').text().trim(),
      summary: $('meta[name="description"]').attr('content') || '',
      imageUrl: this.extractImageUrl($),
      content: this.extractContent($), // Extract article body (TBD based on HTML structure)
      tags: [], // Extract from keywords meta or article tags
    };
  }
  
  private extractImageUrl($: CheerioAPI): string {
    const img = $('img[alt*=""]').first();
    const srcset = img.attr('srcset');
    if (srcset) {
      // Extract highest resolution from srcset (e.g., "https://...?v=w1920r16_9 1920w")
      const urls = srcset.split(',').map(s => s.trim().split(' ')[0]);
      return urls[0]; // Return first (highest resolution)
    }
    return img.attr('src') || '';
  }
  
  private extractContent($: CheerioAPI): string {
    // Extract main article body (identify content container, TBD)
    // For HK01, likely in article body div or paragraphs after title
    // Need to inspect Article1SourceCode.txt for exact selector
    return ''; // TODO: Implement based on HTML structure
  }
}
```

---

## Implementation Checklist (Tasks T062-T077)

- [ ] **T062**: Create `/dev/scraper-test` page route
- [ ] **T063**: Load sample HTML files from `SampleDate/` folder into test page
- [ ] **T064**: Create test UI with tabs for each source + split view (raw HTML | parsed output)
- [ ] **T065**: Add "Run Scraper" button executing parsing logic
- [ ] **T066**: Add validation checklist comparing extracted vs. expected data
- [ ] **T067**: Add export button to save parsed JSON
- [ ] **T068**: Create base scraper class/interface
- [ ] **T069**: Create scraper config for Oriental Daily (Article3Data.md)
- [ ] **T070**: Create scraper config for Ming Pao (Article2Data.md)
- [ ] **T071**: Create scraper config for HK01 (Article1Data.md)
- [ ] **T072**: Implement HK01 scraper validated against Article1Data.md
- [ ] **T073**: Test HK01 scraper on `/dev/scraper-test`; fix selectors if needed
- [ ] **T074**: Implement Ming Pao scraper validated against Article2Data.md
- [ ] **T075**: Test Ming Pao scraper on `/dev/scraper-test`; fix selectors if needed
- [ ] **T076**: Implement Oriental Daily scraper validated against Article3Data.md
- [ ] **T077**: Test Oriental Daily scraper on `/dev/scraper-test`; fix selectors if needed

---

## Security & Production Notes

✅ **PRODUCTION-READY**: `/admin/scraper-test` route is naturally protected by existing admin authentication. No cleanup needed before production deployment.

**Authentication Flow**:
1. User accesses `/admin/scraper-test`
2. If not authenticated → redirect to `/admin/login` (existing behavior)
3. If authenticated → scraper test page loads
4. Admin can test scrapers, view parsed data, export JSON

**Production Options**:
1. **Keep as admin tool** — Repurpose for manual URL scraping (admin pastes URL → scraper extracts → saves to DB)
2. **Keep as debug tool** — Use for troubleshooting scraper issues in production
3. **Hide from nav** — Keep route but remove navigation link (direct URL access only)

**Recommended**: Option 1 (Keep as admin tool) — Provides useful functionality for admins to manually scrape one-off URLs without writing code.

---

## Sample Data Reference

### HK01 (Article1)
- **URL**: `https://www.hk01.com/眾樂迷/60300002/seventeen演唱會2026香港-門票優先-公售攻略-購票連結-座位表`
- **Title**: `SEVENTEEN演唱會2026香港｜門票優先/公售攻略＋購票連結＋座位表`
- **Author**: `多娜 薯條`
- **Published**: `2025-12-03 11:31`
- **Category**: `娛樂` / `眾樂迷`

### Ming Pao (Article2)
- **URL**: `https://www.hk01.com/突發/60300280/宏福苑大火-聞九旬僱主泣訴不想住老人院-留醫印傭-好掛住公公`
- **Title**: `宏福苑大火｜聞九旬僱主泣訴不想住老人院　留醫印傭：好掛住公公`
- **Author**: `戴慧豐 梁偉權`
- **Published**: `2025-12-03 20:57`
- **Updated**: `2025-12-03 22:02`
- **Category**: `港聞` / `突發`

### Oriental Daily (Article3)
- TBD based on `Article3Data.md` content

---

## Next Steps After Test Page Validation

1. ✅ Validate all 3 scrapers achieve 100% field extraction accuracy on test page
2. ✅ Export parsed JSON and manually insert into database to verify schema compatibility
3. ✅ Fix any selector issues identified during validation
4. ✅ Implement content extraction (full article body, not just metadata)
5. ✅ Add image extraction (all images from article, not just featured)
6. ✅ Test scrapers on live URLs (after test page validation passes)
7. ✅ Integrate scrapers into ExtractionService
8. ✅ Deploy to admin portal for manual triggering
9. ✅ Set up scheduled cron job
10. ✅ Remove `/dev/scraper-test` route before production

