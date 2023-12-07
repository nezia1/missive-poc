import { FastifyReply, FastifyRequest } from 'fastify'
import { jwtVerify } from 'jose'
import { JWSSignatureVerificationFailed, JWTExpired } from 'jose/errors'
import { PrismaClient } from '@prisma/client'

import { AuthenticationError } from '@/errors'

const prisma = new PrismaClient()

if (process.env.JWT_SECRET === null) {
  console.error('JWT_SECRET is not defined')
  process.exit(1)
}

const secret = new TextEncoder().encode(process.env.JWT_SECRET)

interface AuthenticatedUser {
  id: string
}

// This is needed to augment the FastifyRequest type and add the authenticatedUser property
declare module 'fastify' {
  interface FastifyRequest {
    authenticatedUser?: AuthenticatedUser
  }
}

export async function authenticationHook(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // Check for refresh token
  const refreshTokenCookie = request.cookies.refreshToken

  if (!refreshTokenCookie)
    throw new AuthenticationError('Missing refresh token')

  // Get access token from Authorization header
  let accessToken = request.headers.authorization?.split(' ')[1]

  if (!accessToken) throw new AuthenticationError('Missing access token')

  try {
    // Get access token payload and check if it matches a user (jwtVerify throws an error if the token is invalid for any reason)
    const { payload } = await jwtVerify(accessToken, secret)
    const user = await prisma.user.findUnique({ where: { id: payload.sub } })

    if (user === null) throw new AuthenticationError('Invalid access token')

    // Inject the authenticated user ID in the request
    request.authenticatedUser = {
      id: user.id,
    }
  } catch (error) {
    if (error instanceof JWTExpired) {
      throw new AuthenticationError('Access token expired')
    } else if (error instanceof JWSSignatureVerificationFailed) {
      throw new AuthenticationError('The access token has been tampered with')
    } else {
      throw new AuthenticationError('Invalid access token')
    }
  }
}
