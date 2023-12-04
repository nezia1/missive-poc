import * as Crypto from 'crypto'

const SALT_LENGTH = 64 // In bytes
const IV_LENGTH = 16 // For AES, this is always 16
const ITERATIONS = 100000 // Recommendation is >= 10000

/**
 * TODO: make this clearer (this is supposed to encrypt the TOTP URL, as well as additional sensitive information that might need to be stored in the database). Perhaps this should be split into two functions: one for deriving the key from the password, and another for encrypting the data
 **/

/**
 * Encrypts text using AES-256-CBC.
 * @param {string} textToEncrypt - Text to encrypt
 * @param {string} password - Password to use for encryption
 */
export function encrypt(
  textToEncrypt: string,
  password: string
): Promise<{ text: string; salt: Buffer; iv: Buffer }> {
  const salt = Crypto.randomBytes(SALT_LENGTH)

  // Wrap in promise to use async/await (still using NodeJS' callback API)
  return new Promise((resolve, reject) => {
    // Derive a 32 bits key from the password
    Crypto.pbkdf2('sample-password', salt, ITERATIONS, 32, 'sha512', (err, derivedKey) => {
      if (err) reject(err)

      const iv = Crypto.randomBytes(IV_LENGTH)
      const cipher = Crypto.createCipheriv('aes-256-cbc', derivedKey, iv)

      // Ciphering text
      let encrypted = cipher.update(password)
      const encryptedText = cipher.final('base64')
      // TODO: finish implementing encryption
      // encrypted =

      // This is sent separately so it can be stored in the database, making it easier to decrypt later
      resolve({ text: encryptedText, salt, iv })
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
  encryptedData: { text: string; salt: Buffer; iv: Buffer }
): Promise<string> {
  const { text, salt, iv } = encryptedData

  const encryptedBuffer = Buffer.from(text, 'base64')

  console.log('Buffer to decrypt: ', encryptedBuffer)
  console.log('IV: ', iv)

  return new Promise((resolve, reject) => {
    Crypto.pbkdf2(password, salt, ITERATIONS, 32, 'sha512', (err, derivedKey) => {
      if (err) reject(err)

      const decipher = Crypto.createDecipheriv('aes-256-cbc', derivedKey, iv)
      decipher.update(encryptedBuffer)

      const decryptedText = decipher.final('base64')

      resolve(decryptedText)
    })
  })
}
