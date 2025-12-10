/**
 * Source-Specific Scraper Strategies
 * 
 * Each news source may have unique quirks in how they structure their HTML.
 * This file contains source-specific extraction logic that extends the base ArticleScraper.
 */

import * as cheerio from 'cheerio';

/**
 * HK01-specific scraping enhancements
 */
export class HK01Scraper {
  /**
   * Extract article ID from HK01 HTML or URL
   */
  static extractArticleId($: cheerio.CheerioAPI, url?: string): string {
    // Try data-article-id attribute
    const articleIdAttr = $('[data-article-id]').first().attr('data-article-id');
    if (articleIdAttr) {
      return articleIdAttr;
    }
    
    // Extract from URL: /zone/category/articleId/title-slug
    if (url) {
      const match = url.match(/\/(\d+)\//);
      if (match) {
        return match[1];
      }
    }
    
    return '';
  }

  /**
   * Extract author from HK01-specific elements
   */
  static extractAuthor($: cheerio.CheerioAPI, titleElement: cheerio.Cheerio<any>): string {
    // Priority: article-author div > h1 data-author
    const authorElement = $('[data-testid="article-author"]').first();
    let author = authorElement.text();
    
    // Clean up author text - remove "撰文：" prefix
    author = author.replace(/撰文：|撰文:/, '').trim();
    
    // Fallback to h1 data-author
    if (!author && titleElement.attr('data-author')) {
      author = titleElement.attr('data-author') || '';
    }
    
    return author;
  }

  /**
   * Extract category and sub-category from HK01 breadcrumbs
   */
  static extractCategories($: cheerio.CheerioAPI, titleElement: cheerio.Cheerio<any>) {
    let category = '';
    let subCategory = '';
    
    // Extract from breadcrumb links
    const breadcrumbItems = $(
      '[data-testid="article-breadcrumb-zone"], [data-testid="article-breadcrumb-channel"]'
    );
    
    if (breadcrumbItems.length >= 1) {
      category = breadcrumbItems.eq(0).text().trim();
    }
    if (breadcrumbItems.length >= 2) {
      subCategory = breadcrumbItems.eq(1).text().trim();
    }
    
    // Fallback to h1 data-category
    if (!category && titleElement.attr('data-category')) {
      category = titleElement.attr('data-category') || '';
    }
    
    return { category, subCategory };
  }

  /**
   * Extract main image from HK01-specific structure
   */
  static extractMainImage($: cheerio.CheerioAPI) {
    const topSection = $('[data-testid="article-top-section"]');
    if (!topSection.length) {
      return { mainImage: '', mainImageFull: '', mainImageCaption: '' };
    }
    
    const topImg = topSection.find('img').first();
    const imgSrc = topImg.attr('src') || topImg.attr('data-src') || '';
    const mainImageFull = imgSrc;
    const mainImage = imgSrc.split('?')[0]; // Remove query params
    
    // Extract caption
    const captionCandidate = topSection
      .find('[data-testid="article-top-section-caption"], figcaption, .img-caption')
      .map((_, el) => $(el).text().trim())
      .get()
      .filter(Boolean);
    
    let mainImageCaption = '';
    if (captionCandidate.length > 0) {
      mainImageCaption = captionCandidate[0];
    } else if (topImg.attr('alt')) {
      mainImageCaption = topImg.attr('alt') || '';
    } else if (topImg.attr('title')) {
      mainImageCaption = topImg.attr('title') || '';
    }
    
    return { mainImage, mainImageFull, mainImageCaption };
  }
}

/**
 * MingPao-specific scraping enhancements
 */
export class MingPaoScraper {
  /**
   * Extract author from MingPao structure
   * MingPao marks authors with <h2>明報記者</h2> or specific author divs
   */
  static extractAuthor($: cheerio.CheerioAPI): string {
    // MingPao uses <h2>明報記者</h2> or similar headers
    let author = '';
    
    // Try to find author heading followed by content
    const h2Elements = $('h2');
    for (let i = 0; i < h2Elements.length; i++) {
      const text = $(h2Elements[i]).text().trim();
      if (text === '明報記者' || text === '記者' || text.includes('記者')) {
        author = text;
        break;
      }
    }
    
    // Fallback to other author indicators
    if (!author) {
      author = $('[itemprop="author"], .author-name, .byline').first().text().trim();
    }
    
    return author;
  }

