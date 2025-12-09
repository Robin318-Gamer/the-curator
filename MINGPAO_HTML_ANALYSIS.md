# MingPao HTML Structure Analysis

## 1. "日報新聞-相關報道" Section Structure

### Location in HTML
Found at approximately **line 1570** of the article content (after the main article text).

### Exact HTML Markup (25 lines of context)
```html
<!-- Article content ends above -->
<div id="lower" style="display: block;">
    <!-- ... article content ... -->
    <div id="pnsautornews">
        <h2><strong>日報新聞-相關報道：</strong></h2>
        <p style="line-height:120%">
            <a href="../pns/%e8%a6%81%e8%81%9e/article/20251208/s00001/1765132931125/%e6%9c%89%e5%ae%8f%e7%a6%8f%e8%a1%97%e5%9d%8a%e7%a5%a8%e7%ab%99%e9%87%8d%e8%81%9a-%e6%9c%89%e5%9b%a0%e7%81%ab%e7%81%bd%e5%86%8d%e6%8a%95%e7%a5%a8-%e8%bd%9f%e5%9c%8d%e6%a8%99">
                <span style="color:#3366CC;font-weight:bold">有宏福街坊票站重聚  有因火災再投票  轟圍標 <small>(2025-12-08)</small></span>
            </a>
        </p>
    </div>
    <p>相關字詞﹕
        <a href="../php/search2.php?pnssection=all&inssection=all&searchtype=A&keywords=%E9%81%B8%E6%B0%91%E7%99%BB%E8%A8%98" target="_blank" class="content_tag color6th">選民登記</a>
        <!-- ... more tags ... -->
    </p>
</div>
```

### CSS Selectors to Identify and Exclude

**Container ID (Unique):**
```css
#pnsautornews
```

**Full Selector Path:**
```css
div#lower > div#pnsautornews
/* or more specifically */
div#lower > div#pnsautornews h2
```

**jQuery Selector to Remove:**
```javascript
// Remove the entire related news section
$('div#pnsautornews').remove();

// Or just hide it
$('div#pnsautornews').hide();

// Or extract text only (for reference)
const relatedNews = $('div#pnsautornews').text();
```

### Structure Summary
- **Container ID:** `pnsautornews`
- **Parent Container:** `div#lower` (main article container)
- **Content Type:** List of related articles with links
- **Contains:** 
  - One heading: `<h2><strong>日報新聞-相關報道：</strong></h2>`
  - Related article links (usually 1-3 links)
  - Date information in `<small>` tags
  - Related keywords/tags below

---

## 2. Image Structure with Captions

### Images Container
The main images are stored in the `#topimage` section within `#blockcontent`.

### Exact HTML Structure for Images (showing all 8 images)

