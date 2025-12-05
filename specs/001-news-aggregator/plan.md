# Implementation Plan: The Curator - News Aggregation Platform

**Feature Branch**: `001-news-aggregator`  
**Last Updated**: 2025-12-03  
**Status**: Ready for Implementation  

---

## Tech Stack & Architecture

### Frontend Technology Stack
- **Framework**: Next.js 14+ (React 18+, TypeScript)
- **Styling**: Tailwind CSS + PostCSS
- **State Management**: React Context API (minimal state) + SWR for data fetching
- **Internationalization (i18n)**: next-intl or next-i18next for English/Traditional Chinese UI switching
- **Language Detection**: Accept-Language header + user preference cookie
- **Responsive Design**: Mobile-first Tailwind breakpoints (sm: 640px, md: 768px, lg: 1024px, xl: 1280px)
- **Component Library**: Headless UI components + custom Tailwind styling
- **Public Site**: Magazine-style grid layout using CSS Grid
- **Admin Portal**: Dashboard with tables, forms, search/filter UI

### Backend Technology Stack
- **Runtime**: Node.js 18+ with Next.js API routes
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (email/password for admin)
- **Session Management**: JWT tokens (Supabase default)
- **Scraping Engine**: Puppeteer or Cheerio for HTML parsing
  - **Puppeteer**: If JavaScript rendering needed for sources; more robust but slower
  - **Cheerio**: Lightweight; sufficient for static HTML extraction from Oriental Daily, Ming Pao, HK01
  - **Decision**: Use Cheerio initially; upgrade to Puppeteer if sources require JS rendering
- **Scheduling**: Node-cron or APScheduler (if Python-based) for hourly extraction
  - **Decision**: Use Node-cron (lightweight, in-process scheduling); consider upgrading to dedicated job queue (Bull/RabbitMQ) in Phase 2
- **AI Integration**: OpenAI API (GPT-4) or local LLM for article rewriting
  - **Decision**: OpenAI API; fall back to manual rewrite if service unavailable
- **WordPress Integration**: WordPress REST API v2 client library
- **Logging**: Pino logger (structured JSON logging)
- **Error Handling & Monitoring**: Sentry integration for production error tracking
- **API Rate Limiting**: Express rate-limit middleware

### Database Schema (PostgreSQL/Supabase)
**Core Tables**:
- `news_sources` — News websites (Oriental Daily, Ming Pao, HK01)
  - id (UUID primary key)
  - name (text, e.g., "Oriental Daily")
  - scraper_key (text, e.g., "oriental_daily")
  - base_url (text)
  - active (boolean, default: true)
  - created_at (timestamp)
  - updated_at (timestamp)

- `news_articles` — Aggregated news articles
  - id (UUID primary key)
  - source_id (UUID, foreign key → news_sources)
  - source_article_id (text, unique with source_id)
  - url (text, original source URL)
  - title (text, required)
  - content (text/HTML, required)
  - summary (text, nullable)
  - ai_rewritten_content (text, nullable)
  - published_date (timestamp)
  - author (text, nullable)
  - category (text, nullable; e.g., "Politics", "Business")
  - tags (jsonb array, nullable; e.g., ["HK", "China"])
  - is_exported_to_wp (boolean, default: false)
  - wp_post_id (integer, nullable; WordPress post ID)
  - archived (boolean, default: false; set when source URL returns 404)
  - created_at (timestamp)
  - updated_at (timestamp)
  - **Indexes**: (source_id, source_article_id), archived, published_date, category

- `news_images` — Images associated with articles
  - id (UUID primary key)
  - article_id (UUID, foreign key → news_articles)
  - url (text)
  - caption (text, nullable)
  - featured (boolean, default: false)
  - created_at (timestamp)

- `admin_users` — Super admin accounts (initially single user, extensible)
  - id (UUID primary key, linked to Supabase Auth)
  - email (text, unique)
  - role (text, enum: "super_admin"; extendable to "admin", "editor")
  - created_at (timestamp)
  - updated_at (timestamp)

- `extraction_logs` — Activity log for scheduled extractions
  - id (UUID primary key)
  - source_id (UUID, foreign key → news_sources)
  - triggered_at (timestamp)
  - completed_at (timestamp, nullable if still running)
  - status (text, enum: "pending", "running", "success", "error")
  - articles_extracted (integer, nullable)
  - error_message (text, nullable)
  - created_at (timestamp)

