# WordPress Content Management Integration

**Feature ID**: 002-wordpress-publish  
**Status**: In Specification  
**Last Updated**: December 5, 2025

## Overview

Provide admin users with an integrated interface to manage and publish articles to a WordPress website directly from The Curator admin dashboard. This feature allows admins to:
- **Publish**: Post new articles with title and content to WordPress
- **Manage**: View, search, and filter all published articles
- **Modify**: Edit published articles and republish changes to WordPress
- **Delete**: Soft-delete articles from Curator (with option to remove from WordPress)

All published articles are captured in The Curator database as a reference snapshot, maintaining a local copy alongside the WordPress link for full control and audit history.

---

## Clarifications

### Session 2025-12-05

- **Q1: Content Modification Workflow** → **Option C**: Capture reference + modification UI in Curator + explicit "Republish" button (one-step, manual confirmation). This approach keeps content management centralized in The Curator with full audit history while maintaining explicit control.

- **Q2: Content Deletion Capability** → **Option A**: Soft delete in Curator DB (mark as deleted, never published to WordPress) with option to permanently delete from WordPress via explicit action. This reduces risk and maintains audit history.

- **Q3: Published Articles List View** → **Option B**: Rich list/table with search, filters (by date/category), and inline quick actions (Edit, View, Delete buttons). This provides an intuitive dashboard for managing content.

- **Q4: Data Storage for Published Articles** → **Option A**: Store full article snapshot (title, content, category, tags) + WordPress reference (post ID, URL, sync timestamp). This gives full control and audit history while maintaining the WordPress link.

- **Q5: Content Source for New Articles** → **Option B with specific workflow**: Articles can come from both existing Curator articles AND new direct creation. Workflow: Articles list → "Publish to WordPress" button → Copy to publisher form → Edit if needed → Click "Publish" → Article saved as reference in Curator DB + published to WordPress.

---

## Business Value

- **Workflow Efficiency**: Reduce manual steps by publishing articles directly from The Curator rather than switching to WordPress admin
- **Centralized Management**: Keep all content operations in one admin dashboard
- **Quality Control**: Enable review and publishing workflows for curated news content
- **Time Savings**: Fast article publishing with bulk operations support

---

## User Scenarios & Testing

### Scenario 1: Publish Article from Curator Articles List
**Actor**: News Admin  
**Given**: Admin is viewing the articles list in Curator admin portal  
**When**: Admin clicks "Publish to WordPress" button on an article  
**Then**: Article is copied to the WordPress publisher form, admin can edit if needed, and click "Publish" to post to WordPress  
**Acceptance Criteria**:
- Article title and content populate the publisher form
- Admin can edit title/content before publishing
- "Publish" button sends article to WordPress and stores reference in Curator DB
- Success message displays with link to published article on WordPress
- Article appears on WordPress site within 2 seconds
- Article reference is saved in Curator for future management

### Scenario 2: Create and Publish New Article Directly
**Actor**: News Admin  
**Given**: Admin is on the WordPress Publisher page  
**When**: Admin fills in article title and content (not from existing article), then clicks publish  
**Then**: New article is created on WordPress and reference is saved in Curator DB  
**Acceptance Criteria**:
- Form validates title and content fields before submission
- Success message displays with link to published article
- Article reference is saved for future management

### Scenario 3: View and Manage Published Articles
**Actor**: News Admin  
**Given**: Admin is on the Published Articles management page  
**When**: Admin searches, filters, or views the list of published articles  
**Then**: Rich list displays with search/filter capabilities and quick action buttons  
**Acceptance Criteria**:
- List shows: Article Title, Published Date, WordPress Post ID, Publication Status
- Search by title or content snippet
- Filter by date range and category
- Quick action buttons: Edit, View on WordPress, Delete
- Pagination or infinite scroll for large lists

### Scenario 4: Modify and Republish Article
**Actor**: News Admin  
**Given**: Admin is viewing a published article in the management list  
**When**: Admin clicks "Edit", modifies the title or content, then clicks "Republish"  
**Then**: Changes are updated in Curator DB and republished to WordPress (overwrites existing post)  
**Acceptance Criteria**:
- Edit form loads with current article data
- Form validates required fields
- "Republish" button requires explicit confirmation before updating WordPress
- Success message shows article was updated on WordPress
- Previous version history is retained in Curator DB (audit trail)

### Scenario 5: Soft Delete Article
**Actor**: News Admin  
**Given**: Admin is viewing a published article  
**When**: Admin clicks "Delete" and confirms the action  
**Then**: Article is soft-deleted in Curator (marked as deleted, hidden from list) but remains on WordPress  
**Acceptance Criteria**:
- Confirmation dialog explains article will be deleted locally but remain on WordPress
- Option to also delete from WordPress in same action (separate confirmation)
- Soft-deleted articles can be recovered/restored (hidden in archive view)
- No data loss