```html
<div id="topimage" style="display: block;">
    <div class="album_big">
        <div class="ImageTable13_album">
            <div class="ImageDiv">
                <div id="zoomedimg">
                    
                    <!-- IMAGE 1 (Main/Featured) -->
                    <div style="display: block; position: relative; background-image: url('https://fs.mingpao.com/pns/20251208/s00006/ce4c6eb7b3ba4496ad6739c3b0ab0dc3.jpg');" 
                         id="zoom_1765132930330" class="imgLiquidNoFill imgLiquid photoresize_H387 imgLiquid_bgSize imgLiquid_ready" 
                         dtitle="" durl="https://news.mingpao.com/pns/%e8%a6%81%e8%81%9e/photo1/20251208/s00001/1765132930340/1765132930330" 
                         dguid="PNS_WEB_TC/20251208/S00006/image/1765132930330">
                        <a href="https://fs.mingpao.com/pns/20251208/s00006/ce4c6eb7b3ba4496ad6739c3b0ab0dc3.jpg" 
                           class="fancybox" data-fancybox-group="button" title="" 
                           durl="https://news.mingpao.com/pns/%e8%a6%81%e8%81%9e/photo1/20251208/s00001/1765132930340/1765132930330" 
                           dguid="PNS_WEB_TC/20251208/S00006/image/1765132930330" 
                           style="display: block; width: 100%; height: 100%;">
                            <img class="lazy" src="https://fs.mingpao.com/pns/20251208/s00006/ce4c6eb7b3ba4496ad6739c3b0ab0dc3.jpg" 
                                 data-original="https://fs.mingpao.com/pns/20251208/s00006/ce4c6eb7b3ba4496ad6739c3b0ab0dc3.jpg" 
                                 alt="" style="display: none;">
                            <div class="clear"></div>
                        </a>
                    </div>

                    <!-- IMAGE 2 -->
                    <div style="display:none;position:relative;" 
                         id="zoom_1765132930334" class="imgLiquidNoFill imgLiquid photoresize_H387" 
                         dtitle="昨日持續有穿不同制服的紀律部隊人員到位於太子的警察體育遊樂會專屬票站投票，圖中一批約20名穿入境處制服人員下午約2時步入票站，同時段也有大批穿制服警員進出票站。（徐君浩攝）" 
                         durl="https://news.mingpao.com/pns/%e8%a6%81%e8%81%9e/photo1/20251208/s00001/1765132930340/1765132930334" 
                         dguid="PNS_WEB_TC/20251208/S00006/image/1765132930334">
                        <a href="https://fs.mingpao.com/pns/20251208/s00006/34bb4b686d85460f86e5afeeb28a39f7.jpg" 
                           class="fancybox" data-fancybox-group="button" 
                           title="昨日持續有穿不同制服的紀律部隊人員到位於太子的警察體育遊樂會專屬票站投票，圖中一批約20名穿入境處制服人員下午約2時步入票站，同時段也有大批穿制服警員進出票站。（徐君浩攝）" 
                           durl="https://news.mingpao.com/pns/%e8%a6%81%e8%81%9e/photo1/20251208/s00001/1765132930340/1765132930334" 
                           dguid="PNS_WEB_TC/20251208/S00006/image/1765132930334">
                            <img class="lazy" src="../image/grey.gif" 
                                 data-original="https://fs.mingpao.com/pns/20251208/s00006/34bb4b686d85460f86e5afeeb28a39f7.jpg" 
                                 alt="昨日持續有穿不同制服的紀律部隊人員到位於太子的警察體育遊樂會專屬票站投票，圖中一批約20名穿入境處制服人員下午約2時步入票站，同時段也有大批穿制服警員進出票站。（徐君浩攝）">
                            <div class="clear"></div>
                        </a>
                    </div>

                    <!-- IMAGE 3 -->
                    <div style="display:none;position:relative;" 
                         id="zoom_1765132930335" class="imgLiquidNoFill imgLiquid photoresize_H387" 
                         dtitle="立法會選舉昨日舉行，上月大埔宏福苑大火令該區投票率受關注。受大火影響，宏福苑及廣福邨選民要往3個新票站投票，包括羅定邦中學（圖），圖為昨晚9時所攝。截至昨晚10時，該3個票站的投票率均落後於全港地區直選投票率。（鍾林枝攝）" 
                         durl="https://news.mingpao.com/pns/%e8%a6%81%e8%81%9e/photo1/20251208/s00001/1765132930340/1765132930335" 
                         dguid="PNS_WEB_TC/20251208/S00006/image/1765132930335">
                        <a href="https://fs.mingpao.com/pns/20251208/s00006/718768f573b549c7bf0bdb456629c3a4.jpg" 
                           class="fancybox" data-fancybox-group="button" 
                           title="立法會選舉昨日舉行，上月大埔宏福苑大火令該區投票率受關注。受大火影響，宏福苑及廣福邨選民要往3個新票站投票，包括羅定邦中學（圖），圖為昨晚9時所攝。截至昨晚10時，該3個票站的投票率均落後於全港地區直選投票率。（鍾林枝攝）" 
                           durl="https://news.mingpao.com/pns/%e8%a6%81%e8%81%9e/photo1/20251208/s00001/1765132930340/1765132930335" 
                           dguid="PNS_WEB_TC/20251208/S00006/image/1765132930335">
                            <img class="lazy" src="../image/grey.gif" 
                                 data-original="https://fs.mingpao.com/pns/20251208/s00006/718768f573b549c7bf0bdb456629c3a4.jpg" 
                                 alt="立法會選舉昨日舉行，上月大埔宏福苑大火令該區投票率受關注。受大火影響，宏福苑及廣福邨選民要往3個新票站投票，包括羅定邦中學（圖），圖為昨晚9時所攝。截至昨晚10時，該3個票站的投票率均落後於全港地區直選投票率。（鍾林枝攝）">
                            <div class="clear"></div>
                        </a>
                    </div>

                    <!-- IMAGE 4 (Empty caption) -->
                    <div style="display:none;position:relative;" 
                         id="zoom_1765132930336" class="imgLiquidNoFill imgLiquid photoresize_H387" 
                         dtitle="" 
                         durl="https://news.mingpao.com/pns/%e8%a6%81%e8%81%9e/photo1/20251208/s00001/1765132930340/1765132930336" 
                         dguid="PNS_WEB_TC/20251208/S00006/image/1765132930336">
                        <a href="https://fs.mingpao.com/pns/20251208/s00006/8bc5be3e8c0a424599b5abab281aa687.jpg" 
                           class="fancybox" data-fancybox-group="button" title="" 
                           durl="https://news.mingpao.com/pns/%e8%a6%81%e8%81%9e/photo1/20251208/s00001/1765132930340/1765132930336" 
                           dguid="PNS_WEB_TC/20251208/S00006/image/1765132930336">
                            <img class="lazy" src="../image/grey.gif" 
                                 data-original="https://fs.mingpao.com/pns/20251208/s00006/8bc5be3e8c0a424599b5abab281aa687.jpg" 
                                 alt="">
                            <div class="clear"></div>
                        </a>
                    </div>

                    <!-- IMAGE 5 (Empty caption) -->
                    <div style="display:none;position:relative;" 
                         id="zoom_1765132930337" class="imgLiquidNoFill imgLiquid photoresize_H387" 
                         dtitle="" 
                         durl="https://news.mingpao.com/pns/%e8%a6%81%e8%81%9e/photo1/20251208/s00001/1765132930340/1765132930337" 
                         dguid="PNS_WEB_TC/20251208/S00006/image/1765132930337">
                        <a href="https://fs.mingpao.com/pns/20251208/s00006/420a228d356b4343bd11e96c0b21eb50.jpg" 
                           class="fancybox" data-fancybox-group="button" title="" 
                           durl="https://news.mingpao.com/pns/%e8%a6%81%e8%81%9e/photo1/20251208/s00001/1765132930340/1765132930337" 
                           dguid="PNS_WEB_TC/20251208/S00006/image/1765132930337">
                            <img class="lazy" src="../image/grey.gif" 
                                 data-original="https://fs.mingpao.com/pns/20251208/s00006/420a228d356b4343bd11e96c0b21eb50.jpg" 
                                 alt="">
                            <div class="clear"></div>
                        </a>
                    </div>

                    <!-- IMAGE 6 -->
                    <div style="display:none;position:relative;" 
                         id="zoom_1765132930338" class="imgLiquidNoFill imgLiquid photoresize_H387" 
                         dtitle="曾任宏福苑法團顧問的民建聯區議員黃碧嬌（左上小圖）昨晚透過通訊軟件，為在新界東北競逐連任的黨主席陳克勤「催票」。（微信截圖）" 
                         durl="https://news.mingpao.com/pns/%e8%a6%81%e8%81%9e/photo1/20251208/s00001/1765132930340/1765132930338" 
                         dguid="PNS_WEB_TC/20251208/S00006/image/1765132930338">
                        <a href="https://fs.mingpao.com/pns/20251208/s00006/d28b7845c01f412a9d250e033d5670e4.jpg" 
                           class="fancybox" data-fancybox-group="button" 
                           title="曾任宏福苑法團顧問的民建聯區議員黃碧嬌（左上小圖）昨晚透過通訊軟件，為在新界東北競逐連任的黨主席陳克勤「催票」。（微信截圖）" 
                           durl="https://news.mingpao.com/pns/%e8%a6%81%e8%81%9e/photo1/20251208/s00001/1765132930340/1765132930338" 
                           dguid="PNS_WEB_TC/20251208/S00006/image/1765132930338">
                            <img class="lazy" src="../image/grey.gif" 
                                 data-original="https://fs.mingpao.com/pns/20251208/s00006/d28b7845c01f412a9d250e033d5670e4.jpg" 
                                 alt="曾任宏福苑法團顧問的民建聯區議員黃碧嬌（左上小圖）昨晚透過通訊軟件，為在新界東北競逐連任的黨主席陳克勤「催票」。（微信截圖）">
                            <div class="clear"></div>
                        </a>
                    </div>

                    <!-- IMAGE 7 -->
                    <div style="display:none;position:relative;" 
                         id="zoom_1765132930339" class="imgLiquidNoFill imgLiquid photoresize_H387" 
                         dtitle="立法會選舉投票昨晚11時半結束，選委會委員石丹理（前排左一），政制及內地事務局長曾國衞（前排左二），選管會主席陸啟康（前排右二）及委員文本立（前排右一）一同在會展中央點票站倒票。（廖凱霖攝）" 
                         durl="https://news.mingpao.com/pns/%e8%a6%81%e8%81%9e/photo1/20251208/s00001/1765132930340/1765132930339" 
                         dguid="PNS_WEB_TC/20251208/S00006/image/1765132930339">
                        <a href="https://fs.mingpao.com/pns/20251208/s00006/cc3cdb66c12349abb1356e1a00211386.jpg" 
                           class="fancybox" data-fancybox-group="button" 
                           title="立法會選舉投票昨晚11時半結束，選委會委員石丹理（前排左一），政制及內地事務局長曾國衞（前排左二），選管會主席陸啟康（前排右二）及委員文本立（前排右一）一同在會展中央點票站倒票。（廖凱霖攝）" 
                           durl="https://news.mingpao.com/pns/%e8%a6%81%e8%81%9e/photo1/20251208/s00001/1765132930340/1765132930339" 
                           dguid="PNS_WEB_TC/20251208/S00006/image/1765132930339">
                            <img class="lazy" src="../image/grey.gif" 
                                 data-original="https://fs.mingpao.com/pns/20251208/s00006/cc3cdb66c12349abb1356e1a00211386.jpg" 
                                 alt="立法會選舉投票昨晚11時半結束，選委會委員石丹理（前排左一），政制及內地事務局長曾國衞（前排左二），選管會主席陸啟康（前排右二）及委員文本立（前排右一）一同在會展中央點票站倒票。（廖凱霖攝）">
                            <div class="clear"></div>
                        </a>
                    </div>

                    <!-- IMAGE 8 -->
                    <div style="display:none;position:relative;" 
                         id="zoom_1765132930340" class="imgLiquidNoFill imgLiquid photoresize_H387" 
                         dtitle="歌手「肥媽」Maria Cordero昨晨到大埔李貴興中學票站投票，她希望新一屆議員「年輕啲、做嘢積極啲」，認為火災見到以往的議員效率太慢，「檢查得清楚唔會有今次慘劇」。（廖俊升攝）" 
                         durl="https://news.mingpao.com/pns/%e8%a6%81%e8%81%9e/photo1/20251208/s00001/1765132930340/1765132930340" 
                         dguid="PNS_WEB_TC/20251208/S00006/image/1765132930340">
                        <a href="https://fs.mingpao.com/pns/20251208/s00006/71b183a727f3407b953bc3b4e7d50389.jpg" 
                           class="fancybox" data-fancybox-group="button" 
                           title="歌手「肥媽」Maria Cordero昨晨到大埔李貴興中學票站投票，她希望新一屆議員「年輕啲、做嘢積極啲」，認為火災見到以往的議員效率太慢，「檢查得清楚唔會有今次慘劇」。（廖俊升攝）" 
                           durl="https://news.mingpao.com/pns/%e8%a6%81%e8%81%9e/photo1/20251208/s00001/1765132930340/1765132930340" 
                           dguid="PNS_WEB_TC/20251208/S00006/image/1765132930340">
                            <img class="lazy" src="../image/grey.gif" 
                                 data-original="https://fs.mingpao.com/pns/20251208/s00006/71b183a727f3407b953bc3b4e7d50389.jpg" 
                                 alt="歌手「肥媽」Maria Cordero昨晨到大埔李貴興中學票站投票，她希望新一屆議員「年輕啲、做嘢積極啲」，認為火災見到以往的議員效率太慢，「檢查得清楚唔會有今次慘劇」。（廖俊升攝）">
                            <div class="clear"></div>
                        </a>
                    </div>

                    <div class="slide_cap1 color_white txt1">圖8之1</div>
                </div>
            </div>
        </div>
    </div>
</div>
```

