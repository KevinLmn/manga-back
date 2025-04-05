import { expect } from 'chai'
import request from 'supertest'
import fastify from '../src/index.js'

// Add Mocha type definitions
declare const describe: (title: string, fn: () => void) => void
declare const it: (title: string, fn: (done?: () => void) => void) => void

describe('POST /login', () => {
  it('should return 401 with "Invalid credentials" for wrong username and password', async () => {
    const response = await request(fastify.server)
      .post('/login')
      .send({ username: 'wronguser', password: 'wrongpass' })

    expect(response.status).to.equal(401)
    const responseText = 'Invalid credentials'
    expect(response.text).to.equal(
      `{"success":false,"message":"${responseText}"}`
    )
    expect(response.body).to.deep.equal({
      success: false,
      message: responseText,
    })
  })
})
