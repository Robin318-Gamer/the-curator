# Development Decisions Log

**Feature**: The Curator - News Aggregation Platform  
**Branch**: `001-news-aggregator`  
**Last Updated**: 2025-12-03  

This log captures all runtime decisions, issues encountered, workarounds, and architectural choices made during development. Use this log to understand the "why" behind implementation decisions and to rebuild the application correctly from documentation.

**Log Format**: Each entry includes timestamp, category, issue description, decision made, rationale, and affected code areas.

---

## Decision Entry Template

```
### Decision #XXX: [Short Title]
- **Date**: YYYY-MM-DD HH:MM UTC
- **Category**: [Database | API | UI | Authentication | Performance | Integration | Other]
- **Issue**: [What problem or question arose?]
- **Decision**: [What was decided?]
- **Rationale**: [Why this choice over alternatives?]
- **Affected Areas**: [Files, components, or systems impacted]
- **Status**: [Active | Superseded | Under Review]
- **Related Issues/PRs**: [Links if applicable]
- **Notes**: [Any additional context or follow-up items]
```

---

## Active Decisions

### Decision #001: Development Decision Capture Strategy
- **Date**: 2025-12-03 12:00 UTC
- **Category**: Process / Documentation
- **Issue**: Need to capture all runtime decisions made during development so the application can be rebuilt from documentation if dropped mid-development
- **Decision**: Create a dedicated `DECISIONS_LOG.md` file in `/specs/001-news-aggregator/` to record all development decisions with structured metadata (timestamp, issue, decision, rationale, affected code areas)
- **Rationale**: Provides a single source of truth for implementation trade-offs, separate from the main spec to avoid bloat, easy to search and reference during rebuilds, naturally captures context and evolution of decisions over time
- **Affected Areas**: Specification process, implementation workflow, project documentation structure
- **Status**: Active
- **Related Issues/PRs**: N/A
- **Notes**: Main `spec.md` should reference this log as the definitive record for understanding "why" implementation choices were made. Update this log incrementally as development progresses.

### Decision #002: Data Retention & Privacy Compliance
- **Date**: 2025-12-03 12:05 UTC
- **Category**: Compliance / Data Management
- **Issue**: System needs explicit policy on data retention and privacy compliance (no guidance on GDPR, PDPO, or indefinite retention)
- **Decision**: No regulatory constraints; keep all article data indefinitely; no privacy compliance requirements; focus only on functional delivery
- **Rationale**: Simplifies architecture and deployment; keeps scope focused on core news aggregation functionality; privacy/compliance can be added in future phases if needed
- **Affected Areas**: Database schema (no soft-delete/archive requirement for compliance), API contracts, admin interface (no data deletion UI needed initially)
- **Status**: Active
- **Related Issues/PRs**: N/A
- **Notes**: If PDPO or GDPR compliance becomes required later, revisit this decision and implement appropriate data retention policies and deletion workflows.

### Decision #003: Concurrent Edit Conflict Resolution
- **Date**: 2025-12-03 12:10 UTC
- **Category**: Database / Data Consistency
- **Issue**: Multiple admins may edit the same article simultaneously; no conflict resolution strategy defined
- **Decision**: Last-write-wins (LWW) approach; no locking mechanism; later admin save overwrites earlier saves without warning
- **Rationale**: Simple implementation (no state management needed); aligns with small team/infrequent concurrent editing scenario; avoids blocking/complexity of pessimistic or optimistic locking
- **Affected Areas**: Article edit endpoint (no version field or conflict detection logic), admin UI (no lock indicator or merge workflow)
- **Status**: Active
- **Related Issues/PRs**: N/A
- **Notes**: Admin team must coordinate externally to avoid lost edits. If concurrent editing becomes frequent, upgrade to optimistic locking (version field + conflict detection UI).