---

## 3. Image Caption Information

### Caption Storage Locations

**Captions are stored in THREE places:**

1. **In `dtitle` attribute** (on the outer `div.imgLiquidNoFill` container):
   ```html
   dtitle="昨日持續有穿不同制服的紀律部隊人員到位於太子的警察體育遊樂會專屬票站投票..."
   ```

2. **In `title` attribute** (on the `<a class="fancybox">` link):
   ```html
   title="昨日持續有穿不同制服的紀律部隊人員到位於太子的警察體育遊樂會專屬票站投票..."
   ```

3. **In `alt` attribute** (on the `<img>` tag):
   ```html
   alt="昨日持續有穿不同制服的紀律部隊人員到位於太子的警察體育遊樂會專屬票站投票..."
   ```

### Caption Extraction - jQuery/CSS Selectors

**Extract image URL and caption together:**
```javascript
// Method 1: Get all images with captions from #topimage
const images = [];
$('#topimage div[id^=zoom_]').each(function() {
    const caption = $(this).attr('dtitle') || $(this).find('a.fancybox').attr('title') || '';
    const imageUrl = $(this).find('a.fancybox').attr('href');
    const guid = $(this).attr('dguid');
    
    if(imageUrl) {
        images.push({
            url: imageUrl,
            caption: caption,
            guid: guid,
            id: this.id
        });
    }
});

// Method 2: Using CSS selector directly
const imageData = [];
$('#blockcontent #zoomedimg > div[id^="zoom_"] a.fancybox').each(function() {
    imageData.push({
        url: $(this).attr('href'),
        caption: $(this).attr('title'),
        guid: $(this).attr('dguid')
    });
});

// Method 3: Get specific image by ID
const image2 = {
    url: $('#zoom_1765132930334 a.fancybox').attr('href'),
    caption: $('#zoom_1765132930334').attr('dtitle'),
    guid: $('#zoom_1765132930334').attr('dguid')
};
```

