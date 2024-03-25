import app from '@/app'
import { sampleUsers } from '@/constants'
import { jwtVerify } from 'jose'
import t from 'tap'

const userWithTOTP = sampleUsers[0]
const userWithoutTOTP = sampleUsers[1]

const successfulResponseWithoutTOTP = await app.inject({
	method: 'POST',
	url: '/tokens',
	payload: {
		name: userWithoutTOTP.name,
		password: userWithoutTOTP.password,
	},
})

t.test('POST /tokens', async (t) => {
	const successfulResponseWithTOTP = await app.inject({
		method: 'POST',
		url: '/tokens',
		payload: {
			name: userWithTOTP.name,
			password: userWithTOTP.password,
		},
	})

	const unsuccessfulResponse = await app.inject({
		method: 'POST',
		url: '/tokens',
		payload: {
			name: 'nonexistent',
			password: 'nonexistent',
		},
	})

	t.equal(
		successfulResponseWithoutTOTP.statusCode,
		201,
		'should have a 201 CREATED status code on successful login',
	)

	t.equal(
		successfulResponseWithTOTP.json().data.status,
		'totp_required',
		'should respond with status: totp_required field when using TOTP',
	)

	t.equal(
		unsuccessfulResponse.statusCode,
		401,
		'should have a 401 UNAUTHORIZED status code on login using wrong credentials',
	)
})

t.test('PUT /tokens', async (t) => {
	const secret = new TextEncoder().encode(process.env.JWT_SECRET)
	const successfullyRefreshedTokenResponse = await app.inject({
		method: 'PUT',
		url: '/tokens',
		cookies: {
			refreshToken: successfulResponseWithoutTOTP.cookies[0].value,
		},
	})

	const accessToken = successfullyRefreshedTokenResponse.json().data.accessToken

	let isAccessTokenValid: boolean
	try {
		await jwtVerify(accessToken, secret)
		isAccessTokenValid = true
	} catch {
		isAccessTokenValid = false
	}

	t.equal(isAccessTokenValid, true, 'should respond with a valid access token')
})
