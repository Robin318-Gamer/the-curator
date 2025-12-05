import * as cheerio from 'cheerio';
import type { NewsSource, ScrapedArticle, ScrapeResult } from '@/lib/types/database';

export class ArticleScraper {
  private source: NewsSource;

  constructor(source: NewsSource) {
    this.source = source;
  }

  /**
   * Scrape an article from raw HTML using configured selectors
   * Extracts: title, author, publish date, category, content, images, summary
   */
  async scrapeArticle(html: string, url?: string): Promise<ScrapeResult> {
    const startTime = Date.now();

    try {
      const $ = cheerio.load(html);
      const rawSelectors = this.source.article_page_config.selectors ?? {};
      const selectors = {
        title: rawSelectors.title ?? 'h1',
        author: rawSelectors.author ?? rawSelectors.author_selector ?? '[data-testid="article-author"]',
        publishDate:
          rawSelectors.publishDate ?? rawSelectors.published_date ?? 'time[datetime]',
        content: rawSelectors.content ?? '#article-content-section',
        category:
          rawSelectors.category ?? rawSelectors.breadcrumb_channel ?? '[data-testid="article-breadcrumb-channel"]',
        breadcrumbZone:
          rawSelectors.breadcrumb_zone ?? '[data-testid="article-breadcrumb-zone"]',
      };

      // Extract article ID from data-article-id attribute or URL
      let articleId = '';
      const articleIdAttr = $('[data-article-id]').first().attr('data-article-id');
      if (articleIdAttr) {
        articleId = articleIdAttr;
      } else if (url) {
        // Extract from URL: /zone/channel/articleId/...
        const match = url.match(/\/(\d+)\//);
        if (match) {
          articleId = match[1];
        }
      }

      // Extract title from h1#articleTitle
      const titleElement = $(selectors.title).first();
      const title = titleElement.text().trim();
      if (!title) {
        throw new Error(`Title not found with selector: ${selectors.title}`);
      }

      // Extract author from data-testid="article-author" or from h1 data-author attribute
      // Priority: article-author div (contains all authors) > h1 data-author (may only have first author)
      let author = '';
      if (selectors.author) {
        // Use the first occurrence of article-author which should have all authors
        const authorElement = $(selectors.author).first();
        const authorText = authorElement.text();
        // Clean up author text - remove "撰文：" prefix if present
        author = authorText.replace(/撰文：|撰文:/, '').trim();
      }
      
      // Fallback to h1 data-author if article-author didn't work
      if (!author && titleElement.attr('data-author')) {
        author = titleElement.attr('data-author') || '';
      }

      // Extract category and sub-category from breadcrumb
      // Breadcrumb structure: first link = category (zone), second link = sub-category (channel)
      let category = '';
      let subCategory = '';
      
      // Try to extract from breadcrumb links
      const breadcrumbItems = $(
        `${selectors.breadcrumbZone}, ${selectors.category}`
      );
      if (breadcrumbItems.length >= 1) {
        // First item is category
        category = breadcrumbItems.eq(0).text().trim();
      }
      if (breadcrumbItems.length >= 2) {
        // Second item is sub-category
        subCategory = breadcrumbItems.eq(1).text().trim();
      }
      
      // Fallback: use h1 data-category if breadcrumb not found (use only if different from extracted)
      if (!category && titleElement.attr('data-category')) {
        category = titleElement.attr('data-category') || '';
      }

      // Extract publish date from time datetime attribute
      let publishedDate = '';
      const publishSelectorChain = [
        selectors.publishDate,
        '[data-testid="article-publish-info"] time[datetime]',
        '[data-testid="article-publish-info"] time',
        'time[datetime]',
        'time',
      ].filter(Boolean);

      for (const selector of publishSelectorChain) {
        const candidate = $(selector).first();
        if (!candidate.length) {
          continue;
        }
        publishedDate = candidate.attr('datetime') || candidate.attr('data-utc') || candidate.text().trim();
        if (publishedDate) {
          break;
        }
      }

      if (!publishedDate) {
        throw new Error(`Publish date not found with selector: ${selectors.publishDate}`);
      }

      // Extract main image from article-top-section (featured image)
      let mainImage = '';
      let mainImageFull = ''; // Keep full URL with query params
      let mainImageCaption = '';
      const topSection = $('[data-testid="article-top-section"]');
      if (topSection.length) {
        const topImg = topSection.find('img').first();
        const imgSrc = topImg.attr('src') || topImg.attr('data-src') || '';
        mainImageFull = imgSrc;
        // Extract base URL without query parameters for comparison
        mainImage = imgSrc.split('?')[0];
        console.log('[Scraper] Main image found:', mainImage);

        const captionCandidate = topSection
          .find('[data-testid="article-top-section-caption"], figcaption, .img-caption, [data-testid="article-top-section"] span')
          .map((_, el) => $(el).text().trim())
          .get()
          .filter(Boolean);

        if (captionCandidate.length > 0) {
          mainImageCaption = captionCandidate[0];
        } else if (topImg.attr('alt')) {
          mainImageCaption = topImg.attr('alt') || '';
        } else if (topImg.attr('title')) {
          mainImageCaption = topImg.attr('title') || '';
        }
      } else {
        console.log('[Scraper] No article-top-section found');
      }
      
      // Extract all images in the article body (Article Image List)
      // Pattern: images inside article-grid__content-section .lazyload-wrapper, but EXCLUDE the main image
      let articleImageList: Array<{ url: string; caption?: string }> = [];
      console.log('[Scraper] Looking for article-grid__content-section .lazyload-wrapper img elements...');
      $('.article-grid__content-section .lazyload-wrapper').each((_, wrapper) => {
        const $wrapper = $(wrapper);
        const imgElem = $wrapper.find('img').first();
        const imgSrc = imgElem.attr('src') || imgElem.attr('data-src') || '';
        // Extract base URL without query parameters for comparison
        const baseSrc = imgSrc.split('?')[0];
        console.log('[Scraper] Found image:', baseSrc);
        
        // Get caption from title/alt attribute or from the caption span
        let caption = imgElem.attr('title') || imgElem.attr('alt') || '';
        if (!caption) {
          // Look for caption in the next sibling span with class img-caption
          const captionSpan = $wrapper.parent().find('.img-caption').first();
          caption = captionSpan.text().trim();
        }
        
        // Only include if it's not the main image and not already in list
        if (baseSrc && baseSrc !== mainImage && !articleImageList.some(img => img.url.split('?')[0] === baseSrc)) {
          articleImageList.push({
            url: imgSrc,
            caption: caption || undefined
          });
        }
      });
      console.log('[Scraper] Total article images found:', articleImageList.length);

      // Extract content - get all paragraphs and headings while preserving structure
      let content = '';
      if (selectors.content) {
        const contentElement = $(selectors.content);
        
        // Get the parent article container to maintain order of p and h3 elements
        const articleContainer = $('#article-content-section');
        if (articleContainer.length) {
          articleContainer.find('h3, p').each((_, elem) => {
            const tagName = elem.tagName?.toLowerCase();
            const text = $(elem).text().trim();
            if (text) {
              if (tagName === 'h3') {
                // Mark headings with a special prefix so we can style them later
                content += `### ${text}\n\n`;
              } else if (tagName === 'p') {
                content += text + '\n\n';
              }
            }
          });
        } else {
          // Fallback: Get all direct paragraphs
          contentElement.find('p').each((_, elem) => {
            const text = $(elem).text().trim();
            if (text) {
              content += text + '\n\n';
            }
          });
        }

        // Fallback: if no content found, get all text content
        if (!content) {
          content = contentElement.text().trim();
        }
      }

      if (!content) {
        throw new Error(`Content not found with selector: ${selectors.content}`);
      }

      // Extract all images from article (main image + article image list)
      const images: string[] = [];
      if (mainImageFull) {
        images.push(mainImageFull);
      }

      // Extract update date from article-publish-info
      let updateDate = '';
      const publishInfo = $('[data-testid="article-publish-info"]');
      if (publishInfo.length) {
        // Find the span containing "更新："
        const updateSpan = publishInfo.find('span').filter((_, el) => {
          return $(el).text().includes('更新：');
        });
        if (updateSpan.length) {
          const updateTime = updateSpan.find('time').attr('datetime');
          if (updateTime) {
            updateDate = updateTime;
          } else {
            // Fallback: extract text after "更新："
            const text = updateSpan.text();
            const match = text.match(/更新：(.+)/);
            if (match) {
              updateDate = match[1].trim();
            }
          }
        }
      }

      // Extract tags from article-tag
      let tags: string[] = [];
      $('[data-testid="article-tag"] a').each((_, el) => {
        const tagText = $(el).find('span').text().trim();
        if (tagText && !tags.includes(tagText)) {
          tags.push(tagText);
        }
      });

      // Extract summary (first paragraph or meta description)
      let summary = '';
      if (content) {
        summary = content.split('\n\n')[0].substring(0, 200);
      }

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        data: {
          articleId: articleId || undefined,
          title,
          content: content.trim(),
          author: author || undefined,
          category: category || undefined,
          subCategory: subCategory || undefined,
          publishedDate,
          updateDate: updateDate || undefined,
          mainImageUrl: mainImageFull || undefined,
          mainImageCaption: mainImageCaption || undefined,
          images: images.length > 0 ? images : undefined,
          articleImageList: articleImageList.length > 0 ? articleImageList : undefined,
          tags: tags.length > 0 ? tags : undefined,
          summary,
        },
        executionTime,
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime,
      };
    }
  }

  /**
   * Update scraper selectors
   */
  updateSelectors(selectors: Partial<NewsSource['article_page_config']['selectors']>) {
    this.source.article_page_config.selectors = {
      ...this.source.article_page_config.selectors,
      ...selectors,
    };
  }
}
