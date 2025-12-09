import * as cheerio from 'cheerio';
import type { NewsSource, ScrapeResult } from '@/lib/types/database';
import { MingPaoScraper } from './sourceStrategies';

export class ArticleScraper {
  private source: NewsSource;

  constructor(source: NewsSource) {
    this.source = source;
  }

  /**
   * Scrape an article from raw HTML using configured selectors
   * Uses source-specific strategies when available
   */
  async scrapeArticle(html: string, url?: string): Promise<ScrapeResult> {
    const startTime = Date.now();

    try {
      const $ = cheerio.load(html);
      const sourceKey = this.source.source_key;

      // Extract title
      let title = '';
      if (sourceKey === 'mingpao') {
        title = MingPaoScraper.extractTitle($);
      } else if (sourceKey === 'hk01') {
        title = $('h1#articleTitle').first().text().trim();
      } else {
        const titleElement = $(this.source.article_page_config?.selectors?.title || 'h1').first();
        title = titleElement.text().trim();
      }

      if (!title) {
        throw new Error('Title not found');
      }

      // Extract article ID
      let articleId = '';
      if (sourceKey === 'mingpao') {
        articleId = MingPaoScraper.extractArticleId(url);
      } else if (sourceKey === 'hk01') {
        const articleIdAttr = $('[data-article-id]').first().attr('data-article-id');
        if (articleIdAttr) {
          articleId = articleIdAttr;
        } else if (url) {
          const match = url.match(/\/(\d+)\//);
          if (match) {
            articleId = match[1];
          }
        }
      }

      // Extract author
      let author = '';
      if (sourceKey === 'mingpao') {
        author = MingPaoScraper.extractAuthor($);
      } else if (sourceKey === 'hk01') {
        const authorElement = $('[data-testid="article-author"]').first();
        author = authorElement.text().replace(/撰文：|撰文:/, '').trim();
        if (!author) {
          const titleElement = $('h1#articleTitle').first();
          author = titleElement.attr('data-author') || '';
        }
      }

      // Extract category
      let category = '';
      let subCategory = '';
      if (sourceKey === 'mingpao') {
        const cats = MingPaoScraper.extractCategories($, url);
        category = cats.category;
        subCategory = cats.subCategory;
      } else if (sourceKey === 'hk01') {
        const breadcrumbItems = $('[data-testid="article-breadcrumb-zone"], [data-testid="article-breadcrumb-channel"]');
        if (breadcrumbItems.length >= 1) {
          category = breadcrumbItems.eq(0).text().trim();
        }
        if (breadcrumbItems.length >= 2) {
          subCategory = breadcrumbItems.eq(1).text().trim();
        }
      }

      // Extract publish date
      let publishedDate = '';
      if (sourceKey === 'mingpao') {
        const dateDiv = $('div[itemprop="datePublished"].date, div.date').first();
        if (dateDiv.length) {
          const dateText = dateDiv.text().trim();
          console.log('[MingPao] Found date text:', dateText);
          // Parse Chinese date format: 2025年12月8日星期一
          const yearMatch = dateText.match(/(\d{4})年/);
          const monthMatch = dateText.match(/(\d{1,2})月/);
          const dayMatch = dateText.match(/(\d{1,2})日/);
          if (yearMatch && monthMatch && dayMatch) {
            const year = yearMatch[1];
            const month = monthMatch[1].padStart(2, '0');
            const day = dayMatch[1].padStart(2, '0');
            publishedDate = `${year}-${month}-${day}`;
            console.log('[MingPao] Parsed date:', publishedDate);
          } else {
            console.log('[MingPao] Date parsing failed - no matches found');
          }
        } else {
          console.log('[MingPao] Date div not found');
        }
      } else {
        const publishSelectorChain = [
          this.source.article_page_config?.selectors?.publishDate,
          '[data-testid="article-publish-info"] time[datetime]',
          '[data-testid="article-publish-info"] time',
          'time[datetime]',
          'time',
        ].filter(Boolean);

        for (const selector of publishSelectorChain) {
          const candidate = $(selector as string).first();
          if (!candidate.length) {
            continue;
          }
          publishedDate = candidate.attr('datetime') || candidate.attr('data-utc') || candidate.text().trim();
          if (publishedDate) {
            break;
          }
        }
      }

      if (!publishedDate) {
        throw new Error('Publish date not found');
      }

      // Extract main image and all images
      let mainImageUrl = '';
      let mainImageCaption = '';
      let articleImageList: Array<{ url: string; caption?: string }> = [];

      if (sourceKey === 'mingpao') {
        // Get all images with captions
        const allImages = MingPaoScraper.extractAllImages($);
        
        // Use first carousel image as main photo
        if (allImages.length > 0) {
          mainImageUrl = allImages[0].url;
          mainImageCaption = allImages[0].caption;
          // ALL carousel images go to article gallery (including first one)
          articleImageList = allImages;
        } else {
          // Fallback to dedicated main image if no carousel images
          const mainImg = MingPaoScraper.extractMainImage($);
          mainImageUrl = mainImg.mainImageFull;
          mainImageCaption = mainImg.mainImageCaption;
        }
      } else if (sourceKey === 'hk01') {
        // HK01 extraction logic
        const topSection = $('[data-testid="article-top-section"]');
        if (topSection.length) {
          const topImg = topSection.find('img').first();
          mainImageUrl = topImg.attr('src') || topImg.attr('data-src') || '';
          const captionCandidate = topSection
            .find('[data-testid="article-top-section-caption"], figcaption, .img-caption')
            .text()
            .trim();
          mainImageCaption = captionCandidate;
        }

        // Get article images
        $('.article-grid__content-section .lazyload-wrapper').each((_, wrapper) => {
          const $wrapper = $(wrapper);
          const imgElem = $wrapper.find('img').first();
          const imgSrc = imgElem.attr('src') || imgElem.attr('data-src') || '';
          let caption = imgElem.attr('title') || imgElem.attr('alt') || '';
          if (!caption) {
            const captionSpan = $wrapper.parent().find('.img-caption').first();
            caption = captionSpan.text().trim();
          }
          if (imgSrc && imgSrc !== mainImageUrl) {
            articleImageList.push({ url: imgSrc, caption: caption || undefined });
          }
        });
      }

      // Extract content
      let contentBlocks: Array<{ type: 'heading' | 'paragraph'; text: string }> = [];
      let contentText = '';

      if (sourceKey === 'mingpao') {
        // MingPao content is in <article class="txt4"> (preferred) or <div#lower> (fallback)
        let article = $('article.txt4').first();
        if (!article.length) {
          article = $('div#lower').first();
        }
        
        if (article.length) {
          // Clone to avoid modifying original HTML
          const clonedArticle = article.clone();
          
          // Remove "相關字詞" paragraph
          clonedArticle.find('p').each((_, elem) => {
            if ($(elem).text().includes('相關字詞')) {
              $(elem).remove();
            }
          });
          
          // Remove "日報新聞-相關報道" section
          clonedArticle.find('div').each((_, elem) => {
            if ($(elem).attr('id') === 'pnsautornews') {
              $(elem).remove();
            }
          });
          
          // Now extract content from the cleaned version
          clonedArticle.find('h2, p').each((_, elem) => {
            const tagName = elem.tagName?.toLowerCase();
            const text = $(elem).text().trim();
            if (text && text.length > 0) {
              if (tagName === 'h2') {
                contentBlocks.push({ type: 'heading', text });
                contentText += `### ${text}\n\n`;
              } else if (tagName === 'p') {
                contentBlocks.push({ type: 'paragraph', text });
                contentText += text + '\n\n';
              }
            }
          });
        }
      } else {
        // HK01 content extraction
        const contentSelector = this.source.article_page_config?.selectors?.content || '#article-content-section';
        const contentElement = $(contentSelector as string);
        const articleContainer = $('#article-content-section');

        if (articleContainer.length) {
          articleContainer.find('h3, p').each((_, elem) => {
            const tagName = elem.tagName?.toLowerCase();
            const text = $(elem).text().trim();
            if (text) {
              if (tagName === 'h3') {
                contentBlocks.push({ type: 'heading', text });
                contentText += `### ${text}\n\n`;
              } else if (tagName === 'p') {
                contentBlocks.push({ type: 'paragraph', text });
                contentText += text + '\n\n';
              }
            }
          });
        } else {
          contentElement.find('p').each((_, elem) => {
            const text = $(elem).text().trim();
            if (text) {
              contentBlocks.push({ type: 'paragraph', text });
              contentText += text + '\n\n';
            }
          });
        }
      }

      if (contentBlocks.length === 0) {
        throw new Error('Content not found');
      }

      // Extract update date
      let updateDate = '';
      const publishInfo = $('[data-testid="article-publish-info"]');
      if (publishInfo.length) {
        const updateSpan = publishInfo.find('span').filter((_, el) => {
          return $(el).text().includes('更新：');
        });
        if (updateSpan.length) {
          const updateTime = updateSpan.find('time').attr('datetime');
          if (updateTime) {
            updateDate = updateTime;
          } else {
            const text = updateSpan.text();
            const match = text.match(/更新：(.+)/);
            if (match) {
              updateDate = match[1].trim();
            }
          }
        }
      }

      // Extract tags
      let tags: string[] = [];
      if (sourceKey === 'mingpao') {
        tags = MingPaoScraper.extractTags($);
      } else {
        // HK01 tags extraction
        $('[data-testid="article-tag"] a').each((_, el) => {
          const tagText = $(el).find('span').text().trim();
          if (tagText && !tags.includes(tagText)) {
            tags.push(tagText);
          }
        });
      }

      // Extract summary
      let summary = '';
      if (contentText) {
        summary = contentText.split('\n\n')[0].substring(0, 200);
      }

      // Extract all images
      const images: string[] = [];
      if (mainImageUrl) {
        images.push(mainImageUrl);
      }

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        data: {
          articleId: articleId || undefined,
          title,
          content: contentBlocks,
          author: author || undefined,
          category: category || undefined,
          subCategory: subCategory || undefined,
          publishedDate,
          updatedDate: updateDate || undefined,
          mainImageUrl: mainImageUrl || undefined,
          mainImageCaption: mainImageCaption || undefined,
          articleImageList: articleImageList.length > 0 ? articleImageList : undefined,
          tags: tags.length > 0 ? tags : undefined,
          excerpt: summary || undefined,
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
  updateSelectors(selectors: Partial<NonNullable<NewsSource['article_page_config']>['selectors']>) {
    if (!this.source.article_page_config) {
      this.source.article_page_config = {
        selectors: {
          title: 'h1',
          content: '#article-content-section',
          ...selectors,
        },
      };
    } else {
      this.source.article_page_config.selectors = {
        ...this.source.article_page_config.selectors,
        ...selectors,
      };
    }
  }
}
