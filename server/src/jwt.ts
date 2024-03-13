import { JWTPayload, SignJWT, jwtVerify } from 'jose'
import { Permissions } from './permissions'

interface ScopedJWTPayload extends JWTPayload {
  scope?: Permissions[]
}

export class SignScopedJWT extends SignJWT {
  constructor(payload: ScopedJWTPayload | undefined) {
    super(payload)
  }
}

/// This function is used to verify and decode a JWT token
/// @param {string} token - The token to verify and decode
/// @param {Uint8Array} secret - The secret to use to verify the token
/// @returns {Promise<ScopedJWTPayload>} - The decoded payload with the scope/permissions
export async function verifyAndDecodeJWT(
  token: string,
  secret: Uint8Array
): Promise<ScopedJWTPayload> {
  const { payload } = await jwtVerify(token, secret)
  return payload as ScopedJWTPayload
}
