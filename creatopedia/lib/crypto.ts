import crypto from 'crypto'

const ALGORITHM = 'aes-256-cbc'
const ENCRYPTION_KEY = Buffer.from(process.env.TOKEN_ENCRYPTION_KEY || '', 'hex')

export function encrypt(text: string) {
  if (!process.env.TOKEN_ENCRYPTION_KEY) {
    console.warn('[Crypto] TOKEN_ENCRYPTION_KEY is not set, skipping encryption')
    return null
  }
  try {
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv)
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    return {
      encrypted,
      iv: iv.toString('hex'),
    }
  } catch (error) {
    console.error('[Crypto] Encryption failed:', error)
    return null
  }
}

export function decrypt(encrypted: string, iv: string) {
  if (!process.env.TOKEN_ENCRYPTION_KEY) {
    console.warn('[Crypto] TOKEN_ENCRYPTION_KEY is not set, skipping decryption')
    return null
  }
  
  try {
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, Buffer.from(iv, 'hex'))
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  } catch (error) {
    console.error('[Crypto] Decryption failed:', error)
    return null
  }
}
