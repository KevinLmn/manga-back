import { FastifyInstance } from 'fastify'
import { loginController } from '../controllers/login.js'
import { refreshTokenController } from '../controllers/refreshToken.js'

export async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/login', loginController)
  fastify.post('/refresh-token', refreshTokenController)
}