### Decision #004: Authentication-Required News Sources
- **Date**: 2025-12-03 12:15 UTC
- **Category**: Scraper / Integration
- **Issue**: Specification questions how system handles news sources requiring authentication or rate limiting
- **Decision**: Out-of-scope for Phase 1; system only supports unauthenticated sources (Oriental Daily, Ming Pao, HK01); skip sources requiring authentication
- **Rationale**: Target sources don't require auth; reduces complexity and credential management burden; keeps MVP scope lean; can be revisited for Phase 2 if needed
- **Affected Areas**: Scraper engine (no session/cookie management), credentials storage (no secure credential vault needed initially), source configuration
- **Status**: Active
- **Related Issues/PRs**: N/A
- **Notes**: If future sources require authentication, implement session-based auth flow with secure credential storage (e.g., Supabase vault or AWS Secrets Manager).

### Decision #005: Handling 404 Errors on Article Source URLs
- **Date**: 2025-12-03 12:20 UTC
- **Category**: Content Management / Data Lifecycle
- **Issue**: Original news source URLs may become unavailable (404); system needs policy for handling archived/removed content
- **Decision**: Mark articles as archived with `archived=true` flag when source URL returns 404; hide archived articles from public display; admins retain full access to view/manage archived content
- **Rationale**: Preserves article data (core value of aggregation); removes stale content from public view (good UX); allows admin audit trail; avoids data loss while maintaining clean public interface
- **Affected Areas**: Database schema (add `archived` boolean field to news_articles table), scraper health checks (detect 404s and set flag), API filtering (public endpoint excludes archived=true), admin interface (show archived articles with special indicator)
- **Status**: Active
- **Related Issues/PRs**: N/A
- **Notes**: Consider adding admin workflow to bulk archive or reactivate articles; implement scheduled health checks to detect newly dead links.

### Decision #006: Scraper Test Page Development Strategy
- **Date**: 2025-12-04 12:00 UTC
- **Category**: Development / Testing / Scraper
- **Issue**: Need to validate scraper parsing logic with real HTML before deploying to production; manual testing inefficient; selectors may break if HTML structure changes; existing `the-curator/` application already has UX/UI mockups and database connection demo; risk of leaking test/dev pages to production
- **Decision**: Build scraper test functionality directly into existing `the-curator/` application at `/admin/scraper-test` route (admin-only, not public); leverage existing database connection, auth, and UI components; test page loads sample HTML files from `SampleDate/` folder; displays raw HTML and parsed output side-by-side; includes validation checklist comparing extracted vs. expected data; allows export of parsed JSON for database testing. Route protected by existing admin authentication; no separate temp application needed.
- **Rationale**: Reuses existing infrastructure (auth, DB, components); avoids code duplication between temp and main app; admin-only route naturally protected from public access; test page can later be converted to production admin tool for "manual scraping trigger"; no risk of leaking test pages since admin routes already require authentication; simplifies deployment (single app vs. two apps)
- **Affected Areas**: New route `the-curator/app/admin/scraper-test/page.tsx`, new API endpoint `the-curator/app/api/admin/scraper-test/parse/route.ts`, scraper implementations (`lib/scrapers/hk01.ts`, `mingPao.ts`, `orientalDaily.ts`), existing admin layout (add navigation link)
- **Status**: Active
- **Related Issues/PRs**: N/A
- **Notes**: Sample data files (Article1Data.md, Article1SourceCode.txt, etc.) in `SampleDate/` folder provide ground truth for validation. Test page accessible only to authenticated admins; can be repurposed as production admin tool for manual URL scraping. No need for separate temp application or cleanup before production deployment.

---

## Archived Decisions

(Entries moved here when superseded or resolved)

---

## Quick Reference by Category

- **Database**: [Decision #003] (Concurrent edits - LWW), [Decision #005] (404 handling - archived flag)
- **API**: [Decision #003] (Article edit endpoint - no versioning)
- **UI/Admin**: [Decision #003] (No conflict indicator), [Decision #005] (Archived articles display)
- **Authentication**: [Decision #004] (Out-of-scope for Phase 1)
- **Performance**: (none yet)
- **Integration**: [Decision #004] (Scraper - unauthenticated sources only)
- **Scraper/Testing**: [Decision #006] (Dev test page for scraper validation)
- **Process/Documentation**: [Decision #001] (Decision logging strategy)
- **Compliance**: [Decision #002] (No regulatory constraints)

