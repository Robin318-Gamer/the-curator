# Prototype06 Review & Technical Analysis

## Overview

**Prototype06** is a Next.js-based news aggregation and scraping application that collects, processes, and manages news articles from multiple Hong Kong news sources. The application features user authentication, automated scraping, content management, and analytics capabilities.

---

## Technology Stack

### Core Framework
- **Next.js 15.3.5** with App Router
- **React 19.0.0**
- **TypeScript 5**
- **Tailwind CSS 4**

### Backend & Database
- **Supabase** - PostgreSQL database with real-time capabilities
- **@supabase/supabase-js 2.51.0** - Supabase client library

### Key Dependencies
- **axios 1.10.0** - HTTP client for web scraping
- **cheerio 1.1.0** - Server-side HTML parsing and manipulation
- **bcryptjs 3.0.2** - Password hashing
- **chart.js 4.5.0** - Data visualization
- **react-chartjs-2 5.3.0** - React wrapper for Chart.js
- **dotenv 17.2.0** - Environment variable management

---

## Application Architecture

### Directory Structure

```
prototype06/
├── src/
│   ├── app/                      # Next.js App Router pages
│   │   ├── api/                  # API route handlers
│   │   │   ├── admin/            # Admin authentication & management
│   │   │   ├── ai-summary/       # AI summarization endpoint
│   │   │   ├── analytics/        # Analytics data API
│   │   │   ├── automation/       # Automation triggers
│   │   │   ├── category-management/
│   │   │   ├── event-log/
│   │   │   ├── list-*/           # News source list APIs
│   │   │   ├── newslist/         # Newslist CRUD
│   │   │   └── source-management/
│   │   ├── admin-*.tsx           # Admin UI pages
│   │   ├── article-management/
│   │   ├── automation/           # Automation UI
│   │   ├── category-management/
│   │   ├── source-management/
│   │   └── user-management/
│   ├── components/               # Reusable UI components
│   ├── context/                  # React context providers
│   └── lib/                      # Utility functions & scrapers
│       ├── scrapers/             # Web scraping modules
│       │   ├── BaseScraper.js
│       │   └── OrientalDailyScraper.js
│       ├── supabaseClient.ts
│       ├── chart.tsx
│       └── resetPinStorage.ts
├── scripts/                      # Database & utility scripts
│   ├── update-db-schema-simple.mjs
│   ├── test-connection.mjs
│   └── *.sql
├── types/                        # TypeScript type definitions
├── public/                       # Static assets
└── Configuration files
```

---

## Database Schema

### Core Tables

#### 1. **users**
Stores user authentication and profile information.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| email | text | User email |
| password_hash | text | Hashed password (bcrypt) |
| role | text | User role (admin, editor, etc.) |
| full_name | text | User's full name |
| created_at | timestamp | Account creation time |
| updated_at | timestamp | Last update time |
| last_login | timestamp | Last login timestamp |
| is_active | boolean | Account status |

#### 2. **news_sources**
Defines news sources being scraped.

| Column | Type | Description |
|--------|------|-------------|
| id | int4 (serial) | Primary key |
| name | text | Source name (e.g., "Oriental Daily") |
| url | text | Source URL |
| created_at | timestamp | Record creation time |

#### 3. **news_category**
Categories for news articles.

| Column | Type | Description |
|--------|------|-------------|
| id | int4 (serial) | Primary key |
| name | text | Category name |
| description | text | Category description |
| created_at | timestamp | Record creation time |

#### 4. **news_articles**
Main article storage table.

| Column | Type | Description |
|--------|------|-------------|
| id | int4 (serial) | Internal unique ID |
| source_id | int4 | FK → news_sources(id) |
| source_article_id | text (unique) | Article ID from source |
| title | text | Article title |
| summary | text | Article summary/lead |
| content | text | Full article content |
| url | text | Original article URL |
| category_id | int4 | FK → news_category(id) |
| publish_at | timestamp | Original publish date |
| article_update_at | timestamp | Article update date |
| created_at | timestamp | System record creation |
| updated_at | timestamp | System record update |

#### 5. **news_images**
Images associated with articles.

| Column | Type | Description |
|--------|------|-------------|
| id | int4 (serial) | Primary key |
| article_id | int4 | FK → news_articles(id) ON DELETE CASCADE |
| url | text | Image URL |
| caption | text | Image caption |
| created_at | timestamp | Record creation time |

#### 6. **newslist**
Temporary staging table for scraped article URLs.

| Column | Type | Description |
|--------|------|-------------|
| id | int4 (serial) | Primary key |
| source_article_id | text (unique) | Article ID from source |
| url | text | Article URL |
| title | text | Article title |
| summary | text | Article summary |
| created_at | timestamp | Record creation time |

#### 7. **automation_event_log**
Logs automation activities.

