import { FastifyPluginCallback } from 'fastify'
import { Prisma, PrismaClient } from '@prisma/client'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library.js'
import { jwtVerify } from 'jose'
import * as argon2 from 'argon2'
import * as OTPAuth from 'otpauth'

import { generateRandomBase32String, parseGenericError, exclude } from '@/utils'
import { authenticationHook, authorizationHook } from '@/hooks'
import { AuthenticationError } from '@/errors'
import { Permissions } from '@/permissions'

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is not defined')
  process.exit(1)
}

const prisma = new PrismaClient()
const secret = new TextEncoder().encode(process.env.JWT_SECRET)

const users: FastifyPluginCallback = (fastify, _, done) => {
  fastify.route({
    method: 'GET',
    url: '/me',
    preParsing: [
      authenticationHook,
      authorizationHook([Permissions.USER_READ]),
    ],
    handler: async (request, _) => {
      const user = await prisma.user.findUniqueOrThrow({
        where: { id: request.authenticatedUser!.id },
      })

      return exclude(user, ['password', 'totp_url'])
    },
  })

  fastify.post<{ Body: Prisma.UserCreateInput }>(
    '/',
    async (request, response) => {
      const newUser = await prisma.user.create({
        data: {
          name: request.body.name,
          password: await argon2.hash(request.body.password),
        },
      })

      response.statusCode = 201

      return { id: newUser.id }
    }
  )

  fastify.route<{ Body: Prisma.UserUpdateInput & { enable_totp?: boolean } }>({
    method: 'PATCH',
    url: '/me',
    preParsing: authenticationHook,
    handler: async (request, response) => {
      let totp: OTPAuth.TOTP | undefined

      // If the user wants to enable TOTP, we generate a new URL
      if (request.body.enable_totp) {
        if (!request.body.password)
          throw new AuthenticationError('Need a valid password to enable TOTP')
        totp = new OTPAuth.TOTP({
          issuer: 'POC Flutter',
          algorithm: 'SHA256',
          digits: 6,
          period: 30,
          secret: generateRandomBase32String(32),
        })
      }

      const updatedUser = await prisma.user.update({
        where: {
          id: request.authenticatedUser!.id,
        },
        data: {
          totp_url:
            request.body.enable_totp && totp ? totp.toString() : undefined,
        },
      })

      if (!updatedUser)
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

  fastify.route({
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