### API Routes & Structure

**Public API Endpoints** (no authentication):
- `GET /api/articles` — Paginated list of non-archived articles with optional filters
  - Query params: `page`, `limit`, `category`, `search` (title/content), `sort_by` (date_desc, date_asc)
  - Response: `{ articles: [...], total: int, page: int, limit: int }`
- `GET /api/articles/[id]` — Single article detail
- `GET /api/categories` — List of available categories
- `GET /api/sources` — List of news sources (for reference)
- Health check: `GET /api/health`

**Admin API Endpoints** (authentication required; JWT bearer token):
- `POST /api/admin/login` — Email/password login; returns JWT token
- `GET /api/admin/articles` — Paginated list of all articles (including archived) with filters
  - Query params: `page`, `limit`, `category`, `search`, `archived`, `sort_by`
  - Response: Same as public but includes archived and metadata
- `GET /api/admin/articles/[id]` — Single article with full metadata
- `PATCH /api/admin/articles/[id]` — Edit article (title, summary, content, category, tags)
  - Body: `{ title?, summary?, content?, category?, tags?, ai_rewritten_content? }`
- `DELETE /api/admin/articles/[id]` — Delete article (soft-delete: mark archived)
- `POST /api/admin/articles/[id]/rewrite` — Trigger AI rewriting
  - Body: `{ prompt?: string }`
  - Response: `{ ai_rewritten_content: string, model: string, usage: { tokens } }`
- `POST /api/admin/articles/[id]/export-wp` — Export article to WordPress
  - Body: `{ wp_site_url?: string, wp_username?: string, wp_password?: string }`
  - Response: `{ is_exported_to_wp: true, wp_post_id: int }`
- `POST /api/admin/extraction/trigger` — Manually trigger extraction for a specific URL
  - Body: `{ url: string, source_key?: string }`
  - Response: `{ extraction_id: uuid, status: "started" }`
- `GET /api/admin/extraction/logs` — Extraction activity log with pagination
  - Query params: `page`, `limit`, `status`, `source_id`
- `GET /api/admin/dashboard` — Dashboard statistics
  - Response: `{ total_articles: int, articles_this_month: int, sources: [...], recent_logs: [...], error_count: int }`
- `GET /api/admin/sources` — List news sources with active/inactive status
- `PATCH /api/admin/sources/[id]` — Update source (e.g., toggle active status)

**Scraper Endpoints** (secured via cron job token or internal only):
- `POST /api/scraper/run` — Trigger extraction run
  - Body: `{ source_keys?: string[], force?: boolean }`
  - Response: `{ run_id: uuid, sources_started: int }`
- `GET /api/scraper/status/[run_id]` — Check extraction status

