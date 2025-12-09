// Test the Vercel deployment for MingPao bulk-save
const https = require('https');

const options = {
  hostname: 'the-curator-silk.vercel.app',
  path: '/api/automation/bulk-save/mingpao',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
};

console.log('Testing MingPao bulk-save on Vercel...');
console.log('URL:', `https://${options.hostname}${options.path}`);
console.log('Started at:', new Date().toISOString());
console.log('---');

const req = https.request(options, (res) => {
  console.log('Response Status:', res.statusCode);
  console.log('Response Headers:', JSON.stringify(res.headers, null, 2));
  console.log('---');
  
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response received at:', new Date().toISOString());
    console.log('Response length:', data.length, 'bytes');
    console.log('---');
    
    try {
      const json = JSON.parse(data);
      console.log('Parsed Response:');
      console.log(JSON.stringify(json, null, 2));
      
      if (json.success) {
        console.log('\n✅ SUCCESS');
        console.log('Articles saved:', json.saved);
        console.log('Duplicates:', json.duplicates);
        console.log('Total found:', json.totalFound);
        if (json.category) {
          console.log('Category:', json.category.name);
          console.log('URL:', json.category.url);
        }
      } else {
        console.log('\n❌ FAILED');
        console.log('Error:', json.error);
        if (json.details) {
          console.log('Details:', json.details);
        }
      }
    } catch (e) {
      console.log('Failed to parse JSON:');
      console.log(data);
    }
  });
});

req.on('error', (e) => {
  console.error('Request error:', e.message);
});

req.end();
