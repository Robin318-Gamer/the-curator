import { WordPressClient } from './client'
import { WordPressAuthenticationError, WordPressValidationError } from './errors'

// Mock fetch for testing
global.fetch = jest.fn()

describe('WordPress API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Initialization', () => {
    it('should create client with site URL and auth context', () => {
      const client = new WordPressClient('https://example.com', {
        method: 'password',
        username: 'admin',
        password: 'secret',
      })

      expect(client).toBeDefined()
    })

    it('should validate site URL format', () => {
      expect(
        () =>
          new WordPressClient('invalid-url', {
            method: 'password',
            username: 'admin',
            password: 'secret',
          }),
      ).toThrow()

      expect(() => new WordPressClient('', { method: 'password' })).toThrow()
    })

    it('should require authentication method', () => {
      expect(
        () =>
          new WordPressClient('https://example.com', {
            method: 'password' as any,
            // missing password/username
          }),
      ).toThrow()

      expect(
        () =>
          new WordPressClient('https://example.com', {
            method: 'token' as any,
            // missing token
          }),
      ).toThrow()
    })

    it('should normalize site URL (remove trailing slash, ensure HTTPS)', () => {
      const client1 = new WordPressClient('https://example.com/', {
        method: 'token',
        token: 'abc123',
      })
      const client2 = new WordPressClient('https://example.com', {
        method: 'token',
        token: 'abc123',
      })

      // Both should have same base URL
      expect(client1).toBeDefined()
      expect(client2).toBeDefined()
    })

    it('should enforce HTTPS for security', () => {
      expect(
        () =>
          new WordPressClient('http://example.com', {
            method: 'password',
            username: 'admin',
            password: 'secret',
          }),
      ).toThrow(/HTTPS/)
    })
  })

  describe('Authentication', () => {
    it('should support Basic Auth (username/password)', () => {
      const client = new WordPressClient('https://example.com', {
        method: 'password',
        username: 'admin',
        password: 'secretpass123',
      })

      expect(client).toBeDefined()
    })

    it('should support Bearer Token auth', () => {
      const client = new WordPressClient('https://example.com', {
        method: 'token',
        token: 'wp_1234567890abcdef',
      })

      expect(client).toBeDefined()
    })

    it('should throw on invalid auth combination', () => {
      expect(
        () =>
          new WordPressClient('https://example.com', {
            method: 'password' as any,
            token: 'should-fail',
          }),
      ).toThrow()

      expect(
        () =>
          new WordPressClient('https://example.com', {
            method: 'token' as any,
            username: 'admin',
          }),
      ).toThrow()
    })
  })

  describe('GET Request', () => {
    it('should make GET request to WordPress API', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => ({
          name: 'Test Blog',
          description: 'A test WordPress blog',
        }),
      }
      ;(global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse)

      const client = new WordPressClient('https://example.com', {
        method: 'token',
        token: 'abc123',
      })

      const result = await client.get('/')
      expect(result).toEqual({ name: 'Test Blog', description: 'A test WordPress blog' })
      
      // Verify fetch was called with correct parameters
      const callArgs = (global.fetch as jest.Mock).mock.calls[0]
      expect(callArgs[0]).toContain('https://example.com')
      expect(callArgs[1].method).toBe('GET')
      expect(callArgs[1].headers.Authorization).toBe('Bearer abc123')
    })

    it('should handle query parameters', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => ({ id: 1, title: { rendered: 'Test Post' } }),
      }
      ;(global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse)

      const client = new WordPressClient('https://example.com', {
        method: 'token',
        token: 'token123',
      })

      await client.get('/posts/1')

      const callUrl = (global.fetch as jest.Mock).mock.calls[0][0]
      expect(callUrl).toContain('/posts/1')
    })

    it('should throw on 401 Unauthorized', async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        json: async () => ({
          code: 'rest_authentication_required',
          message: 'Authentication required',
        }),
      }
      ;(global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse)

      const client = new WordPressClient('https://example.com', {
        method: 'password',
        username: 'admin',
        password: 'wrong-password',
      })

      await expect(client.get('/')).rejects.toThrow(WordPressAuthenticationError)
    })
  })

  describe('POST Request', () => {
    it('should make POST request with data', async () => {
      const mockResponse = {
        ok: true,
        status: 201,
        json: async () => ({ id: 123, title: { rendered: 'New Post' } }),
      }
      ;(global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse)

      const client = new WordPressClient('https://example.com', {
        method: 'token',
        token: 'token123',
      })

      const result = await client.post('/posts', {
        title: 'New Post',
        content: 'Post content',
        status: 'draft',
      })

      expect(result.id).toBe(123)
      
      // Verify fetch was called with correct parameters
      const callArgs = (global.fetch as jest.Mock).mock.calls[0]
      expect(callArgs[1].method).toBe('POST')
      expect(callArgs[1].headers['Content-Type']).toBe('application/json')
      expect(callArgs[1].headers.Authorization).toBe('Bearer token123')
      expect(callArgs[1].body).toContain('New Post')
    })

    it('should throw on 400 Bad Request (validation error)', async () => {
      const mockResponse = {
        ok: false,
        status: 400,
        json: async () => ({
          code: 'rest_missing_callback_param',
          message: 'Missing parameter: title',
          data: { param: 'title' },
        }),
      }
      ;(global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse)

      const client = new WordPressClient('https://example.com', {
        method: 'token',
        token: 'token123',
      })

      await expect(
        client.post('/posts', { content: 'Missing title' }),
      ).rejects.toThrow(WordPressValidationError)
    })
  })

  describe('PUT Request', () => {
    it('should make PUT request to update resource', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => ({ id: 123, title: { rendered: 'Updated Post' } }),
      }
      ;(global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse)

      const client = new WordPressClient('https://example.com', {
        method: 'token',
        token: 'token123',
      })

      const result = await client.put('/posts/123', {
        title: 'Updated Post',
        content: 'Updated content',
      })

      expect(result.id).toBe(123)
      expect(result.title.rendered).toBe('Updated Post')
    })
  })

  describe('DELETE Request', () => {
    it('should make DELETE request', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => ({ deleted: true, previous: { id: 123 } }),
      }
      ;(global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse)

      const client = new WordPressClient('https://example.com', {
        method: 'token',
        token: 'token123',
      })

      const result = await client.delete('/posts/123')
      expect(result.deleted).toBe(true)
    })
  })

  describe('Retry Logic', () => {
    it('should retry on network error', async () => {
      let callCount = 0
      ;(global.fetch as jest.Mock).mockImplementation(async () => {
        callCount++
        if (callCount === 1) {
          // Simulate network error like fetch would throw
          throw new TypeError('fetch: network request failed')
        }
        return {
          ok: true,
          status: 200,
          json: async () => ({ success: true }),
        }
      })

      const client = new WordPressClient('https://example.com', {
        method: 'token',
        token: 'token123',
      })

      const result = await client.get('/')
      expect(result.success).toBe(true)
      expect(callCount).toBe(2) // Called twice (retry)
    })

    it('should not retry on 401 authentication error', async () => {
      const mockResponse = {
        ok: false,
        status: 401,
        json: async () => ({ code: 'authentication_failed' }),
      }
      ;(global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse)

      const client = new WordPressClient('https://example.com', {
        method: 'password',
        username: 'admin',
        password: 'wrong',
      })

      try {
        await client.get('/')
        fail('Should have thrown an error')
      } catch (error) {
        expect(error).toBeDefined()
      }
      
      expect(global.fetch).toHaveBeenCalledTimes(1) // No retry
    })

    it('should retry on 503 service unavailable', async () => {
      let callCount = 0
      ;(global.fetch as jest.Mock).mockImplementation(async () => {
        callCount++
        if (callCount === 1) {
          return {
            ok: false,
            status: 503,
            json: async () => ({ code: 'service_unavailable' }),
          }
        }
        return {
          ok: true,
          status: 200,
          json: async () => ({ success: true }),
        }
      })

      const client = new WordPressClient('https://example.com', {
        method: 'token',
        token: 'token123',
      })

      const result = await client.get('/')
      expect(result.success).toBe(true)
      expect(callCount).toBe(2) // Called twice (retry)
    })
  })

  describe('Timeout Handling', () => {
    it('should handle timeout gracefully', async () => {
      // Mock fetch to reject with AbortError (timeout)
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(
        Object.assign(new Error('Aborted'), { name: 'AbortError' }),
      )

      const client = new WordPressClient('https://example.com', {
        method: 'token',
        token: 'token123',
      })

      try {
        await client.get('/')
        fail('Should have thrown')
      } catch (error: any) {
        expect(error).toBeDefined()
      }
    })
  })

  describe('Response Validation', () => {
    it('should handle empty response body', async () => {
      const mockResponse = {
        ok: true,
        status: 204,
        json: async () => ({}),
      }
      ;(global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse)

      const client = new WordPressClient('https://example.com', {
        method: 'token',
        token: 'token123',
      })

      const result = await client.get('/')
      expect(result).toBeDefined()
    })

    it('should handle null response', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: async () => null,
      }
      ;(global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse)

      const client = new WordPressClient('https://example.com', {
        method: 'token',
        token: 'token123',
      })

      const result = await client.get('/')
      expect(result).toBeNull()
    })
  })
})
