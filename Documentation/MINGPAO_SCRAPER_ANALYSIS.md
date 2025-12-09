# MingPao Scraper Implementation Analysis

## Overview
This document details the MingPao news source extraction logic implemented in `lib/scrapers/sourceStrategies.ts`.

## Sample Article Analysis
**URL:** https://news.mingpao.com/pns/要聞/article/20251208/s00001/1765132930340/投票率31.9%-升1.7百分點-少3.3萬人-大埔所屬新界東北投票率較低

### Extracted Data Points

#### 1. **Article ID** ✅
- **Method:** Extract large numeric ID from URL path
- **Pattern:** `/article/YYYYMMDD/sXXXXX/1765132930340/`
- **Implementation:** Match 10+ digit numeric ID (1765132930340)
- **Result:** `1765132930340`

#### 2. **Title** ✅
- **Selector:** `<hgroup><h1>title</h1></hgroup>`
- **HTML Structure:**
  ```html
  <hgroup>
    <h1>投票率31.9%  升1.7百分點  少3.3萬人  大埔所屬新界東北投票率較低</h1>
  </hgroup>
  ```
- **Result:** `投票率31.9%  升1.7百分點  少3.3萬人  大埔所屬新界東北投票率較低`

#### 3. **Category** ✅
- **Selector:** `<div itemprop="alternativeHeadline" class="colleft"><a><h3>category</h3></a></div>`
- **HTML Structure:**
  ```html
  <div itemprop="alternativeHeadline" class="colleft">
    <a href="../pns/%E8%A6%81%E8%81%9E/section/20251208/s00001">
      <h3>要聞</h3>
    </a>
    <div itemprop="datePublished" class="date">2025年12月8日星期一</div>
  </div>
  ```
- **Result:** `要聞` (News category)
- **Fallback:** URL decoding from `/pns/%E8%A6%81%E8%81%9E/article/` path

#### 4. **Publish Date** ✅
- **Selector:** `<div itemprop="datePublished" class="date">2025年12月8日星期一</div>`
- **Format:** Chinese format (2025年12月8日星期一)
- **Regex:** Extract year/month/day with Chinese characters `/(\d{4})年(\d{1,2})月(\d{1,2})日/`
- **Conversion:** Convert to ISO format (YYYY-MM-DD)
- **Result:** `2025-12-08`

#### 5. **Author** ✅
- **Selector:** `<article class="txt4"><h2>明報記者</h2>`
- **Pattern:** Look for first `<h2>` in article containing "記者" (reporter/journalist)
- **Result:** `Ming Pao Reporter` (generally marked as "明報記者" - Ming Pao Reporter)
- **Note:** MingPao typically credits articles to "明報記者" rather than individual names

#### 6. **Main Image** ✅
- **Container:** `<div id="topimage" style="display: block;">`
- **Structure:**
  ```html
  <div id="topimage">
    <div class="album_big">
      <div class="ImageTable13_album">
        <div class="ImageDiv">
          <div id="zoomedimg">
            <div style="display: block; position: relative; 
                 background-image: url(&quot;https://fs.mingpao.com/pns/20251208/s00006/ce4c6eb7b3ba4496ad6739c3b0ab0dc3.jpg&quot;);" 
                 id="zoom_1765132930330" 
                 dtitle="" 
                 durl="...">
  ```
- **Extraction Method:**
  1. Find `#topimage` div
  2. Extract first image's background-image URL from inline style
  3. Parse URL from `url("https://...")`
  4. Get caption from `dtitle` attribute (empty in first image)
- **Result:** `https://fs.mingpao.com/pns/20251208/s00006/ce4c6eb7b3ba4496ad6739c3b0ab0dc3.jpg`

#### 7. **Article Images with Captions** ✅
- **Container:** Same `#topimage` div with carousel
- **Structure:** Multiple images as divs with `background-image` style and `dtitle` attributes
- **Examples:**
  ```html
  <!-- Image 1: No caption (main image) -->
  <div style="background-image: url(&quot;...ce4c6eb7b3ba4496ad6739c3b0ab0dc3.jpg&quot;);" 
       id="zoom_1765132930330" dtitle=""></div>
  
  <!-- Image 2: With caption -->
  <div style="background-image: url(&quot;...34bb4b686d85460f86e5afeeb28a39f7.jpg&quot;);" 
       id="zoom_1765132930334" 
       dtitle="昨日持續有穿不同制服的紀律部隊人員到位於太子的警察體育遊樂會專屬票站投票...（徐君浩攝）"></div>
  
  <!-- Image 3: With caption -->
  <div style="background-image: url(&quot;...718768f573b549c7bf0bdb456629c3a4.jpg&quot;);" 
       id="zoom_1765132930335" 
       dtitle="立法會選舉昨日舉行，上月大埔宏福苑大火令該區投票率受關注...（鍾林枝攝）"></div>
  ```
- **Extraction Method:**
  1. Find all divs in `#topimage` with `background-image` style
  2. Extract URL from `url("...")` pattern
  3. Extract caption from `dtitle` attribute
  4. Filter for valid MingPao images (must contain `fs.mingpao.com`)
