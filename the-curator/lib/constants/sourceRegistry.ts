/**
 * Source Registry - Central configuration for all news sources
 * 
 * This registry allows easy addition of new news sources without modifying core logic.
 * Each source defines its own selectors, base URL, and scraping configuration.
 */

import type { NewsSource } from '../types/database';

// HK01 Configuration
export const hk01Config: NewsSource = {
  id: 'hk01',
  source_key: 'hk01',
  name: 'HK01',
  base_url: 'https://www.hk01.com',
  category: 'General',
  language: 'zh-TW',
  is_active: true,
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
      category: '[data-testid="article-breadcrumb-zone"], [data-testid="article-breadcrumb-channel"]',
    },
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// MingPao Configuration
export const mingPaoConfig: NewsSource = {
  id: 'mingpao',
  source_key: 'mingpao',
  name: 'Ming Pao 明報',
  base_url: 'https://www.mingpao.com',
  category: 'General',
  language: 'zh-TW',
  is_active: true,
  list_page_config: {
    listUrl: 'https://www.mingpao.com/ins/',
    selectors: {
      articleLinks: 'a.link-content',
      articleId: 'href', // Extract from URL
    },
  },
  article_page_config: {
    selectors: {
      title: 'hgroup h1, h1.main-title',
      content: 'article.txt4 p, div#lower p',
      author: 'h2',
      publishDate: 'div[itemprop="datePublished"].date, div.date',
      category: 'div.colleft a h3',
    },
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

/**
 * Source Registry - maps source keys to their configurations
 * Add new sources here as they are implemented
 */
export const SOURCE_REGISTRY: Record<string, NewsSource> = {
  hk01: hk01Config,
  mingpao: mingPaoConfig,
};

/**
 * Get available source keys
 */
export function getAvailableSources(): string[] {
  return Object.keys(SOURCE_REGISTRY);
}

/**
 * Get source configuration by key
 */
export function getSourceConfig(sourceKey: string): NewsSource | null {
  return SOURCE_REGISTRY[sourceKey] || null;
}

/**
 * Get all source configurations
 */
export function getAllSourceConfigs(): NewsSource[] {
  return Object.values(SOURCE_REGISTRY);
}

/**
 * Detect source from URL
 */
export function detectSourceFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace('www.', '');
    
    // Map hostnames to source keys - check for domain patterns
    if (hostname.includes('hk01.com')) return 'hk01';
    if (hostname.includes('mingpao.com')) return 'mingpao';
    
    return null;
  } catch {
    return null;
  }
}

/**
 * Check if source is supported
 */
export function isSourceSupported(sourceKey: string): boolean {
  return sourceKey in SOURCE_REGISTRY;
}