### Scenario 6: Error Handling on Failed Publish
**Actor**: News Admin  
**Given**: Admin attempts to publish an article with invalid WordPress credentials  
**When**: Publish button is clicked  
**Then**: Clear error message explains the problem and provides next steps  
**Acceptance Criteria**:
- Error message is user-friendly (no technical jargon)
- Admin can retry after fixing the issue
- Error is logged with full details for debugging

---

## Functional Requirements

### FR1: WordPress Connection Configuration
- Admin users must be able to configure WordPress site URL and API credentials (username/password or API token)
- Connection settings must be securely stored in Supabase and not exposed in client-side code
- System must validate connection before allowing publish operations
- Store connection with encryption at rest

### FR2: Publish to WordPress Button in Articles List
- Add "Publish to WordPress" button/action to existing Curator articles list
- When clicked, article is copied to the WordPress publisher form
- Admin can edit article before publishing (title, content, category, tags, featured image)
- Must work from any article list view (all articles, by category, by source, search results)

### FR3: WordPress Publisher Form
- Provide a form with fields for:
  - Article Title (required, max 255 characters)
  - Article Content (required, max 50,000 characters)
  - Category/Tags (optional, searchable from existing WordPress categories)
  - Featured Image URL (optional)
  - Author (optional, defaults to authenticated admin)
- Form must include clear field labels and help text
- "Publish" button should show loading state during publishing
- Support publishing articles from two sources:
  - Copied from existing Curator articles (pre-populated form)
  - New articles created directly in publisher form

### FR4: Publish to WordPress API Integration
- On form submission, send article data to WordPress REST API
- Create article as a Draft post on WordPress
- Capture WordPress response including:
  - WordPress Post ID
  - WordPress Post URL
  - Publication timestamp
- Store article snapshot and WordPress reference in Curator database

### FR5: Article Storage in Curator Database
- Store full snapshot of published article including:
  - Article Title
  - Article Content
  - Category/Tags
  - Featured Image URL
  - WordPress Post ID
  - WordPress Post URL
  - Initial publication timestamp
  - Last updated timestamp
  - Publication status (Draft/Published)
  - Sync status with WordPress
- Store as a publishable record that tracks local version vs WordPress version

### FR6: View and Manage Published Articles
- Display a rich, searchable/filterable list of all published articles
- List view must show:
  - Article Title
  - Publication Date
  - WordPress Post ID
  - Status indicator (Draft/Published/Modified Locally)
- Search by article title or content
- Filter by:
  - Date range (published date)
  - Category/Tags
  - Publication status
- Inline quick action buttons:
  - **Edit**: Open article in publisher form to modify
  - **View on WordPress**: Link to published post on WordPress
  - **Delete**: Soft-delete from Curator

### FR7: Modify and Republish Articles
- "Edit" action loads article data into publisher form
- Admin can modify title, content, category, tags, featured image
- "Republish" button (instead of "Publish") explicitly updates WordPress post
- Republish requires explicit confirmation before updating WordPress
- Track edit history and maintain audit trail of changes
- Mark article as "Modified Locally" if not yet republished
- After republish, update "Last Updated" timestamp and sync status

### FR8: Delete Articles
- Soft delete in Curator DB (mark record as deleted, remove from active lists)
- Soft-deleted articles move to archive/trash view
- Option to permanently delete from WordPress in same action (with separate confirmation)
- Maintain audit log of deletions
- Support restore/recovery of soft-deleted articles from archive

### FR9: Error Handling & Validation
- Validate all required fields client-side with clear error messages
- Handle network failures gracefully with retry options
- Validate WordPress connection before attempting publish
- Log detailed error information using existing exception logging pattern
- Display user-friendly error messages (hide technical details)
- Provide actionable next steps for common errors (invalid credentials, network timeout, etc.)

### FR10: Security & Permissions
- Only authenticated admin users can access WordPress publisher
- WordPress credentials stored encrypted in Supabase
- API keys and tokens never logged or exposed in browser console
- Implement Supabase RLS policies for access control
- Audit logging for all publish/modify/delete operations

---

## Success Criteria

1. **Publish Workflow**: Admin can publish an article from Curator articles list to WordPress in under 30 seconds (copy → edit → publish)
2. **Management Capability**: Admin can view, search, filter, edit, and delete published articles from a single unified interface
3. **Modification Control**: Published articles can be modified and republished to WordPress with explicit confirmation
4. **Data Capture**: All published articles are captured in Curator DB with full snapshot and WordPress reference
5. **Reliability**: 99% of publish operations complete successfully under normal network conditions
6. **User Experience**: All error messages are clear and actionable; no technical jargon or stack traces shown
7. **Performance**: Article appears on WordPress website within 2 seconds of successful API call
8. **Security**: WordPress credentials are never logged or exposed in browser console
9. **Audit Trail**: All publish/modify/delete operations are logged for compliance and debugging
10. **Navigation**: WordPress publisher is accessible from Articles list AND Admin dashboard main menu
11. **Data Integrity**: Soft-deleted articles retain full audit history; can be recovered if needed

---

## Key Entities

