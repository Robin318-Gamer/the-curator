import {
  WordPressError,
  WordPressAuthenticationError,
  WordPressAuthorizationError,
  WordPressNotFoundError,
  WordPressNetworkError,
  WordPressValidationError,
  WordPressRateLimitError,
  WordPressServerError,
  WordPressConfigurationError,
  WordPressDatabaseError,
  parseWordPressError,
  isRetryableError,
} from './errors'

describe('WordPress Error Classes', () => {
  describe('Error Type Checking', () => {
    it('should be instances of Error', () => {
      const error = new WordPressError('Test', 'TEST_CODE')
      expect(error).toBeInstanceOf(Error)
      expect(error).toBeInstanceOf(WordPressError)
    })

    it('should have correct name property', () => {
      expect(new WordPressError('Test', 'TEST').name).toBe('WordPressError')
      expect(new WordPressAuthenticationError().name).toBe('WordPressAuthenticationError')
      expect(new WordPressNetworkError().name).toBe('WordPressNetworkError')
      expect(new WordPressServerError().name).toBe('WordPressServerError')
    })
  })

  describe('WordPressError Base Class', () => {
    it('should store error code, message, and details', () => {
      const details = { field: 'title', reason: 'required' }
      const error = new WordPressError('Field missing', 'FIELD_MISSING', details)

      expect(error.message).toBe('Field missing')
      expect(error.code).toBe('FIELD_MISSING')
      expect(error.details).toEqual(details)
    })

    it('should default isRetryable to false', () => {
      const error = new WordPressError('Test', 'TEST')
      expect(error.isRetryable).toBe(false)
    })

    it('should allow setting isRetryable', () => {
      const error = new WordPressError('Test', 'TEST', undefined, true)
      expect(error.isRetryable).toBe(true)
    })
  })

  describe('Specialized Error Classes', () => {
    it('WordPressAuthenticationError should not be retryable', () => {
      const error = new WordPressAuthenticationError('Invalid credentials')
      expect(error.isRetryable).toBe(false)
      expect(error.code).toBe('WORDPRESS_AUTH_ERROR')
    })

    it('WordPressNetworkError should be retryable', () => {
      const error = new WordPressNetworkError('Timeout')
      expect(error.isRetryable).toBe(true)
      expect(error.code).toBe('WORDPRESS_NETWORK_ERROR')
    })

    it('WordPressRateLimitError should be retryable', () => {
      const error = new WordPressRateLimitError('Rate limited', undefined, 60)
      expect(error.isRetryable).toBe(true)
      expect(error.retryAfterSeconds).toBe(60)
    })

    it('WordPressServerError should be retryable', () => {
      const error = new WordPressServerError('Server error')
      expect(error.isRetryable).toBe(true)
    })

    it('WordPressValidationError should not be retryable', () => {
      const error = new WordPressValidationError('Invalid data')
      expect(error.isRetryable).toBe(false)
    })

    it('WordPressDatabaseError should be retryable', () => {
      const error = new WordPressDatabaseError('Connection failed')
      expect(error.isRetryable).toBe(true)
    })

    it('WordPressConfigurationError should not be retryable', () => {
      const error = new WordPressConfigurationError('Missing config')
      expect(error.isRetryable).toBe(false)
    })
  })

  describe('parseWordPressError', () => {
    it('should parse 400 as validation error', () => {
      const error = parseWordPressError(400, {
        message: 'Invalid parameter',
        code: 'invalid_param',
      })

      expect(error).toBeInstanceOf(WordPressValidationError)
      expect(error.message).toBe('Invalid parameter')
    })

    it('should parse 401 as authentication error', () => {
      const error = parseWordPressError(401, { message: 'Unauthorized' })
      expect(error).toBeInstanceOf(WordPressAuthenticationError)
    })

    it('should parse 403 as authorization error', () => {
      const error = parseWordPressError(403, { message: 'Forbidden' })
      expect(error).toBeInstanceOf(WordPressAuthorizationError)
    })

    it('should parse 404 as not found error', () => {
      const error = parseWordPressError(404, { message: 'Not found' })
      expect(error).toBeInstanceOf(WordPressNotFoundError)
    })

    it('should parse 429 as rate limit error with retry-after', () => {
      const error = parseWordPressError(429, {
        message: 'Rate limited',
        data: { retryAfter: 120 },
      })

      expect(error).toBeInstanceOf(WordPressRateLimitError)
      expect((error as WordPressRateLimitError).retryAfterSeconds).toBe(120)
    })

    it('should parse 5xx as server error', () => {
      expect(parseWordPressError(500, { message: 'Internal error' })).toBeInstanceOf(
        WordPressServerError,
      )
      expect(parseWordPressError(502, { message: 'Bad gateway' })).toBeInstanceOf(
        WordPressServerError,
      )
      expect(parseWordPressError(503, { message: 'Service unavailable' })).toBeInstanceOf(
        WordPressServerError,
      )
    })

    it('should handle missing body', () => {
      const error = parseWordPressError(500, {})
      expect(error).toBeInstanceOf(WordPressServerError)
      expect(error.message).toContain('WordPress API error')
    })

    it('should parse unknown status as base error', () => {
      const error = parseWordPressError(418, { message: 'I am a teapot' })
      expect(error).toBeInstanceOf(WordPressError)
      expect(error.message).toBe('I am a teapot')
    })
  })

  describe('isRetryableError', () => {
    it('should return true for retryable error with retries remaining', () => {
      const error = new WordPressNetworkError()
      expect(isRetryableError(error, 3)).toBe(true)
      expect(isRetryableError(error, 1)).toBe(true)
    })

    it('should return false for retryable error with no retries remaining', () => {
      const error = new WordPressNetworkError()
      expect(isRetryableError(error, 0)).toBe(false)
    })

    it('should return false for non-retryable error', () => {
      const error = new WordPressAuthenticationError()
      expect(isRetryableError(error, 3)).toBe(false)
    })

    it('should return true for network TypeError', () => {
      const error = new TypeError('fetch failed')
      expect(isRetryableError(error, 3)).toBe(true)
    })

    it('should return false for other TypeErrors', () => {
      const error = new TypeError('undefined is not a function')
      expect(isRetryableError(error, 3)).toBe(false)
    })

    it('should default maxRetries to 3', () => {
      const error = new WordPressNetworkError()
      expect(isRetryableError(error)).toBe(true)
    })

    it('should return false for non-WordPressError when maxRetries is 0', () => {
      const error = new TypeError('any error')
      expect(isRetryableError(error, 0)).toBe(false)
    })
  })

  describe('Error Message Defaults', () => {
    it('should use default messages', () => {
      expect(new WordPressAuthenticationError().message).toBe(
        'WordPress authentication failed',
      )
      expect(new WordPressAuthorizationError().message).toBe(
        'Insufficient permissions on WordPress site',
      )
      expect(new WordPressNotFoundError().message).toBe('WordPress resource not found')
      expect(new WordPressNetworkError().message).toBe(
        'Network error communicating with WordPress',
      )
      expect(new WordPressValidationError().message).toBe('Invalid data sent to WordPress')
      expect(new WordPressRateLimitError().message).toBe(
        'WordPress API rate limit exceeded',
      )
      expect(new WordPressServerError().message).toBe('WordPress server error')
      expect(new WordPressConfigurationError().message).toBe(
        'WordPress configuration invalid',
      )
      expect(new WordPressDatabaseError().message).toBe('Database operation failed')
    })

    it('should allow custom messages', () => {
      expect(new WordPressAuthenticationError('Custom auth error').message).toBe(
        'Custom auth error',
      )
      expect(new WordPressNetworkError('Connection refused').message).toBe(
        'Connection refused',
      )
    })
  })

  describe('Error Details Storage', () => {
    it('should preserve complex details object', () => {
      const details = {
        field: 'title',
        value: 'test',
        constraints: ['min_length', 'required'],
        nested: {
          reason: 'validation failed',
          code: 'VALIDATION_001',
        },
      }

      const error = new WordPressValidationError('Validation failed', details)
      expect(error.details).toEqual(details)
    })

    it('should handle undefined details', () => {
      const error = new WordPressError('Test', 'TEST', undefined)
      expect(error.details).toBeUndefined()
    })

    it('should handle null details', () => {
      const error = new WordPressError('Test', 'TEST', null)
      expect(error.details).toBe(null)
    })
  })
})
