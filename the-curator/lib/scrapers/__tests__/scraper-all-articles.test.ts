import fs from 'fs';
import path from 'path';
import { ArticleScraper } from '../ArticleScraper.js';
import type { NewsSource } from '../../types/database.js';

/**
 * Test scraper against all 3 sample articles from HK01
 * Run with: npx tsx lib/scrapers/__tests__/scraper-all-articles.test.ts
 */

// Sample HK01 scraper configuration
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

// Expected data from Article1Data.md (SEVENTEEN concert)
const expectedArticle1 = {
  title: 'SEVENTEEN演唱會2026香港｜門票優先/公售攻略＋購票連結＋座位表',
  author: '多娜 薯條',
  category: '眾樂迷',
  publishedDate: '2025-12-03T11:31:54+08:00',
};

// Expected data from Article2Data.md (Apartment fire)
const expectedArticle2 = {
  title: '宏福苑大火｜聞九旬僱主泣訴不想住老人院　留醫印傭：好掛住公公',
  author: '戴慧豐 梁偉權',
  category: '突發',
  publishedDate: '2025-12-03T20:57:43+08:00',
};

// Expected data from Article3Data.md (Actor Chan Kam-hung)
const expectedArticle3 = {
  title: '前TVB小生近照精神爽利氣質儒雅　曾停工10年一度暴瘦面黃惹擔憂',
  author: '董欣琪',
  category: '即時娛樂',
  publishedDate: '2025-12-04T06:30:53+08:00',
};

interface TestCase {
  name: string;
  htmlFile: string;
  expected: typeof expectedArticle1;
}

const testCases: TestCase[] = [
  {
    name: 'Article 1 (SEVENTEEN Concert)',
    htmlFile: 'Article1Sourcecode.txt',
    expected: expectedArticle1,
  },
  {
    name: 'Article 2 (Apartment Fire)',
    htmlFile: 'Article2SourcCode.txt',
    expected: expectedArticle2,
  },
  {
    name: 'Article 3 (Actor Chan)',
    htmlFile: 'Article3SourceCode.txt',
    expected: expectedArticle3,
  },
];

async function testArticle(testCase: TestCase) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`🧪 Testing ${testCase.name}`);
  console.log('='.repeat(70));

  try {
    // Read HTML file
    const htmlPath = path.join(process.cwd(), '..', 'SampleDate', testCase.htmlFile);
    const html = fs.readFileSync(htmlPath, 'utf-8');

    console.log(`✓ Loaded HTML (${html.length} bytes)`);

    // Create scraper instance
    const scraper = new ArticleScraper(hk01Source);

    // Run scraper
    const startTime = Date.now();
    const result = await scraper.scrapeArticle(html);
    const duration = Date.now() - startTime;

    if (!result.success) {
      console.error('❌ Scraping failed:');
      console.error(result.error);
      return false;
    }

    console.log('✅ Scraping succeeded!');
    console.log(`⏱️  Execution time: ${duration}ms\n`);

    // Validation
    const checks = [
      {
        name: 'Title matches',
        pass: result.data?.title === testCase.expected.title,
        expected: testCase.expected.title,
        actual: result.data?.title,
      },
      {
        name: 'Author matches',
        pass: result.data?.author === testCase.expected.author,
        expected: testCase.expected.author,
        actual: result.data?.author,
      },
      {
        name: 'Category matches',
        pass: result.data?.category === testCase.expected.category,
        expected: testCase.expected.category,
        actual: result.data?.category,
      },
      {
        name: 'Published date matches',
        pass: result.data?.publishedDate === testCase.expected.publishedDate,
        expected: testCase.expected.publishedDate,
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

    console.log('📊 Validation Results:');
    checks.forEach((check) => {
      const icon = check.pass ? '✅' : '❌';
      console.log(`${icon} ${check.name}`);
      if (!check.pass) {
        console.log(`   Expected: ${check.expected}`);
        console.log(`   Actual:   ${check.actual}`);
      }
    });

    console.log(`\n📈 Score: ${passed}/${total} checks passed`);

    if (passed === total) {
      console.log('✅ Test passed!');
      return true;
    } else {
      console.log(`⚠️  ${total - passed} validation(s) failed`);
      return false;
    }
  } catch (error) {
    console.error('❌ Test error:', error instanceof Error ? error.message : error);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Running All Article Tests for HK01 Scraper');
  console.log('─'.repeat(70));

  const results: boolean[] = [];

  for (const testCase of testCases) {
    const passed = await testArticle(testCase);
    results.push(passed);
  }

  // Summary
  console.log(`\n${'='.repeat(70)}`);
  console.log('📊 Test Summary');
  console.log('='.repeat(70));

  const passedCount = results.filter((r) => r).length;
  const totalCount = results.length;

  testCases.forEach((testCase, index) => {
    const icon = results[index] ? '✅' : '❌';
    console.log(`${icon} ${testCase.name}`);
  });

  console.log(`\n📈 Overall: ${passedCount}/${totalCount} tests passed`);

  if (passedCount === totalCount) {
    console.log('\n🎉 All tests passed! Scraper is production-ready for HK01.');
  } else {
    console.log(
      `\n⚠️  ${totalCount - passedCount} test(s) failed. Review selectors and extraction logic.`
    );
  }
}

// Run all tests
runAllTests();
