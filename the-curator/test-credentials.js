const https = require('https');

// Test credentials directly against WordPress.com XML-RPC
const username = 'bob3185e06de9976';
const password = 'WzPWji(^QT&OuNP5M2)WRSf^';
const siteUrl = 'https://newsfinder1.wordpress.com';

// Try wp.getUsersBlogs to test if credentials work
const xmlPayload = `<?xml version="1.0" encoding="UTF-8"?>
<methodCall>
  <methodName>wp.getUsersBlogs</methodName>
  <params>
    <param><value><string>${username}</string></value></param>
    <param><value><string>${password}</string></value></param>
  </params>
</methodCall>`;

console.log('Testing credentials against:', `${siteUrl}/xmlrpc.php`);
console.log('Username:', username);
console.log('Password:', password.substring(0, 4) + '...');
console.log('\n');

const url = new URL(`${siteUrl}/xmlrpc.php`);

const options = {
  hostname: url.hostname,
  port: 443,
  path: url.pathname,
  method: 'POST',
  headers: {
    'Content-Type': 'text/xml',
    'Content-Length': Buffer.byteLength(xmlPayload)
  }
};

const req = https.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  
  let responseData = '';
  
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    console.log('\n=== RESPONSE ===');
    console.log(responseData);
    
    // Parse the response
    if (responseData.includes('<fault>')) {
      const faultCodeMatch = responseData.match(/<name>faultCode<\/name>\s*<value><int>(\d+)<\/int><\/value>/);
      const faultStringMatch = responseData.match(/<name>faultString<\/name>\s*<value><string>(.*?)<\/string><\/value>/);
      
      console.log('\n=== ERROR ===');
      console.log('Fault Code:', faultCodeMatch ? faultCodeMatch[1] : 'Unknown');
      console.log('Fault String:', faultStringMatch ? faultStringMatch[1] : 'Unknown');
    } else if (responseData.includes('<array>')) {
      console.log('\n=== SUCCESS ===');
      console.log('Credentials are valid! You have access to one or more blogs.');
    }
  });
});

req.on('error', (error) => {
  console.error('Request error:', error.message);
});

req.write(xmlPayload);
req.end();

setTimeout(() => {
  process.exit(0);
}, 10000);
