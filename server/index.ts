import * as OTPAuth from 'otpauth'
import { encrypt, decrypt } from './utils'

// OTP
const totp = OTPAuth.URI.parse(
  'otpauth://totp/Missive:OTPAuth?issuer=Missive&secret=QFEPVWPD4OXBPKTZCOUPIZ4URDI223VN&algorithm=SHA256&digits=6&period=30'
)
console.log(totp.validate({ token: '519333' }))

console.log('Hello via Bun!')

const encryptedTOTP = await encrypt(totp.toString(), 'sample-password')
await decrypt('sample-password', {
  text: encryptedTOTP.text,
  salt: encryptedTOTP.salt,
  iv: encryptedTOTP.iv,
})
