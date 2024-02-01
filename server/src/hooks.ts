import { FastifyReply, FastifyRequest } from 'fastify'
import { jwtVerify } from 'jose'
import { JWTInvalid } from 'jose/errors'
import { PrismaClient, Prisma } from '@prisma/client'

const prisma = new PrismaClient()

if (process.env.JWT_SECRET === null) {
  console.error('JWT_SECRET is not defined')
  process.exit(1)
}

const secret = new TextEncoder().encode(process.env.JWT_SECRET)

// This is needed to augment the FastifyRequest type and add the authenticatedUser property
declare module 'fastify' {
  interface FastifyRequest {
    authenticatedUser?: Prisma.UserSelect
  }
}

export async function authenticationHook(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // Get access token from Authorization header
  let accessToken = request.headers.authorization?.split(' ')[1]

  if (!accessToken) throw new JWTInvalid('Missing access token')

  // Get access token payload and check if it matches a user (jwtVerify throws an error if the token is invalid for any reason)
  const { payload } = await jwtVerify(accessToken, secret)
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: payload.sub },
  })

  // Inject the authenticated user ID in the request
  request.authenticatedUser = user
}
