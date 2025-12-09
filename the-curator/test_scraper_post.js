const http = require('http');

const postData = JSON.stringify({
  sourceKey: 'mingpao',
  customUrl: 'https://news.mingpao.com/pns/%E8%A6%81%E8%81%9E/section/latest/s00001'
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/scraper/article-list',
  method: 'POST',
  timeout: 180000,
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('Making POST request...');
console.log('Payload:', postData);
console.log('Timeout: 180 seconds');
console.log('Started at:', new Date().toISOString());

const req = http.request(options, (res) => {
  console.log('Response received at:', new Date().toISOString());
  console.log('Status code:', res.statusCode);
  console.log('Headers:', res.headers);
  
  let data = '';
  let lastLog = Date.now();
  
  res.on('data', (chunk) => {
    data += chunk;
    const now = Date.now();
    if (now - lastLog > 5000) { // Log every 5 seconds
      console.log(`[${new Date().toISOString()}] Received ${data.length} bytes total`);
      lastLog = now;
    }
  });
  
  res.on('end', () => {
    console.log('Response complete at:', new Date().toISOString());
    console.log('Total received:', data.length, 'bytes');
    try {
      const json = JSON.parse(data);
      console.log('\nParsed JSON:');
      console.log('- success:', json.success);
      if (json.data && json.data.articles) {
        console.log('- articles count:', json.data.articles.length);
        if (json.data.articles.length > 0) {
          console.log('\nFirst 3 articles:');
          json.data.articles.slice(0, 3).forEach((a, i) => {
            console.log(`  ${i+1}. ${a.category} - ${a.titleSlug}`);
          });
        }
      } else {
        console.log('\nResponse:', JSON.stringify(json, null, 2));
      }
    } catch (e) {
      console.log('Failed to parse JSON:', e.message);
      console.log('First 500 chars:', data.substring(0, 500));
    }
  });
});

req.on('error', (e) => {
  console.error('Request error:', e.message);
  console.error('Error code:', e.code);
  console.error('Full error:', e);
  process.exit(1);
});

req.on('timeout', () => {
  console.log('Request timed out');
  req.destroy();
});

console.log('Writing POST data...');
req.write(postData);
req.end();
console.log('Request sent');
