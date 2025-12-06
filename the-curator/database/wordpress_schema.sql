-- =====================================================
-- WORDPRESS INTEGRATION DATABASE SCHEMA
-- Isolated WordPress Management Tables in Separate Schema (Same Database)
-- Author: GitHub Copilot
-- Date: December 5, 2025
-- Database: PostgreSQL (Supabase)
-- Purpose: Store WordPress configuration and publishing audit trails
-- =====================================================

-- =====================================================
-- CREATE WORDPRESS SCHEMA
-- All WordPress tables isolated in 'wordpress' schema, separate from 'public' (Curator core)
-- =====================================================
CREATE SCHEMA IF NOT EXISTS wordpress;

-- =====================================================
-- TABLE 1: wordpress.config
-- Stores WordPress site configuration and encrypted credentials
-- =====================================================
CREATE TABLE IF NOT EXISTS wordpress.config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Site Information
  site_url TEXT NOT NULL UNIQUE, -- e.g., 'https://myblog.wordpress.com'
  site_name VARCHAR(255), -- Display name (e.g., 'My WordPress Blog')
  
  -- Authentication Method & Encrypted Credentials
  auth_method VARCHAR(20) NOT NULL CHECK (auth_method IN ('password', 'token')),
  
  -- For Basic Auth (username/password)
  username TEXT, -- WordPress username
  password_encrypted TEXT, -- Encrypted password stored at rest
  
  -- For Bearer Token Auth
  api_token_encrypted TEXT, -- Encrypted API token stored at rest
  
  -- Configuration Status
  is_active BOOLEAN DEFAULT true,
  is_validated BOOLEAN DEFAULT false,
  last_validated_at TIMESTAMPTZ,
  validation_status VARCHAR(50) DEFAULT 'untested', -- 'untested', 'valid', 'invalid'
  validation_error TEXT, -- Error message from last validation attempt
  
  -- Metadata
  notes TEXT, -- Admin notes about this site
  
  -- Audit Trail
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Constraints
  CONSTRAINT wp_single_active_config CHECK (
    (is_active = false) OR 
    (is_active = true) -- Future: enforce only one active config if desired
  )
);

-- =====================================================
-- TABLE 2: wordpress.published_articles
-- Stores snapshot of published articles and WordPress references
-- =====================================================
CREATE TABLE IF NOT EXISTS wordpress.published_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Source Article Reference (optional - can publish new articles directly)
  curator_article_id UUID REFERENCES public.articles(id) ON DELETE SET NULL,
  
  -- Article Content Snapshot (captured at publish time)
  title TEXT NOT NULL,
  content TEXT NOT NULL, -- Full article content
  excerpt TEXT, -- Optional summary/excerpt
  category VARCHAR(100),
  tags TEXT[], -- Array of tag names
  author VARCHAR(255),
  featured_image_url TEXT,
  
  -- WordPress Reference
  wp_post_id BIGINT NOT NULL, -- WordPress post ID
  wp_post_url TEXT NOT NULL, -- Full URL to WordPress post
  wp_site_config_id UUID NOT NULL REFERENCES wordpress.config(id) ON DELETE CASCADE,
  
  -- Status Tracking
  status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'published', 'scheduled'
  sync_status VARCHAR(50) DEFAULT 'in_sync', -- 'in_sync', 'modified_locally', 'sync_pending'
  is_deleted BOOLEAN DEFAULT false, -- Soft delete flag
  
  -- Publishing Metadata
  published_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  wp_synced_at TIMESTAMPTZ, -- When last synced with WordPress
  deleted_at TIMESTAMPTZ, -- When marked as deleted (soft delete)
  deleted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Change Tracking for Audit Trail
  change_history JSONB DEFAULT '[]'::jsonb, -- Array of {timestamp, action, field, old_value, new_value}
  
  -- Constraints
  CONSTRAINT wp_unique_post UNIQUE(wp_site_config_id, wp_post_id),
  CONSTRAINT wp_valid_status CHECK (status IN ('draft', 'published', 'scheduled')),
  CONSTRAINT wp_valid_sync_status CHECK (sync_status IN ('in_sync', 'modified_locally', 'sync_pending'))
);

