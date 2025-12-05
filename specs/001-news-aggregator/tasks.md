# News Aggregator - Phase 1: Database & Admin Import (PRIORITY)

**Focus**: Get manual article import working end-to-end  
**Target Completion**: ~2-3 days  
**Success Criteria**: Admin scrapes HK01 article → clicks "Save to Database" → article stored with images → no duplicates

---

## Phase 1A: Database Setup

- [ ] T001 Run database schema.sql in Supabase
  - File: `database/schema.sql`
  - Action: Copy entire SQL file → Supabase SQL Editor → Execute
  - Verify: Tables created: `news_sources`, `articles`, `article_images`
  - Verify: HK01 source auto-inserted with config

- [ ] T002 Create/update TypeScript types for articles
  - File: `lib/types/database.ts`
  - Add interfaces: `Article`, `ArticleImage`, `NewsSource`
  - Fields: Match database schema columns (title, content JSONB, images array, etc.)

- [ ] T003 Create Supabase utilities for article operations
  - File: `lib/supabase/articlesClient.ts`
  - Functions:
    - `checkArticleExists(sourceId: string, articleId: string): Promise<boolean>`
    - `getArticleBySourceAndId(sourceId: string, articleId: string)`
    - `createArticle(article: Article): Promise<{ id: UUID, error? }>`
    - `createArticleImages(articleId: UUID, images: ArticleImage[])`
  - Use Supabase client (already configured at `lib/supabaseClient.ts`)

---

## Phase 1B: Import API Endpoint

- [ ] T004 Create `/api/articles/import` endpoint
  - File: `app/api/articles/import/route.ts`
  - Method: POST
  - Input JSON:
    ```json
    {
      "sourceKey": "hk01",
      "sourceArticleId": "60300150",
      "title": "...",
      "author": "...",
      "category": "娛樂",
      "subCategory": "即時娛樂",
      "tags": "tag1,tag2,tag3",
      "publishedDate": "2025-12-04T10:30:00Z",
      "updatedDate": "2025-12-04T14:45:00Z",
      "content": [...],
      "excerpt": "First 200 chars...",
      "mainImageUrl": "https://...",
      "mainImageCaption": "...",
      "sourceUrl": "https://www.hk01.com/...",
      "images": [{"url": "...", "caption": "..."}]
    }
    ```
  - Logic:
    1. Get source ID from `news_sources` table by `source_key`
    2. Check if article exists using `checkArticleExists()`
    3. If exists: return 409 Conflict with article ID
    4. If new: insert article + images using `createArticle()` + `createArticleImages()`
    5. Return: `{ success: true, data: { id, articleId, alreadyExists: false } }`
  - Error handling: Wrap in try-catch, return 500 on DB error

- [ ] T005 Add "Save to Database" button to scraper-url-test page
  - File: `app/admin/scraper-url-test/page.tsx`
  - After successful scrape (result shows), add button: "💾 Save to Database"
  - On click:
    1. Show loading state
    2. Call `/api/articles/import` with scraped data
    3. If success: show "✅ Article saved! DB ID: [id]"
    4. If 409 Conflict: show "⚠️ Article already imported. ID: [id]"
    5. If error: show error message
  - Add option to edit before saving (optional enhancement)

---

## Phase 1C: Deduplication & Status Check

- [ ] T006 Add duplicate check API endpoint
  - File: `app/api/articles/check/route.ts`
  - Method: POST
  - Input: `{ sourceKey: string, sourceArticleId: string }`
  - Output: `{ exists: boolean, articleId?: UUID }`
  - Use: To show "Already imported" status before saving

- [ ] T007 Update article-list-scraper page to show import status
  - File: `app/admin/article-list-scraper/page.tsx`
  - After fetching articles list, call `/api/articles/check` for each
  - Show status column: "New" badge or ✅ "Imported" with link
  - Scrape button: Opens scraper-url-test in new tab (already implemented)

---

## Phase 1D: Verification & Testing

- [ ] T008 Manual end-to-end test
  1. Go to `/admin/scraper-url-test`
  2. Paste HK01 article URL
  3. Click "Run Scraper" → verify metadata loads
  4. Click "Save to Database"
  5. Check Supabase: 
     - Articles table has 1 row
     - article_images table has N rows (all images)
     - Deduplication: Try saving same article → should show "already imported"

- [ ] T009 Verify database structure in Supabase
  - Open Supabase Dashboard
  - Check tables:
    - `news_sources`: 1 row (HK01)
    - `articles`: Has columns (id, source_id, source_article_id, title, content, excerpt, published_date, etc.)
    - `article_images`: Has columns (article_id, image_url, caption, display_order, is_main_image)
  - Check indexes: idx_articles_source_article_id exists
  - Verify unique constraint: `UNIQUE(source_id, source_article_id)`

---

## Success Criteria (MVP Complete)

✅ Database schema deployed to Supabase  
✅ Admin can scrape HK01 article  
✅ Admin clicks "Save to Database"  
✅ Article + images stored in database  
✅ No duplicate articles allowed (409 error if trying to re-import)  
✅ Status shows "Already imported" for existing articles  

---

## Next Steps After Phase 1

Once Phase 1 is working:

### Phase 2A: End User Homepage (2-3 days)
- [ ] API endpoint: GET `/api/articles/list` (with filters, pagination)
- [ ] API endpoint: GET `/api/articles/categories`
- [ ] Homepage component with search, category filters, infinite scroll
- [ ] Article detail page

