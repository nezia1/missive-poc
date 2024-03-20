import { StringAsNumber } from 'fastify/types/utils'

interface SuccessResponse {
	data: Record<string, unknown>
	errors?: never
}

interface ErrorResponse {
	data?: never
	error: APIError
}

export interface APIError {
	responseMessage: string
	message: string
	statusCode: number
}

export type APIResponse = SuccessResponse | ErrorResponse
