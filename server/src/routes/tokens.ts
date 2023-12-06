import { FastifyPluginCallback } from 'fastify'
import { Prisma, PrismaClient } from '@prisma/client'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'
import { password } from 'bun'
import * as jwt from 'jsonwebtoken'

import { UserRequestBody } from '@/global'
import { AuthenticationError } from '@/errors'
import { parseGenericError } from '@/utils'

const { JWT_SECRET } = process.env

if (JWT_SECRET === undefined) {
  console.error('JWT_SECRET is not defined')
  process.exit(1)
}

const tokens: FastifyPluginCallback = (fastify, _, done) => {
  const prisma = new PrismaClient()

  fastify.post<{ Body: UserRequestBody }>('/', async (request, response) => {
    const user = await prisma.user.findUnique({
      where: { name: request.body.name },
    })

    if (user === null)
      throw new PrismaClientKnownRequestError(
        'Username not found while trying to authenticate',
        {
          code: 'P2025',
          clientVersion: Prisma.prismaVersion.client,
        }
      )

    const authenticated = await password.verify(
      request.body.password,
      user.password
    )

    if (!authenticated) {
      throw new AuthenticationError('Invalid username or password', {
        id: user.id,
      })
    }

    const accessToken = jwt.sign({ id: user.id }, JWT_SECRET, {
      expiresIn: '15m',
    })

    const refreshToken = jwt.sign({ id: user.id }, JWT_SECRET, {
      expiresIn: '30d',
    })

    response.statusCode = 201

    return { accessToken, refreshToken }
  })

  fastify.setErrorHandler(async (error, request, reply) => {
    const apiError = parseGenericError(error)

    console.error(error)
    request.log.error(apiError.message)

    return reply
      .code(apiError.statusCode)
      .send({ error: apiError.responseMessage })
  })
  done()
}

export default tokens
