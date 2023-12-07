import { User } from '@prisma/client'

export interface ResourceParams {
  id: string
}
export interface UpdateUserBody {
  enable_totp?: boolean
  password?: string
}
