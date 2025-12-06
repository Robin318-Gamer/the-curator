import { encryptData, decryptData } from './encryption'

describe('Encryption Utilities (AES-256)', () => {
  describe('encryptData', () => {
    it('should encrypt a string and return a base64-encoded encrypted value', () => {
      const plaintext = 'my-secret-password'
      const encrypted = encryptData(plaintext)
      
      // Should not be the same as plaintext
      expect(encrypted).not.toBe(plaintext)
      
      // Should be a non-empty string
      expect(encrypted).toBeTruthy()
      expect(typeof encrypted).toBe('string')
      
      // Should contain valid base64 characters
      expect(/^[A-Za-z0-9+/=]+$/.test(encrypted)).toBe(true)
    })

    it('should return different encrypted values for the same plaintext (due to random IV)', () => {
      const plaintext = 'my-secret-password'
      const encrypted1 = encryptData(plaintext)
      const encrypted2 = encryptData(plaintext)
      
      // Encrypted values should be different (random IV used)
      expect(encrypted1).not.toBe(encrypted2)
    })

    it('should handle special characters and unicode', () => {
      const specialText = 'P@ssw0rd!#$%^&*()_+-=[]{}|;:,.<>?'
      const encrypted = encryptData(specialText)
      const decrypted = decryptData(encrypted)
      
      expect(decrypted).toBe(specialText)
    })

    it('should handle long strings', () => {
      const longText = 'a'.repeat(1000)
      const encrypted = encryptData(longText)
      const decrypted = decryptData(encrypted)
      
      expect(decrypted).toBe(longText)
    })

    it('should throw error if input is not a string', () => {
      // @ts-ignore - Testing runtime error handling
      expect(() => encryptData(null)).toThrow()
      // @ts-ignore
      expect(() => encryptData(undefined)).toThrow()
      // @ts-ignore
      expect(() => encryptData(123)).toThrow()
    })
  })

  describe('decryptData', () => {
    it('should decrypt a value encrypted with encryptData', () => {
      const plaintext = 'wordpress-api-token-xyz123'
      const encrypted = encryptData(plaintext)
      const decrypted = decryptData(encrypted)
      
      expect(decrypted).toBe(plaintext)
    })

    it('should return original value after round-trip encryption/decryption', () => {
      const testCases = [
        'simple-password',
        'p@$$w0rd!',
        'https://example.com/api/key',
        'token_with_underscores_and_numbers_123456',
        '',
      ]

      testCases.forEach((testValue) => {
        const encrypted = encryptData(testValue)
        const decrypted = decryptData(encrypted)
        expect(decrypted).toBe(testValue)
      })
    })

    it('should throw error if encrypted value is tampered with', () => {
      const plaintext = 'secret-password'
      const encrypted = encryptData(plaintext)
      
      // Tamper with the encrypted value (change one character)
      const tampered = encrypted.slice(0, -1) + 'X'
      
      // Should throw or return corrupted data
      expect(() => decryptData(tampered)).toThrow()
    })

    it('should throw error if encrypted value is invalid base64', () => {
      const invalidBase64 = '!!!invalid-base64!!!'
      
      expect(() => decryptData(invalidBase64)).toThrow()
    })

    it('should throw error if input is not a string', () => {
      // @ts-ignore
      expect(() => decryptData(null)).toThrow()
      // @ts-ignore
      expect(() => decryptData(undefined)).toThrow()
      // @ts-ignore
      expect(() => decryptData(123)).toThrow()
    })
  })

  describe('Encryption Key Management', () => {
    it('should use consistent encryption key across multiple operations', () => {
      const plaintext = 'consistent-key-test'
      
      // Encrypt and decrypt multiple times - should work consistently
      for (let i = 0; i < 5; i++) {
        const encrypted = encryptData(plaintext)
        const decrypted = decryptData(encrypted)
        expect(decrypted).toBe(plaintext)
      }
    })

    it('should handle empty string', () => {
      const empty = ''
      const encrypted = encryptData(empty)
      const decrypted = decryptData(encrypted)
      
      expect(decrypted).toBe('')
    })
  })

  describe('Security Properties', () => {
    it('should not expose plaintext in encrypted output', () => {
      const plaintext = 'SuperSecretPassword123'
      const encrypted = encryptData(plaintext)
      
      // Encrypted value should not contain plaintext
      expect(encrypted).not.toContain(plaintext)
    })

    it('encrypted data should be reasonably sized', () => {
      const plaintext = 'password'
      const encrypted = encryptData(plaintext)
      
      // Encrypted data should be longer than plaintext (due to IV + salt)
      expect(encrypted.length).toBeGreaterThan(plaintext.length)
      
      // But not unreasonably long (should be ~2-3x)
      expect(encrypted.length).toBeLessThan(plaintext.length * 10)
    })
  })
})