### Phase 2B: Admin Dashboard (2-3 days)
- [ ] Admin article management page (list, edit, delete)
- [ ] Batch import UI
- [ ] Extraction history/logs

### Phase 3: Automation (Future)
- [ ] Vercel Cron Job to run scraper daily
- [ ] Batch article import
- [ ] Email notifications

---

## File Changes Summary

**New Files:**
- `database/schema.sql` - Database schema ✅ (already created)
- `database/README.md` - Database docs ✅ (already created)
- `lib/types/database.ts` - Article types (update/create)
- `lib/supabase/articlesClient.ts` - Supabase utilities (create)
- `app/api/articles/import/route.ts` - Import endpoint (create)
- `app/api/articles/check/route.ts` - Duplicate check (create)

**Modified Files:**
- `app/admin/scraper-url-test/page.tsx` - Add save button
- `app/admin/article-list-scraper/page.tsx` - Add import status

**Total effort**: ~8-12 hours

---

## Immediate Action Items

1. **TODAY**: Run `database/schema.sql` in Supabase
   - Verify 3 tables created
   - Verify HK01 source inserted

2. **TODAY**: Create `lib/types/database.ts`
   - Define TypeScript interfaces

3. **TOMORROW**: Implement T003 + T004
   - Supabase client functions
   - Import API endpoint

4. **TOMORROW**: Implement T005
   - Update scraper-url-test page

5. **DAY 3**: Test end-to-end + iterate

Ready to start?  

---

## Overview

Tasks are organized in phases and by user story to enable independent implementation and parallel execution. Each task follows the strict checklist format: `- [ ] [TaskID] [P?] [Story?] Description with file path`

**Task Symbols**:
- `[P]` = Parallelizable (can run independently; different files or no dependency on incomplete tasks)
- `[USX]` = Belongs to User Story X (US1, US2, US3, US4, US5)
- No label = Setup or foundational task

**Execution Strategy**:
1. Complete Phase 1 (Setup) sequentially
2. Complete Phase 2 (Foundational) sequentially
3. Then execute Phase 3+ (User Stories) in priority order; tasks marked `[P]` within a story can run in parallel
4. Each story phase is independently testable and delivers value

---

## Phase 1: Setup & Project Initialization ✅

- [x] T001 Create Next.js project with TypeScript and Tailwind CSS configuration in `the-curator/`
- [x] T002 Configure ESLint, Prettier, and TypeScript strict mode in `the-curator/`
- [x] T003 Install required dependencies (next, react, tailwindcss, @supabase/supabase-js, cheerio, openai, pino, etc.) in `the-curator/package.json`
- [x] T004 Create `.env.local` and `.env.example` with all required environment variables in `the-curator/`
- [x] T005 Create project directory structure and core folders per plan in `the-curator/`
- [x] T006 Create GitHub repository and push initial commit to `001-news-aggregator` branch
- [x] T007 Set up Supabase project and configure connection in `lib/db/supabase.ts`
- [x] T008 Configure i18n for English/Traditional Chinese support in `lib/config/i18n.ts`
- [x] T009 Add root layout with i18n wrapper and language switcher in `app/layout.tsx`

---

## Phase 2: Foundational Infrastructure & Database

### Database Schema & Migrations ✅

- [x] T010 [P] Create Supabase migration script for `news_sources` table with selectors/config columns in `lib/db/migrations.sql`
- [x] T011 [P] Create Supabase migration script for `news_articles` table with all required fields (title, content, summary, archived flag, etc.) in `lib/db/migrations.sql`
- [x] T012 [P] Create Supabase migration script for `news_images` table with article foreign key in `lib/db/migrations.sql`
- [x] T013 [P] Create Supabase migration script for `extraction_logs` table for activity tracking in `lib/db/migrations.sql`
- [x] T014 [P] Create Supabase migration script for `admin_users` table with Supabase Auth integration in `lib/db/migrations.sql`
- [ ] T015 Run all migration scripts and verify schema in Supabase console
- [x] T016 Create database indexes on (source_id, source_article_id), archived, published_date, category in `lib/db/migrations.sql`

### Newslist Tracking & Database Safety ✅

- [x] T181 [P] Sync HK01 scraping + import flows with the `newslist` table to capture URLs and lifecycle status (`app/api/scraper/article-list/route.ts`, `lib/supabase/articlesClient.ts`)
- [x] T182 [P] Build secured admin API/page for viewing the newslist queue (`app/api/admin/newslist/route.ts`, `app/admin/database/page.tsx`)
- [x] T183 Create service-role protected API + UI trigger to run `reset_curator_schema()` and document new env vars (`app/api/admin/reset-database/route.ts`, `.env.local.example`)

### Data Access Layer

- [ ] T017 [P] Create TypeScript types for Article, NewsSource, Image, User, ExtractionLog in `src/types/`
- [ ] T018 [P] Create API response/error types in `src/types/api.ts`
- [ ] T019 [P] Create Supabase repository functions for CRUD operations in `src/lib/db/repositories.ts`
- [ ] T020 [P] Create ArticleRepository class with methods: findAll(), findById(), findArchived(), create(), update(), delete() in `src/lib/db/repositories.ts`
- [ ] T021 [P] Create SourceRepository class with methods: findAll(), findActive(), create(), update() in `src/lib/db/repositories.ts`
- [ ] T022 [P] Create ExtractionLogRepository class with methods: create(), findByRunId(), findRecent() in `src/lib/db/repositories.ts`