-- =====================================================
-- TABLE 3: wordpress.publish_audit_log
-- Complete audit trail of all WordPress publishing operations
-- =====================================================
CREATE TABLE IF NOT EXISTS wordpress.publish_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Article Reference
  article_id UUID NOT NULL REFERENCES wordpress.published_articles(id) ON DELETE CASCADE,
  
  -- Operation Details
  action VARCHAR(50) NOT NULL, -- 'publish', 'update', 'delete', 'restore', 'validate'
  admin_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  
  -- Data Snapshots
  old_data JSONB, -- Previous state before action
  new_data JSONB, -- New state after action
  wp_response JSONB, -- Response from WordPress API
  
  -- Operation Status
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'success', 'failed', 'partial'
  error_message TEXT, -- Error details if failed
  
  -- Request Context
  ip_address INET, -- Admin IP address
  user_agent TEXT, -- Browser/client info
  
  -- Environment
  environment VARCHAR(50) DEFAULT 'development', -- 'development', 'staging', 'production'
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT wp_valid_action CHECK (action IN ('publish', 'update', 'delete', 'restore', 'validate')),
  CONSTRAINT wp_valid_audit_status CHECK (status IN ('pending', 'success', 'failed', 'partial'))
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- wordpress.config indexes
CREATE INDEX IF NOT EXISTS idx_wp_config_active ON wordpress.config(is_active, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_wp_config_validation_status ON wordpress.config(validation_status);
CREATE INDEX IF NOT EXISTS idx_wp_config_created_by ON wordpress.config(created_by);

-- wordpress.published_articles indexes
CREATE INDEX IF NOT EXISTS idx_wp_articles_deleted ON wordpress.published_articles(is_deleted, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_wp_articles_site ON wordpress.published_articles(wp_site_config_id, is_deleted);
CREATE INDEX IF NOT EXISTS idx_wp_articles_title ON wordpress.published_articles(title) WHERE is_deleted = false;
CREATE INDEX IF NOT EXISTS idx_wp_articles_curator_source ON wordpress.published_articles(curator_article_id);
CREATE INDEX IF NOT EXISTS idx_wp_articles_published_by ON wordpress.published_articles(published_by, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_wp_articles_sync_status ON wordpress.published_articles(sync_status, wp_site_config_id);

-- wordpress.publish_audit_log indexes
CREATE INDEX IF NOT EXISTS idx_wp_audit_article ON wordpress.publish_audit_log(article_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wp_audit_action ON wordpress.publish_audit_log(action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wp_audit_user ON wordpress.publish_audit_log(admin_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wp_audit_status ON wordpress.publish_audit_log(status) WHERE status != 'success';
CREATE INDEX IF NOT EXISTS idx_wp_audit_recent ON wordpress.publish_audit_log(created_at DESC) WHERE status IN ('failed', 'partial');

-- =====================================================
-- TABLE COMMENTS & DOCUMENTATION
-- =====================================================

COMMENT ON SCHEMA wordpress IS 'Isolated schema for WordPress content management feature - separate from public (Curator core)';

COMMENT ON TABLE wordpress.config IS 'WordPress site configuration with encrypted credentials. Each row represents one WordPress site connection.';
COMMENT ON COLUMN wordpress.config.site_url IS 'Base URL of WordPress site (must be HTTPS)';
COMMENT ON COLUMN wordpress.config.auth_method IS 'Authentication type: password (Basic Auth) or token (Bearer Token)';
COMMENT ON COLUMN wordpress.config.password_encrypted IS 'Encrypted WordPress password for Basic Auth - encrypted at rest using Node.js crypto or Supabase encryption';
COMMENT ON COLUMN wordpress.config.api_token_encrypted IS 'Encrypted WordPress API token for Bearer Token auth - encrypted at rest';
COMMENT ON COLUMN wordpress.config.validation_status IS 'Result of last connection test: untested (never validated), valid (connection works), invalid (connection failed)';

COMMENT ON TABLE wordpress.published_articles IS 'Snapshot of articles published to WordPress. Stores article content at time of publication plus WordPress reference and sync status.';
COMMENT ON COLUMN wordpress.published_articles.curator_article_id IS 'Reference to source article in curator articles table (NULL if article created directly via WordPress publisher)';
COMMENT ON COLUMN wordpress.published_articles.wp_post_id IS 'WordPress post ID (unique identifier from WordPress)';
COMMENT ON COLUMN wordpress.published_articles.sync_status IS 'Tracks local vs remote state: in_sync (matches WordPress), modified_locally (edited in Curator, not yet republished), sync_pending (waiting for sync)';
COMMENT ON COLUMN wordpress.published_articles.is_deleted IS 'Soft delete flag: true means deleted in Curator but may still exist on WordPress. Use with deleted_at for soft delete pattern.';
COMMENT ON COLUMN wordpress.published_articles.change_history IS 'JSONB array tracking all modifications: [{timestamp, action, field, old_value, new_value}, ...]';

COMMENT ON TABLE wordpress.publish_audit_log IS 'Complete audit trail of all WordPress operations. Every action (publish, update, delete, restore) creates an entry.';
COMMENT ON COLUMN wordpress.publish_audit_log.action IS 'Type of operation performed: publish (new article), update (republish existing), delete (soft delete in Curator), restore (undo soft delete), validate (test connection)';
COMMENT ON COLUMN wordpress.publish_audit_log.old_data IS 'Previous state before operation (for updates/deletes) as JSON snapshot';
COMMENT ON COLUMN wordpress.publish_audit_log.new_data IS 'New state after operation as JSON snapshot';
COMMENT ON COLUMN wordpress.publish_audit_log.wp_response IS 'Full response from WordPress REST API including headers and metadata';
COMMENT ON COLUMN wordpress.publish_audit_log.status IS 'Operation outcome: pending (in progress), success (completed successfully), failed (error occurred), partial (partially succeeded)';

-- =====================================================
-- RLS POLICIES (Row Level Security) - OPTIONAL
-- Uncomment and adjust based on your authentication model
-- =====================================================

-- Allow only authenticated admins to view WordPress config
-- ALTER TABLE wordpress.config ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Only authenticated users can view wordpress config"
--   ON wordpress.config
--   FOR SELECT
--   USING (auth.uid() IS NOT NULL);

-- Allow only authenticated admins to insert/update WordPress config
-- CREATE POLICY "Only authenticated users can manage wordpress config"
--   ON wordpress.config
--   FOR INSERT
--   WITH CHECK (auth.uid() = created_by);

-- Allow only authenticated admins to view articles
-- ALTER TABLE wordpress.published_articles ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Only authenticated users can view published articles"
--   ON wordpress.published_articles
--   FOR SELECT
--   USING (auth.uid() IS NOT NULL);

-- Allow only authenticated admins to view audit logs
-- ALTER TABLE wordpress.publish_audit_log ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Only authenticated users can view audit logs"
--   ON wordpress.publish_audit_log
--   FOR SELECT
--   USING (auth.uid() IS NOT NULL);

-- =====================================================
-- MIGRATION VERSION TRACKING
-- =====================================================
-- Record: WordPress Schema Migration v1.0
-- Created: December 5, 2025
-- Status: Ready for deployment
-- Schema: wordpress (isolated from public schema)
-- Tables: config, published_articles, publish_audit_log
-- Next Steps: Apply this migration to Supabase, then run encryption utility setup (Phase 1, Task 8-25)