---

## 4. Image Container Structure Details

### Main Container IDs and Classes

```
#topimage (outer wrapper, display: block)
  ├── .album_big
  │   ├── .ImageTable13_album
  │   │   ├── .ImageDiv
  │   │   │   ├── #zoomedimg (contains all zoom_* divs)
  │   │   │   │   ├── div#zoom_1765132930330 (Image 1 - visible)
  │   │   │   │   ├── div#zoom_1765132930334 (Image 2 - hidden)
  │   │   │   │   ├── div#zoom_1765132930335 (Image 3 - hidden)
  │   │   │   │   ├── ... (Images 4-8)
  │   │   │   │   └── .slide_cap1 (caption display)
  │   ├── .carousel4th (thumbnail carousel below)
  │   │   └── #foo_topimage (carousel container)
  │   │       └── figure.boxSep x8 (thumbnails)
```

### Key Attributes on Images

| Attribute | Purpose | Example |
|-----------|---------|---------|
| `id="zoom_*"` | Unique image identifier | `zoom_1765132930330` |
| `dtitle=""` | Caption text | "昨日持續有穿不同制服..." |
| `dguid=""` | GUID for tracking | `PNS_WEB_TC/20251208/S00006/image/1765132930330` |
| `durl=""` | Article detail URL | `https://news.mingpao.com/pns/.../1765132930330` |
| `class="fancybox"` | jQuery Fancybox lightbox plugin marker | - |
| `data-fancybox-group="button"` | Fancybox group | - |