### Utilities & Helpers

- [ ] T023 [P] Create custom error classes (ValidationError, AuthError, ScraperError, ExternalServiceError) in `src/lib/utils/errors.ts`
- [ ] T024 [P] Set up Pino logger with structured JSON output in `src/lib/utils/logger.ts`
- [ ] T025 [P] Create HTML sanitization utility (remove script/style/iframe/event handlers) in `src/lib/scrapers/htmlSanitizer.ts`
- [ ] T026 [P] Create URL helper utilities (convert relative to absolute, validate, extract domain) in `src/lib/utils/urlHelpers.ts`
- [ ] T027 [P] Create input validation utilities using Zod in `src/lib/utils/validation.ts`
- [ ] T028 [P] Create environment variable validation and loader in `src/config/env.ts`

### Authentication & Middleware

- [ ] T029 Create Supabase Auth configuration and login helper in `src/lib/auth/supabaseAuth.ts`
- [ ] T030 Create JWT verification middleware for admin routes in `src/lib/auth/middleware.ts`
- [ ] T031 Create Next.js middleware for auth checks and i18n routing in `src/middleware.ts`
- [ ] T032 Implement protected API routes pattern (wrapper for verifying JWT on admin endpoints)

### Sample Data & Fixtures

- [ ] T033 Create mock article data (5–10 sample articles) in `public/mock-data/articles.json`
- [ ] T034 Insert mock articles into Supabase for local development in `scripts/seed-dev-data.ts`

---

## Phase 3: User Story 1 – Public News Reading (Priority P1)

**Story Goal**: Public users can browse and read news articles in a magazine-style layout with multi-language UI support.  
**Independent Test Criteria**: User navigates homepage → browses articles by category → reads full article → switches language. All interactions complete without errors and within SLA (< 2s page load).

### Public API Endpoints

- [ ] T035 [US1] [P] Implement GET `/api/articles` endpoint with pagination, filtering (category, search), sorting in `src/app/api/articles/route.ts`
- [ ] T036 [US1] [P] Implement GET `/api/articles/[id]` endpoint returning full article with images in `src/app/api/articles/[id]/route.ts`
- [ ] T037 [US1] [P] Implement GET `/api/categories` endpoint returning distinct categories from articles in `src/app/api/categories/route.ts`
- [ ] T038 [US1] [P] Implement GET `/api/sources` endpoint returning list of news sources in `src/app/api/sources/route.ts`
- [ ] T039 [US1] [P] Implement GET `/api/health` health check endpoint in `src/app/api/health/route.ts`
- [ ] T040 [US1] Add response type definitions for all public endpoints in `src/types/api.ts`

### Public Components

- [ ] T041 [US1] [P] Create ArticleCard component displaying image, title, excerpt, source, date, category in `src/components/public/ArticleCard.tsx`
- [ ] T042 [US1] [P] Create ArticleGrid component with CSS Grid layout (responsive: 1 col mobile, 2 col tablet, 3 col desktop) in `src/components/public/ArticleGrid.tsx`
- [ ] T043 [US1] [P] Create CategoryFilter component with multi-select or tabs UI in `src/components/public/CategoryFilter.tsx`
- [ ] T044 [US1] [P] Create LanguageSwitcher component with EN/ZH-TW buttons in `src/components/public/LanguageSwitcher.tsx`
- [ ] T045 [US1] [P] Create Navigation component with logo, category links, language switcher in `src/components/public/Navigation.tsx`
- [ ] T046 [US1] [P] Create ArticleDetail component displaying full content, images, metadata (author, source, date) in `src/components/public/ArticleDetail.tsx`
- [ ] T047 [US1] [P] Create shared Button, Card, Pagination components in `src/components/shared/`

### Public Pages

- [ ] T048 [US1] Implement public homepage (`/`) with hero section, featured articles, category navigation in `src/app/page.tsx`
- [x] T049 [US1] Implement articles browse page (`/articles`) with grid, category filter, search, pagination in `src/app/articles/page.tsx`
- [x] T050 [US1] Implement article detail page (`/articles/[id]`) with full content, images, source link, navigation in `src/app/articles/[id]/page.tsx`

### Responsive Design & i18n

- [ ] T051 [US1] [P] Add Tailwind breakpoints and responsive classes to all public components (mobile-first)
- [ ] T052 [US1] [P] Add i18n translations for UI labels (navigation, buttons, placeholders) in `public/locales/en/common.json` and `public/locales/zh-TW/common.json`
- [ ] T053 [US1] Verify language switcher functionality: UI labels change on toggle; article content remains original language

### Testing

- [ ] T054 [US1] Write unit tests for API endpoints (mock database, verify response format, pagination) in `src/app/api/__tests__/`
- [ ] T055 [US1] Write integration tests for component rendering (ArticleGrid, ArticleDetail) in `src/components/public/__tests__/`
- [ ] T056 [US1] Write E2E tests for public user flow (homepage → browse → read → filter → language switch) using Playwright or Cypress

### Story 1 Acceptance

