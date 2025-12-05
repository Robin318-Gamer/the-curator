# Build Troubleshooting Guide

**Issue**: Next.js dev server won't start - module resolution errors

## Current Status
✅ Code Complete:
- Header component with language toggle
- HeroSection (60/40 split layout)
- ArticleGrid (3-column responsive)
- Mock data with professional images

❌ Server Issue:
- Build error: "Cannot find module 'fill-range'"
- Server crashes on startup

## Attempted Fixes
1. Reinstalled dependencies (`npm install`)
2. Cleared node_modules and package-lock.json
3. Updated font configuration

## Next Steps for User

### Option 1: Manual Start (Recommended)
```powershell
cd "c:\Users\RHung\OneDrive - SIRVA\Documents\Personal project\Robin318-Gamer\POC1\the-curator"
npm run dev
```

Share the full terminal output if errors persist.

### Option 2: Fresh Install
If issues continue, try a complete fresh install:
```powershell
Remove-Item -Path ".next" -Recurse -Force
Remove-Item -Path "node_modules" -Recurse -Force  
Remove-Item -Path "package-lock.json" -Force
npm cache clean --force
npm install
npm run dev
```

## Expected Outcome
When working, you should see:
- `✓ Ready in Xms`
- `- Local: http://localhost:3000`
- No red error messages
