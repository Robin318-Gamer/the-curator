/**
 * WordPress Database Operations
 * 
 * This module provides database query functions for WordPress integration.
 * All operations use the 'wordpress' schema with encrypted credential storage.
 */

import { supabaseAdmin } from '@/lib/db/supabase'
import { encryptData, decryptData } from '@/lib/encryption'
import type {
  WordPressConfig,
  WordPressPublishedArticle,
  WordPressAuditLog,
} from '@/lib/wordpress/types'
import { WordPressDatabaseError } from '@/lib/wordpress/errors'

/**
 * Configuration Management
 */

export interface SaveConfigData {
  site_url: string
  site_name?: string
  auth_method: 'password' | 'token'
  username?: string
  password?: string
  api_token?: string
  created_by: string
  updated_by?: string
}

/**
 * Fetch WordPress configuration (only one config per installation)
 */
export async function getWordPressConfig(): Promise<WordPressConfig | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('wordpress_config')
      .select('*')
      .eq('is_active', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned - no config exists
        return null
      }
      throw new WordPressDatabaseError(`Failed to fetch WordPress config: ${error.message}`, { error })
    }

    if (!data) {
      return null
    }

    // Decrypt sensitive fields
    const config: WordPressConfig = {
      ...data,
      password: data.password_encrypted ? decryptData(data.password_encrypted) : undefined,
      api_token: data.api_token_encrypted ? decryptData(data.api_token_encrypted) : undefined,
    }

    return config
  } catch (error) {
    if (error instanceof WordPressDatabaseError) {
      throw error
    }
    throw new WordPressDatabaseError('Failed to fetch WordPress configuration', { error })
  }
}

/**
 * Save or update WordPress configuration
 * Only one active configuration is allowed
 */
export async function saveWordPressConfig(configData: SaveConfigData): Promise<WordPressConfig> {
  try {
    // Prepare encrypted data
    const insertData: Record<string, any> = {
      site_url: configData.site_url,
      site_name: configData.site_name || null,
      auth_method: configData.auth_method,
      username: configData.username || null,
      created_by: configData.created_by,
      updated_by: configData.updated_by || configData.created_by,
      is_active: true,
    }

    // Encrypt credentials based on auth method
    if (configData.auth_method === 'password' && configData.password) {
      insertData.password_encrypted = encryptData(configData.password)
    }

    if (configData.auth_method === 'token' && configData.api_token) {
      insertData.api_token_encrypted = encryptData(configData.api_token)
    }

    const { data, error } = await supabaseAdmin
      .from('wordpress_config')
      .upsert(insertData, { onConflict: 'id' })
      .select()
      .single()

    if (error) {
      throw new WordPressDatabaseError(`Failed to save WordPress config: ${error.message}`, { error })
    }

    // Decrypt for return
    const config: WordPressConfig = {
      ...data,
      password: data.password_encrypted ? decryptData(data.password_encrypted) : undefined,
      api_token: data.api_token_encrypted ? decryptData(data.api_token_encrypted) : undefined,
    }

    return config
  } catch (error) {
    if (error instanceof WordPressDatabaseError) {
      throw error
    }
    throw new WordPressDatabaseError('Failed to save WordPress configuration', { error })
  }
}

/**
 * Published Articles Management
 */

export interface GetArticlesOptions {
  page: number
  limit: number
  search?: string
  includeDeleted?: boolean
}

/**
 * Get list of published articles with pagination and filters
 */
export async function getPublishedArticles(options: GetArticlesOptions): Promise<WordPressPublishedArticle[]> {
  try {
    const { page, limit, search, includeDeleted = false } = options
    const offset = (page - 1) * limit

    let query = supabaseAdmin
      .from('wordpress_published_articles')
      .select('*')

    // Filter deleted articles unless explicitly included
    if (!includeDeleted) {
      query = query.eq('is_deleted', false)
    }

    // Search filter
    if (search) {
      query = query.ilike('title', `%${search}%`)
    }

    query = query
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data, error } = await query

    if (error) {
      throw new WordPressDatabaseError(`Failed to fetch published articles: ${error.message}`, { error })
    }

    return data || []
  } catch (error) {
    if (error instanceof WordPressDatabaseError) {
      throw error
    }
    throw new WordPressDatabaseError('Failed to fetch published articles', { error })
  }
}

/**
 * Get single published article by ID
 */
export async function getPublishedArticleById(articleId: string): Promise<WordPressPublishedArticle | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('wordpress_published_articles')
      .select('*')
      .eq('id', articleId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new WordPressDatabaseError(`Failed to fetch article: ${error.message}`, { error })
    }

    return data
  } catch (error) {
    if (error instanceof WordPressDatabaseError) {
      throw error
    }
    throw new WordPressDatabaseError('Failed to fetch article by ID', { error })
  }
}

