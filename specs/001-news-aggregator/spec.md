# Feature Specification: The Curator - News Aggregation Platform

**Feature Branch**: `001-news-aggregator`  
**Created**: 2025-12-01  
**Status**: Draft  
**Input**: User description: "News aggregation platform with public site and admin portal"

## Clarifications

### Session 2025-12-01

- Q: What should happen when AI rewriting fails or times out? → A: Fail immediately and show error; admin must manually retry
- Q: How should the system respond when scrapers detect selector changes? → A: Log parsing error with source details; send alert notification; continue scraping other sources; provide admin dashboard alert
- Q: Should articles with missing optional metadata (images, authors) be saved or rejected? → A: Save article with null/empty fields for missing metadata; only title, content, and publish date are required

### Session 2025-12-03

- Q: How should development decisions made during implementation be captured for project continuity? → A: Create dedicated `DECISIONS_LOG.md` file in `/specs/001-news-aggregator/` with structured entries (timestamp, category, issue, decision, rationale, affected areas) to enable rebuild from documentation
- Q: What data retention and privacy compliance approach should the system follow? → A: No regulatory constraints; keep all article data indefinitely; no privacy compliance requirements; focus only on functional delivery
- Q: How should concurrent edits of the same article by multiple admins be handled? → A: Last-write-wins (LWW); no locking; later save overwrites earlier saves; simple implementation approach
- Q: How should the system handle news sources requiring authentication or rate limiting? → A: Out-of-scope initially; only support unauthenticated sources (Oriental Daily, Ming Pao, HK01); document limitation; skip sources requiring auth
- Q: How should the system handle articles whose original source URLs become unavailable (404)? → A: Mark articles as archived with `archived=true` flag when source URL returns 404; hide from public by default; admins can still view and manage archived articles

### Session 2025-12-04

- Q: How should scraper parsing logic be validated during development before deploying to production? → A: Create development-only test page at `/dev/scraper-test` loading sample HTML from `SampleDate/` folder (3 articles: HK01, Ming Pao, Oriental Daily); display raw HTML and parsed output side-by-side; validate against expected data; remove or auth-protect route before production

**Note**: See [DECISIONS_LOG.md](DECISIONS_LOG.md) for all development decisions, architectural trade-offs, and runtime issue resolutions. This is the source of truth for understanding "why" implementation choices were made.

**Note**: See [SCRAPER_TEST_PAGE_SPEC.md](SCRAPER_TEST_PAGE_SPEC.md) for detailed specification of the scraper validation test page, including UI layout, API endpoints, sample data mapping, and security considerations.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Public News Reading (Priority: P1)

Public users can browse and read news articles from Hong Kong sources in a magazine-style layout with multi-language UI support.

**Why this priority**: Core value proposition - delivering news content to readers. Without this, the platform has no purpose for end users.

**Independent Test**: Can be fully tested by navigating to the public homepage, browsing articles by category, reading full articles, and switching UI language between English and Traditional Chinese. Delivers immediate value by providing access to aggregated news content.

**Acceptance Scenarios**:

1. **Given** a user visits the homepage, **When** they view the page, **Then** they see a magazine-style grid layout with latest articles, hero image, and category navigation
2. **Given** a user clicks on an article card, **When** the article detail page loads, **Then** they see the full article with title, content, images, author, source, and publication date
3. **Given** a user is on any public page, **When** they click the language switcher, **Then** UI labels (menus, buttons, navigation) change to the selected language while article content remains in original language
4. **Given** a user accesses the site on a mobile device, **When** pages load, **Then** the layout adapts responsively (1 column on mobile 320-767px, 2 columns on tablet 768-1023px, 3+ columns on desktop 1024px+)
5. **Given** a user browses articles by category, **When** they select a category filter, **Then** only articles from that category are displayed

---

### User Story 2 - Automated News Extraction (Priority: P2)

System automatically extracts news articles from Hong Kong sources (Oriental Daily, Ming Pao, HK01) at scheduled intervals.

**Why this priority**: Automation is critical for scalability and keeping content fresh, but the platform can function with manual extraction initially.

**Independent Test**: Can be tested by configuring automated extraction schedules, verifying that articles are fetched at correct intervals, and checking that extracted data matches expected format. Delivers value by eliminating manual extraction work.

**Acceptance Scenarios**:

1. **Given** the system is configured with extraction schedules, **When** the scheduled time is reached, **Then** the scraper engine fetches articles from all active sources
2. **Given** a scraper successfully extracts an article, **When** saving to the database, **Then** the article is stored with standardized format (title, summary, content, images, publish date, author, category)
3. **Given** a scraper encounters a network error, **When** the error occurs, **Then** the system retries up to 3 times with exponential backoff and logs the error
4. **Given** duplicate articles are detected (same source and source article ID), **When** attempting to save, **Then** the system skips the duplicate and logs the occurrence
5. **Given** a scraper fails to find critical selectors (title or content), **When** parsing HTML, **Then** the system throws a parse error and does not save incomplete data

