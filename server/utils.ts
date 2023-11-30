import * as Crypto from 'crypto'
import * as OTPAuth from 'otpauth'
const IV_LENGTH = 16 // For AES, this is always 16
const SALT_LENGTH = 64 // In bytes

// OTP
const totp = OTPAuth.URI.parse(
  'otpauth://totp/Missive:OTPAuth?issuer=Missive&secret=QFEPVWPD4OXBPKTZCOUPIZ4URDI223VN&algorithm=SHA256&digits=6&period=30'
)
console.log(totp.validate({ token: '519333' }))

/**
 * Encrypts text using AES-256-CBC.
 * @param {string} textToEncrypt - Text to encrypt
 * @param {string} password - Password to use for encryption
 */
function encrypt(textToEncrypt: string, password: string): Promise<string> {
  const salt = Crypto.randomBytes(SALT_LENGTH)

  // Wrap in promise to use async/await (still using NodeJS' callback API)
  return new Promise((resolve, reject) => {
    // Derive a 32 bits key from the password
    Crypto.pbkdf2('sample-password', salt, 100000, 32, 'sha512', (err, derivedKey) => {
      if (err) reject(err)
      console.log(derivedKey.toString('hex')) // Print the key

      const iv = Crypto.randomBytes(IV_LENGTH)
      const cipher = Crypto.createCipheriv('aes-256-cbc', derivedKey, iv)

      // Ciphering TOTP URL
      cipher.update(password)
      const encryptedText = cipher.final('base64')

      resolve(encryptedText)
    })
  })
}