### Project Structure
```
the-curator/
├── public/
│   ├── locales/
│   │   ├── en/
│   │   │   └── common.json          (UI labels in English)
│   │   └── zh-TW/
│   │       └── common.json          (UI labels in Traditional Chinese)
│   └── mock-data/                   (sample articles for demo)
├── src/
│   ├── app/
│   │   ├── page.tsx                 (public homepage)
│   │   ├── layout.tsx               (root layout with i18n wrapper)
│   │   ├── articles/
│   │   │   ├── page.tsx             (articles browse/filter)
│   │   │   └── [id]/
│   │   │       └── page.tsx         (article detail)
│   │   ├── api/
│   │   │   ├── articles/
│   │   │   │   ├── route.ts         (GET /api/articles)
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts     (GET /api/articles/[id])
│   │   │   ├── categories/
│   │   │   │   └── route.ts         (GET /api/categories)
│   │   │   ├── sources/
│   │   │   │   └── route.ts         (GET /api/sources)
│   │   │   ├── health/
│   │   │   │   └── route.ts         (GET /api/health)
│   │   │   ├── admin/
│   │   │   │   ├── login/
│   │   │   │   │   └── route.ts     (POST /api/admin/login)
│   │   │   │   ├── articles/
│   │   │   │   │   ├── route.ts     (GET, PATCH, DELETE /api/admin/articles)
│   │   │   │   │   └── [id]/
│   │   │   │   │       ├── route.ts
│   │   │   │   │       ├── rewrite/
│   │   │   │   │       │   └── route.ts     (POST rewrite)
│   │   │   │   │       └── export-wp/
│   │   │   │   │           └── route.ts     (POST export)
│   │   │   │   ├── extraction/
│   │   │   │   │   ├── trigger/
│   │   │   │   │   │   └── route.ts     (POST trigger)
│   │   │   │   │   └── logs/
│   │   │   │   │       └── route.ts     (GET logs)
│   │   │   │   ├── dashboard/
│   │   │   │   │   └── route.ts     (GET /api/admin/dashboard)
│   │   │   │   └── sources/
│   │   │   │       ├── route.ts     (GET /api/admin/sources)
│   │   │   │       └── [id]/
│   │   │   │           └── route.ts (PATCH /api/admin/sources/[id])
│   │   │   └── scraper/
│   │   │       ├── run/
│   │   │       │   └── route.ts     (POST /api/scraper/run)
│   │   │       └── status/
│   │   │           └── [run_id]/
│   │   │               └── route.ts (GET /api/scraper/status/[run_id])
│   │   └── admin/
│   │       ├── layout.tsx           (admin layout)
│   │       ├── login/
│   │       │   └── page.tsx         (admin login page)
│   │       ├── page.tsx             (admin dashboard)
│   │       ├── articles/
│   │       │   ├── page.tsx         (articles management list)
│   │       │   └── [id]/
│   │       │       ├── edit/
│   │       │       │   └── page.tsx (article edit form)
│   │       │       └── page.tsx     (article detail with actions)
│   │       ├── extraction/
│   │       │   └── page.tsx         (extraction logs/status)
│   │       └── sources/
│   │           └── page.tsx         (manage news sources)
│   ├── components/
│   │   ├── public/
│   │   │   ├── ArticleGrid.tsx      (magazine-style grid)
│   │   │   ├── ArticleCard.tsx      (single article card)
│   │   │   ├── ArticleDetail.tsx    (full article view)
│   │   │   ├── CategoryFilter.tsx   (filter UI)
│   │   │   ├── LanguageSwitcher.tsx (EN/ZH-TW toggle)
│   │   │   └── Navigation.tsx       (header/navbar)
│   │   ├── admin/
│   │   │   ├── AdminLayout.tsx      (sidebar, header)
│   │   │   ├── ArticleTable.tsx     (searchable article list)
│   │   │   ├── ArticleForm.tsx      (edit form with preview)
│   │   │   ├── DashboardStats.tsx   (statistics cards)
│   │   │   ├── ExtractionLog.tsx    (activity log table)
│   │   │   ├── SourceManager.tsx    (manage sources)
│   │   │   └── AIRewriteUI.tsx      (trigger rewrite + preview)
│   │   └── shared/
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── Modal.tsx
│   │       ├── Pagination.tsx
│   │       └── LoadingSpinner.tsx
│   ├── lib/
│   │   ├── db/
│   │   │   ├── supabase.ts          (Supabase client, queries)
│   │   │   ├── repositories.ts      (data access layer)
│   │   │   └── migrations.sql       (schema creation)
│   │   ├── scrapers/
│   │   │   ├── baseScraper.ts       (base class/interface)
│   │   │   ├── orientalDaily.ts     (Oriental Daily scraper)
│   │   │   ├── mingPao.ts           (Ming Pao scraper)
│   │   │   ├── hk01.ts             (HK01 scraper)
│   │   │   ├── scrapingService.ts   (orchestrator)
│   │   │   └── htmlSanitizer.ts     (HTML sanitization)
│   │   ├── ai/
│   │   │   ├── openai.ts            (OpenAI client & rewrite logic)
│   │   │   └── prompts.ts           (rewrite prompt templates)
│   │   ├── wordpress/
│   │   │   └── wpClient.ts          (WordPress REST API client)
│   │   ├── auth/
│   │   │   ├── supabaseAuth.ts      (authentication helper)
│   │   │   └── middleware.ts        (JWT verification for admin routes)
│   │   ├── utils/
│   │   │   ├── logger.ts            (Pino logger setup)
│   │   │   ├── errors.ts            (custom error classes)
│   │   │   ├── validation.ts        (input validation)
│   │   │   ├── urlHelpers.ts        (URL parsing/conversion)
│   │   │   └── dateHelpers.ts       (date formatting)
│   │   ├── services/
│   │   │   ├── articleService.ts    (article business logic)
│   │   │   ├── extractionService.ts (extraction orchestration)
│   │   │   └── notificationService.ts (alert notifications for extraction errors)
│   │   └── constants/
│   │       ├── sources.ts           (scraper config: URLs, selectors)
│   │       └── categories.ts        (available article categories)
│   ├── middleware.ts                (Next.js middleware: auth checks, i18n routing)
│   ├── types/
│   │   ├── article.ts
│   │   ├── source.ts
│   │   ├── user.ts
│   │   └── api.ts                   (API response types)
│   └── config/
│       ├── env.ts                   (environment variable validation)
│       └── i18n.ts                  (i18n configuration)
├── .env.local                       (local env vars; DO NOT commit)
├── .env.example                     (template for required env vars)
├── next.config.ts                   (Next.js config)
├── tsconfig.json                    (TypeScript config)
├── tailwind.config.ts               (Tailwind CSS config)
├── postcss.config.mjs               (PostCSS config)
├── package.json                     (dependencies)
└── README.md                        (setup & running instructions)
```

