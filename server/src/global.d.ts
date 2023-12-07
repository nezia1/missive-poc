import { User } from '@prisma/client'

export interface ResourceParams {
  id: string
}
interface BasicUpdateUserBody extends User {
  enable_totp?: false
}

interface UpdateUserBodyWithTOTP extends User {
  enable_totp: true
  totp_password: string
}

// This union type exists so that if a user has enable_totp set to true, the password field is required in order to be able to encrypt the TOTP secret using the user's password
export type UpdateUserBody = BasicUpdateUserBody | UpdateUserBodyWithTOTP
