# The Curator Project Plan

> **Status**: Phase 2 Complete ✅, Phase 3 Ready to Start
> **Methodology**: TDD, Mock-First, Spec Driven
> **Last Updated**: 2025-12-01

## Phase 1: Foundation & Assets ✅
- [x] **Generate Application Logo** (Saved to Documentation/assets/logo.png)
- [x] **Version Control**: Initialize Git & Commit Documentation
- [x] **Project Initialization**: Setup Next.js 15 + Tailwind + Jest

## Phase 2: Mock Prototype (The "Shell") ✅
*Goal: Validate UX/UI and Flows without backend complexity.*
- [x] **Mock Data Layer**
    - [x] Create `mock/articles.json` (Varied languages, categories)
    - [x] Create `mock/users.json`
    - [x] Create `mock/images.json` (Article featured images)
- [x] **Public Website (Mock)**
    - [x] Implement "Magazine" Layout using Mock Data
    - [x] **Test**: Verify Multi-language Toggle (UI Labels) ✅ Verified
    - [x] **Test**: Verify Responsive Design (Mobile/Desktop) ✅ Verified on Pixel 7
- [x] **Admin Portal (Mock)**
    - [x] Implement Admin Login Page with Auth
    - [x] Implement Protected Admin Routes (Middleware)
    - [x] **Test**: Verify Login Flow ✅ Security verified - admin requires authentication

## Phase 3: Functional Implementation (The "Core") ✅
*Goal: Replace Mocks with Real Logic (TDD & OO).*
- [x] **Database Integration** ← COMPLETED
    - [x] Decision: Remote Supabase PostgreSQL
    - [x] Setup Supabase Project & Database
    - [x] Create Tables per Schema (03_Database_Schema.md)
    - [x] Implement Repository Pattern (ArticleRepository)
    - [x] Create API Routes (/api/articles, /api/categories)
    - [x] Connect UI to Real API Endpoints
    - [x] Automatic Fallback to Mock Data
- [x] **Scraper Engine (TDD)** ← PARTIALLY COMPLETED
    - [x] **HK01 Article Scraper** ✅ Complete
        - [x] Implement ArticleScraper class with Cheerio & Puppeteer
        - [x] Extract metadata: title, author, category, tags, dates
        - [x] Extract images (main + article list with captions)
        - [x] Preserve article structure (h3 headings + paragraphs)
        - [x] Admin test page at `/admin/scraper-url-test`
        - [x] Puppeteer integration for lazy-loaded images
        - [x] Image filtering (article-grid__content-section only)
        - [x] Git commit: c15ce76
    - [ ] Implement `BaseScraper` Abstract Class (Pending)
    - [ ] Implement Source Scrapers (Oriental Daily, Ming Pao)
    - [ ] Article Listing from HK01 (Next Phase)
    - [ ] Unit Tests for All Scrapers
    - [ ] Error Handling & Retry Logic

## Phase 4: Deployment & Export
- [ ] **WordPress Integration**
    - [ ] Implement Export Logic
- [ ] **Final Verification**
    - [ ] End-to-End Testing
    - [ ] Deployment to Vercel
