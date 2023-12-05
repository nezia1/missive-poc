import * as Crypto from 'crypto'

const SALT_LENGTH = 64 // In bytes
const IV_LENGTH = 12 // In bytes (for AES-256-gcm, this is 96 bits based on the GCM specification)
const ITERATIONS = 10000 // Recommendation is >= 10000

/**
 * TODO: Separate key generation from ciphering
 * TODO: Also we should perhaps use a different algorithm for deriving the key from the password (use the password hash that we use for authentication?). Also 10000 iterations is too low according to the OWASP specification (https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html#pbkdf2). Using the hash from the password will also be faster since it will already be generated.
 **/

/**
 * Encrypts text using AES-256-CBC.
 * @param {string} textToEncrypt - Text to encrypt
 * @param {string} password - Password to use for encryption
 */
export function encrypt(
  textToEncrypt: string,
  password: string
): Promise<{ text: string; salt: Buffer; iv: Buffer; tag: Buffer }> {
  const salt = Crypto.randomBytes(SALT_LENGTH)

  // Wrap in promise to use async/await (still using NodeJS' callback API)
  return new Promise((resolve, reject) => {
    // Derive a 32 bits key from the password
    Crypto.pbkdf2(password, salt, ITERATIONS, 32, 'sha512', (err, derivedKey) => {
      if (err) reject(err)

      const iv = Crypto.randomBytes(IV_LENGTH)
      const cipher = Crypto.createCipheriv('aes-256-gcm', derivedKey, iv)

      // Ciphering text
      let encrypted = cipher.update(textToEncrypt)
      encrypted = Buffer.concat([encrypted, cipher.final()])

      const tag = cipher.getAuthTag()

      // This is sent separately so it can be stored in the database, making it easier to decrypt later
      resolve({
        text: encrypted.toString('base64'),
        salt,
        iv,
        tag,
      })
    })
  })
}

/**
 * Decrypts text using AES-256-CBC, by providing the password, the symmetrical key salt and IV used for encryption.
 * @param password
 * @param encryptedData
 * @returns {Promise<string>} Decrypted text
 */
export function decrypt(
  password: string,
  encryptedData: { text: string; salt: Buffer; iv: Buffer; tag: Buffer }
): Promise<string> {
  const { text, salt, iv, tag } = encryptedData

  const encryptedBuffer = Buffer.from(text, 'base64')

  return new Promise((resolve, reject) => {
    Crypto.pbkdf2(password, salt, ITERATIONS, 32, 'sha512', (err, derivedKey) => {
      if (err) reject(err)

      const decipher = Crypto.createDecipheriv('aes-256-gcm', derivedKey, iv)

      decipher.setAuthTag(tag)

      let decrypted = decipher.update(encryptedBuffer)
      decrypted = Buffer.concat([decrypted, decipher.final()])

      resolve(decrypted.toString('utf8'))
    })
  })
}