- [ ] T057 [US1] Verify page load time < 2s on desktop (Lighthouse/Chrome DevTools)
- [ ] T058 [US1] Verify responsive layout on mobile (320px), tablet (768px), desktop (1024px+) using browser dev tools
- [ ] T059 [US1] Verify all articles load without console errors; API responses valid
- [ ] T060 [US1] Verify category filter works correctly; language switcher changes UI labels only
- [ ] T061 [US1] Deploy Story 1 to staging environment and conduct UAT with stakeholder

---

## Phase 4: User Story 2 – Automated News Extraction (Priority P2)

**Story Goal**: System automatically extracts news articles from Oriental Daily, Ming Pao, HK01 at scheduled intervals.  
**Independent Test Criteria**: Trigger extraction → verify articles appear in database with correct format → confirm logs recorded. No manual intervention required.

### Scraper Test Infrastructure (Admin Tool - Reuses Existing App)

- [ ] T062 [US2] Create scraper test page route at `/admin/scraper-test` in `the-curator/app/admin/scraper-test/page.tsx` for admin-only scraper validation (leverages existing admin auth)
- [ ] T063 [US2] Load sample HTML files from `SampleDate/` folder into test page (Article1SourceCode.txt, Article2SourceCode.txt, Article3SourceCode.txt) using Next.js API or file system
- [ ] T064 [US2] [P] Create test UI with tabs for each source (HK01, Ming Pao, Oriental Daily) displaying raw HTML and parsed output side-by-side in `the-curator/app/admin/scraper-test/page.tsx`
- [ ] T065 [US2] [P] Add "Run Scraper" button per source that executes parsing logic and displays extracted fields (title, author, date, category, content, images) in `the-curator/app/admin/scraper-test/page.tsx`
- [ ] T066 [US2] [P] Add validation checklist comparing extracted data vs. expected data from `SampleDate/Article*Data.md` files with pass/fail indicators
- [ ] T067 [US2] Add export button to save parsed article data as JSON for manual database insertion testing
- [ ] T067b [US2] Add navigation link to scraper test page in existing admin sidebar/menu in `the-curator/components/admin/` layout

### Scraper Infrastructure

- [ ] T068 [US2] [P] Create base scraper class/interface in `the-curator/lib/scrapers/baseScraper.ts` with parse(), validate(), saveArticles() methods
- [ ] T069 [US2] [P] Create scraper configuration for Oriental Daily (selectors, URLs, retry logic) in `the-curator/lib/constants/sources.ts` using sample data from Article3Data.md
- [ ] T070 [US2] [P] Create scraper configuration for Ming Pao in `the-curator/lib/constants/sources.ts` using sample data from Article2Data.md
- [ ] T071 [US2] [P] Create scraper configuration for HK01 in `the-curator/lib/constants/sources.ts` using sample data from Article1Data.md

### Source-Specific Scrapers

- [ ] T072 [US2] [P] Implement HK01 scraper extracting title, content, author, images, publish date, category, subcategory in `the-curator/lib/scrapers/hk01.ts` validated against Article1Data.md
- [ ] T073 [US2] [P] Test HK01 scraper on `/admin/scraper-test` page; verify all fields match Article1Data.md; fix selectors if needed
- [ ] T074 [US2] [P] Implement Ming Pao scraper with same extraction logic in `the-curator/lib/scrapers/mingPao.ts` validated against Article2Data.md
- [ ] T075 [US2] [P] Test Ming Pao scraper on `/admin/scraper-test` page; verify all fields match Article2Data.md; fix selectors if needed
- [ ] T076 [US2] [P] Implement Oriental Daily scraper in `the-curator/lib/scrapers/orientalDaily.ts` validated against Article3Data.md
- [ ] T077 [US2] [P] Test Oriental Daily scraper on `/admin/scraper-test` page; verify all fields match Article3Data.md; fix selectors if needed

### Extraction Orchestration

- [ ] T078 [US2] Create ScrapingService class orchestrating all scrapers, duplicate detection, error handling in `the-curator/lib/scrapers/scrapingService.ts`
- [ ] T079 [US2] Implement duplicate detection logic (source + source_article_id) in `the-curator/lib/scrapers/scrapingService.ts`
- [ ] T080 [US2] Implement retry logic (3 retries with exponential backoff for network errors) in `the-curator/lib/scrapers/scrapingService.ts`
- [ ] T081 [US2] Create ExtractionService for coordinating scraping + logging + notifications in `the-curator/lib/services/extractionService.ts`
- [ ] T184 [US2] [P] Add `scraper_categories` migration and repository/helper so each run can pick the enabled category with the oldest `last_run_at` (or highest priority when equal) and update that timestamp after processing (`lib/db/migrations.sql`, `the-curator/lib/scrapers/categoryScheduler.ts`)
- [ ] T185 [US2] [P] Add `automation_history` table plus Supabase helpers to record each automation invocation (category, run_id, articles_processed, errors, timestamps) for review (`lib/db/migrations.sql`, `the-curator/lib/services/automationHistory.ts`)
- [ ] T186 [US2] [P] Create a `categoryScheduler` utility that selects the next category to scrape, returns its slug/source metadata, and exposes a method to refresh `last_run_at` after a batch completes (`the-curator/lib/scrapers/categoryScheduler.ts`)
- [ ] T187 [US2] Implement GET `/api/scraper/list` returning enabled categories with priority/last run metadata for the scheduler and dashboard (`the-curator/app/api/scraper/list/route.ts`)
- [ ] T188 [US2] Implement POST `/api/scraper/article` that accepts `{ categorySlug }`, runs the extractor, updates `last_run_at`, writes to `automation_history`, and returns counts/errors for that batch (`the-curator/app/api/scraper/article/route.ts`)
- [ ] T189 [US2] [P] Add a local automation log writer (e.g., `logs/automation-history.log` and `the-curator/lib/utils/automationLogger.ts`) so local runs append human-readable summaries before you switch to Vercel Cron

