import Fastify from 'fastify'
import * as OTPAuth from 'otpauth'
import { PrismaClient } from '@prisma/client'
import cookie from '@fastify/cookie'
import type { FastifyCookieOptions } from '@fastify/cookie'

import users from '@/routes/users'
import tokens from '@/routes/tokens'

const prisma = new PrismaClient()

const fastify = Fastify({ logger: true })

if (process.env.COOKIE_SECRET === undefined) {
  console.error('COOKIE_SECRET is not defined')
  process.exit(1)
}

fastify.register(users, { prefix: '/users' })
fastify.register(tokens, { prefix: '/tokens' })
fastify.register(cookie, {
  secret: process.env.COOKIE_SECRET,
  parseOptions: {},
} as FastifyCookieOptions)

export default fastify
