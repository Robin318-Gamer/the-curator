import crypto from 'crypto'

/**
 * Encryption configuration using AES-256-GCM
 * - Algorithm: AES-256-GCM (Galois/Counter Mode provides authenticated encryption)
 * - Key: 32 bytes (256 bits) derived from environment variable
 * - IV: 16 bytes (128 bits) randomly generated per encryption
 * - Auth Tag: 16 bytes (automatically handled by GCM mode)
 */

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-dev-key-do-not-use-in-production-please-set-encryption-key'

/**
 * Derive a consistent 32-byte key from the ENCRYPTION_KEY string
 * Uses SHA-256 to ensure consistent key regardless of input length
 */
function getEncryptionKey(): Buffer {
  // If key is already 32 bytes, use it directly
  if (ENCRYPTION_KEY.length === 32) {
    return Buffer.from(ENCRYPTION_KEY, 'utf-8')
  }

  // Otherwise, derive a 32-byte key using SHA-256
  return crypto.createHash('sha256').update(ENCRYPTION_KEY).digest()
}

/**
 * Encrypt a string using AES-256-GCM
 * Returns base64-encoded string containing: IV (16 bytes) + ciphertext + authTag (16 bytes)
 *
 * @param plaintext - The string to encrypt
 * @returns Base64-encoded encrypted data
 * @throws Error if plaintext is not a string
 */
export function encryptData(plaintext: string): string {
  if (typeof plaintext !== 'string') {
    throw new Error('Plaintext must be a string')
  }

  try {
    const key = getEncryptionKey()

    // Generate a random 16-byte IV for this encryption
    const iv = crypto.randomBytes(16)

    // Create cipher
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)

    // Encrypt the plaintext
    let encrypted = cipher.update(plaintext, 'utf-8', 'hex')
    encrypted += cipher.final('hex')

    // Get the authentication tag (provides integrity checking)
    const authTag = cipher.getAuthTag()

    // Combine IV + encrypted data + authTag and encode as base64
    const combined = Buffer.concat([iv, Buffer.from(encrypted, 'hex'), authTag])
    return combined.toString('base64')
  } catch (error) {
    throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Decrypt a base64-encoded string encrypted with encryptData()
 * Verifies authentication tag to ensure data integrity
 *
 * @param encrypted - Base64-encoded encrypted data from encryptData()
 * @returns The decrypted plaintext string
 * @throws Error if encrypted data is invalid or tampering is detected
 */
export function decryptData(encrypted: string): string {
  if (typeof encrypted !== 'string') {
    throw new Error('Encrypted data must be a string')
  }

  try {
    const key = getEncryptionKey()

    // Decode base64
    let buffer: Buffer
    try {
      buffer = Buffer.from(encrypted, 'base64')
    } catch {
      throw new Error('Invalid base64 format')
    }

    // Verify minimum length: IV (16) + authTag (16)
    if (buffer.length < 32) {
      throw new Error('Encrypted data too short or corrupted')
    }

    // Extract components
    const iv = buffer.slice(0, 16)
    const authTag = buffer.slice(buffer.length - 16)
    const ciphertext = buffer.slice(16, buffer.length - 16)

    // Create decipher
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
    decipher.setAuthTag(authTag)

    // Decrypt
    let decrypted = ''
    if (ciphertext.length > 0) {
      decrypted = decipher.update(ciphertext.toString('hex'), 'hex', 'utf-8')
    }
    decrypted += decipher.final('utf-8')

    return decrypted
  } catch (error) {
    throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Hash a string using SHA-256 (one-way, non-reversible)
 * Useful for storing hashes of sensitive data for comparison
 *
 * @param data - The string to hash
 * @returns Hex-encoded SHA-256 hash
 */
export function hashData(data: string): string {
  if (typeof data !== 'string') {
    throw new Error('Data must be a string')
  }

  return crypto.createHash('sha256').update(data).digest('hex')
}

/**
 * Generate a random secure token (useful for API tokens, secrets)
 *
 * @param length - Length of token in bytes (default 32)
 * @returns Hex-encoded random token
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex')
}