---

### User Story 3 - Admin Content Management (Priority: P3)

Super admin can view, edit, and manage scraped articles through a Traditional Chinese admin portal.

**Why this priority**: Important for content quality control and editorial oversight, but articles can be published without manual editing initially.

**Independent Test**: Can be tested by logging into the admin portal with credentials, viewing the article list, editing article content, and verifying changes persist. Delivers value by enabling editorial control over published content.

**Acceptance Scenarios**:

1. **Given** an admin accesses the admin portal URL, **When** they are not authenticated, **Then** they are redirected to a login page
2. **Given** an admin enters valid credentials, **When** they submit the login form, **Then** they are authenticated and redirected to the admin dashboard
3. **Given** an authenticated admin views the dashboard, **When** the page loads, **Then** they see statistics (total articles count, recently scraped count), quick action buttons, and recent extraction activity log
4. **Given** an admin views the articles management page, **When** the page loads, **Then** they see a searchable, filterable table of all articles with source, AI rewrite status, and action buttons
5. **Given** an admin clicks "Edit" on an article, **When** the edit page loads, **Then** they can modify title, summary, content, category, and tags, then save changes
6. **Given** an admin manually triggers extraction for a source, **When** they click the trigger button and provide a URL, **Then** the scraper fetches that specific article and saves it to the database

---

### User Story 4 - AI Content Rewriting (Priority: P4)

Admin can trigger AI rewriting of article content to create editorial variations.

**Why this priority**: Value-add feature for content customization, but not essential for core news aggregation functionality.

**Independent Test**: Can be tested by selecting an article in admin portal, clicking "AI Rewrite" button, and verifying rewritten content is saved separately from original. Delivers value by providing editorial flexibility.

**Acceptance Scenarios**:

1. **Given** an admin views an article without AI rewritten content, **When** they click "Trigger AI Rewrite", **Then** the system sends the original content to an AI service and receives rewritten content
2. **Given** AI rewriting completes successfully, **When** saving the result, **Then** the rewritten content is stored in the `ai_rewritten_content` field without overwriting the original content
3. **Given** an article has both original and AI rewritten content, **When** displayed in admin interface, **Then** both versions are shown with clear labels indicating which is original and which is rewritten

---

### User Story 5 - WordPress Export (Priority: P5)

Admin can manually export articles to an external WordPress site.

**Why this priority**: Integration feature that extends platform utility but is not required for core news aggregation.

**Independent Test**: Can be tested by configuring WordPress credentials, selecting an article with AI rewritten content, clicking "Push to WordPress", and verifying the post appears on the WordPress site. Delivers value by enabling content syndication.

**Acceptance Scenarios**:

1. **Given** an admin selects an article to export, **When** they click "Push to WordPress", **Then** the system sends article data to the WordPress REST API
2. **Given** an article has AI rewritten content, **When** exporting to WordPress, **Then** the rewritten content is used; otherwise, the original content is used
3. **Given** WordPress export succeeds, **When** the response is received, **Then** the `is_exported_to_wp` flag is set to true and the `wp_post_id` is saved
4. **Given** WordPress export fails, **When** the error occurs, **Then** the system logs the error details and displays an error message to the admin without marking the article as exported

---

### Edge Cases

- What happens when a news source changes its HTML structure and selectors no longer match? → System logs error with source details, sends alert, continues other sources, shows dashboard alert
- How does the system handle articles with missing images or authors? → System saves article with null/empty fields; only title, content, publish date required
- What happens when multiple admins attempt to edit the same article simultaneously? → **Last-write-wins (LWW)**: Later save overwrites earlier saves; no locking mechanism; admins risk losing concurrent edits if not coordinating
- How does the system handle news sources that require authentication or have rate limiting? → **Out-of-scope initially**: System only supports unauthenticated sources (Oriental Daily, Ming Pao, HK01); sources requiring authentication are not supported at this time; rate limiting detection TBD in future iteration
- What happens when an article's original URL becomes unavailable (404 error)? → **Mark as archived**: Article is flagged with `archived=true` when source URL returns 404; removed from public display; admins can view/manage archived articles; article data is retained indefinitely
- How does the system handle articles published in languages other than Chinese/English?
- What happens when the AI rewriting service is temporarily unavailable? → System displays immediate error; admin manually retries
- How does the system handle extremely long articles that exceed expected content length?
- What happens when WordPress credentials are invalid or the WordPress site is unreachable?

## Requirements *(mandatory)*

### Functional Requirements