| Column | Type | Description |
|--------|------|-------------|
| id | int4 (serial) | Primary key |
| event_type | text | Type of automation event |
| source | text | News source name |
| saved_count | int4 | Number of articles saved |
| duplicate_count | int4 | Number of duplicates found |
| message | text | Event message/notes |
| created_at | timestamp | Event timestamp |

#### 8. **email_token**
Password reset tokens.

| Column | Type | Description |
|--------|------|-------------|
| id | int4 (serial) | Primary key |
| user_id | uuid | FK → users(id) |
| token | text | Reset token |
| created_at | timestamp | Token creation time |
| expires_at | timestamp | Token expiration time |

---

## Key Features & Functionality

### 1. **Web Scraping System**

#### Scraper Architecture
- **Base Class Pattern**: `BaseScraper.js` provides a template with standard metadata structure
- **Source-Specific Scrapers**: Extended scrapers for each news source (e.g., `OrientalDailyScraper.js`)

#### Metadata Extracted
```javascript
{
  title: string,           // Article title
  summary: string,         // Article summary/description
  content: string,         // Full article content (HTML)
  author: string,          // Article author
  sourceUrl: string,       // Original URL
  featuredImage: string,   // Main image URL
  featuredImageCaption: string,
  additionalImages: [],    // Array of {url, caption, metadata}
  tags: [],               // Article tags/keywords
  category: string,       // Article category
  postDate: string,       // Publication date
  updateDate: string      // Last update date
}
```

#### Scraping Features
- **URL Normalization**: Converts relative URLs to absolute
- **User-Agent Spoofing**: Mimics browser requests
- **Error Handling**: Graceful failure with detailed error messages
- **Dual Modes**: 
  - Direct URL scraping with axios
  - HTML content parsing (for pre-fetched HTML)

### 2. **API Endpoints**

#### Admin Authentication
- `POST /api/admin/login` - User authentication
- `POST /api/admin/forgot-password` - Password reset request
- `POST /api/admin/reset-password` - Password reset completion
- `GET /api/admin/users` - User management

#### Content Management
- `GET /api/newslist` - Paginated newslist retrieval
- `GET /api/list-mingpao` - MingPao article list
- `GET /api/list-hk01` - HK01 article list
- `GET /api/list-takungpao` - TakungPao article list
- `GET /api/list-orientaldaily` - Oriental Daily article list

#### Automation
- `POST /api/automation/batch-scrape` - Trigger batch scraping
- `POST /api/automation/bulk-save/[slug]` - Bulk save articles from source
- `GET /api/automation-event-log` - Retrieve automation logs

#### Management
- `GET/POST /api/source-management` - News source CRUD
- `GET/POST /api/category-management` - Category CRUD
- `GET /api/event-log` - System event logs
- `GET /api/analytics` - Analytics data

#### AI Features
- `POST /api/ai-summary` - AI-powered article summarization

### 3. **Database Management Tools**

#### Automated Schema Documentation
- **Script**: `scripts/update-db-schema-simple.mjs`
- **Command**: `npm run update-schema`
- **Function**: Queries live Supabase database and auto-generates `db-schema.md`
- **Features**:
  - Connects via Supabase client
  - Infers column types from sample data
  - Generates markdown documentation
  - Prevents manual documentation drift

#### Database Setup Scripts
- `setup-database.js` - Initial database setup
- `setup-database.sql` - SQL setup script
- `table-creation.sql` - Table creation definitions
- `create-newslist-table.sql` - Newslist table setup
- `db-schema-email-token.sql` - Email token table
- `update-source-article-id-to-text.sql` - Schema migration

### 4. **User Interface Components**

#### Admin Pages
- **Login System** (`admin-login.tsx`) - Authentication UI
- **Password Reset** (`admin-forgot-password.tsx`, `admin-reset-password.tsx`)
- **User Management** - User CRUD operations
- **Article Management** - Content management interface
- **Source Management** - News source configuration
- **Category Management** - Category organization
- **Automation Dashboard** - Scraping automation controls
- **Event Logs** - System activity monitoring
- **Analytics** - Data visualization with Chart.js

#### UI Features
- Server-side rendering with Next.js App Router
- TypeScript for type safety
- Tailwind CSS for styling
- Chart.js integration for analytics visualization
- Responsive design

### 5. **Automation System**

#### Capabilities
- Batch scraping from multiple sources
- Bulk article saving
- Event logging for all automation activities
- Duplicate detection
- Error tracking and reporting

#### Workflow
1. Scraper fetches article list from source
2. URLs saved to `newslist` table
3. Batch scraping triggered (manual or automated)
4. Articles parsed and saved to `news_articles`
5. Images extracted and saved to `news_images`
6. Events logged in `automation_event_log`

---

## Reusable Components & Functions