### Extraction API Endpoints

- [ ] T082 [US2] [P] Implement POST `/api/scraper/run` endpoint (secured with cron token) in `the-curator/app/api/scraper/run/route.ts`
- [ ] T083 [US2] [P] Implement GET `/api/scraper/status/[run_id]` endpoint to check extraction status in `the-curator/app/api/scraper/status/[run_id]/route.ts`
- [ ] T084 [US2] [P] Implement POST `/api/admin/scraper-test/parse` endpoint for test page to execute parsing without saving to database in `the-curator/app/api/admin/scraper-test/parse/route.ts`

### Scheduling & Cron

- [ ] T085 [US2] Set up node-cron to trigger extraction hourly in scheduled job (or use Vercel Cron if deployed on Vercel) in `the-curator/jobs/extractionSchedule.ts`
- [ ] T086 [US2] Create internal trigger mechanism for manual extraction (admin endpoint calling ExtractionService) in `the-curator/app/api/admin/extraction/trigger/route.ts`

### Logging & Monitoring

- [ ] T087 [US2] Implement ExtractionLog creation for each run (timestamp, source, status, article count, errors) in `the-curator/lib/services/extractionService.ts`
- [ ] T088 [US2] Implement error alerting (log parsing errors with source details; send notification) in `the-curator/lib/services/notificationService.ts`

### Testing

- [ ] T089 [US2] Write unit tests for each scraper (mock HTML, verify parsing, title/content extraction) in `the-curator/lib/scrapers/__tests__/`
- [ ] T090 [US2] Validate all 3 scrapers on `/admin/scraper-test` page; ensure 100% field extraction accuracy for sample data
- [ ] T091 [US2] Write tests for duplicate detection logic in `the-curator/lib/services/__tests__/`
- [ ] T092 [US2] Write integration tests for end-to-end extraction (scrape → save → verify in database)

### Story 2 Acceptance

- [ ] T093 [US2] Run extraction for each source; verify articles appear in database with all required fields
- [ ] T094 [US2] Verify extraction logs record status, item counts, errors correctly
- [ ] T095 [US2] Verify 95% extraction success rate across three sources (excluding source downtime)
- [ ] T096 [US2] Verify scheduled extraction runs hourly without manual intervention
- [ ] T097 [US2] (Optional) Convert `/admin/scraper-test` to production admin tool for manual URL scraping or keep as internal debugging tool

---

## Phase 5: User Story 3 – Admin Content Management (Priority P3)

**Story Goal**: Super admin can view, edit, and manage articles through Traditional Chinese admin portal.  
**Independent Test Criteria**: Admin logs in → views article list → edits article → saves changes → changes persist in database. All admin UI in Traditional Chinese.

### Admin Authentication

- [ ] T086 [US3] Implement admin login page with email/password form in `src/app/admin/login/page.tsx`
- [ ] T087 [US3] Implement POST `/api/admin/login` endpoint returning JWT token in `src/app/api/admin/login/route.ts`
- [ ] T088 [US3] Implement login form submission, token storage (httpOnly cookie), redirect to dashboard in `src/app/admin/login/page.tsx`
- [ ] T089 [US3] Implement logout functionality and session expiry handling

### Admin Dashboard

- [ ] T090 [US3] [P] Create DashboardStats component displaying total articles, recently scraped count, error count in `src/components/admin/DashboardStats.tsx`
- [ ] T091 [US3] [P] Create ExtractionLog component displaying recent activity (source, timestamp, status, item count) in `src/components/admin/ExtractionLog.tsx`
- [ ] T092 [US3] [P] Create quick action buttons for manual extraction per source in `src/components/admin/ExtractionLog.tsx`
- [ ] T093 [US3] Implement admin dashboard page (`/admin`) displaying stats, recent logs, quick actions in `src/app/admin/page.tsx`

### Admin Article Management

- [x] T094 [US3] [P] Create ArticleTable component (searchable, filterable table of articles) in `src/components/admin/ArticleTable.tsx`
- [ ] T095 [US3] [P] Create ArticleForm component for editing (title, summary, content, category, tags) in `src/components/admin/ArticleForm.tsx`
- [ ] T096 [US3] [P] Create source indicator and AI rewrite status column in ArticleTable in `src/components/admin/ArticleTable.tsx`
- [x] T097 [US3] Implement articles management page (`/admin/articles`) with search, filter, pagination in `src/app/admin/articles/page.tsx`
- [ ] T098 [US3] Implement article edit page (`/admin/articles/[id]/edit`) with form and save button in `src/app/admin/articles/[id]/edit/page.tsx`

### Admin API Endpoints

