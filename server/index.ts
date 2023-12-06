import * as OTPAuth from 'otpauth'
import { encrypt, decrypt } from './utils'

// OTP
const totp = OTPAuth.URI.parse(
  'otpauth://totp/Missive:OTPAuth?issuer=Missive&secret=QFEPVWPD4OXBPKTZCOUPIZ4URDI223VN&algorithm=SHA256&digits=6&period=30'
)

console.time('encrypt')

const encryptedTOTP = await encrypt(totp.toString(), 'sample-password')
console.log('encrypted url: ' + encryptedTOTP.text)
const decryptedTOTP = await decrypt('sample-password', encryptedTOTP)

console.log('decrypted url: ' + decryptedTOTP)

console.timeEnd('encrypt')
