import fs from 'fs';
import path from 'path';
import { ArticleScraper } from '../ArticleScraper.js';
import type { NewsSource } from '../../types/database.js';

/**
 * Test scraper against sample Article 3 data (HK01)
 * Run with: npx ts-node lib/scrapers/__tests__/scraper.test.ts
 */

// Sample HK01 scraper configuration based on Article3Data.md and actual HTML
const hk01Source: NewsSource = {
  id: 'hk01-test',
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
      images: '.article-grid__top-media-section img[src]',
    },
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// Expected data from Article3Data.md
const expectedArticle3 = {
  title: '前TVB小生近照精神爽利氣質儒雅　曾停工10年一度暴瘦面黃惹擔憂',
  author: '董欣琪',
  category: '即時娛樂',
  publishedDate: '2025-12-04T06:30:53+08:00',
  mainImage: 'https://cdn.hk01.com/di/media/images/dw/20251203/1072965400162996224529637.jpeg/cp37RIzmFpYEBJWvtQu-NNigZRyNvJ_w-r-i7Pq_ouw?v=w1280r16_9',
  summary: '現年58歲的陳錦鴻曾為TVB當家小生',
};

async function testScraper() {
  console.log('🧪 Testing Article3 Scraper (HK01)...\n');

  try {
    // Read Article3SourceCode.txt (raw HTML) from parent project folder
    const htmlPath = path.join(process.cwd(), '..', 'SampleDate', 'Article3SourceCode.txt');
    const html = fs.readFileSync(htmlPath, 'utf-8');

    console.log(`✓ Loaded HTML (${html.length} bytes)\n`);

    // Create scraper instance
    const scraper = new ArticleScraper(hk01Source);

    // Run scraper
    const result = await scraper.scrapeArticle(html);

    if (!result.success) {
      console.error('❌ Scraping failed:');
      console.error(result.error);
      return;
    }

    console.log('✅ Scraping succeeded!\n');

    // Display results
    console.log('📋 Scraped Data:');
    console.log('─'.repeat(60));
    console.log(`Title:        ${result.data?.title}`);
    console.log(`Author:       ${result.data?.author || '(not found)'}`);
    console.log(`Category:     ${result.data?.category || '(not found)'}`);
    console.log(`Published:    ${result.data?.publishedDate}`);
    console.log(`Content:      ${result.data?.content?.substring(0, 80)}...`);
    console.log(`Images:       ${result.data?.images?.length || 0} found`);
    if (result.data?.images?.[0]) {
      console.log(`  └─ ${result.data.images[0].substring(0, 80)}...`);
    }
    console.log(`Execution:    ${result.executionTime}ms`);
    console.log('─'.repeat(60));

    // Validation
    console.log('\n✔️  Validation Results:');
    console.log('─'.repeat(60));

    const checks = [
      {
        name: 'Title matches',
        pass: result.data?.title === expectedArticle3.title,
        expected: expectedArticle3.title,
        actual: result.data?.title,
      },
      {
        name: 'Author matches',
        pass: result.data?.author === expectedArticle3.author,
        expected: expectedArticle3.author,
        actual: result.data?.author,
      },
      {
        name: 'Category matches',
        pass: result.data?.category === expectedArticle3.category,
        expected: expectedArticle3.category,
        actual: result.data?.category,
      },
      {
        name: 'Published date found',
        pass: !!result.data?.publishedDate,
        expected: 'datetime value',
        actual: result.data?.publishedDate,
      },
      {
        name: 'Content extracted',
        pass: (result.data?.content?.length || 0) > 100,
        expected: '> 100 chars',
        actual: `${result.data?.content?.length || 0} chars`,
      },
      {
        name: 'Main image found',
        pass: (result.data?.images?.length || 0) > 0,
        expected: 'at least 1 image',
        actual: `${result.data?.images?.length || 0} images`,
      },
    ];

    const passed = checks.filter((c) => c.pass).length;
    const total = checks.length;

    checks.forEach((check) => {
      const icon = check.pass ? '✅' : '❌';
      console.log(`${icon} ${check.name}`);
      if (!check.pass) {
        console.log(`   Expected: ${check.expected}`);
        console.log(`   Actual:   ${check.actual}`);
      }
    });

    console.log('─'.repeat(60));
    console.log(`\n${passed}/${total} checks passed`);

    if (passed === total) {
      console.log('\n🎉 All tests passed! Scraper is working correctly.');
    } else {
      console.log(`\n⚠️  ${total - passed} test(s) failed. Review selectors.`);
    }
  } catch (error) {
    console.error('❌ Test error:', error instanceof Error ? error.message : error);
  }
}

// Run test
testScraper();