- **Result:** Array of 8 images with captions:
  ```
  [
    { url: "https://fs.mingpao.com/pns/20251208/s00006/ce4c6eb7b3ba4496ad6739c3b0ab0dc3.jpg", caption: "" },
    { url: "https://fs.mingpao.com/pns/20251208/s00006/34bb4b686d85460f86e5afeeb28a39f7.jpg", caption: "昨日持續有穿不同制服的紀律部隊人員到位於太子的警察體育遊樂會專屬票站投票..." },
    ...
  ]
  ```

#### 8. **Content/Body** (via ArticleScraper)
- **Primary Selector:** `<article class="txt4">`
- **Content Structure:** Paragraphs within `<div id="lower">`
- **Extraction:** Parse paragraphs, sections, and quoted blocks
- **Result:** Full article body with 文 structured format

#### 9. **Summary/Description** ✅
- **Meta Tag:** `<meta name="description" content="..."/>`
- **Content:** First paragraph or meta description
- **Result:** `【明報專訊】立法會選舉昨日完結，今屆地區直選投票率31.9％...`

## HTML Structure Reference

### Key Container Elements:
- `#topimage` - Image gallery container
- `article.txt4` - Main article content
- `div.colleft` - Category/date metadata
- `div[id="lower"]` - Article body content
- `hgroup` - Article title wrapper

### Important Attributes:
- `dtitle` - Image captions in MingPao gallery
- `itemprop="datePublished"` - Publication date
- `itemprop="alternativeHeadline"` - Category link
- `data-original` - Lazy-loaded image URLs
- `style="background-image: url(...)"` - Background images in gallery

## Implementation in sourceStrategies.ts

### MingPaoScraper Class Methods:

1. **extractArticleId()**
   - Extracts numeric ID from URL path
   - Falls back to YYYYMMDD format

2. **extractAuthor()**
   - Looks for `<h2>` tags containing "記者"
   - Defaults to "Ming Pao Reporter"

3. **extractCategories()**
   - Extracts from `div.colleft a h3`
   - Falls back to URL path decoding

4. **extractMainImage()**
   - Gets first image from `#topimage`
   - Extracts from inline style background-image
   - Extracts caption from `dtitle`

5. **extractAllImages()**
   - Gets all images from gallery with captions
   - Filters for valid fs.mingpao.com URLs

6. **extractPublishDate()**
   - Parses Chinese date format (2025年12月8日)
   - Converts to ISO format (2025-12-08)
   - Falls back to URL date extraction

7. **extractTitle()**
   - Extracts from `<hgroup><h1>`
   - Falls back to OG meta tag

## Testing Results

### Sample Article Results:
```
✅ Article ID: 1765132930340
✅ Title: 投票率31.9%  升1.7百分點  少3.3萬人  大埔所屬新界東北投票率較低
✅ Category: 要聞
✅ Date: 2025-12-08
✅ Author: Ming Pao Reporter (明報記者)
✅ Main Image: https://fs.mingpao.com/pns/20251208/s00006/ce4c6eb7b3ba4496ad6739c3b0ab0dc3.jpg
✅ Images Count: 8 total with captions
✅ Content: Full article body extracted
```

## Differences from HK01

| Feature | HK01 | MingPao |
|---------|------|---------|
| **Article ID** | data-article-id attribute | Numeric ID in URL path |
| **Title** | h1#articleTitle | hgroup h1 |
| **Author** | [data-testid="article-author"] | h2 containing "記者" |
| **Category** | Breadcrumb attributes | div.colleft a h3 |
| **Date** | ISO format datetime attribute | Chinese format with Chinese characters |
| **Images** | Standard img tags | Background images in divs with dtitle |
| **Captions** | Alt text or nearby text | dtitle attribute |
| **Gallery** | Not emphasized | Primary #topimage carousel |

## Future Enhancements

1. **Image Processing:** Extract photo credits from captions (e.g., "（徐君浩攝）" = photo by Xu Junhao)
2. **Content Parsing:** Better handle MingPao's specific heading patterns (h2 with subsections)
3. **Video Support:** MingPao articles may embed videos - add video extraction
4. **Related Articles:** Extract "相關字詞" (related keywords) section
5. **Author Attribution:** Parse individual photographer/reporter names from captions

## Troubleshooting

### Common Issues:

1. **Images not extracting:**
   - Check if `#topimage` div has `display: none` (not visible)
   - Verify background-image URL format in style attribute
   - Look for dtitle attribute for captions

2. **Date parsing fails:**
   - Ensure Chinese characters are properly decoded
   - Verify regex matches 年月日 format
   - Fall back to URL date extraction

3. **Category extraction empty:**
   - Check if URL is properly URL-decoded
   - Verify `div.colleft a h3` structure exists
   - Try meta tag fallback

4. **Author appears as "Ming Pao Reporter":**
   - This is expected for most MingPao articles
   - Individual author names rarely appear in main h2
   - Check bylines in article body for specific names

---

**Last Updated:** December 7, 2025  
**Article Tested:** https://news.mingpao.com/pns/要聞/article/20251208/s00001/1765132930340/投票率31.9%-升1.7百分點-少3.3萬人-大埔所屬新界東北投票率較低
