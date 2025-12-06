import {
  parseWordPressError,
  isRetryableError,
  WordPressConfigurationError,
} from './errors'
import type { WordPressAuthContext } from './types'

interface RequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  headers?: Record<string, string>
  body?: any
}

/**
 * WordPress REST API Client
 * Handles authentication, requests, retries, and error handling
 */
export class WordPressClient {
  private baseUrl: string
  private authContext: WordPressAuthContext
  private readonly maxRetries = 3
  private readonly requestTimeout = 30000 // 30 seconds
  private readonly retryDelay = 1000 // 1 second

  /**
   * Initialize WordPress API Client
   *
   * @param siteUrl - WordPress site URL (must be HTTPS)
   * @param authContext - Authentication method and credentials
   * @throws Error if URL is invalid or auth is incomplete
   */
  constructor(siteUrl: string, authContext: WordPressAuthContext) {
    // Validate inputs
    this.validateSiteUrl(siteUrl)
    this.validateAuthContext(authContext)

    // Normalize URL
    this.baseUrl = this.normalizeSiteUrl(siteUrl)
    this.authContext = authContext
  }

  /**
   * Make GET request to WordPress REST API
   *
   * @param endpoint - API endpoint (e.g., '/wp-json/wp/v2/posts/1')
   * @param params - Query parameters
   * @returns Response data from WordPress API
   */
  async get<T = any>(endpoint: string, params?: Record<string, any>): Promise<T> {
    let url = endpoint
    if (params && Object.keys(params).length > 0) {
      const query = new URLSearchParams(params).toString()
      url = `${endpoint}?${query}`
    }

    return this.request<T>(url, { method: 'GET' })
  }

