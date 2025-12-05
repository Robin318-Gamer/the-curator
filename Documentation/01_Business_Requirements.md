# 01. Business Requirements Document (BRD)

> **Project**: The Curator (Global News Aggregator)
> **Status**: Draft
> **Last Updated**: 2025-12-01

## 1. Executive Summary
The objective is to develop a robust **News Aggregation & Management Platform** that automates the collection of news from Hong Kong sources (Oriental Daily, Ming Pao, HK01), provides a secure Admin Portal for content management and AI rewriting, and serves a premium "Magazine-Style" public website. The system also supports exporting curated content to external WordPress sites.

## 2. User Roles

### 2.1 Super Admin
*   **Access**: Full system access (Authentication required).
*   **Capabilities**:
    *   Trigger manual extractions from specific sources.
    *   View, edit, and delete articles.
    *   Trigger AI rewriting of articles.
    *   Push articles to WordPress.
    *   Manage system settings.

### 2.2 Public User
*   **Access**: Read-only, no authentication required.
*   **Capabilities**:
    *   Browse news by category.
    *   Read full articles.
    *   Switch UI language (English/Chinese).


## 3. User Stories & Functional Requirements

### User Story 1: News Web Application & Admin Portal
* A modern web application for public news display and a secure admin portal for article management.
* Initial mockup is approved and should be used as a design baseline.
* The admin portal and public site must operate independently.

### User Story 2: Database Communication & API
* The system must save and read news data from the database.
* APIs must support all CRUD operations for news articles and related entities.
* API endpoints must be documented and independently testable.

### User Story 3: News Scraper Engine
* Scraper module collects unique news article URLs from multiple sources.
* Extracts correct metadata from each article URL.
* Scraper logic is isolated and can run independently, storing results via the API.

### User Story 4: WordPress Integration
* Functionality to export/push news articles to a WordPress website.
* Export logic is isolated and can be triggered independently from other modules.

**Isolation Requirement:**
Each user story/module must be able to operate and be tested independently, with clear boundaries and minimal coupling.

### 3.1 Extraction Engine
*   **FR-01**: System MUST support extraction from **Oriental Daily**, **Ming Pao**, and **HK01**.
*   **FR-02**: System MUST extract: Title, Summary, Content (HTML), Images, Publish Date, Author.
*   **FR-03**: System MUST standardize data into a common format regardless of source.
*   **FR-04**: Admin MUST be able to manually trigger extraction for a specific source.

### 3.2 Content Management
*   **FR-05**: Admin MUST be able to view a list of all scraped articles.
*   **FR-06**: Admin MUST be able to edit the content of any article.
*   **FR-07**: Admin MUST be able to trigger an "AI Rewrite" process for an article.
*   **FR-08**: System MUST store the "AI Rewritten" content separately from the "Original" content.

### 3.3 WordPress Integration
*   **FR-09**: Admin MUST be able to manually "Push" a specific article to an external WordPress site.
*   **FR-10**: The export payload MUST use the "AI Rewritten" content if available, otherwise the Original content.

### 3.4 Public Interface
*   **FR-11**: Website MUST display articles in a "Magazine" grid layout.
*   **FR-12**: Website MUST support a UI Language Switcher (EN/CN) that changes **public interface labels only** (menus, buttons). Article content remains in original language. **Note: Admin Portal will remain in Chinese only.**

## 4. Non-Functional Requirements
*   **NFR-01**: **Performance**: Public pages should load in under 2 seconds.
*   **NFR-02**: **Reliability**: Scrapers should handle network errors gracefully with retry logic.
*   **NFR-03**: **Security**: Admin Portal must be protected by secure authentication.