  /**
   * Extract category from MingPao structure
   * Uses: <a href="../pns/%E8%A6%81%E8%81%9E/section/..."><h3>要聞</h3></a>
   */
  static extractCategories($: cheerio.CheerioAPI, url?: string) {
    let category = '';
    let subCategory = '';
    
    // Look for category in colleft div with anchor and h3
    const categoryLink = $('div.colleft a h3').first();
    if (categoryLink.length) {
      category = categoryLink.text().trim();
    }
    
    // Fallback: extract from URL path
    if (!category && url) {
      // URL pattern: /pns/{category}/article/... (URL-encoded)
      const urlMatch = url.match(/\/pns\/([^\/]+)\/article\//);
      if (urlMatch) {
        category = decodeURIComponent(urlMatch[1]);
      }
    }
    
    // Try meta tags
    if (!category) {
      category = $('meta[property="article:section"]').attr('content') || '';
    }
    
    return { category, subCategory };
  }

  /**
   * Extract main image from MingPao gallery structure
   * MingPao uses: <div id="topimage" style="display: block;"> with album_big
   * Returns empty if no image found - DON'T use fallback to random fs.mingpao.com images (like weather icons)
   */
  static extractMainImage($: cheerio.CheerioAPI) {
    // Primary: Look in topimage div for first image
    const topImageDiv = $('#topimage');
    if (topImageDiv.length) {
      // Find first image in the gallery
      const img = topImageDiv.find('img').first();
      if (img.length) {
        let imgSrc = img.attr('src') || img.attr('data-original') || '';
        
        // MingPao uses data-original for lazy-loaded images
        if (!imgSrc || imgSrc.includes('grey.gif')) {
          imgSrc = img.attr('data-original') || '';
        }
        
        if (imgSrc) {
          const mainImage = imgSrc.split('?')[0];
          const mainImageFull = imgSrc;
          
          // Extract caption from image title or parent alt
          let mainImageCaption = img.attr('alt') || img.attr('title') || '';
          
          return { mainImage, mainImageFull, mainImageCaption };
        }
      }
    }
    
    // NO FALLBACK: If no proper article image found, return empty
    // Don't use generic fs.mingpao.com selectors (they pick up weather icons, etc.)
    return { mainImage: '', mainImageFull: '', mainImageCaption: '' };
  }

  /**
   * Extract all article images with captions from MingPao gallery
   * MingPao stores images with dtitle attribute for captions
   * Images are in carousel: #blockcontent #zoomedimg > div[id^="zoom_"]
   */
  static extractAllImages($: cheerio.CheerioAPI) {
    const images: Array<{ url: string; caption: string }> = [];
    
    console.log('[MingPao] ===== IMAGE EXTRACTION DEBUG =====');
    
    // Find all image divs in the carousel
    // Structure: div#blockcontent > div#zoomedimg > div[id^="zoom_"] with background-image and dtitle
    const blockcontent = $('#blockcontent');
    console.log('[MingPao] Found #blockcontent:', blockcontent.length > 0 ? 'YES' : 'NO');
    
    const imageContainer = $('#blockcontent #zoomedimg');
    console.log('[MingPao] Found #blockcontent #zoomedimg:', imageContainer.length > 0 ? 'YES' : 'NO');
    
    if (imageContainer.length) {
      // Get all divs with id starting with "zoom_"
      const zoomDivs = imageContainer.find('div[id^="zoom_"]');
      console.log('[MingPao] Found zoom divs with id^="zoom_":', zoomDivs.length);
      
      zoomDivs.each((idx, elem) => {
        const $elem = $(elem);
        const elemId = $elem.attr('id') || 'no-id';
        
        // Try to get image URL from various sources
        let imgUrl = '';
        
        // 1. Priority: try to find img tag with lazy-load attributes
        // MingPao uses data-original for the real image URL (src is placeholder grey.gif)
        const img = $elem.find('img').first();
        if (img.length) {
          // For lazy-loaded images, the real URL is in data-original or data-src
          imgUrl = img.attr('data-original') || img.attr('data-src') || '';
          if (imgUrl) {
            console.log(`[MingPao] Image ${idx} (${elemId}): Found via img data-original: ${imgUrl.substring(0, 60)}...`);
          } else {
            // If no lazy-load attribute, try src (but it might be grey.gif placeholder)
            imgUrl = img.attr('src') || '';
            if (imgUrl && !imgUrl.includes('grey.gif')) {
              console.log(`[MingPao] Image ${idx} (${elemId}): Found via img src: ${imgUrl.substring(0, 60)}...`);
            } else {
              console.log(`[MingPao] Image ${idx} (${elemId}): img src is placeholder (grey.gif), no data-original found`);
              imgUrl = ''; // Reset - placeholder is not useful
            }
          }
        }
        
        // 2. Fallback: try background-image style (for carousel display)
        if (!imgUrl) {
          const styleAttr = $elem.attr('style') || '';
          const bgMatch = styleAttr.match(/url\("([^"]+)"\)/);
          if (bgMatch && bgMatch[1]) {
            imgUrl = bgMatch[1];
            console.log(`[MingPao] Image ${idx} (${elemId}): Found via background-image: ${imgUrl.substring(0, 60)}...`);
          }
        }
        
        // 3. Fallback: try to find a tag with href
        if (!imgUrl) {
          const link = $elem.find('a').first();
          imgUrl = link.attr('href') || '';
          if (imgUrl) {
            console.log(`[MingPao] Image ${idx} (${elemId}): Found via a href: ${imgUrl.substring(0, 60)}...`);
          }
        }
        
        if (!imgUrl) {
          console.log(`[MingPao] Image ${idx} (${elemId}): No URL found in any format`);
        }
        
        // Get caption from dtitle, title, or alt attributes
        let caption = $elem.attr('dtitle') || '';
        if (!caption) {
          caption = $elem.attr('title') || '';
        }
        if (!caption) {
          const img = $elem.find('img').first();
          caption = img.attr('alt') || img.attr('title') || '';
        }
        
        if (caption) {
          console.log(`[MingPao] Image ${idx} caption: ${caption.substring(0, 60)}...`);
        } else {
          console.log(`[MingPao] Image ${idx}: No caption found`);
        }
        
        // Only add if we have a valid MingPao image URL
        if (imgUrl && imgUrl.includes('fs.mingpao.com')) {
          images.push({
            url: imgUrl,
            caption: caption.trim()
          });
          console.log(`[MingPao] ✓ Image ${idx} ADDED to results`);
        } else if (imgUrl) {
          console.log(`[MingPao] ✗ Image ${idx} SKIPPED - URL doesn't match fs.mingpao.com`);
        }
      });
    }
    
    console.log(`[MingPao] Total images extracted: ${images.length}`);
    
    // Fallback: if no images found in carousel, try topimage div
    if (images.length === 0) {
      console.log('[MingPao] No images found in carousel, trying #topimage fallback...');
      const topImageDiv = $('#topimage');
      console.log('[MingPao] Found #topimage:', topImageDiv.length > 0 ? 'YES' : 'NO');
      
      if (topImageDiv.length) {
        const imageDivs = topImageDiv.find('div[style*="background-image"]');
        console.log('[MingPao] Found divs with background-image in #topimage:', imageDivs.length);
        
        imageDivs.each((idx, elem) => {
          const $elem = $(elem);
          const styleAttr = $elem.attr('style') || '';
          const bgMatch = styleAttr.match(/url\("([^"]+)"\)/);
          
          if (bgMatch && bgMatch[1]) {
            const imgUrl = bgMatch[1];
            const caption = $elem.attr('dtitle') || '';
            
            console.log(`[MingPao] Fallback image ${idx}: ${imgUrl.substring(0, 60)}...`);
            
            if (imgUrl && imgUrl.includes('fs.mingpao.com')) {
              images.push({
                url: imgUrl,
                caption: caption.trim()
              });
              console.log(`[MingPao] ✓ Fallback image ${idx} ADDED`);
            }
          }
        });
      }
    }
    
    console.log('[MingPao] ===== END IMAGE EXTRACTION =====');
    console.log('[MingPao] Final result: ' + images.length + ' images');
    
    return images;
  }

  /**
   * Extract tags from MingPao "相關字詞" section
   * Tags appear as: <p>相關字詞﹕<a class="content_tag">tag1</a> <a class="content_tag">tag2</a></p>
   */
  static extractTags($: cheerio.CheerioAPI): string[] {
    const tags: string[] = [];
    
    // Find the paragraph containing "相關字詞﹕"
    const relatedKeywordsPara = $('p').toArray().find(elem => {
      return $(elem).text().includes('相關字詞');
    });
    
    if (relatedKeywordsPara) {
      // Get all anchor tags with class 'content_tag' within this paragraph
      $(relatedKeywordsPara).find('a.content_tag').each((_, elem) => {
        const tagText = $(elem).text().trim();
        if (tagText && !tags.includes(tagText)) {
          tags.push(tagText);
        }
      });
    }
    
    return tags;
  }

  /**
   * Extract full article ID from MingPao's large numeric ID
   */
  static extractArticleId(url?: string): string {
    if (!url) return '';
    
    // MingPao article URL has numeric ID: /article/YYYYMMDD/sXXXXX/1765132930340/
    // The large ID at the end is the most reliable identifier
    const idMatch = url.match(/\/(\d{10,})\//);
    if (idMatch) {
      return idMatch[1];
    }
    
    // Fallback: use YYYYMMDD format
    const dateMatch = url.match(/\/(\d{8})\//);
    if (dateMatch) {
      return dateMatch[1];
    }
    
    return '';
  }

  /**
   * Extract title with proper formatting
   */
  static extractTitle($: cheerio.CheerioAPI): string {
    // MingPao article title is in <hgroup><h1>title</h1></hgroup>
    let title = $('hgroup h1').text().trim();
    
    if (!title) {
      // Fallback: try meta tag
      title = $('meta[property="og:title"]').attr('content') || '';
    }
    
    return title;
  }
}

/**
 * Get source-specific scraper strategy
 */
export function getSourceStrategy(sourceKey: string) {
  const strategies: Record<string, any> = {
    hk01: HK01Scraper,
    mingpao: MingPaoScraper,
  };
  
  return strategies[sourceKey] || null;
}