### Article (Curator Published Record)
- **ID**: UUID primary key
- **Title**: String (max 255 characters)
- **Content**: String (max 50,000 characters)
- **Category**: Optional reference to WordPress category
- **Tags**: Optional array of tag names
- **Featured Image URL**: Optional URL string
- **Author ID**: Reference to authenticated admin user
- **WordPress Post ID**: External reference to WordPress post
- **WordPress Post URL**: Full URL to published post on WordPress
- **Status**: "Draft" | "Published"
- **Sync Status**: "In Sync" | "Modified Locally" | "Sync Pending"
- **Is Deleted**: Boolean (soft delete flag)
- **Published At**: DateTime (initial publication)
- **Updated At**: DateTime (last modification in Curator)
- **Wordpress Synced At**: DateTime (last sync to WordPress)
- **Change History**: JSON (tracks edits and changes)

### WordPress Configuration
- **ID**: UUID primary key
- **Site URL**: String (base URL of WordPress site)
- **Authentication Method**: "password" | "token"
- **Username**: String (if password auth, encrypted)
- **Password**: String (encrypted, never logged)
- **API Token**: String (encrypted, never logged)
- **Created At**: DateTime
- **Last Validated At**: DateTime

### Publishing Audit Log
- **ID**: UUID primary key
- **Article ID**: Reference to Curator article
- **Action**: "publish" | "update" | "delete" | "restore"
- **Admin User ID**: Reference to admin who performed action
- **Old Data**: JSON snapshot of previous state (before modification)
- **New Data**: JSON snapshot of new state
- **WordPress Response**: JSON (WordPress API response)
- **Status**: "success" | "failed"
- **Error Message**: String (if failed)
- **Timestamp**: DateTime
- **Environment**: "development" | "production"

---

## Assumptions

1. **WordPress Version**: Target WordPress 6.0+ with REST API enabled
2. **Authentication**: WordPress site has user account configured for API access
3. **Content Format**: Article content is plain text or HTML; complex formatting conversion is out of scope
4. **Images**: Featured images are provided via URL; image upload to WordPress is out of scope for MVP
5. **Categories**: Existing WordPress categories are fetched from WordPress when form loads
6. **Permissions**: Only authenticated admin users with service role access can use this feature
7. **API Rate Limiting**: WordPress site allows at least 10 requests per second
8. **CORS**: WordPress site or admin must allow CORS requests from The Curator domain
9. **Data Sovereignty**: Curator DB is source of truth; WordPress is publication target only
10. **Editing Workflow**: Modifications made in Curator do not automatically sync to WordPress (explicit republish required)
11. **Deletion Policy**: Soft-delete in Curator is independent from WordPress (manual action required to delete from WordPress)

---

## Out of Scope

- Fetching/syncing existing content from WordPress into Curator (WordPress is publish-only target)
- Full WordPress content editing features (custom fields, blocks, etc.)
- Scheduling articles for future publication
- Media library management or image uploads (URL-based only)
- Draft auto-saving
- Collaborative editing features (single-editor workflow)
- Publishing to multiple WordPress sites simultaneously
- SEO optimization tools
- Article analytics or engagement tracking
- WordPress post status management (articles are always Draft when published from Curator)
- Hard-delete (permanent removal) of WordPress posts directly (manual action via WordPress admin)

---

## Dependencies

- Existing admin authentication system (already in place)
- Existing articles list view in admin portal
- Supabase connection for storing WordPress configuration and published article references
- WordPress REST API v2+ on target WordPress site
- HTTP client library for API calls (already in project)
- Existing exception logging infrastructure for error tracking

## Implementation Notes

### Pages & Routes
- **Admin Articles List** (existing, modify): Add "Publish to WordPress" button/action to each article
- **/admin/wordpress-publisher**: New page for WordPress publisher form and published articles management
- **/api/admin/wordpress/publish**: New API route for publishing articles to WordPress
- **/api/admin/wordpress/update**: New API route for updating/republishing articles
- **/api/admin/wordpress/delete**: New API route for soft-deleting articles
- **/api/admin/wordpress/config**: New API route for WordPress connection management

### Database Schema
- Create `wordpress_published_articles` table (with snapshot of article data and WordPress reference)
- Create `wordpress_config` table (encrypted credentials)
- Create `wordpress_publish_audit_log` table (audit trail of all operations)
- Add RLS policies for authenticated admin access
- Create indexes on commonly queried fields (published_at, title, wp_post_id, is_deleted)

### UI Components
- Reuse existing admin styling and components where possible
- Create WordPress publisher form component
- Create published articles list component with search/filter
- Create quick action buttons for edit/view/delete
- Create republish confirmation dialog
- Create delete confirmation dialog (with WordPress delete option)

### Security Considerations
- Store WordPress credentials encrypted at rest in Supabase
- Never expose credentials in API responses or browser console
- Implement rate limiting on publish endpoints
- Log all operations for audit trail
- Validate WordPress credentials before allowing publish
- Use Supabase RLS for access control