  /**
   * Make POST request to WordPress REST API (create new resource)
   *
   * @param endpoint - API endpoint
   * @param data - Data to send
   * @returns Created resource with ID
   */
  async post<T = any>(endpoint: string, data?: Record<string, any>): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data,
    })
  }

  /**
   * Make PUT request to WordPress REST API (update resource)
   *
   * @param endpoint - API endpoint (must include resource ID)
   * @param data - Data to update
   * @returns Updated resource
   */
  async put<T = any>(endpoint: string, data?: Record<string, any>): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data,
    })
  }

  /**
   * Make DELETE request to WordPress REST API
   *
   * @param endpoint - API endpoint (must include resource ID)
   * @param params - Optional parameters (e.g., { force: true })
   * @returns Deletion response
   */
  async delete<T = any>(endpoint: string, params?: Record<string, any>): Promise<T> {
    let url = endpoint
    if (params && Object.keys(params).length > 0) {
      const query = new URLSearchParams(params).toString()
      url = `${endpoint}?${query}`
    }

    return this.request<T>(url, { method: 'DELETE' })
  }

  /**
   * Test WordPress connection and authentication
   * Useful for validating credentials before storing
   *
   * @returns true if connection is valid
   * @throws error if connection fails
   */
  async testConnection(): Promise<boolean> {
    try {
      // Try to fetch site information - this requires proper auth
      await this.get('/wp-json/wp/v2/users/me')
      return true
    } catch (error) {
      throw error
    }
  }

  /**
   * Internal method to make HTTP request with retry logic
   */
  private async request<T = any>(
    endpoint: string,
    options: RequestOptions,
  ): Promise<T> {
    let lastError: any = null
    let retryCount = 0

    while (retryCount <= this.maxRetries) {
      try {
        const url = this.buildUrl(endpoint)
        const headers = this.buildHeaders(options.method)

        const fetchOptions: RequestInit = {
          method: options.method,
          headers,
          signal: AbortSignal.timeout(this.requestTimeout),
        }

        if (options.body && ['POST', 'PUT', 'PATCH'].includes(options.method)) {
          fetchOptions.body = JSON.stringify(options.body)
        }

        const response = await fetch(url, fetchOptions)

        // Handle non-2xx responses
        if (!response.ok) {
          let errorBody: any = {}
          try {
            errorBody = await response.json()
          } catch {
            // Response body not JSON, use status only
          }

          const error = parseWordPressError(response.status, errorBody)
          lastError = error

          // Don't retry authentication errors
          if (!isRetryableError(error, this.maxRetries - retryCount)) {
            throw error
          }

          // Retry with exponential backoff
          retryCount++
          if (retryCount <= this.maxRetries) {
            const delay = this.retryDelay * Math.pow(2, retryCount - 1)
            await this.sleep(delay)
            continue
          }

          throw error
        }

        // Parse successful response
        const data: T = await response.json()
        return data
      } catch (error) {
        // Network errors and other exceptions
        if (error instanceof Error && error.name === 'AbortError') {
          lastError = new Error('Request timeout')
        } else {
          lastError = error
        }

        // Retry on network errors
        if (isRetryableError(lastError, this.maxRetries - retryCount)) {
          retryCount++
          if (retryCount <= this.maxRetries) {
            const delay = this.retryDelay * Math.pow(2, retryCount - 1)
            await this.sleep(delay)
            continue
          }
        }

        throw lastError
      }
    }

    throw lastError
  }

  /**
   * Build complete URL for API request
   */
  private buildUrl(endpoint: string): string {
    // Remove leading slash if present
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint

    // Check if this is a WordPress.com site
    const isWordPressCom = this.baseUrl.includes('.wordpress.com')

    if (isWordPressCom) {
      // WordPress.com uses public-api.wordpress.com with site in the path
      // Extract site domain from baseUrl
      const siteUrl = new URL(this.baseUrl)
      const siteDomain = siteUrl.hostname // e.g., "newsfinder1.wordpress.com"
      
      // Endpoint should start with wp-json
      let apiPath = normalizedEndpoint
      if (!normalizedEndpoint.startsWith('wp-json') && !normalizedEndpoint.startsWith('wp/v2')) {
        // For WordPress.com, use: /wp/v2/sites/{site}/posts
        apiPath = `wp/v2/sites/${siteDomain}/${normalizedEndpoint}`
      }

      return `https://public-api.wordpress.com/${apiPath}`
    } else {
      // Self-hosted WordPress uses /wp-json/wp/v2/
      let apiPath = normalizedEndpoint
      if (!normalizedEndpoint.startsWith('wp-json')) {
        apiPath = `wp-json/wp/v2/${normalizedEndpoint}`
      }

      return `${this.baseUrl}/${apiPath}`
    }
  }

  /**
   * Build Authorization header
   */
  private buildHeaders(method: string): Record<string, string> {
    const headers: Record<string, string> = {}

    // Add Content-Type for POST/PUT/PATCH
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      headers['Content-Type'] = 'application/json'
    }

    // Add authentication
    if (this.authContext.method === 'password') {
      const credentials = `${this.authContext.username}:${this.authContext.password}`
      const encoded = Buffer.from(credentials).toString('base64')
      headers['Authorization'] = `Basic ${encoded}`
    } else if (this.authContext.method === 'token') {
      headers['Authorization'] = `Bearer ${this.authContext.token}`
    }

    return headers
  }

  /**
   * Validate site URL
   */
  private validateSiteUrl(url: string): void {
    if (!url || typeof url !== 'string') {
      throw new WordPressConfigurationError('Site URL must be a non-empty string')
    }

    try {
      const parsed = new URL(url)
      if (parsed.protocol !== 'https:' && parsed.hostname !== 'localhost') {
        throw new Error('HTTPS required for security')
      }
    } catch (error) {
      throw new WordPressConfigurationError(
        `Invalid site URL: ${error instanceof Error ? error.message : 'Unknown error'}`,
      )
    }
  }

  /**
   * Validate authentication context
   */
  private validateAuthContext(auth: WordPressAuthContext): void {
    if (!auth || !auth.method) {
      throw new WordPressConfigurationError('Authentication method required')
    }

    if (auth.method === 'password') {
      if (!auth.username || !auth.password) {
        throw new WordPressConfigurationError('Username and password required for Basic Auth')
      }
    } else if (auth.method === 'token') {
      if (!auth.token) {
        throw new WordPressConfigurationError('API token required for Bearer auth')
      }
    } else {
      throw new WordPressConfigurationError(`Unknown authentication method: ${auth.method}`)
    }
  }

  /**
   * Normalize site URL
   */
  private normalizeSiteUrl(url: string): string {
    let normalized = url.trim()

    // Add https if missing (unless localhost)
    if (!normalized.startsWith('http')) {
      normalized = `https://${normalized}`
    }

    // Remove trailing slash
    normalized = normalized.replace(/\/$/, '')

    return normalized
  }

  /**
   * Utility: sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
