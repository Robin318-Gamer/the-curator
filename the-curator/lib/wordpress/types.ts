/**
 * WordPress REST API Response Types
 * Based on WordPress REST API v2.0+ specification
 * https://developer.wordpress.org/rest-api/reference/
 */

/**
 * WordPress Post object from REST API
 */
export interface WordPressPost {
  id: number
  date: string
  date_gmt: string
  guid: {
    rendered: string
  }
  modified: string
  modified_gmt: string
  slug: string
  status: 'publish' | 'draft' | 'pending' | 'private' | 'scheduled'
  type: string
  link: string
  title: {
    rendered: string
  }
  content: {
    rendered: string
    protected: boolean
  }
  excerpt: {
    rendered: string
    protected: boolean
  }
  author: number
  featured_media: number
  comment_status: string
  ping_status: string
  sticky: boolean
  template: string
  format: string
  meta: Record<string, any>
  categories: number[]
  tags: number[]
  [key: string]: any // Allow additional fields
}

/**
 * WordPress Category object from REST API
 */
export interface WordPressCategory {
  id: number
  count: number
  description: string
  link: string
  name: string
  slug: string
  taxonomy: string
  parent: number
  meta: Record<string, any>
}

/**
 * WordPress Tag object from REST API
 */
export interface WordPressTag {
  id: number
  count: number
  description: string
  link: string
  name: string
  slug: string
  taxonomy: string
  meta: Record<string, any>
}

/**
 * Request body for creating/updating a post
 */
export interface WordPressCreatePostRequest {
  title: string
  content: string
  excerpt?: string
  status?: 'draft' | 'publish' | 'pending' | 'scheduled'
  author?: number
  featured_media?: number
  categories?: number[]
  tags?: number[] | string[] // Can be IDs or names
  meta?: Record<string, any>
  [key: string]: any
}

/**
 * Request body for updating a post
 */
export interface WordPressUpdatePostRequest extends Partial<WordPressCreatePostRequest> {}

/**
 * WordPress REST API authentication context
 */
export interface WordPressAuthContext {
  method: 'password' | 'token'
  username?: string
  password?: string
  token?: string
}

/**
 * Validation result for WordPress connection
 */
export interface WordPressValidationResult {
  isValid: boolean
  error?: string
  siteTitle?: string
  wordPressVersion?: string
  restApiVersion?: string
  authenticatedAs?: string
}

/**
 * WordPress API error response
 */
export interface WordPressErrorResponse {
  code: string
  message: string
  data?: {
    status: number
    params?: Record<string, any>
    [key: string]: any
  }
}

/**
 * WordPress media upload response
 */
export interface WordPressMedia {
  id: number
  date: string
  date_gmt: string
  guid: {
    rendered: string
  }
  modified: string
  modified_gmt: string
  slug: string
  status: string
  type: string
  link: string
  title: {
    rendered: string
  }
  description: {
    rendered: string
  }
  alt_text: string
  media_type: 'image' | 'file'
  mime_type: string
  source_url: string
  [key: string]: any
}

/**
 * Internal database type for WordPress configuration
 */
export interface WordPressConfig {
  id: string
  site_url: string
  site_name?: string
  auth_method: 'password' | 'token'
  username?: string
  password?: string // Decrypted password (only available after decryption)
  password_encrypted?: string
  api_token?: string // Decrypted API token (only available after decryption)
  api_token_encrypted?: string
  is_active: boolean
  is_validated: boolean
  last_validated_at?: string
  validation_status: 'untested' | 'valid' | 'invalid'
  validation_error?: string
  notes?: string
  created_at: string
  updated_at: string
  created_by: string
  updated_by: string
}

/**
 * Internal database type for published articles
 */
export interface WordPressPublishedArticle {
  id: string
  curator_article_id?: string
  title: string
  content: string
  excerpt?: string
  category?: string
  tags?: string[]
  author?: string
  featured_image_url?: string
  wp_post_id: number
  wp_post_url: string
  wp_site_config_id: string
  status: 'draft' | 'published' | 'scheduled'
  sync_status: 'in_sync' | 'modified_locally' | 'sync_pending'
  is_deleted: boolean
  published_by: string
  published_at: string
  updated_at: string
  wp_synced_at?: string
  deleted_at?: string
  deleted_by?: string
  change_history?: Array<{
    timestamp: string
    action: string
    field: string
    old_value: any
    new_value: any
  }>
}

/**
 * Internal database type for audit log
 */
export interface WordPressAuditLog {
  id: string
  article_id: string
  action: 'publish' | 'update' | 'delete' | 'restore' | 'validate'
  admin_user_id: string
  old_data?: Record<string, any>
  new_data?: Record<string, any>
  wp_response?: Record<string, any>
  status: 'pending' | 'success' | 'failed' | 'partial'
  error_message?: string
  ip_address?: string
  user_agent?: string
  environment: 'development' | 'staging' | 'production'
  created_at: string
}

/**
 * Request/Response wrapper for API endpoints
 */
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
  timestamp: string
}
