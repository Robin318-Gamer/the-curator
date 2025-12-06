# Implementation Plan: WordPress Content Management Integration

**Feature ID**: 002-wordpress-publish  
**Status**: Implementation Planning  
**Last Updated**: December 5, 2025  
**Plan Version**: 1.0

---

## Executive Summary

This plan outlines the implementation of a WordPress content management system integrated into The Curator admin dashboard. The feature enables admins to publish, manage, edit, and delete articles on a WordPress site directly from The Curator interface while maintaining a local snapshot and audit trail.

**Estimated Effort**: 80-100 hours  
**Estimated Timeline**: 3-4 weeks  
**Target Release**: Q1 2026

---

## Tech Stack & Architecture

### Frontend Stack
- **Framework**: Next.js 14.2.0 (App Router)
- **UI**: React 18.3.0 with Tailwind CSS
- **Form Handling**: React Hook Form (recommended for validation)
- **HTTP Client**: Fetch API (built-in)
- **State Management**: React Context + Hooks
- **Code Standards**: Follow existing admin dashboard patterns

### Backend Stack
- **Runtime**: Node.js (via Next.js API routes)
- **API Framework**: Next.js API Routes
- **Database**: Supabase PostgreSQL
- **Authentication**: Supabase Auth (existing)
- **Encryption**: `crypto` module (Node.js built-in) or `@supabase/crypto`
- **HTTP Client**: `node-fetch` or `axios`

### Database
- **Provider**: Supabase PostgreSQL
- **ORM**: Direct SQL queries or Supabase JS client
- **Encryption**: Column-level encryption for sensitive data (WordPress credentials)

### External Integration
- **WordPress REST API**: v2.0+
- **Authentication Methods**: Basic Auth (username/password) or Bearer Token
- **Protocol**: HTTPS only

---

## Project Structure

```
the-curator/
├── app/
│   └── admin/
│       ├── wordpress-publisher/
│       │   ├── page.tsx                 # Main publisher & management page
│       │   ├── layout.tsx               # Layout for publisher section
│       │   └── components/
│       │       ├── PublisherForm.tsx    # Article form (new/edit/publish)
│       │       ├── PublishedList.tsx    # Published articles list
│       │       ├── EditArticleModal.tsx # Modal for editing existing articles
│       │       ├── DeleteConfirm.tsx    # Delete confirmation dialog
│       │       └── QuickActions.tsx     # Action buttons (Edit, View, Delete)
│       └── articles/
│           └── components/
│               └── PublishButton.tsx    # "Publish to WordPress" button (modify existing)
│
├── api/
│   └── admin/
│       └── wordpress/
│           ├── publish.ts              # POST endpoint for publishing articles
│           ├── update.ts               # PUT endpoint for republishing
│           ├── delete.ts               # DELETE endpoint for soft-deleting
│           ├── list.ts                 # GET endpoint for published articles
│           ├── config.ts               # GET/POST endpoint for configuration
│           └── validate.ts             # POST endpoint for connection validation
│
├── lib/
│   ├── wordpress/
│   │   ├── client.ts                   # WordPress API client
│   │   ├── auth.ts                     # WordPress authentication logic
│   │   ├── types.ts                    # WordPress API types
│   │   └── errors.ts                   # Error handling utilities
│   ├── db/
│   │   ├── wordpress.ts                # Database queries for WordPress tables
│   │   └── migrations/
│   │       └── 002_wordpress_tables.sql # Database schema migrations
│   └── encryption.ts                   # Encryption utilities for credentials
│
├── types/
│   ├── wordpress.ts                    # WordPress types and interfaces
│   └── curator.ts                      # Curator-specific types
│
└── database/
    └── schema/
        └── wordpress_schema.sql         # Schema DDL for WordPress integration
```

---

## Database Schema

### Table: `wordpress_config`
```sql
CREATE TABLE wordpress_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_url TEXT NOT NULL UNIQUE,
  auth_method VARCHAR(20) NOT NULL CHECK (auth_method IN ('password', 'token')),
  username TEXT,
  password_encrypted TEXT, -- encrypted at rest
  api_token_encrypted TEXT, -- encrypted at rest
  is_active BOOLEAN DEFAULT true,
  last_validated_at TIMESTAMPTZ,
  validation_status VARCHAR(50), -- 'valid', 'invalid', 'untested'
  validation_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);
```

