import {
  getWordPressConfig,
  saveWordPressConfig,
  getPublishedArticles,
  getPublishedArticleById,
  publishArticle,
  updatePublishedArticle,
  softDeleteArticle,
  restoreArticle,
  addAuditLog,
} from './wordpress'
import { supabaseAdmin } from '@/lib/db/supabase'
import type { WordPressConfig, WordPressPublishedArticle } from '@/lib/wordpress/types'

// Mock Supabase client
jest.mock('@/lib/db/supabase', () => ({
  supabaseAdmin: {
    from: jest.fn(),
  },
}))

// Mock encryption
jest.mock('@/lib/encryption', () => ({
  encryptData: jest.fn((data: string) => `encrypted_${data}`),
  decryptData: jest.fn((data: string) => data.replace('encrypted_', '')),
}))

describe('WordPress Database Queries', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getWordPressConfig', () => {
    it('should fetch and decrypt WordPress configuration', async () => {
      const mockData = {
        id: 'config-123',
        site_url: 'https://myblog.com',
        site_name: 'My Blog',
        auth_method: 'password',
        username: 'admin',
        password_encrypted: 'encrypted_mypassword',
        is_active: true,
        validation_status: 'valid',
      }

      ;(supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockData, error: null }),
          }),
        }),
      })

      const config = await getWordPressConfig()

      expect(config).toBeDefined()
      expect(config.site_url).toBe('https://myblog.com')
      expect(config.auth_method).toBe('password')
    })

    it('should return null if no config exists', async () => {
      ;(supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      })

      const config = await getWordPressConfig()
      expect(config).toBeNull()
    })

    it('should throw on database error', async () => {
      ;(supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
            }),
          }),
        }),
      })

      await expect(getWordPressConfig()).rejects.toThrow()
    })
  })

  describe('saveWordPressConfig', () => {
    it('should encrypt and save configuration', async () => {
      const configData = {
        site_url: 'https://newblog.com',
        site_name: 'New Blog',
        auth_method: 'password' as const,
        username: 'admin',
        password: 'secretpass',
        created_by: 'user-123',
      }

      const mockSaved = {
        id: 'config-456',
        ...configData,
        password_encrypted: 'encrypted_secretpass',
        is_active: true,
        created_at: new Date().toISOString(),
      }

      ;(supabaseAdmin.from as jest.Mock).mockReturnValue({
        upsert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockSaved, error: null }),
          }),
        }),
      })

      const result = await saveWordPressConfig(configData)

      expect(result).toBeDefined()
      expect(result.site_url).toBe('https://newblog.com')
    })

    it('should handle token authentication', async () => {
      const configData = {
        site_url: 'https://tokenblog.com',
        auth_method: 'token' as const,
        api_token: 'my-secret-token',
        created_by: 'user-123',
      }

      const mockSaved = {
        id: 'config-789',
        ...configData,
        api_token_encrypted: 'encrypted_my-secret-token',
        is_active: true,
      }

      ;(supabaseAdmin.from as jest.Mock).mockReturnValue({
        upsert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockSaved, error: null }),
          }),
        }),
      })

      const result = await saveWordPressConfig(configData)
      expect(result).toBeDefined()
    })
  })

  describe('getPublishedArticles', () => {
    it('should fetch published articles with filters', async () => {
      const mockArticles = [
        {
          id: 'article-1',
          title: 'Test Article 1',
          wp_post_id: 123,
          is_deleted: false,
        },
        {
          id: 'article-2',
          title: 'Test Article 2',
          wp_post_id: 456,
          is_deleted: false,
        },
      ]

      ;(supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              range: jest.fn().mockResolvedValue({ data: mockArticles, error: null }),
            }),
          }),
        }),
      })

      const articles = await getPublishedArticles({ page: 1, limit: 10 })

      expect(articles).toHaveLength(2)
      expect(articles[0].title).toBe('Test Article 1')
    })

    it('should filter by search term', async () => {
      ;(supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            ilike: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                range: jest.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          }),
        }),
      })

      const articles = await getPublishedArticles({ search: 'test', page: 1, limit: 10 })
      expect(articles).toBeDefined()
    })
  })

  describe('getPublishedArticleById', () => {
    it('should fetch single article by ID', async () => {
      const mockArticle = {
        id: 'article-123',
        title: 'Single Article',
        content: 'Article content',
        wp_post_id: 789,
      }

      ;(supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockArticle, error: null }),
          }),
        }),
      })

      const article = await getPublishedArticleById('article-123')

      expect(article).toBeDefined()
      expect(article!.title).toBe('Single Article')
    })

    it('should return null if article not found', async () => {
      ;(supabaseAdmin.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      })

      const article = await getPublishedArticleById('nonexistent')
      expect(article).toBeNull()
    })
  })

  describe('publishArticle', () => {
    it('should insert published article record', async () => {
      const articleData = {
        title: 'New Published Article',
        content: 'Article content here',
        wp_post_id: 999,
        wp_post_url: 'https://blog.com/new-article',
        wp_site_config_id: 'config-123',
        published_by: 'user-456',
      }

      const mockInserted = {
        id: 'article-new',
        ...articleData,
        published_at: new Date().toISOString(),
      }

      ;(supabaseAdmin.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockInserted, error: null }),
          }),
        }),
      })

      const result = await publishArticle(articleData)

      expect(result).toBeDefined()
      expect(result.title).toBe('New Published Article')
      expect(result.wp_post_id).toBe(999)
    })
  })

  describe('updatePublishedArticle', () => {
    it('should update existing article', async () => {
      const updateData = {
        id: 'article-123',
        title: 'Updated Title',
        content: 'Updated content',
      }

      const mockUpdated = {
        ...updateData,
        updated_at: new Date().toISOString(),
      }

      ;(supabaseAdmin.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: mockUpdated, error: null }),
            }),
          }),
        }),
      })

      const result = await updatePublishedArticle(updateData)

      expect(result).toBeDefined()
      expect(result.title).toBe('Updated Title')
    })
  })

  describe('softDeleteArticle', () => {
    it('should mark article as deleted', async () => {
      const mockDeleted = {
        id: 'article-delete',
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        deleted_by: 'user-123',
      }

      ;(supabaseAdmin.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: mockDeleted, error: null }),
            }),
          }),
        }),
      })

      await softDeleteArticle('article-delete', 'user-123')

      // Should not throw
      expect(true).toBe(true)
    })
  })

  describe('restoreArticle', () => {
    it('should restore soft-deleted article', async () => {
      const mockRestored = {
        id: 'article-restore',
        is_deleted: false,
        deleted_at: null,
        deleted_by: null,
      }

      ;(supabaseAdmin.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: mockRestored, error: null }),
            }),
          }),
        }),
      })

      await restoreArticle('article-restore')

      expect(true).toBe(true)
    })
  })

  describe('addAuditLog', () => {
    it('should insert audit log entry', async () => {
      const logData = {
        article_id: 'article-123',
        action: 'publish' as const,
        admin_user_id: 'user-456',
        status: 'success' as const,
        new_data: { title: 'Test' },
        environment: 'development' as const,
      }

      const mockLog = {
        id: 'log-789',
        ...logData,
        created_at: new Date().toISOString(),
      }

      ;(supabaseAdmin.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: mockLog, error: null }),
          }),
        }),
      })

      const result = await addAuditLog(logData)

      expect(result).toBeDefined()
      expect(result.action).toBe('publish')
    })
  })
})

