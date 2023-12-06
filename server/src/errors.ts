export class AuthenticationError extends Error {
  id: string
  constructor(message: string, { id }: { id: string }) {
    super(message)
    this.name = 'AuthenticationError'
    this.id = id
  }
}
