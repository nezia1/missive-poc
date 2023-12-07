import { FastifyPluginCallback } from 'fastify'
import { Prisma, PrismaClient } from '@prisma/client'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'
import { password } from 'bun'
import { SignJWT, jwtVerify } from 'jose'

import { User } from '@prisma/client'
import { AuthenticationError } from '@/errors'
import { parseGenericError } from '@/utils'

if (process.env.JWT_SECRET === undefined) {
  console.error('JWT_SECRET is not defined')
  process.exit(1)
}

const prisma = new PrismaClient()
// TODO: switch to a more robust secret (e.g. a private key)
const secret = new TextEncoder().encode(process.env.JWT_SECRET)

// TODO: Add a route to refresh the access token
const tokens: FastifyPluginCallback = (fastify, _, done) => {
  fastify.post<{ Body: User }>('/', async (request, response) => {
    const user = await prisma.user.findUnique({
      where: { name: request.body.name },
    })

    if (user === null)
      throw new AuthenticationError('Invalid username or password')

    const authenticated = await password.verify(
      request.body.password,
      user.password
    )

    if (!authenticated) {
      throw new AuthenticationError('Invalid username or password', {
        id: user.id,
      })
    }

    // Creating the first access and refresh tokens
    const accessToken = await new SignJWT()
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setSubject(user.id)
      .setExpirationTime('15m')
      .sign(secret)

    const refreshToken = await new SignJWT()
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setSubject(user.id)
      .setExpirationTime('30d')
      .sign(secret)

    // This needs to be stored in the database
    await prisma.refreshToken.create({
      data: {
        value: refreshToken,
        user: { connect: { id: user.id } },
      },
    })

    response.statusCode = 201

    response.setCookie('refreshToken', refreshToken, {
      path: '/',
      httpOnly: true,
      sameSite: 'strict',
    })

    return { accessToken }
  })

  fastify.put('/', async (request, response) => {
    // Forcing non null since we know the cookie is set because of the authentication hook
    const refreshToken = request.cookies.refreshToken!
    const { payload } = await jwtVerify(refreshToken, secret)
    const user = await prisma.user.findUnique({ where: { id: payload.sub } })
    if (!user) throw new AuthenticationError('Invalid refresh token')

    const accessToken = await new SignJWT()
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setSubject(user.id)
      .setExpirationTime('15m')
      .sign(secret)
    return { accessToken }
  })

  fastify.setErrorHandler(async (error, request, reply) => {
    const apiError = parseGenericError(error)

    request.log.error(apiError.message)

    return reply
      .code(apiError.statusCode)
      .send({ error: apiError.responseMessage })
  })
  done()
}

export default tokens
