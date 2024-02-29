import { PrismaClient } from '@prisma/client'
import * as OTPAuth from 'otpauth'
import { password } from 'bun'
import { generateRandomBase32String } from '@/utils'
import constants from '@/constants'

const prisma = new PrismaClient()

async function main() {
  const totp = new OTPAuth.TOTP({
    issuer: 'POC Flutter',
    algorithm: 'SHA256',
    digits: 6,
    period: 30,
    secret: generateRandomBase32String(32),
  })

  const users = constants.seedUsers

  for (const user of users) {
    const { name, password: plainPassword } = user

    const hashedPassword = await password.hash(plainPassword)
    await prisma.user.create({
      data: {
        name,
        password: hashedPassword,
        totp_url: totp.toString(),
      },
    })
  }
  console.log(users)
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
