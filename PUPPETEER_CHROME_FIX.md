# Puppeteer Chrome Not Found - Fix Guide

**Error**: `Could not find Chrome (ver. 143.0.7499.40)`

**Cause**: Puppeteer is trying to launch Chrome but it's not installed on your server.

---

## ✅ Quick Fix (Choose One)

### Option 1: Install Chrome on Your Server (Recommended)

```bash
# On your deployment server (production)
npx puppeteer browsers install chrome

# Verify it worked
npx puppeteer browsers list
# Output should show: chrome (installed)
```

**Use this if**: You control the server or using a platform that allows system packages.

---

### Option 2: Use Browserless.io Service (Easiest for Serverless)

Best for Vercel, AWS Lambda, or other serverless platforms.

#### Step 1: Sign up for browserless.io
- Go to https://browserless.io/
- Create free account (includes 100 browser hours/month)
- Get your API token

#### Step 2: Set Environment Variable
```env
# .env.local (development)
# .env.production (production on Vercel)
BROWSERLESS_TOKEN=your_token_here
```

#### Step 3: Already Implemented! ✅
The code now checks for `BROWSERLESS_TOKEN` automatically.

**Use this if**: Using Vercel, AWS Lambda, or other managed hosting.

---

### Option 3: Use chrome-aws-lambda Package

For AWS Lambda specifically.

```bash
npm install chrome-aws-lambda
```

Then modify launch code:
```typescript
import chromium from 'chrome-aws-lambda';

const browser = await puppeteer.launch({
  args: chromium.args,
  executablePath: await chromium.executablePath,
  headless: chromium.headless,
});
```

**Use this if**: Deploying to AWS Lambda.

---

### Option 4: Skip Puppeteer (Basic Fallback)

If you only need to scrape non-JavaScript websites:

```typescript
// Use fetch instead of Puppeteer for simple HTML
const response = await fetch(url);
const html = await response.text();
```

**Use this if**: Your target sites don't use heavy JavaScript.

---

## 🔍 Verify Which Option to Use

Check your deployment environment:

| Environment | Recommended | Install Command |
|---|---|---|
| **Local/Docker** | Option 1 | `npx puppeteer browsers install chrome` |
| **Vercel** | Option 2 | Set `BROWSERLESS_TOKEN` env var |
| **AWS Lambda** | Option 3 | `npm install chrome-aws-lambda` |
| **Other Serverless** | Option 2 | Set `BROWSERLESS_TOKEN` env var |
| **VPS/EC2** | Option 1 | `npx puppeteer browsers install chrome` |

---

## 📝 Step-by-Step for Vercel

### 1. Sign Up for Browserless
- Visit https://browserless.io/
- Create account
- Copy API token

### 2. Add to Vercel Project
- Go to Vercel dashboard
- Select your project
- Settings → Environment Variables
- Add variable:
  - Name: `BROWSERLESS_TOKEN`
  - Value: `your_token_from_browserless`
  - Environments: Production, Preview, Development

### 3. Deploy
```bash
git add .
git commit -m "Add browserless.io support for Chrome"
git push
```

Vercel auto-deploys → Puppeteer now uses browserless.io → No more Chrome not found error!

---

## 📝 Step-by-Step for Local/Docker

### 1. Install Chrome
```bash
# macOS
brew install chromium

# Ubuntu/Debian
sudo apt-get update
sudo apt-get install chromium-browser

# Windows
choco install chromium
```

### 2. Install Puppeteer Chrome Binary
```bash
npx puppeteer browsers install chrome
```

### 3. Test Locally
```bash
npm run dev
# Try: http://localhost:3000/api/scraper/url
# POST with: { "url": "https://www.hk01.com/..." }
```

---

## 🐳 Docker Solution

If using Docker:

