import { PrismaClient } from '@prisma/client'
import * as OTPAuth from 'otpauth'
import { password } from 'bun'
import { generateRandomBase32String } from '@/utils'

const prisma = new PrismaClient()

async function main() {
  const totp = new OTPAuth.TOTP({
    issuer: 'POC Flutter',
    algorithm: 'SHA256',
    digits: 6,
    period: 30,
    secret: generateRandomBase32String(32),
  })

  const alice = await prisma.user.create({
    data: {
      name: 'Alice',
      password: await password.hash('Super'),
      totp_url: totp.toString(),
    },
  })

  const bob = await prisma.user.create({
    data: { name: 'Bob', password: await password.hash('Super') },
  })

  console.log({ alice, bob })
}

await main()
  .then(async () => {
    await prisma.$disconnect()
  })

  .catch(async (e) => {
    console.error(e)

    await prisma.$disconnect()

    process.exit(1)
  })