### Key Libraries & Dependencies

**Frontend**:
- `next` (14+), `react` (18+), `typescript`
- `tailwindcss`, `postcss`, `autoprefixer`
- `next-intl` or `next-i18next` (i18n)
- `swr` (data fetching)
- `react-hook-form` (form management)
- `zod` (schema validation)
- `framer-motion` (animations, optional)

**Backend/Scraping**:
- `cheerio` (HTML parsing)
- `axios` or `node-fetch` (HTTP requests)
- `node-cron` (scheduling)
- `openai` (AI rewriting)
- `@supabase/supabase-js` (Supabase client)
- `pino` (logging)
- `sentry-node` (error tracking)
- `express-rate-limit` (rate limiting)

**Development**:
- `eslint`, `prettier` (linting & formatting)
- `jest`, `@testing-library/react` (testing)
- `typescript`

---

## Implementation Strategy

### MVP Scope (Phase 1)
Focus on **User Story 1 (Public News Reading)** — the core value proposition.

**Minimal Deliverable**:
1. Database schema with `news_sources`, `news_articles`, `news_images` tables
2. Sample articles imported from one source (e.g., Oriental Daily mock data)
3. Public homepage with magazine-style grid layout
4. Article detail page
5. Category filtering
6. English + Traditional Chinese UI language switching
7. Responsive design (mobile/tablet/desktop)
8. Basic health check endpoint

**Acceptance Criteria**:
- Homepage loads in < 2 seconds (desktop)
- Users can browse and read articles without errors
- Language switcher works; UI labels change; content remains original language
- Responsive design adapts across breakpoints
- No authentication required for public access

**Estimated Timeline**: 2 weeks (single developer)

### Phase 2: Admin & Extraction (User Stories 2–3)
- Admin authentication (Supabase Auth)
- Admin dashboard with statistics
- Article management (search, filter, edit)
- Automated extraction from all three sources (Oriental Daily, Ming Pao, HK01)
- Extraction logs & alerts
- Manual extraction trigger

**Estimated Timeline**: 3 weeks

### Phase 3: AI & Export (User Stories 4–5)
- AI content rewriting (OpenAI GPT-4)
- WordPress export integration
- Error handling for failed rewrites/exports

**Estimated Timeline**: 2 weeks

### Phase 4: Polish & Optimization
- Performance optimization (image lazy-loading, pagination, caching)
- Monitoring & observability (Sentry)
- Security hardening (input validation, rate limiting, CORS)
- Documentation & deployment

**Estimated Timeline**: 1–2 weeks

---

## Data Flow Diagrams

### Public User Flow
```
User
  ↓ (visits homepage)
Next.js (public page)
  ↓
SWR (fetch /api/articles)
  ↓
Next.js API Route
  ↓
Supabase PostgreSQL (SELECT * FROM news_articles WHERE archived=false)
  ↓
ArticleGrid Component (render cards)
  ↓
Browser (display magazine layout)
```