- [ ] T099 [US3] [P] Implement GET `/api/admin/articles` (paginated, filterable list of all articles including archived) in `src/app/api/admin/articles/route.ts`
- [ ] T100 [US3] [P] Implement GET `/api/admin/articles/[id]` returning full article with metadata in `src/app/api/admin/articles/[id]/route.ts`
- [ ] T101 [US3] [P] Implement PATCH `/api/admin/articles/[id]` updating article fields (title, summary, content, category, tags) in `src/app/api/admin/articles/[id]/route.ts`
- [ ] T102 [US3] [P] Implement DELETE `/api/admin/articles/[id]` soft-deleting article (mark archived) in `src/app/api/admin/articles/[id]/route.ts`
- [ ] T103 [US3] [P] Implement GET `/api/admin/dashboard` returning statistics and recent logs in `src/app/api/admin/dashboard/route.ts`
- [ ] T104 [US3] [P] Implement GET `/api/admin/sources` listing news sources with active/inactive status in `src/app/api/admin/sources/route.ts`
- [ ] T105 [US3] [P] Implement POST `/api/admin/extraction/trigger` for manual extraction of specific URL in `src/app/api/admin/extraction/trigger/route.ts`
- [ ] T106 [US3] [P] Implement GET `/api/admin/extraction/logs` paginated extraction activity log in `src/app/api/admin/extraction/logs/route.ts`

### Admin UI Localization

- [ ] T107 [US3] [P] Add Traditional Chinese translations for all admin UI labels in `public/locales/zh-TW/common.json`
- [ ] T108 [US3] [P] Ensure all admin pages display in Traditional Chinese only (enforce locale in middleware)
- [ ] T109 [US3] Verify all admin UI text is Traditional Chinese; no English labels exposed

### Testing

- [ ] T110 [US3] Write tests for admin authentication flow (login, JWT creation, protected routes) in `src/lib/auth/__tests__/`
- [ ] T111 [US3] Write tests for article edit/update endpoints in `src/app/api/admin/articles/__tests__/`
- [ ] T112 [US3] Write E2E tests for admin workflow (login → view articles → edit → save) using Playwright

### Story 3 Acceptance

- [ ] T113 [US3] Admin can log in with valid credentials and access dashboard
- [ ] T114 [US3] Admin can view, search, filter all articles with correct metadata
- [ ] T115 [US3] Admin can edit article title, summary, content, category; changes persist in database
- [ ] T116 [US3] Admin can view extraction logs with timestamps, source, status, item counts
- [ ] T117 [US3] Admin dashboard displays accurate statistics (total articles, recently scraped)
- [ ] T118 [US3] All admin UI is in Traditional Chinese; no English text visible

---

## Phase 6: User Story 4 – AI Content Rewriting (Priority P4)

**Story Goal**: Admin can trigger AI rewriting of article content to create editorial variations.  
**Independent Test Criteria**: Admin selects article → clicks "Rewrite" → receives rewritten content → preview matches original meaning. Changes saved separately from original.

### OpenAI Integration

- [ ] T119 [US4] Create OpenAI client wrapper with rewrite() method in `src/lib/ai/openai.ts`
- [ ] T119 [US4] Implement error handling for OpenAI API failures (timeout, rate limit, invalid key) in `src/lib/ai/openai.ts`
- [ ] T120 [US4] [P] Create rewrite prompt templates in `src/lib/ai/prompts.ts` (e.g., "Rewrite in journalistic style", "Simplify for general audience")

### Rewrite API Endpoints

- [ ] T121 [US4] [P] Implement POST `/api/admin/articles/[id]/rewrite` triggering AI rewrite in `src/app/api/admin/articles/[id]/rewrite/route.ts`
- [ ] T122 [US4] [P] Validate article exists and is not already rewritten (or allow re-rewrite) in endpoint logic

### Admin UI for Rewriting

- [ ] T123 [US4] [P] Create AIRewriteUI component with "Trigger Rewrite" button, loading state, preview panel in `src/components/admin/AIRewriteUI.tsx`
- [ ] T124 [US4] [P] Display original + rewritten content side-by-side with clear labels in `src/components/admin/AIRewriteUI.tsx`
- [ ] T125 [US4] [P] Add save button to accept rewritten content into `ai_rewritten_content` field

### Error Handling & UX

- [ ] T126 [US4] Display immediate error message if rewriting fails or times out (per FR-037)
- [ ] T127 [US4] Implement retry button for failed rewrites
- [ ] T128 [US4] Log rewrite attempts and failures to ExtractionLog or separate audit log

### Testing

- [ ] T129 [US4] Write unit tests for OpenAI client (mock API responses, error handling) in `src/lib/ai/__tests__/`
- [ ] T130 [US4] Write tests for rewrite endpoint (verify ai_rewritten_content saved separately) in `src/app/api/admin/articles/__tests__/`
- [ ] T131 [US4] Write E2E test: Admin triggers rewrite → receives content → saves → verifies in database

### Story 4 Acceptance

- [ ] T132 [US4] Admin can trigger AI rewriting for any article without errors
- [ ] T133 [US4] Rewritten content is stored in `ai_rewritten_content` field; original content unchanged
- [ ] T134 [US4] Admin can preview both original and rewritten content with clear labels
- [ ] T135 [US4] If rewrite fails, admin sees error message and can retry
- [ ] T136 [US4] Rewrite completes within 30 seconds for articles up to 2000 words

