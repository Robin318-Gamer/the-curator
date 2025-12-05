import type { NewsSource } from '../types/database';

export const hk01SourceConfig: NewsSource = {
  id: 'hk01',
  name: 'HK01',
  base_url: 'https://www.hk01.com',
  category: 'General',
  language: 'zh-TW',
  active: true,
  list_page_config: {
    listUrl: 'https://www.hk01.com/zone/1/latest',
    selectors: {
      articleLinks: 'a[data-testid="article-link"]',
      articleId: 'data-article-id',
    },
  },
  article_page_config: {
    selectors: {
      title: 'h1#articleTitle',
      content: 'article#article-content-section p',
      author: '[data-testid="article-author"]',
      publishDate: 'time[datetime]',
      category: '[data-testid="article-breadcrumb-channel"]',
      // Images are extracted using hardcoded selectors in ArticleScraper for better accuracy
    },
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};