### High-Value Extractable Components

#### 1. **Scraper Architecture**
**Files to Extract:**
- [`BaseScraper.js`](file:///c:/Users/RHung/OneDrive%20-%20SIRVA/Documents/Personal%20project/Robin318-Gamer/POC1/prototype06/src/lib/scrapers/BaseScraper.js)
- [`OrientalDailyScraper.js`](file:///c:/Users/RHung/OneDrive%20-%20SIRVA/Documents/Personal%20project/Robin318-Gamer/POC1/prototype06/src/lib/scrapers/OrientalDailyScraper.js)

**Reusable Patterns:**
- Base scraper template with metadata structure
- URL normalization utilities
- HTML parsing with cheerio
- Error handling patterns
- Image extraction logic
- Content cleaning and formatting

#### 2. **Database Integration**
**Files to Extract:**
- [`supabaseClient.ts`](file:///c:/Users/RHung/OneDrive%20-%20SIRVA/Documents/Personal%20project/Robin318-Gamer/POC1/prototype06/src/lib/supabaseClient.ts)
- Schema documentation script: `scripts/update-db-schema-simple.mjs`

**Reusable Patterns:**
- Supabase client configuration
- Environment variable management
- Connection testing utilities
- Schema documentation automation

#### 3. **API Route Patterns**
**Reusable Patterns:**
- Pagination implementation
- Error response formatting
- Request parameter parsing
- Supabase query patterns
- Authentication middleware patterns

#### 4. **Utilities**
- Chart configuration (`lib/chart.tsx`)
- Storage reset utilities (`lib/resetPinStorage.ts`)
- TypeScript type definitions (in `types/`)

---

## Technical Insights

### Strengths
✅ Well-organized modular architecture  
✅ Strong separation of concerns (scrapers, API, UI)  
✅ Automated schema documentation  
✅ Comprehensive logging and event tracking  
✅ Type-safe with TypeScript  
✅ Modern Next.js App Router usage  
✅ Reusable scraper base class pattern  

### Areas for Improvement
⚠️ Some API endpoints incomplete (e.g., batch-scrape placeholder)  
⚠️ Limited scraper implementations (only OrientalDaily fully implemented)  
⚠️ No automated testing infrastructure  
⚠️ Schema migration handling could be more robust  
⚠️ AI summary endpoint needs implementation  

### Security Considerations
- ✅ Password hashing with bcrypt
- ✅ Token-based password reset
- ⚠️ Need to verify RLS policies in Supabase
- ⚠️ API endpoints may need rate limiting
- ⚠️ User-Agent spoofing may violate ToS of news sites

---

## Recommended Extraction Strategy

### For New Application

#### Core Components to Extract
1. **Scraper System** (100% reusable)
   - Base scraper class
   - Oriental Daily scraper as template
   - URL utilities and parsing logic

2. **Database Layer** (80% reusable)
   - Supabase client setup
   - Schema documentation tooling
   - Core table structures (adapt as needed)

3. **API Patterns** (70% reusable)
   - Pagination logic
   - Error handling patterns
   - Response formatting

4. **Utilities** (90% reusable)
   - Chart utilities
   - Storage management
   - Type definitions

#### Components to Redesign
- Admin authentication (use Next-Auth or similar)
- UI components (create fresh with your design system)
- Automation scheduling (consider cron jobs or queues)

---

## Next Steps

### Questions for User

1. **Which features do you want in the new application?**
   - Just scraping functionality?
   - Full content management system?
   - User authentication?
   - Analytics dashboard?

2. **Which news sources do you want to support?**
   - Keep Oriental Daily?
   - Add new sources?
   - Need to build new scrapers?

3. **Database preferences?**
   - Continue with Supabase?
   - Use a different database?
   - What schema modifications needed?

4. **Application scope?**
   - Standalone scraper library?
   - Full-stack web application?
   - API-only service?
   - Desktop application?

---

## Reference Documentation

- [Database Schema Details](file:///c:/Users/RHung/OneDrive%20-%20SIRVA/Documents/Personal%20project/Robin318-Gamer/POC1/prototype06/expected-db-schema.md)
- [Schema Management Guide](file:///c:/Users/RHung/OneDrive%20-%20SIRVA/Documents/Personal%20project/Robin318-Gamer/POC1/prototype06/DATABASE_SCHEMA_MANAGEMENT.md)
- [Technical Issues Log](file:///c:/Users/RHung/OneDrive%20-%20SIRVA/Documents/Personal%20project/Robin318-Gamer/POC1/prototype06/TECHNICAL_ISSUES_LOG.md)
- [Package Configuration](file:///c:/Users/RHung/OneDrive%20-%20SIRVA/Documents/Personal%20project/Robin318-Gamer/POC1/prototype06/package.json)

---

_Review completed: 2025-12-01_