---

## Phase 7: User Story 5 – WordPress Export (Priority P5)

**Story Goal**: Admin can manually export articles to external WordPress site.  
**Independent Test Criteria**: Admin selects article with rewritten content → clicks "Push to WordPress" → article appears on WordPress site → export status recorded.

### WordPress Client Integration

- [ ] T137 [US5] Create WordPress REST API client wrapper in `src/lib/wordpress/wpClient.ts`
- [ ] T138 [US5] Implement error handling for WordPress API failures (invalid credentials, site unreachable) in `src/lib/wordpress/wpClient.ts`

### Export API Endpoints

- [ ] T139 [US5] [P] Implement POST `/api/admin/articles/[id]/export-wp` exporting article to WordPress in `src/app/api/admin/articles/[id]/export-wp/route.ts`
- [ ] T140 [US5] [P] Use AI rewritten content if available; otherwise use original content in export logic

### Admin UI for Export

- [ ] T141 [US5] [P] Add "Push to WordPress" button in ArticleDetail component (admin view) in `src/components/admin/ArticleTable.tsx`
- [ ] T142 [US5] [P] Display export status (`is_exported_to_wp` flag) and WordPress post ID in article metadata in `src/components/admin/ArticleTable.tsx`
- [ ] T143 [US5] [P] Show success/error message after export attempt in `src/components/admin/ArticleTable.tsx`

### Database Tracking

- [ ] T144 [US5] Update article record with `is_exported_to_wp=true` and `wp_post_id` on successful export in `src/lib/db/repositories.ts`
- [ ] T145 [US5] Log export failures with error details in extraction logs or audit log

### Testing

- [ ] T146 [US5] Write unit tests for WordPress client (mock API responses, error handling) in `src/lib/wordpress/__tests__/`
- [ ] T147 [US5] Write tests for export endpoint (verify is_exported_to_wp flag set, wp_post_id saved) in `src/app/api/admin/articles/__tests__/`
- [ ] T148 [US5] Write E2E test: Admin exports article → verify on WordPress site → check database flags

### Story 5 Acceptance

- [ ] T149 [US5] Admin can export any article with AI rewritten or original content to WordPress
- [ ] T150 [US5] WordPress export succeeds for 95% of attempts (excluding WordPress site downtime)
- [ ] T151 [US5] Export status (`is_exported_to_wp`, `wp_post_id`) correctly recorded in database
- [ ] T152 [US5] If export fails, admin sees error message; article not marked as exported

---

## Phase 8: Polish & Cross-Cutting Concerns

### Performance & Caching

- [ ] T153 [P] Implement image lazy-loading on ArticleGrid component in `src/components/public/ArticleGrid.tsx`
- [ ] T154 [P] Add caching headers to public API endpoints (Cache-Control, ETag) in route handlers
- [ ] T155 [P] Implement SWR caching for client-side data fetching (revalidation strategy) in `src/components/`
- [ ] T156 [P] Optimize database queries (add indexes, batch queries, use SELECT projections) in repositories

### Security & Input Validation

- [ ] T157 [P] Validate all user inputs (article edits, URLs, search queries) using Zod in `src/lib/utils/validation.ts`
- [ ] T158 [P] Implement rate limiting on public and admin endpoints in Next.js middleware
- [ ] T159 [P] Sanitize all HTML content (remove XSS vectors) in scrapers and article display
- [ ] T160 [P] Use parameterized queries for all database operations (Supabase client handles this)
- [ ] T161 [P] Configure CORS policy for API endpoints

### Error Handling & Monitoring

- [ ] T162 [P] Integrate Sentry for error tracking in production in `src/config/sentry.ts`
- [ ] T163 [P] Implement structured error responses across all API endpoints with status codes and messages
- [ ] T164 [P] Create error boundary component for graceful UI error handling in `src/components/shared/ErrorBoundary.tsx`
- [ ] T165 [P] Log all critical errors (scraper failures, API errors, auth issues) using Pino logger

### Documentation & Deployment

- [ ] T166 Create README.md with project overview, setup instructions, environment variables, running locally in `the-curator/README.md`
- [ ] T167 Create API documentation (endpoints, request/response examples) in `docs/API.md`
- [ ] T168 Create scraper configuration guide (how to add new sources, selectors) in `docs/SCRAPER_SETUP.md`
- [ ] T169 Create deployment guide (Vercel, environment setup, secrets management) in `docs/DEPLOYMENT.md`
- [ ] T170 [P] Set up GitHub Actions CI/CD pipeline (.github/workflows/test.yml, lint.yml) for automated testing and linting

### Final Testing & QA

- [ ] T171 Conduct full end-to-end testing across all user stories (happy path + error scenarios)
- [ ] T172 Run Lighthouse performance audit; ensure page load < 2s desktop, < 3s mobile
- [ ] T173 Test on real devices/browsers (Chrome, Safari, Firefox; mobile, tablet, desktop)
- [ ] T174 Conduct security review (OWASP Top 10, input validation, auth, rate limiting)
- [ ] T175 Verify all edge cases are handled (missing data, 404s, timeouts, network errors)

### Deployment to Staging

- [ ] T176 Deploy complete application to staging environment (Vercel or AWS)
- [ ] T177 Verify all endpoints and features work in staging (not localhost)
- [ ] T178 Conduct UAT with stakeholder or internal team
- [ ] T179 Fix any issues identified during UAT; redeploy
- [ ] T180 Document known limitations and future improvements in DECISIONS_LOG.md

