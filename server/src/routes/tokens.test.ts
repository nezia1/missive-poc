import { sampleUsers } from '@/constants'
import app from '@/app'
import t from 'tap'

t.test('POST /tokens successful authentication', async (t) => {
  const userWithTOTP = sampleUsers[0]
  const userWithoutTOTP = sampleUsers[1]

  const successfulResponseWithTOTP = await app.inject({
    method: 'POST',
    url: '/tokens',
    payload: {
      name: userWithTOTP.name,
      password: userWithTOTP.password,
    },
  })
  const successfulResponseWithoutTOTP = await app.inject({
    method: 'POST',
    url: '/tokens',
    payload: {
      name: userWithoutTOTP.name,
      password: userWithoutTOTP.password,
    },
  })

  t.equal(
    successfulResponseWithoutTOTP.statusCode,
    201,
    'should have a 201 CREATED status code on successful login'
  )

  t.equal(
    successfulResponseWithTOTP.json().status,
    'totp_required',
    'should respond with status: totp_required field when using TOTP'
  )
})
