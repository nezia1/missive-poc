import { User } from '@prisma/client'

export interface ResourceParams {
  id: string
}
interface BasicUpdateUserBody extends User {
  enable_totp?: false
  password?: string
}

interface UpdateUserBodyWithTOTP extends User {
  enable_totp: true
  password: string
}

// This union type exists so that if a user has enable_totp set to true, the password field is required
export type UpdateUserBody = BasicUpdateUserBody | UpdateUserBodyWithTOTP