export interface PublishArticleData {
  title: string
  content: string
  excerpt?: string
  featured_image_url?: string
  wp_post_id: number
  wp_post_url: string
  wp_site_config_id: string
  wp_categories?: number[]
  wp_tags?: number[]
  published_by: string
}

/**
 * Record a newly published article
 */
export async function publishArticle(articleData: PublishArticleData): Promise<WordPressPublishedArticle> {
  try {
    const { data, error } = await supabaseAdmin
      .from('wordpress_published_articles')
      .insert({
        title: articleData.title,
        content: articleData.content,
        excerpt: articleData.excerpt || null,
        featured_image_url: articleData.featured_image_url || null,
        wp_post_id: articleData.wp_post_id,
        wp_post_url: articleData.wp_post_url,
        wp_site_config_id: articleData.wp_site_config_id,
        wp_categories: articleData.wp_categories || [],
        wp_tags: articleData.wp_tags || [],
        published_by: articleData.published_by,
        sync_status: 'synced',
      })
      .select()
      .single()

    if (error) {
      throw new WordPressDatabaseError(`Failed to publish article: ${error.message}`, { error })
    }

    return data
  } catch (error) {
    if (error instanceof WordPressDatabaseError) {
      throw error
    }
    throw new WordPressDatabaseError('Failed to record published article', { error })
  }
}

export interface UpdateArticleData {
  id: string
  title?: string
  content?: string
  excerpt?: string
  featured_image_url?: string
  wp_categories?: number[]
  wp_tags?: number[]
  sync_status?: 'synced' | 'pending' | 'failed'
}

/**
 * Update existing published article
 */
export async function updatePublishedArticle(updateData: UpdateArticleData): Promise<WordPressPublishedArticle> {
  try {
    const { id, ...updates } = updateData

    const { data, error } = await supabaseAdmin
      .from('wordpress_published_articles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new WordPressDatabaseError(`Failed to update article: ${error.message}`, { error })
    }

    return data
  } catch (error) {
    if (error instanceof WordPressDatabaseError) {
      throw error
    }
    throw new WordPressDatabaseError('Failed to update published article', { error })
  }
}

/**
 * Soft delete an article (mark as deleted without removing from DB)
 */
export async function softDeleteArticle(articleId: string, deletedBy: string): Promise<void> {
  try {
    const { error } = await supabaseAdmin
      .from('wordpress_published_articles')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        deleted_by: deletedBy,
      })
      .eq('id', articleId)
      .select()
      .single()

    if (error) {
      throw new WordPressDatabaseError(`Failed to delete article: ${error.message}`, { error })
    }
  } catch (error) {
    if (error instanceof WordPressDatabaseError) {
      throw error
    }
    throw new WordPressDatabaseError('Failed to soft delete article', { error })
  }
}

/**
 * Restore a soft-deleted article
 */
export async function restoreArticle(articleId: string): Promise<void> {
  try {
    const { error } = await supabaseAdmin
      .from('wordpress_published_articles')
      .update({
        is_deleted: false,
        deleted_at: null,
        deleted_by: null,
      })
      .eq('id', articleId)
      .select()
      .single()

    if (error) {
      throw new WordPressDatabaseError(`Failed to restore article: ${error.message}`, { error })
    }
  } catch (error) {
    if (error instanceof WordPressDatabaseError) {
      throw error
    }
    throw new WordPressDatabaseError('Failed to restore article', { error })
  }
}

/**
 * Audit Log Management
 */

export interface AddAuditLogData {
  article_id?: string
  action: 'publish' | 'update' | 'delete' | 'restore'
  admin_user_id: string
  old_data?: Record<string, any>
  new_data?: Record<string, any>
  wp_response?: Record<string, any>
  status: 'success' | 'failed'
  error_message?: string
  environment?: 'development' | 'staging' | 'production'
}

/**
 * Add audit log entry for WordPress operations
 */
export async function addAuditLog(logData: AddAuditLogData): Promise<WordPressAuditLog> {
  try {
    const { data, error } = await supabaseAdmin
      .from('wordpress_publish_audit_log')
      .insert({
        article_id: logData.article_id || null,
        action: logData.action,
        admin_user_id: logData.admin_user_id,
        old_data: logData.old_data || null,
        new_data: logData.new_data || null,
        wp_response: logData.wp_response || null,
        status: logData.status,
        error_message: logData.error_message || null,
        environment: logData.environment || 'production',
      })
      .select()
      .single()

    if (error) {
      throw new WordPressDatabaseError(`Failed to add audit log: ${error.message}`, { error })
    }

    return data
  } catch (error) {
    if (error instanceof WordPressDatabaseError) {
      throw error
    }
    throw new WordPressDatabaseError('Failed to add audit log', { error })
  }
}
