const http = require('http');

const url = 'http://localhost:3000/api/scraper/article-list?source=mingpao&customUrl=https://news.mingpao.com/pns/%E8%A6%81%E8%81%9E/section/latest/s00001';

console.log('Testing:', url);
console.log('Sending request at', new Date().toISOString());

const request = http.get(url, (res) => {
  console.log('Got response status:', res.statusCode);
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
    console.log('Received', chunk.length, 'bytes, total:', data.length);
  });
  
  res.on('end', () => {
    console.log('Response complete at', new Date().toISOString());
    try {
      const json = JSON.parse(data);
      console.log('Articles found:', json.articles ? json.articles.length : 0);
      if (json.articles && json.articles.length > 0) {
        console.log('First article:', JSON.stringify(json.articles[0], null, 2));
      }
    } catch (e) {
      console.log('Failed to parse JSON:', e.message);
      console.log('Response:', data.substring(0, 500));
    }
  });
});

request.on('error', (e) => {
  console.log('Error:', e.message);
});

request.setTimeout(180000, () => {
  console.log('Request timeout');
  request.abort();
});

console.log('Request sent');
