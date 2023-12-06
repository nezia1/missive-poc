import Fastify from 'fastify'
import * as OTPAuth from 'otpauth'
import { PrismaClient } from '@prisma/client'
import { password } from 'bun'
import { encrypt, decrypt } from '@/utils'
import { parseGenericError } from '@/utils'

import users from '@/routes/users'
import tokens from '@/routes/tokens'

const prisma = new PrismaClient()

const fastify = Fastify({ logger: true })

fastify.register(users, { prefix: '/users' })
fastify.register(tokens, { prefix: '/tokens' })

try {
  await fastify.listen({ port: 8080 })
} catch (err) {
  fastify.log.error(err)
  process.exit(1)
}
