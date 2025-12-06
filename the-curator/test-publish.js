const http = require('http');

const data = JSON.stringify({
  title: 'AI Test - Safe to Delete',
  content: '<p>Test article from The Curator API</p>',
  excerpt: 'Test',
  status: 'draft',
  published_by: 'admin'
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/admin/wordpress/publish',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

console.log('Sending request to:', `http://${options.hostname}:${options.port}${options.path}`);
console.log('Body:', data);

const req = http.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  console.log('Headers:', JSON.stringify(res.headers, null, 2));
  
  let responseData = '';
  
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    console.log('\n=== RESPONSE ===');
    try {
      const json = JSON.parse(responseData);
      console.log(JSON.stringify(json, null, 2));
    } catch (e) {
      console.log('Raw response:', responseData);
    }
  });
});

req.on('error', (error) => {
  console.error('Request error:', error.message);
  console.error('Full error:', error);
});

req.write(data);
req.end();

setTimeout(() => {
  console.log('\nTimeout after 10 seconds');
  process.exit(1);
}, 10000);
