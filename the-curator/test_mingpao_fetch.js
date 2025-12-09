const url = 'https://news.mingpao.com/pns/%E5%9C%8B%E9%9A%9B/section/latest/s00014';
console.log('Testing URL:', url);

fetch(url, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  }
}).then(r => r.text()).then(html => {
  console.log('HTML length:', html.length);
  
  const matches = html.match(/\/article\//g);
  console.log('Found /article/ occurrences:', matches ? matches.length : 0);
  
  // Extract sample URLs
  const articleUrls = [];
  const regex = /href="([^"]+\/article\/[^"]+)"/g;
  let match;
  while ((match = regex.exec(html)) !== null && articleUrls.length < 5) {
    articleUrls.push(match[1]);
  }
  console.log('\nSample article URLs found:');
  articleUrls.forEach((u, i) => console.log(`  ${i+1}. ${u}`));
  
  // Test the extraction logic from bulk-save route
  const cheerio = require('cheerio');
  const $ = cheerio.load(html);
  
  const articles = new Map();
  let linksProcessed = 0;
  
  $('a').each((_, elem) => {
    linksProcessed++;
    let href = $(elem).attr('href');
    if (!href || !href.includes('/article/')) return;
    
    if (!href.startsWith('http')) {
      href = new URL(href, 'https://news.mingpao.com').toString();
    }
    
    try {
      const urlObj = new URL(href);
      const pathParts = urlObj.pathname.split('/');
      const articleIdxInPath = pathParts.indexOf('article');
      if (articleIdxInPath === -1) return;
      
      const dateStr = pathParts[articleIdxInPath + 1];
      const sectionCode = pathParts[articleIdxInPath + 2];
      const articleId = pathParts[articleIdxInPath + 3];
      
      if (articleId && !articles.has(articleId)) {
        articles.set(articleId, {
          articleId,
          url: href,
          dateStr,
          sectionCode
        });
      }
    } catch (e) {
      // Invalid URL
    }
  });
  
  console.log(`\nProcessed ${linksProcessed} <a> tags`);
  console.log(`Extracted ${articles.size} unique articles`);
  
  if (articles.size > 0) {
    console.log('\nFirst 3 extracted articles:');
    Array.from(articles.values()).slice(0, 3).forEach((a, i) => {
      console.log(`  ${i+1}. ID: ${a.articleId}, Date: ${a.dateStr}, URL: ${a.url.substring(0, 80)}...`);
    });
  }
  
}).catch(e => console.error('Error:', e.message));
