/**
 * Custom Error Classes for WordPress Integration
 * Provides structured error handling with specific types for different failure scenarios
 */

/**
 * Base error class for all WordPress-related errors
 */
export class WordPressError extends Error {
  public readonly code: string
  public readonly details?: any
  public readonly isRetryable: boolean

  constructor(
    message: string,
    code: string,
    details?: any,
    isRetryable: boolean = false,
  ) {
    super(message)
    this.name = 'WordPressError'
    this.code = code
    this.details = details
    this.isRetryable = isRetryable

    // Maintain proper prototype chain
    Object.setPrototypeOf(this, WordPressError.prototype)
  }
}

/**
 * Thrown when WordPress API returns 401/403 Unauthorized or authentication fails
 */
export class WordPressAuthenticationError extends WordPressError {
  constructor(message: string = 'WordPress authentication failed', details?: any) {
    super(message, 'WORDPRESS_AUTH_ERROR', details, false)
    this.name = 'WordPressAuthenticationError'
    Object.setPrototypeOf(this, WordPressAuthenticationError.prototype)
  }
}

/**
 * Thrown when WordPress API returns 403 Forbidden (lacks permissions)
 */
export class WordPressAuthorizationError extends WordPressError {
  constructor(
    message: string = 'Insufficient permissions on WordPress site',
    details?: any,
  ) {
    super(message, 'WORDPRESS_AUTHZ_ERROR', details, false)
    this.name = 'WordPressAuthorizationError'
    Object.setPrototypeOf(this, WordPressAuthorizationError.prototype)
  }
}

/**
 * Thrown when WordPress API returns 404 Not Found
 */
export class WordPressNotFoundError extends WordPressError {
  constructor(message: string = 'WordPress resource not found', details?: any) {
    super(message, 'WORDPRESS_NOT_FOUND', details, false)
    this.name = 'WordPressNotFoundError'
    Object.setPrototypeOf(this, WordPressNotFoundError.prototype)
  }
}

/**
 * Thrown on network timeouts or transient failures (usually retryable)
 */
export class WordPressNetworkError extends WordPressError {
  constructor(message: string = 'Network error communicating with WordPress', details?: any) {
    super(message, 'WORDPRESS_NETWORK_ERROR', details, true) // Retryable
    this.name = 'WordPressNetworkError'
    Object.setPrototypeOf(this, WordPressNetworkError.prototype)
  }
}

/**
 * Thrown when WordPress API returns 400 Bad Request or validation fails
 */
export class WordPressValidationError extends WordPressError {
  constructor(message: string = 'Invalid data sent to WordPress', details?: any) {
    super(message, 'WORDPRESS_VALIDATION_ERROR', details, false)
    this.name = 'WordPressValidationError'
    Object.setPrototypeOf(this, WordPressValidationError.prototype)
  }
}

/**
 * Thrown when WordPress API returns 429 Too Many Requests (rate limited)
 */
export class WordPressRateLimitError extends WordPressError {
  public readonly retryAfterSeconds?: number

  constructor(
    message: string = 'WordPress API rate limit exceeded',
    details?: any,
    retryAfterSeconds?: number,
  ) {
    super(message, 'WORDPRESS_RATE_LIMIT', details, true) // Retryable
    this.name = 'WordPressRateLimitError'
    this.retryAfterSeconds = retryAfterSeconds
    Object.setPrototypeOf(this, WordPressRateLimitError.prototype)
  }
}

/**
 * Thrown when WordPress API returns 500+ server error
 */
export class WordPressServerError extends WordPressError {
  constructor(message: string = 'WordPress server error', details?: any) {
    super(message, 'WORDPRESS_SERVER_ERROR', details, true) // Retryable
    this.name = 'WordPressServerError'
    Object.setPrototypeOf(this, WordPressServerError.prototype)
  }
}

/**
 * Thrown when local validation or configuration is invalid
 */
export class WordPressConfigurationError extends WordPressError {
  constructor(message: string = 'WordPress configuration invalid', details?: any) {
    super(message, 'WORDPRESS_CONFIG_ERROR', details, false)
    this.name = 'WordPressConfigurationError'
    Object.setPrototypeOf(this, WordPressConfigurationError.prototype)
  }
}

/**
 * Thrown when database operation fails
 */
export class WordPressDatabaseError extends WordPressError {
  constructor(message: string = 'Database operation failed', details?: any) {
    super(message, 'WORDPRESS_DB_ERROR', details, true) // Retryable in some cases
    this.name = 'WordPressDatabaseError'
    Object.setPrototypeOf(this, WordPressDatabaseError.prototype)
  }
}

/**
 * Parse WordPress REST API error response into appropriate error type
 *
 * @param status - HTTP status code
 * @param body - Response body from WordPress API
 * @returns Appropriate WordPressError subclass
 */
export function parseWordPressError(status: number, body: any): WordPressError {
  const message = body?.message || `WordPress API error (status: ${status})`
  const code = body?.code || `HTTP_${status}`
  const data = body?.data

  switch (status) {
    case 400:
      return new WordPressValidationError(message, data)
    case 401:
      return new WordPressAuthenticationError(message, data)
    case 403:
      return new WordPressAuthorizationError(message, data)
    case 404:
      return new WordPressNotFoundError(message, data)
    case 429:
      const retryAfter = data?.retryAfter || undefined
      return new WordPressRateLimitError(message, data, retryAfter)
    case 500:
    case 502:
    case 503:
    case 504:
      return new WordPressServerError(message, data)
    default:
      if (status >= 500) {
        return new WordPressServerError(message, data)
      }
      return new WordPressError(message, code, data)
  }
}

/**
 * Determine if an error is retryable
 * Useful for implementing retry logic
 *
 * @param error - Error object
 * @param maxRetries - Maximum number of retries already attempted
 * @returns true if error should be retried
 */
export function isRetryableError(error: any, maxRetries: number = 3): boolean {
  if (error instanceof WordPressError) {
    return error.isRetryable && maxRetries > 0
  }

  // Network errors from fetch
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true
  }

  return false
}
