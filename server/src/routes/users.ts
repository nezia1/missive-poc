import { FastifyPluginCallback } from 'fastify'
import { Prisma, PrismaClient } from '@prisma/client'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'
import { jwtVerify } from 'jose'
import { password } from 'bun'

import type { ResourceParams, UserRequestBody } from '@/global'
import { parseGenericError } from '@/utils'
import { authenticationHook } from '@/hooks'

if (process.env.JWT_SECRET === undefined) {
  console.error('COOKIE_SECRET is not defined')
  process.exit(1)
}

const prisma = new PrismaClient()
const secret = new TextEncoder().encode(process.env.JWT_SECRET)

const users: FastifyPluginCallback = (fastify, _, done) => {
  fastify.route({
    method: 'GET',
    url: '/me',
    preParsing: authenticationHook,
    handler: async (request, response) => {
      const accessToken = request.headers.authorization!.split(' ')[1]

      const { payload } = await jwtVerify(accessToken, secret)
      const user = await prisma.user.findUnique({
        where: { id: payload.sub },
      })

      if (user === null)
        throw new PrismaClientKnownRequestError('User not found', {
          code: 'P2025',
          clientVersion: Prisma.prismaVersion.client,
        })

      return user
    },
  })
  fastify.post<{ Body: UserRequestBody }>('/', async (request, response) => {
    const newUser = await prisma.user.create({
      data: {
        name: request.body.name,
        password: await password.hash(request.body.password),
      },
    })

    response.statusCode = 201

    return { id: newUser.id }
  })

  fastify.patch<{ Params: ResourceParams; Body: UserRequestBody }>(
    '/:id',
    async (request, response) => {
      const updatedUser = await prisma.user.update({
        where: {
          id: request.params.id,
        },
        data: {
          name: request.body.name,
          password: await password.hash(request.body.password),
        },
      })

      if (updatedUser === undefined)
        throw new PrismaClientKnownRequestError(
          'User to update was not found',
          {
            code: 'P2025',
            clientVersion: Prisma.prismaVersion.client,
          }
        )

      response.statusCode = 204
    }
  )

  fastify.delete<{ Params: ResourceParams }>(
    '/:id',
    async (request, response) => {
      await prisma.user.delete({
        where: {
          id: request.params.id,
        },
      })

      response.statusCode = 204
    }
  )

  fastify.setErrorHandler(async (error, request, reply) => {
    const apiError = parseGenericError(error, {
      notFoundMessage:
        'The user you provided does not exist in our database. Please double check your user ID and try again.',
      duplicateMessage:
        'The username you are trying to register with already exists.',
    })

    request.log.error(apiError.message)

    return reply
      .code(apiError.statusCode)
      .send({ error: apiError.responseMessage })
  })
  done()
}

export default users
