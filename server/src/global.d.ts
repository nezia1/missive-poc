import { User } from '@prisma/client'

export interface ResourceParams {
  id: string
}

export interface UpdateUserBody extends User {
  enable_totp: boolean
}
