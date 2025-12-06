-- =====================================================
-- EXCEPTION LOG TABLE
-- For comprehensive debugging and error tracking
-- =====================================================

CREATE TABLE IF NOT EXISTS exception_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Error Details
  error_type VARCHAR(100) NOT NULL, -- e.g., 'DatabaseError', 'ScraperError', 'ValidationError'
  error_message TEXT NOT NULL,
  error_stack TEXT, -- Full stack trace if available
  
  -- Context Information
  endpoint VARCHAR(255), -- API endpoint that failed (e.g., '/api/scraper/article')
  function_name VARCHAR(100), -- Function where error occurred
  operation VARCHAR(100), -- Operation being performed (e.g., 'category_selection', 'article_scrape', 'content_extract')
  
  -- Request Context
  request_method VARCHAR(10), -- GET, POST, PUT, DELETE, etc.
  request_url TEXT, -- Full request URL
  request_body JSONB, -- Request payload (truncated if too large)
  
  -- User/Session Context
  category_slug VARCHAR(150), -- Affected scraper category (if applicable)
  source_key VARCHAR(50), -- Affected news source (e.g., 'hk01')
  article_id VARCHAR(100), -- Affected article ID (if applicable)
  article_url TEXT, -- Affected article URL (if applicable)
  
  -- Severity & Status
  severity VARCHAR(20) DEFAULT 'error', -- 'debug', 'info', 'warning', 'error', 'critical'
  is_resolved BOOLEAN DEFAULT false,
  resolution_notes TEXT,
  
  -- Metadata
  environment VARCHAR(50), -- 'development', 'production', 'staging'
  app_version VARCHAR(20), -- Application version
  metadata JSONB, -- Additional contextual data
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR EXCEPTION LOG
-- =====================================================

-- Quick lookups by endpoint and recent errors
CREATE INDEX idx_exception_logs_endpoint ON exception_logs(endpoint, created_at DESC);
CREATE INDEX idx_exception_logs_created_at ON exception_logs(created_at DESC);
CREATE INDEX idx_exception_logs_error_type ON exception_logs(error_type);
CREATE INDEX idx_exception_logs_severity ON exception_logs(severity);

-- Find errors by source/category
CREATE INDEX idx_exception_logs_source_key ON exception_logs(source_key, created_at DESC);
CREATE INDEX idx_exception_logs_category_slug ON exception_logs(category_slug, created_at DESC);
CREATE INDEX idx_exception_logs_article_id ON exception_logs(article_id);

-- Find unresolved errors
CREATE INDEX idx_exception_logs_unresolved ON exception_logs(is_resolved, severity, created_at DESC);

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE exception_logs IS 'Comprehensive exception and error logging table for debugging and monitoring';
COMMENT ON COLUMN exception_logs.error_type IS 'Type of error: DatabaseError, ScraperError, ValidationError, TimeoutError, etc.';
COMMENT ON COLUMN exception_logs.operation IS 'The specific operation being performed when error occurred';
COMMENT ON COLUMN exception_logs.endpoint IS 'API route/endpoint that encountered the error';
COMMENT ON COLUMN exception_logs.severity IS 'Error severity level: debug, info, warning, error, critical';
COMMENT ON COLUMN exception_logs.metadata IS 'Flexible JSON field for storing additional context-specific data';

-- =====================================================
-- GRANT PERMISSIONS (Optional - adjust based on your roles)
-- =====================================================
-- If you have different service roles, uncomment and adjust:
-- GRANT SELECT, INSERT, UPDATE ON exception_logs TO authenticated;
-- GRANT SELECT, INSERT, UPDATE ON exception_logs TO anon;
-- GRANT TRUNCATE ON exception_logs TO authenticated;
