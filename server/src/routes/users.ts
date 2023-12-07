import { FastifyPluginCallback } from 'fastify'
import { Prisma, PrismaClient } from '@prisma/client'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'
import { jwtVerify } from 'jose'
import { password } from 'bun'
import * as OTPAuth from 'otpauth'

import type { ResourceParams, UpdateUserBody } from '@/global'
import { User } from '@prisma/client'
import { generateRandomBase32String, parseGenericError } from '@/utils'
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
      const user = await prisma.user.findUnique({
        where: { id: request.authenticatedUser?.id },
      })

      if (user === null)
        throw new PrismaClientKnownRequestError('User not found', {
          code: 'P2025',
          clientVersion: Prisma.prismaVersion.client,
        })

      return user
    },
  })
  fastify.post<{ Body: User }>('/', async (request, response) => {
    const newUser = await prisma.user.create({
      data: {
        name: request.body.name,
        password: await password.hash(request.body.password),
      },
    })

    response.statusCode = 201

    return { id: newUser.id }
  })

  fastify.route<{ Params: ResourceParams; Body: UpdateUserBody }>({
    method: 'PATCH',
    url: '/me',
    preParsing: authenticationHook,
    handler: async (request, response) => {
      let totp: OTPAuth.TOTP | undefined

      // If the user wants to enable TOTP, we generate a new URL
      if (request.body.enable_totp) {
        totp = new OTPAuth.TOTP({
          issuer: 'POC Flutter',
          label: request.body.name,
          algorithm: 'SHA256',
          digits: 6,
          period: 30,
          secret: totp ? generateRandomBase32String(32) : undefined,
        })
      }

      const updatedUser = await prisma.user.update({
        where: {
          id: request.authenticatedUser?.id,
        },
        data: {
          name: request.body.name,
          password: await password.hash(request.body.password),
          totp: totp ? totp.toString() : undefined,
        },
      })

      if (updatedUser === undefined)
        throw new PrismaClientKnownRequestError('User not found', {
          code: 'P2025',
          clientVersion: Prisma.prismaVersion.client,
        })

      if (totp) {
        response.send({ totp: totp.toString() })
        response.statusCode = 200
        return
      }
      response.statusCode = 204
    },
  })

  fastify.route<{ Params: ResourceParams }>({
    method: 'DELETE',
    url: '/me',
    preParsing: authenticationHook,
    handler: async (request, response) => {
      const accessToken = request.headers.authorization!.split(' ')[1]
      const { payload } = await jwtVerify(accessToken, secret)
      await prisma.user.delete({
        where: {
          id: payload.sub,
        },
      })

      response.statusCode = 204
    },
  })

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