**Extraction & Scraping**:
- **FR-001**: System MUST support extraction from Oriental Daily, Ming Pao, and HK01 news sources
- **FR-002**: System MUST extract title, summary, content (HTML), images with captions, publish date, author(s), category, and tags from each article
- **FR-003**: System MUST standardize extracted data into a common format regardless of source
- **FR-004**: System MUST handle network errors gracefully with retry logic (up to 3 retries with exponential backoff)
- **FR-005**: System MUST prevent duplicate articles based on source and source article ID
- **FR-006**: System MUST sanitize HTML content by removing script tags, style tags, iframes, objects, and event handlers while preserving semantic tags
- **FR-007**: System MUST convert relative URLs to absolute URLs for images and links
- **FR-038**: System MUST log parsing errors with source details when selectors fail; send alert notification; continue scraping other sources; display alert on admin dashboard
- **FR-039**: System MUST save articles with null/empty fields for missing optional metadata (images, authors, summary, category, tags); only title, content, and publish date are required fields
- **FR-040**: System MUST support an `archived` flag on articles; when source URL returns 404, article is automatically flagged as archived and hidden from public display; admins retain full view/management access

**Content Management**:
- **FR-008**: Admin MUST be able to view a paginated list of all scraped articles with filtering by source, category, and date
- **FR-009**: Admin MUST be able to search articles by title or content
- **FR-010**: Admin MUST be able to edit article title, summary, content, category, and tags
- **FR-011**: Admin MUST be able to manually trigger extraction for a specific URL from a supported source
- **FR-012**: Admin MUST be able to delete articles
- **FR-013**: System MUST store original content separately from AI rewritten content

**AI Rewriting**:
- **FR-014**: Admin MUST be able to trigger AI rewriting for any article
- **FR-015**: System MUST preserve original content when storing AI rewritten content
- **FR-016**: System MUST display both original and AI rewritten content versions in admin interface with clear labels
- **FR-037**: System MUST display immediate error message when AI rewriting fails or times out; admin must manually retry

**WordPress Integration**:
- **FR-017**: Admin MUST be able to manually export an article to WordPress
- **FR-018**: System MUST use AI rewritten content for WordPress export if available, otherwise use original content
- **FR-019**: System MUST track export status with `is_exported_to_wp` flag and `wp_post_id`
- **FR-020**: System MUST handle WordPress API errors and log failure details

**Authentication & Authorization**:
- **FR-021**: Admin portal MUST require authentication using Supabase Auth
- **FR-022**: Public site MUST be accessible without authentication
- **FR-023**: System MUST use a single super admin account (configured via environment variables)

**Public Interface**:
- **FR-024**: Public site MUST display articles in a magazine-style grid layout
- **FR-025**: Public site MUST support responsive design with breakpoints: mobile (320-767px), tablet (768-1023px), desktop (1024px+)
- **FR-026**: Public site MUST support UI language switching between English and Traditional Chinese for interface labels only
- **FR-027**: Public site MUST display article detail pages with full content, images, author, source, and publication date
- **FR-028**: Public site MUST support browsing articles by category
- **FR-029**: Public site MUST load pages in under 2 seconds

**Admin Interface**:
- **FR-030**: Admin portal MUST be displayed in Traditional Chinese only
- **FR-031**: Admin dashboard MUST display statistics: total articles count, recently scraped count, and extraction error count
- **FR-032**: Admin dashboard MUST provide quick action buttons to trigger extraction for each source
- **FR-033**: Admin dashboard MUST display recent extraction activity log with timestamp, source, status, and item count
- **FR-034**: Admin portal MUST adapt to mobile devices with scrollable tables converted to card layouts

**Automation**:
- **FR-035**: System MUST support scheduled automated extraction at configurable intervals (default: hourly)
- **FR-036**: Automated extraction MUST be triggered via secure API endpoint with cron job integration

### Key Entities

- **News Source**: Represents a news website (Oriental Daily, Ming Pao, HK01). Attributes: name, scraper key, base URL, active status, creation timestamp
- **News Article**: Central content entity. Required attributes: system ID, source reference, source article ID, URL, title, content, published date, creation timestamp, update timestamp. Optional attributes: summary, AI rewritten content, authors array, category, tags array, WordPress export status, WordPress post ID
- **News Image**: Images associated with articles. Attributes: image ID, article reference, URL, caption, featured flag, creation timestamp
- **Relationships**: One source has many articles; one article has many images

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Public users can browse and read articles within 2 seconds of page load on desktop and 3 seconds on mobile
- **SC-002**: System successfully extracts articles from all three sources with 95% success rate (excluding source website downtime)
- **SC-003**: Automated extraction runs every hour without manual intervention for 99% of scheduled runs
- **SC-004**: Admin can view, filter, and search through 1000+ articles without performance degradation
- **SC-005**: Public site layout adapts correctly across mobile (320px), tablet (768px), and desktop (1024px+) viewports
- **SC-006**: Language switcher changes UI labels within 1 second with no page reload
- **SC-007**: Admin can complete article editing workflow (find article, edit content, save) in under 2 minutes
- **SC-008**: AI rewriting completes within 30 seconds for articles up to 2000 words
- **SC-009**: WordPress export succeeds for 95% of attempts (excluding WordPress site downtime)
- **SC-010**: Zero duplicate articles exist in the database for the same source and source article ID
