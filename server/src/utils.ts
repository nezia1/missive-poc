import * as Crypto from 'crypto'
import {
  PrismaClientInitializationError,
  PrismaClientKnownRequestError,
} from '@prisma/client/runtime/library'

const SALT_LENGTH = 64 // In bytes
const IV_LENGTH = 12 // In bytes (for AES-256-gcm, this is 96 bits based on the GCM specification)
const ITERATIONS = 10000 // Recommendation is >= 10000

type EncryptedData = {
  text: string
  salt: Buffer
  iv: Buffer
  tag: Buffer
}

interface ParseErrorOptions {
  notFoundMessage: string
  duplicateMessage: string
}

interface APIError {
  responseMessage: string
  message: string
  statusCode: number
}

/**
 * TODO: Separate key generation from ciphering
 * TODO: Also we should perhaps use a different algorithm for deriving the key from the password (use the password hash that we use for authentication?). Also 10000 iterations is too low according to the OWASP specification (https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html#pbkdf2). However, since we are using ephemeral keys computed on the fly, this is probably not a big issue.
 **/

/**
 * Encrypts text using AES-256-GDM.
 * @param {string} textToEncrypt - Text to encrypt
 * @param {string} password - Password to use for encryption
 */
export function encrypt(
  textToEncrypt: string,
  password: string
): Promise<EncryptedData> {
  const salt = Crypto.randomBytes(SALT_LENGTH)

  // Wrap in promise to use async/await (still using NodeJS' callback API)
  return new Promise((resolve, reject) => {
    // Derive a 32 bits key from the password
    Crypto.pbkdf2(
      password,
      salt,
      ITERATIONS,
      32,
      'sha512',
      (err, derivedKey) => {
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
      }
    )
  })
}

/**
 * Decrypts text using AES-256-GDM, by providing the password, the symmetrical key salt and IV used for encryption.
 * @param password
 * @param {EncryptedData} encryptedData - Encrypted data
 * @returns {Promise<string>} Decrypted text
 */
export function decrypt(
  password: string,
  encryptedData: EncryptedData
): Promise<string> {
  const { text, salt, iv, tag } = encryptedData

  const encryptedBuffer = Buffer.from(text, 'base64')

  return new Promise((resolve, reject) => {
    Crypto.pbkdf2(
      password,
      salt,
      ITERATIONS,
      32,
      'sha512',
      (err, derivedKey) => {
        if (err) reject(err)

        const decipher = Crypto.createDecipheriv('aes-256-gcm', derivedKey, iv)

        decipher.setAuthTag(tag)

        let decrypted = decipher.update(encryptedBuffer)
        decrypted = Buffer.concat([decrypted, decipher.final()])

        resolve(decrypted.toString('utf8'))
      }
    )
  })
}
/**
 * Transforms a generic Typescript error into an APIError.
 * @param {Error} error - The error to parse.
 * @param {ParseErrorOptions | undefined} options - allows to configure the different error messages the API will return.
 * @returns {APIError}
 * */
export function parseGenericError(
  error: Error,
  options?: ParseErrorOptions
): APIError {
  const apiError: APIError = {} as APIError

  if (error instanceof PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2025':
        apiError.statusCode = 404
        apiError.responseMessage =
          options?.notFoundMessage ||
          'The resource you are trying to reach has not been found.'
        break
      case 'P2002':
        apiError.statusCode = 409
        apiError.responseMessage =
          options?.duplicateMessage ||
          'The resource you are trying to create already exists.'
        break
    }
  } else if (error instanceof PrismaClientInitializationError) {
    apiError.statusCode = 500
    apiError.responseMessage =
      'Our servers encountered an unexpected error. We apologize for the inconvenience.'
  } else {
    apiError.statusCode = 500
    apiError.responseMessage =
      'Our servers encountered an unexpected error. We apologize for the inconvenience.'
  }
  apiError.message = error.message
  return apiError
}