### Admin Article Edit Flow
```
Admin (logged in)
  ↓ (edits article title, clicks Save)
Next.js Admin Page
  ↓
fetch() PATCH /api/admin/articles/[id] (with JWT token)
  ↓
Next.js Admin API Route (verify JWT)
  ↓
Supabase PostgreSQL (UPDATE news_articles)
  ↓
Success response → UI updates
```

### Extraction Flow
```
Cron Job (hourly)
  ↓
POST /api/scraper/run (internal token)
  ↓
ScrapingService.execute()
  ↓
For each source:
  ├─ Cheerio.load(HTML)
  ├─ Extract title, content, author, images
  ├─ Sanitize HTML
  ├─ Check for duplicates (source + source_article_id)
  ├─ Save to database
  └─ If error: log error, send alert
  ↓
ExtractionLog.create({ status: 'success', articles_extracted: N })
```

### AI Rewrite Flow
```
Admin (clicks "Rewrite")
  ↓
POST /api/admin/articles/[id]/rewrite
  ↓
OpenAI API (GPT-4 with prompt)
  ↓
If success:
  ├─ Save to ai_rewritten_content field
  ├─ Return rewritten content to UI
  └─ Admin can preview & save
  ↓
If error:
  ├─ Log error
  ├─ Return error response
  └─ Admin sees: "Rewriting failed; please try again"
```

---

## Known Constraints & Decisions

**From DECISIONS_LOG.md**:
1. **Concurrent Edits**: Last-write-wins (LWW); no locking
2. **Data Retention**: Indefinite; no deletion workflow
3. **Authentication**: Out-of-scope Phase 1; only unauthenticated sources
4. **404 Handling**: Mark articles as archived; hide from public
5. **Process**: Capture all runtime decisions in DECISIONS_LOG.md for rebuild capability

---

## Testing Strategy

### Unit Tests
- Scraper logic (HTML parsing, selector matching, duplicate detection)
- HTML sanitization (no XSS, preserved semantic tags)
- URL conversion (relative → absolute)
- Validation (input, email format, etc.)

### Integration Tests
- Database operations (CRUD for articles, sources, logs)
- API endpoints (public and admin routes)
- Authentication flow (login, JWT validation)
- Extraction workflow (end-to-end scraping + storage)

### End-to-End (E2E) Tests
- Public user flow: Homepage → Browse → Read Article → Change Language
- Admin flow: Login → Edit Article → Save → Verify in database
- Extraction flow: Trigger extraction → Verify articles in database → Check logs

### Performance Tests
- Page load time (target: < 2s desktop, < 3s mobile)
- API response time (target: < 500ms for most endpoints)
- Database query performance (1000+ articles should load in < 1s)

---

## Deployment & Infrastructure

### Hosting
- **Frontend/Backend**: Vercel (Next.js optimized) or AWS Amplify
- **Database**: Supabase (PostgreSQL; includes auth, real-time)
- **Cron Jobs**: Vercel Cron, AWS Lambda, or EasyCron (external service)
- **File Storage**: Supabase Storage (for images, if needed) or AWS S3
- **Error Tracking**: Sentry.io
- **Secrets**: Environment variables (SUPABASE_KEY, OPENAI_API_KEY, WP_CREDENTIALS)

### Environment Variables
```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_KEY=xxx (server-side only)

# OpenAI
OPENAI_API_KEY=sk-xxx

# WordPress (if used)
WP_SITE_URL=https://example.wordpress.com
WP_USERNAME=admin
WP_PASSWORD=xxx

# Admin credentials (if not using Supabase Auth)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=xxx

# Logging
LOG_LEVEL=info

# Cron Job Secret (for /api/scraper/run security)
SCRAPER_CRON_SECRET=xxx
```

---

## Next Steps

1. **Create database schema** (migrations)
2. **Set up Next.js project** with TypeScript, Tailwind, i18n
3. **Implement public pages** (homepage, articles grid, detail, language switcher)
4. **Implement sample data** (mock articles for MVP demo)
5. **Add public API endpoints** (GET /api/articles, /api/articles/[id])
6. **Test public user flow** (load, browse, read, filter, language switching)
7. → Move to Phase 2 (admin, extraction) after MVP validation