---

## 5. Image Gallery Implementation Details

### Carousel Thumbnails

The carousel shows 8 thumbnail images:
```html
<div id="foo_topimage" class="box_pad">
    <figure class="boxSep">
        <div class="imgLiquidNoFill imgLiquid photoresize_H75">
            <a href="javascript:void(0)" onclick="adjustimg('zoom_1765132930330');">
                <img class="lazy" src="https://fs.mingpao.com/pns/20251208/s00006/ed9404c504104d8bb515e8202652340b.jpg" ...>
            </a>
        </div>
    </figure>
    <!-- ... 7 more figures ... -->
</div>
```

**Carousel Controls:**
```html
<a class="prev disabled" id="foo_topimage_prev" href="#">prev</a>
<a class="next" id="foo_topimage_next" href="#">next</a>
```

---

## 6. All 8 Images Summary Table

| # | ID | URL (fs.mingpao.com) | Caption | Display |
|---|----|----|---------|---------|
| 1 | zoom_1765132930330 | `/pns/20251208/s00006/ce4c6eb7b3ba4496ad6739c3b0ab0dc3.jpg` | (Empty) | Initial visible |
| 2 | zoom_1765132930334 | `/pns/20251208/s00006/34bb4b686d85460f86e5afeeb28a39f7.jpg` | "昨日持續有穿不同制服的紀律部隊人員..." | Hidden |
| 3 | zoom_1765132930335 | `/pns/20251208/s00006/718768f573b549c7bf0bdb456629c3a4.jpg` | "立法會選舉昨日舉行，上月大埔宏福苑大火..." | Hidden |
| 4 | zoom_1765132930336 | `/pns/20251208/s00006/8bc5be3e8c0a424599b5abab281aa687.jpg` | (Empty) | Hidden |
| 5 | zoom_1765132930337 | `/pns/20251208/s00006/420a228d356b4343bd11e96c0b21eb50.jpg` | (Empty) | Hidden |
| 6 | zoom_1765132930338 | `/pns/20251208/s00006/d28b7845c01f412a9d250e033d5670e4.jpg` | "曾任宏福苑法團顧問的民建聯區議員黃碧嬌..." | Hidden |
| 7 | zoom_1765132930339 | `/pns/20251208/s00006/cc3cdb66c12349abb1356e1a00211386.jpg` | "立法會選舉投票昨晚11時半結束..." | Hidden |
| 8 | zoom_1765132930340 | `/pns/20251208/s00006/71b183a727f3407b953bc3b4e7d50389.jpg` | "歌手「肥媽」Maria Cordero昨晨到大埔..." | Hidden |

