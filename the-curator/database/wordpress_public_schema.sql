-- WordPress Publishing Feature Tables
-- Schema: public (with wordpress_ prefix to avoid conflicts)
-- Created: 2025-12-05

-- ============================================================================
-- Table 1: WordPress Configuration
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.wordpress_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Site Information
    site_url TEXT NOT NULL UNIQUE,
    site_name TEXT,
    
    -- Authentication
    auth_method TEXT NOT NULL CHECK (auth_method IN ('password', 'token')),
    username TEXT,
    password_encrypted TEXT,  -- AES-256-GCM encrypted
    api_token_encrypted TEXT, -- AES-256-GCM encrypted
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    validation_status TEXT CHECK (validation_status IN ('valid', 'invalid', 'pending', 'error')),
    last_validated_at TIMESTAMPTZ,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by TEXT NOT NULL,
    updated_by TEXT
);

-- Index for active config lookup
CREATE INDEX IF NOT EXISTS idx_wordpress_config_active 
ON public.wordpress_config(is_active) 
WHERE is_active = true;

-- ============================================================================
-- Table 2: Published Articles (with WordPress reference)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.wordpress_published_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Article Snapshot (at time of publishing)
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    featured_image_url TEXT,
    
    -- WordPress Reference
    wp_post_id INTEGER NOT NULL,
    wp_post_url TEXT NOT NULL,
    wp_site_config_id UUID REFERENCES public.wordpress_config(id) ON DELETE SET NULL,
    
    -- WordPress Metadata
    wp_categories INTEGER[] DEFAULT '{}',
    wp_tags INTEGER[] DEFAULT '{}',
    
    -- Publishing Info
    published_at TIMESTAMPTZ DEFAULT NOW(),
    published_by TEXT NOT NULL,
    updated_at TIMESTAMPTZ,
    
    -- Sync Status
    sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'failed')),
    last_synced_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Soft Delete
    is_deleted BOOLEAN DEFAULT false,
    deleted_at TIMESTAMPTZ,
    deleted_by TEXT
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_wordpress_articles_published 
ON public.wordpress_published_articles(published_at DESC);

CREATE INDEX IF NOT EXISTS idx_wordpress_articles_wp_post 
ON public.wordpress_published_articles(wp_post_id);

CREATE INDEX IF NOT EXISTS idx_wordpress_articles_deleted 
ON public.wordpress_published_articles(is_deleted) 
WHERE is_deleted = false;

CREATE INDEX IF NOT EXISTS idx_wordpress_articles_sync_status 
ON public.wordpress_published_articles(sync_status);

CREATE INDEX IF NOT EXISTS idx_wordpress_articles_title_search 
ON public.wordpress_published_articles USING gin(to_tsvector('english', title));

-- ============================================================================
-- Table 3: Audit Log for WordPress Operations
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.wordpress_publish_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Article Reference (nullable for config-only operations)
    article_id UUID REFERENCES public.wordpress_published_articles(id) ON DELETE SET NULL,
    
    -- Action Details
    action TEXT NOT NULL CHECK (action IN ('publish', 'update', 'delete', 'restore')),
    admin_user_id TEXT NOT NULL,
    
    -- Change Tracking
    old_data JSONB,
    new_data JSONB,
    
    -- WordPress Response
    wp_response JSONB,
    
    -- Result
    status TEXT NOT NULL CHECK (status IN ('success', 'failed')),
    error_message TEXT,
    
    -- Environment
    environment TEXT DEFAULT 'production' CHECK (environment IN ('development', 'staging', 'production')),
    
    -- Timestamp
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for audit queries
CREATE INDEX IF NOT EXISTS idx_wordpress_audit_article 
ON public.wordpress_publish_audit_log(article_id);

CREATE INDEX IF NOT EXISTS idx_wordpress_audit_admin 
ON public.wordpress_publish_audit_log(admin_user_id);

CREATE INDEX IF NOT EXISTS idx_wordpress_audit_created 
ON public.wordpress_publish_audit_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_wordpress_audit_action 
ON public.wordpress_publish_audit_log(action);

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on all WordPress tables
ALTER TABLE public.wordpress_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wordpress_published_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wordpress_publish_audit_log ENABLE ROW LEVEL SECURITY;

-- Allow service role to bypass RLS (for API operations)
-- Note: In production, create more granular policies based on auth.uid()

-- ============================================================================
-- Comments for Documentation
-- ============================================================================

COMMENT ON TABLE public.wordpress_config IS 
'WordPress site configuration with encrypted credentials. Only one active config allowed.';

COMMENT ON TABLE public.wordpress_published_articles IS 
'Published articles with WordPress post references. Maintains local snapshot for audit trail.';

COMMENT ON TABLE public.wordpress_publish_audit_log IS 
'Audit trail for all WordPress publishing operations. Tracks who did what and when.';

COMMENT ON COLUMN public.wordpress_config.password_encrypted IS 
'AES-256-GCM encrypted password. Decrypted only when needed for WordPress API calls.';

COMMENT ON COLUMN public.wordpress_config.api_token_encrypted IS 
'AES-256-GCM encrypted API token. Alternative to password authentication.';

COMMENT ON COLUMN public.wordpress_published_articles.sync_status IS 
'Tracks if local snapshot matches WordPress. Used for conflict detection.';
