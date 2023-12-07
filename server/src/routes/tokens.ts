import { FastifyPluginCallback } from 'fastify'
import { Prisma, PrismaClient } from '@prisma/client'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'
import { password } from 'bun'
import { SignJWT, jwtVerify } from 'jose'

import { UserRequestBody } from '@/global'
import { AuthenticationError } from '@/errors'
import { parseGenericError } from '@/utils'

if (process.env.JWT_SECRET === undefined) {
  console.error('JWT_SECRET is not defined')
  process.exit(1)
}

// TODO: switch to a more robust secret (e.g. a private key)
const secret = new TextEncoder().encode(process.env.JWT_SECRET)

const tokens: FastifyPluginCallback = (fastify, _, done) => {
  const prisma = new PrismaClient()

  fastify.post<{ Body: UserRequestBody }>('/', async (request, response) => {
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