```dockerfile
FROM node:18-slim

# Install Chrome dependencies
RUN apt-get update && apt-get install -y \
    chromium-browser \
    && rm -rf /var/lib/apt/lists/*

# Install Puppeteer Chrome binary
RUN npx puppeteer browsers install chrome

WORKDIR /app
COPY . .
RUN npm install
RUN npm run build

CMD ["npm", "run", "start"]
```

---

## 🧪 Test Your Fix

### Test 1: Check if Chrome/Puppeteer Works
```bash
node -e "
const puppeteer = require('puppeteer');
puppeteer.launch().then(browser => {
  console.log('✅ Chrome launched successfully');
  browser.close();
}).catch(err => {
  console.log('❌ Error:', err.message);
});
"
```

### Test 2: Test Scraper Endpoint
```bash
curl -X POST http://localhost:3000/api/scraper/url \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.hk01.com/zone/news/8764088"}'
```

---

## 📊 Cost Comparison

| Option | Cost | Ease | Setup Time |
|--------|------|------|-----------|
| Option 1 (Install Chrome) | $0 | Medium | 5 min |
| Option 2 (Browserless) | $0-20/month | Easy | 2 min |
| Option 3 (chrome-aws-lambda) | $0 | Hard | 15 min |
| Option 4 (No Puppeteer) | $0 | Easy | 10 min |

**Recommendation**: Use Option 2 (Browserless) for Vercel - easiest and most reliable.

---

## 🔧 Troubleshooting

### Still getting "Chrome not found"?

**Check 1**: Is Puppeteer installed?
```bash
npm list puppeteer
```

**Check 2**: Is Chrome installed?
```bash
which chromium  # macOS/Linux
where chromium  # Windows
```

**Check 3**: Is BROWSERLESS_TOKEN set? (if using Option 2)
```bash
echo $BROWSERLESS_TOKEN  # macOS/Linux
echo %BROWSERLESS_TOKEN%  # Windows
```

**Check 4**: Try clearing Puppeteer cache
```bash
rm -rf ~/.cache/puppeteer
npx puppeteer browsers install chrome
```

---

## 📚 Code Changes

The scraper now:
1. ✅ Checks for `BROWSERLESS_TOKEN` env var
2. ✅ Uses browserless.io if token provided
3. ✅ Falls back to local Chrome launch
4. ✅ Provides helpful error messages if Chrome missing
5. ✅ Returns 503 status (service unavailable) when browser not ready

### Files Updated
- `app/api/scraper/url/route.ts` - Added browser launch error handling
- `app/api/scraper/article-list/route.ts` - Added browser launch error handling

### Implementation Example
```typescript
if (process.env.BROWSERLESS_TOKEN) {
  // Use remote browser service
  browser = await puppeteer.connect({
    browserWSEndpoint: `wss://chrome.browserless.io?token=${process.env.BROWSERLESS_TOKEN}`
  });
} else {
  // Use local Chrome
  browser = await puppeteer.launch(launchOptions);
}
```

---

## ✨ What Works Now

After applying one of these fixes:

✅ Scraping HK01 articles works
✅ Article list discovery works
✅ Lazy-loaded images load correctly
✅ JavaScript-rendered content captured
✅ Production deployment works

---

## 🚀 Next Steps

1. **Choose your option** (1, 2, 3, or 4)
2. **Apply the fix** (see steps above)
3. **Test locally** with `npm run dev`
4. **Deploy** to production
5. **Verify** by scraping an article

---

## 📞 Support

**Still having issues?**

Check the error response from `/api/scraper/url`:
```json
{
  "success": false,
  "error": "specific error message",
  "hint": "helpful instructions"
}
```

Common errors:
- `"Could not find Chrome"` → Install Chrome (Option 1) or set BROWSERLESS_TOKEN (Option 2)
- `"Failed to launch browser"` → Browser crashed, try again or use Option 2
- `"Network timeout"` → Site may have blocked your IP, try different user agent

---

**Last Updated**: December 6, 2025
**Status**: Ready to deploy
