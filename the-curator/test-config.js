const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/admin/wordpress/config',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

console.log('Fetching WordPress config...');

const req = http.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  
  let responseData = '';
  
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    try {
      const json = JSON.parse(responseData);
      console.log('\n=== CONFIG ===');
      console.log('Site URL:', json.site_url);
      console.log('Username:', json.username);
      console.log('Auth Method:', json.auth_method);
      console.log('Has Password:', json.password ? 'YES (encrypted)' : 'NO');
      console.log('Has API Token:', json.api_token ? 'YES (encrypted)' : 'NO');
    } catch (e) {
      console.log('Raw response:', responseData);
    }
  });
});

req.on('error', (error) => {
  console.error('Request error:', error.message);
});

req.end();

setTimeout(() => {
  process.exit(0);
}, 5000);
