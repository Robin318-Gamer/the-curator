# WordPress Content Management Integration

**Feature ID**: 002-wordpress-publish  
**Status**: In Specification  
**Last Updated**: December 5, 2025

## Overview

Provide admin users with an integrated interface to manage and publish articles to a WordPress website directly from The Curator admin dashboard. This feature allows admins to post news articles with titles and content to their WordPress site without leaving the application.

---

## Business Value

- **Workflow Efficiency**: Reduce manual steps by publishing articles directly from The Curator rather than switching to WordPress admin
- **Centralized Management**: Keep all content operations in one admin dashboard
- **Quality Control**: Enable review and publishing workflows for curated news content
- **Time Savings**: Fast article publishing with bulk operations support

---

## User Scenarios & Testing

### Scenario 1: Single Article Publishing
**Actor**: News Admin  
**Given**: Admin is on the WordPress Content Manager page with article data available  
**When**: Admin fills in article title and content, then clicks publish  
**Then**: Article appears on the WordPress website and confirmation is shown in the UI  
**Acceptance Criteria**:
- Form validates title and content fields before submission
- Success message displays with link to published article
- Article appears on WordPress site within 2 seconds

### Scenario 2: Error Handling on Failed Publish
**Actor**: News Admin  
**Given**: Admin attempts to publish an article with invalid WordPress credentials  
**When**: Publish button is clicked  
**Then**: Clear error message explains the problem and provides next steps  
**Acceptance Criteria**:
- Error message is user-friendly (no technical jargon)
- Admin can retry after fixing the issue
- Error is logged for debugging

### Scenario 3: Bulk Article Publishing
**Actor**: News Admin  
**Given**: Admin has selected multiple articles from The Curator database  
**When**: Admin clicks "Publish Multiple" and confirms  
**Then**: Articles are published sequentially to WordPress  
**Acceptance Criteria**:
- Progress indicator shows publishing status
- Admin receives summary of successes and failures
- Failed articles can be retried

### Scenario 4: Article Preview Before Publishing
**Actor**: News Admin  
**Given**: Admin has entered article title and content  
**When**: Admin clicks the preview button  
**Then**: Article appears as it will on the WordPress site  
**Acceptance Criteria**:
- Preview shows accurate formatting
- Preview modal can be closed to return to editing

---

## Functional Requirements

### FR1: WordPress Connection Configuration
- Admin users must be able to configure WordPress site URL and API credentials (username/password or API token)
- Connection settings must be securely stored and not exposed in client-side code
- System must validate connection before allowing publish operations

### FR2: Article Publishing Interface
- Provide a form with fields for:
  - Article Title (required, max 255 characters)
  - Article Content (required, max 50,000 characters)
  - Category/Tags (optional, searchable from existing WordPress categories)
  - Featured Image URL (optional)
- Form must include clear field labels and help text
- Submit button should show loading state during publishing

### FR3: Publish to WordPress
- On form submission, send article data to WordPress REST API
- Create article as a Draft post initially (admin can publish from WordPress if needed)
- Return success response with link to the published article on WordPress
- Support both password and token-based authentication methods

### FR4: Error Handling & Validation
- Validate all required fields client-side with clear error messages
- Handle network failures gracefully with retry options
- Log detailed error information for troubleshooting
- Display user-friendly error messages (hide technical details)

### FR5: Publishing History
- Maintain a record of published articles including:
  - Timestamp of publication
  - Article title and URL
  - WordPress post ID
  - Publication status
- Allow admins to view publishing history with filtering by date range

### FR6: Bulk Publishing (Future Enhancement)
- Allow selection of multiple articles from The Curator database
- Publish selected articles sequentially with progress tracking
- Provide summary report of successful and failed publications

### FR7: Article Preview
- Display a preview of how the article will appear on WordPress
- Show formatting, images, and styling as they will appear
- Allow closing preview to return to editing

---

## Success Criteria

1. **Functionality**: Admin can successfully publish an article with title and content to WordPress in under 30 seconds end-to-end
2. **Reliability**: 99% of publish operations complete successfully under normal network conditions
3. **User Experience**: All error messages are clear and actionable; no technical jargon or stack traces shown to admins
4. **Performance**: Article appears on WordPress website within 2 seconds of successful API call
5. **Security**: WordPress credentials are never logged or exposed in browser console
6. **Documentation**: Admin documentation explains how to obtain WordPress API credentials and configure the connection
7. **Navigation**: WordPress manager is accessible from the Admin dashboard and main admin navigation

---

## Key Entities

### Article
- **Title**: String (max 255 characters)
- **Content**: String (max 50,000 characters)
- **Category**: Optional reference to WordPress category
- **Tags**: Optional array of tag names
- **Featured Image URL**: Optional URL string
- **Status**: Draft/Published

### Publishing History Record
- **ID**: Unique identifier
- **Article Title**: String
- **WordPress Post ID**: String
- **WordPress Post URL**: String
- **Timestamp**: DateTime
- **Status**: Success/Failed
- **Error Message**: String (if failed)

### WordPress Configuration
- **Site URL**: String (base URL of WordPress site)
- **Authentication Method**: "password" | "token"
- **Username**: String (if password auth)
- **Password**: String (encrypted, never logged)
- **API Token**: String (encrypted, never logged)

---

## Assumptions

1. **WordPress Version**: Target WordPress 6.0+ with REST API enabled
2. **Authentication**: WordPress site has user account configured for API access
3. **Content Format**: Article content is plain text or HTML; complex formatting conversion is out of scope
4. **Images**: Featured images are provided via URL; image upload to WordPress is out of scope for MVP
5. **Categories**: Existing WordPress categories are fetched from WordPress when form loads
6. **Permissions**: Only authenticated admin users with "manage_options" capability can use this feature
7. **API Rate Limiting**: WordPress site allows at least 10 requests per second
8. **CORS**: WordPress site or admin must allow CORS requests from The Curator domain

---

## Out of Scope

- Full WordPress content editing features (custom fields, blocks, etc.)
- Scheduling articles for future publication
- Media library management or image uploads
- Draft auto-saving
- Collaborative editing features
- Publishing to multiple WordPress sites simultaneously
- SEO optimization tools
- Article analytics or engagement tracking

---

## Dependencies

- Existing admin authentication system (already in place)
- Supabase connection for storing WordPress configuration
- WordPress REST API v2+
- HTTP client library for API calls

---

## Implementation Notes

- Use Next.js API route `/api/admin/wordpress/publish` as the backend endpoint
- Store WordPress connection details in Supabase with encryption
- Create a new admin page at `/admin/wordpress-publisher`
- Add WordPress menu item to existing admin navigation
- Use existing UI components and styling from admin dashboard
- Follow existing exception logging pattern for error tracking