### Table: `wordpress_published_articles`
```sql
CREATE TABLE wordpress_published_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  curator_article_id UUID, -- reference to source article if applicable
  
  -- Article content snapshot
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  tags TEXT[], -- array of tag names
  featured_image_url TEXT,
  author_id UUID REFERENCES auth.users(id),
  
  -- WordPress reference
  wp_post_id BIGINT NOT NULL,
  wp_post_url TEXT NOT NULL,
  wp_site_config_id UUID NOT NULL REFERENCES wordpress_config(id),
  
  -- Status tracking
  status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'published'
  sync_status VARCHAR(50) DEFAULT 'in_sync', -- 'in_sync', 'modified_locally', 'sync_pending'
  is_deleted BOOLEAN DEFAULT false,
  
  -- Audit fields
  published_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  wp_synced_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  
  -- Change tracking
  change_history JSONB DEFAULT '[]'::jsonb, -- array of changes
  
  UNIQUE(wp_site_config_id, wp_post_id)
);
```

### Table: `wordpress_publish_audit_log`
```sql
CREATE TABLE wordpress_publish_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES wordpress_published_articles(id),
  action VARCHAR(50) NOT NULL, -- 'publish', 'update', 'delete', 'restore'
  admin_user_id UUID NOT NULL REFERENCES auth.users(id),
  
  -- Data snapshots
  old_data JSONB,
  new_data JSONB,
  wp_response JSONB,
  
  -- Status
  status VARCHAR(50), -- 'success', 'failed', 'partial'
  error_message TEXT,
  
  -- Metadata
  ip_address INET,
  user_agent TEXT,
  environment VARCHAR(50), -- 'development', 'production'
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Indexes
```sql
CREATE INDEX idx_wp_articles_deleted ON wordpress_published_articles(is_deleted, updated_at DESC);
CREATE INDEX idx_wp_articles_site ON wordpress_published_articles(wp_site_config_id, is_deleted);
CREATE INDEX idx_wp_articles_title ON wordpress_published_articles(title) WHERE is_deleted = false;
CREATE INDEX idx_wp_audit_article ON wordpress_publish_audit_log(article_id, created_at DESC);
CREATE INDEX idx_wp_audit_action ON wordpress_publish_audit_log(action, created_at DESC);
CREATE INDEX idx_wp_audit_user ON wordpress_publish_audit_log(admin_user_id, created_at DESC);
```

---

## Implementation Phases

### Phase 1: Foundation & Setup (Week 1)
**Goal**: Set up database schema, encryption utilities, and WordPress API client  
**Effort**: 20 hours  
**Dependencies**: None

**Tasks**:
1. Create database migration for WordPress tables
2. Implement encryption utilities for credentials
3. Build WordPress API client library
4. Set up error handling and logging
5. Create database query layer
6. Write API client unit tests
7. Document WordPress API integration patterns

**Deliverables**:
- ✅ Database schema created and migrated
- ✅ WordPress client library ready to use
- ✅ Error handling patterns established
- ✅ Basic unit tests passing

---

### Phase 2: Core API Endpoints (Week 1-2)
**Goal**: Build backend API endpoints for all operations  
**Effort**: 25 hours  
**Dependencies**: Phase 1

**Tasks**:
1. Implement `/api/admin/wordpress/config` (GET/POST) - Connection configuration
2. Implement `/api/admin/wordpress/validate` (POST) - Connection validation
3. Implement `/api/admin/wordpress/publish` (POST) - Publish new articles
4. Implement `/api/admin/wordpress/update` (PUT) - Republish updated articles
5. Implement `/api/admin/wordpress/delete` (DELETE) - Soft-delete articles
6. Implement `/api/admin/wordpress/list` (GET) - Fetch published articles
7. Add authentication middleware
8. Add rate limiting
9. Add request/response logging
10. Write integration tests for all endpoints

**Deliverables**:
- ✅ All 6 API endpoints functional
- ✅ Authentication and authorization working
- ✅ Error responses consistent and user-friendly
- ✅ Rate limiting in place
- ✅ Integration tests passing

---

### Phase 3: Frontend - Configuration & Setup (Week 2)
**Goal**: Build WordPress configuration interface  
**Effort**: 15 hours  
**Dependencies**: Phase 2

**Tasks**:
1. Create WordPress configuration form component
2. Implement connection validation UI
3. Add credential input with secure storage confirmation
4. Create configuration page layout
5. Implement form validation (client-side)
6. Add error display and success messages
7. Create credential editing workflow
8. Add connection status indicator
9. Write component tests

**Deliverables**:
- ✅ Configuration page accessible from admin menu
- ✅ Admins can securely enter WordPress credentials
- ✅ Connection validation works with clear feedback
- ✅ Error messages are user-friendly

---

### Phase 4: Frontend - Publisher Form (Week 2-3)
**Goal**: Build article publishing form component  
**Effort**: 20 hours  
**Dependencies**: Phase 2, Phase 3

**Tasks**:
1. Create publisher form component with all fields
2. Implement form validation (client + server)
3. Add rich text editor (optional: use simple textarea for MVP)
4. Implement category/tags dropdown (fetched from WordPress)
5. Add featured image URL input with preview
6. Create "Publish" button with loading state
7. Implement success/error handling and notifications
8. Add article preview modal (optional: defer to Phase 5)
9. Create "Republish" vs "Publish" logic
10. Add edit form population from article data
11. Write component and integration tests

**Deliverables**:
- ✅ Publisher form fully functional
- ✅ New articles can be published to WordPress
- ✅ Existing articles can be edited and republished
- ✅ User-friendly feedback for all operations
- ✅ Form validation prevents invalid submissions

---

### Phase 5: Frontend - Published Articles Management (Week 3)
**Goal**: Build published articles list and management interface  
**Effort**: 20 hours  
**Dependencies**: Phase 2, Phase 4

**Tasks**:
1. Create published articles list component
2. Implement search functionality
3. Implement filtering (by date range, category, status)
4. Add sorting by title, date, status
5. Create quick action buttons (Edit, View, Delete)
6. Implement "Edit" action (open in publisher form)
7. Implement "View on WordPress" action (link to post)
8. Create delete confirmation dialog
9. Implement soft-delete functionality
10. Add archive/restore functionality
11. Implement pagination or infinite scroll
12. Add empty state messaging
13. Write component and integration tests

**Deliverables**:
- ✅ Published articles list accessible from admin menu
- ✅ Search and filter working correctly
- ✅ Quick actions functional
- ✅ Edit/delete workflows smooth
- ✅ Archive management in place

---

### Phase 6: Integration with Existing Articles List (Week 3-4)
**Goal**: Add "Publish to WordPress" button to existing articles list  
**Effort**: 10 hours  
**Dependencies**: Phase 2, Phase 4

**Tasks**:
1. Locate and examine existing articles list component
2. Add "Publish to WordPress" button/action to each article
3. Implement copy-to-publisher workflow
4. Test button integration with existing components
5. Ensure styling matches existing design
6. Add action confirmation if needed
7. Write integration tests

**Deliverables**:
- ✅ "Publish to WordPress" button visible in articles list
- ✅ One-click workflow to copy article to publisher form
- ✅ Seamless integration with existing UI

---

### Phase 7: UI Polish & Navigation (Week 4)
**Goal**: Refine UI, add navigation, and improve user experience  
**Effort**: 10 hours  
**Dependencies**: Phase 3-6

**Tasks**:
1. Add WordPress Publisher to admin main menu
2. Create navigation breadcrumbs
3. Add admin toolbar shortcuts
4. Refine responsive design for mobile
5. Add loading skeletons for list/form
6. Improve error message styling
7. Add success toast notifications
8. Create keyboard shortcuts (optional)
9. Audit accessibility (WCAG compliance)
10. Polish animations and transitions

**Deliverables**:
- ✅ Seamless navigation throughout feature
- ✅ Responsive design works on all devices
- ✅ Professional look and feel
- ✅ Accessibility standards met

---

### Phase 8: Testing & Quality Assurance (Week 4)
**Goal**: Comprehensive testing and bug fixes  
**Effort**: 10 hours  
**Dependencies**: Phase 1-7

**Tasks**:
1. Run full integration test suite
2. Test all error scenarios
3. Test edge cases (large content, special characters, etc.)
4. Test WordPress API failures and retries
5. Security testing (credential exposure, XSS, CSRF)
6. Performance testing (large article lists)
7. Cross-browser testing
8. User acceptance testing with sample data
9. Bug fixes and refinements
10. Performance optimization if needed

**Deliverables**:
- ✅ All tests passing
- ✅ No security vulnerabilities
- ✅ Performance acceptable
- ✅ Ready for production

---

### Phase 9: Documentation & Deployment (Week 4)
**Goal**: Document feature and prepare for production  
**Effort**: 5 hours  
**Dependencies**: Phase 1-8

**Tasks**:
1. Write admin user guide (how to configure, publish, manage)
2. Document WordPress setup requirements
3. Create API documentation
4. Write developer guide for future maintenance
5. Create troubleshooting guide
6. Set up monitoring/alerting for publish operations
7. Prepare deployment checklist
8. Deploy to staging environment
9. Perform final smoke tests
10. Deploy to production

**Deliverables**:
- ✅ Complete user documentation
- ✅ Developer documentation
- ✅ Feature deployed and live
- ✅ Monitoring in place

---

## Task Breakdown by Phase

### Phase 1: Foundation & Setup
- [ ] T001 Create database migration for WordPress tables
- [ ] T002 Implement AES-256 encryption utilities for credentials
- [ ] T003 Build WordPress REST API client library with auth support
- [ ] T004 Implement error handling and exception logging patterns
- [ ] T005 Create database query layer for WordPress tables
- [ ] T006 Write unit tests for WordPress client library
- [ ] T007 Document WordPress API integration patterns

### Phase 2: Core API Endpoints
- [ ] T008 Build `/api/admin/wordpress/config` endpoint (GET/POST)
- [ ] T009 Build `/api/admin/wordpress/validate` endpoint (POST)
- [ ] T010 Build `/api/admin/wordpress/publish` endpoint (POST)
- [ ] T011 Build `/api/admin/wordpress/update` endpoint (PUT)
- [ ] T012 Build `/api/admin/wordpress/delete` endpoint (DELETE)
- [ ] T013 Build `/api/admin/wordpress/list` endpoint (GET)
- [ ] T014 Add authentication middleware to all endpoints
- [ ] T015 Implement rate limiting on publish endpoints
- [ ] T016 Add comprehensive request/response logging
- [ ] T017 Write integration tests for all API endpoints

### Phase 3: Frontend - Configuration
- [ ] T018 Create WordPress configuration form component
- [ ] T019 Implement connection validation UI with feedback
- [ ] T020 Build credential input with secure storage messaging
- [ ] T021 Create configuration page with proper layout
- [ ] T022 Implement client-side form validation
- [ ] T023 Add error display and success notifications
- [ ] T024 Create credential editing workflow
- [ ] T025 Add connection status indicator component
- [ ] T026 Write component tests for configuration UI

### Phase 4: Frontend - Publisher Form
- [ ] T027 Build publisher form component with all fields
- [ ] T028 Implement client and server-side validation
- [ ] T029 Build category/tags dropdown (fetch from WordPress)
- [ ] T030 Add featured image URL input with preview
- [ ] T031 Create "Publish" button with loading state
- [ ] T032 Implement success/error handling and notifications
- [ ] T033 Add article preview modal component
- [ ] T034 Create "Republish" vs "Publish" button logic
- [ ] T035 Implement edit form population from article data
- [ ] T036 Write component and integration tests for publisher

### Phase 5: Frontend - Published Articles Management
- [ ] T037 Build published articles list component
- [ ] T038 Implement search by title/content functionality
- [ ] T039 Implement filter by date range
- [ ] T040 Implement filter by category/tags
- [ ] T041 Implement filter by publication status
- [ ] T042 Add sorting capabilities (title, date, status)
- [ ] T043 Create quick action buttons (Edit, View, Delete)
- [ ] T044 Implement "Edit" action workflow
- [ ] T045 Implement "View on WordPress" action
- [ ] T046 Create delete confirmation dialog
- [ ] T047 Implement soft-delete functionality
- [ ] T048 Add archive/restore functionality
- [ ] T049 Implement pagination or infinite scroll
- [ ] T050 Add empty state messaging
- [ ] T051 Write component and integration tests

### Phase 6: Integration with Existing Articles List
- [ ] T052 Locate and examine existing articles list component
- [ ] T053 Add "Publish to WordPress" button to article row
- [ ] T054 Implement copy-to-publisher workflow
- [ ] T055 Integrate with publisher form (pre-populate)
- [ ] T056 Test button functionality end-to-end
- [ ] T057 Ensure styling matches existing design
- [ ] T058 Write integration tests for articles list integration

### Phase 7: UI Polish & Navigation
- [ ] T059 Add WordPress Publisher menu item to admin navigation
- [ ] T060 Create breadcrumb navigation component
- [ ] T061 Add admin dashboard shortcuts
- [ ] T062 Refine responsive design (mobile, tablet, desktop)
- [ ] T063 Create loading skeleton components
- [ ] T064 Refine error message display
- [ ] T065 Implement toast notification system
- [ ] T066 Add keyboard shortcuts (optional)
- [ ] T067 Audit and fix accessibility issues (WCAG)
- [ ] T068 Polish animations and transitions

### Phase 8: Testing & Quality Assurance
- [ ] T069 Run full integration test suite
- [ ] T070 Test all error scenarios and edge cases
- [ ] T071 Test WordPress API failures and retry logic
- [ ] T072 Security testing (XSS, CSRF, credential exposure)
- [ ] T073 Performance testing with large article lists
- [ ] T074 Cross-browser compatibility testing
- [ ] T075 User acceptance testing with sample data
- [ ] T076 Fix bugs and refinements
- [ ] T077 Optimize performance if needed
- [ ] T078 Document known limitations

### Phase 9: Documentation & Deployment
- [ ] T079 Write admin user guide
- [ ] T080 Document WordPress configuration steps
- [ ] T081 Write API documentation for developers
- [ ] T082 Create developer maintenance guide
- [ ] T083 Write troubleshooting guide
- [ ] T084 Set up monitoring and alerting
- [ ] T085 Create deployment checklist
- [ ] T086 Deploy to staging environment
- [ ] T087 Perform final smoke tests
- [ ] T088 Deploy to production

---

## Implementation Strategy

### MVP Scope (Weeks 1-3)
**Focus**: Core publishing functionality with basic management

Include:
- ✅ Phase 1: Foundation setup
- ✅ Phase 2: API endpoints
- ✅ Phase 3: Configuration UI
- ✅ Phase 4: Publisher form
- ✅ Phase 5: Basic published articles list (without archive)

Exclude:
- ❌ Phase 6: Article list integration (can be added in Phase 2)
- ❌ Advanced filtering and search
- ❌ Archive/restore functionality
- ❌ Preview modal

**MVP Deliverables**:
- Admins can configure WordPress connection
- Admins can publish new articles to WordPress
- Admins can edit and republish articles
- Admins can view all published articles
- Admins can soft-delete articles

---

### Phase 2: Enhancements (Week 4+)
Add after MVP validation:
- Integration with existing articles list ("Publish" button)
- Advanced search and filtering
- Archive/restore functionality
- Article preview
- Bulk operations (future)

---

## Risk Mitigation

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|-----------|
| WordPress API changes | High | Low | Use stable v2 API, version pinning |
| Network timeouts | Medium | Medium | Implement retry logic with exponential backoff |
| Credential exposure | Critical | Low | Encrypt at rest, never log, HTTPS only |
| Large content performance | Medium | Medium | Implement pagination, optimize queries |
| WordPress site downtime | Medium | Medium | Graceful degradation, error messaging |
| Data inconsistency | High | Low | Transaction management, audit trail |

---

## Success Metrics

1. **Functionality**: All core operations (publish, manage, edit, delete) work reliably
2. **Performance**: Publish operation completes in < 3 seconds average
3. **Reliability**: 99% successful operations (< 1% failure rate)
4. **User Adoption**: Feature used for 50%+ of article publications within 1 month
5. **Security**: Zero credential exposure incidents
6. **Maintainability**: Code coverage > 80%, documentation complete

---

## Assumptions & Constraints

### Assumptions
1. WordPress 6.0+ with REST API enabled on target site
2. WordPress site allows HTTPS requests from Curator domain
3. No WordPress plugin conflicts with REST API
4. Curator DB connection remains stable
5. Team has access to target WordPress site for testing

### Constraints
1. Single WordPress site per Curator instance (MVP)
2. Articles published as Draft (admin publishes manually if needed)
3. No scheduled publishing (immediate only)
4. No draft auto-saving
5. No collaborative editing
6. No image upload to WordPress (URL-based only)

---

## Dependencies & Prerequisites

### External Dependencies
- WordPress 6.0+ with REST API v2
- Supabase PostgreSQL instance
- Node.js 18+

### Internal Dependencies
- Existing admin authentication system
- Existing articles list component
- Existing styling/component library
- Exception logging infrastructure

---

## Next Steps

1. **Review & Approve Plan**: Get stakeholder sign-off
2. **Set Up Development Environment**: Prepare test WordPress site
3. **Create Feature Branch**: `002-wordpress-publish-impl`
4. **Begin Phase 1**: Database schema and utilities
5. **Weekly Status Updates**: Track progress against phases

---

## Document Version History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-05 | AI Assistant | Initial implementation plan |