---

## 7. Recommended Selectors for Scraping

### Extract All Images with Captions (Node.js/Puppeteer)

```javascript
const images = await page.$$eval('#blockcontent #zoomedimg > div[id^="zoom_"]', divs => {
    return divs.map(div => ({
        id: div.id,
        imageUrl: div.querySelector('a.fancybox')?.href,
        caption: div.getAttribute('dtitle') || div.querySelector('a.fancybox')?.title || '',
        guid: div.getAttribute('dguid'),
        alt: div.querySelector('img')?.alt
    })).filter(img => img.imageUrl);
});
```

### Exclude Related News Section

```javascript
// Remove before extracting article content
await page.$eval('#pnsautornews', el => el.remove());

// Or extract content excluding this section
const articleText = await page.$eval('#lower:not(#pnsautornews)', el => el.innerText);
```

### Extract From `#topimage` Container Only

```javascript
const topImages = await page.$$eval('#topimage a.fancybox', links => {
    return links.map(link => ({
        url: link.href,
        caption: link.title,
        guid: link.getAttribute('dguid')
    }));
});
```

---

## Summary

- **Related News Section:** `div#pnsautornews` - easily excluded with selector
- **Images Container:** `#topimage > #zoomedimg` - 8 images total (ID: zoom_*)
- **Captions:** Stored in `dtitle`, `title`, and `alt` attributes
- **Image URLs:** All from `fs.mingpao.com/pns/20251208/s00006/`
- **Carousel:** Thumbnail carousel with prev/next controls