---

## Dependencies & Execution Order

### Story Completion Order (Sequential)
1. **User Story 1 (P1)**: Public News Reading — must complete first; provides user-facing value
2. **User Story 2 (P2)**: Automated Extraction — critical for content delivery; enables Story 3
3. **User Story 3 (P3)**: Admin Management — required for content control; depends on Stories 1–2
4. **User Story 4 (P4)**: AI Rewriting — value-add; independent of Stories 1–3 data flow
5. **User Story 5 (P5)**: WordPress Export — integration feature; independent of Stories 1–4 logic

### Parallel Execution Within Stories
- **Story 1**: T035–T039 (API endpoints) can run in parallel; T041–T047 (components) can run in parallel; T048–T050 (pages) depend on components
- **Story 2**: T062–T068 (scraper config) can run in parallel; T069–T072 (orchestration) depends on individual scrapers
- **Story 3**: T090–T092 (dashboard components) can run in parallel; T094–T096 (article components) can run in parallel; endpoints (T099–T106) can run in parallel
- **Stories 4–5**: All parallel within story; sequential dependency on Story 3 completion

### Critical Path
T001–T034 (Setup) → T035–T061 (Story 1) → T062–T085 (Story 2) → T086–T118 (Story 3) → T119–T152 (Stories 4–5) → T153–T180 (Polish & Deployment)

**Estimated Duration**: 8–10 weeks (single developer); 4–6 weeks (team of 2–3)

---

## Test Scenarios (Optional: Execute if TDD Requested)

### User Story 1 Test Cases
- **TS1.1**: Homepage renders without errors; displays grid layout with articles
- **TS1.2**: Article cards show title, excerpt, image, category, source
- **TS1.3**: Clicking article card navigates to detail page
- **TS1.4**: Article detail displays full content, images, metadata (author, source, date)
- **TS1.5**: Category filter works; only selected category articles display
- **TS1.6**: Search bar filters articles by title/content (case-insensitive)
- **TS1.7**: Language switcher changes UI labels; content remains original language
- **TS1.8**: Responsive layout: 1 col (320px), 2 col (768px), 3 col (1024px)
- **TS1.9**: Page load time < 2s desktop, < 3s mobile
- **TS1.10**: No console errors; valid API responses

### User Story 2 Test Cases
- **TS2.1**: Extraction runs hourly without manual trigger
- **TS2.2**: Scrapers extract title, content, author, images from each source
- **TS2.3**: Duplicate articles (same source + source_article_id) are skipped
- **TS2.4**: Network errors trigger retry logic (max 3 retries)
- **TS2.5**: Extraction logs record status, article count, errors
- **TS2.6**: Parsing errors log source details and send alert
- **TS2.7**: HTML sanitization removes script/style/iframe tags
- **TS2.8**: Relative URLs converted to absolute for images/links
- **TS2.9**: Articles with missing optional fields (author, summary) still save
- **TS2.10**: Extraction success rate > 95% (excluding source downtime)

### User Story 3 Test Cases
- **TS3.1**: Admin login with valid credentials succeeds; invalid credentials fail
- **TS3.2**: Admin dashboard displays total articles, recent extractions, error count
- **TS3.3**: Article list searchable by title/content
- **TS3.4**: Article list filterable by source, category, date
- **TS3.5**: Admin can edit article title, summary, content, category; changes persist
- **TS3.6**: Admin can manually trigger extraction for specific URL
- **TS3.7**: Archived articles hidden from public; visible to admin
- **TS3.8**: All admin UI text in Traditional Chinese
- **TS3.9**: Admin logout clears session; redirects to login
- **TS3.10**: Concurrent edits follow LWW (later save overwrites)

### User Story 4 Test Cases
- **TS4.1**: Admin can trigger rewrite for any article
- **TS4.2**: Rewritten content stored in `ai_rewritten_content` field; original unchanged
- **TS4.3**: Admin can preview original and rewritten content with labels
- **TS4.4**: Rewrite completes within 30s for articles < 2000 words
- **TS4.5**: Rewrite failure shows error; admin can retry
- **TS4.6**: AI service timeout handled gracefully (immediate error message)

### User Story 5 Test Cases
- **TS5.1**: Admin can export article to WordPress
- **TS5.2**: Export uses AI rewritten content if available; otherwise original
- **TS5.3**: Successful export: `is_exported_to_wp=true`, `wp_post_id` saved
- **TS5.4**: Failed export: error logged, article not marked exported
- **TS5.5**: Export success rate > 95% (excluding WordPress downtime)

---

## Notes & Reminders

- **Record Decisions**: Update DECISIONS_LOG.md as runtime issues and choices arise during implementation
- **MVP Mindset**: Focus on User Story 1 first; Stories 2–5 add incrementally
- **Database Backups**: Ensure regular Supabase backups before major migrations
- **Environment Secrets**: Store API keys (OpenAI, WordPress) securely; never commit to git
- **Performance Monitoring**: Monitor page load times, API latency, database query times in production
- **Error Alerting**: Set up notifications for extraction failures, API errors, auth issues
- **Documentation**: Keep API docs, setup guides, and deployment steps current as features evolve

