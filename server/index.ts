import Fastify from 'fastify'
import * as OTPAuth from 'otpauth'
import { PrismaClient } from '@prisma/client'
import { password } from 'bun'
import { encrypt, decrypt } from './utils'

const prisma = new PrismaClient()

const fastify = Fastify({ logger: true })

try {
  await fastify.listen({ port: 3000 })
} catch (err) {
  fastify.log.error(err)
  process.exit(1)
}
