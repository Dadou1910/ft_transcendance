import fp from 'fastify-plugin'
import { FastifyEnvOptions } from '@fastify/env'

export interface Env {
  PORT: number
  DB_PATH: string
  BCRYPT_SALT_ROUNDS: number
}

const schema = {
  type: 'object',
  required: ['PORT', 'DB_PATH', 'BCRYPT_SALT_ROUNDS'],
  properties: {
    PORT: { type: 'number' },
    DB_PATH: { type: 'string' },
    BCRYPT_SALT_ROUNDS: { type: 'number' }
  }
}

const options: FastifyEnvOptions = {
  schema,
  dotenv: true,
  data: process.env
}

export default fp(async (fastify) => {
  await fastify.register(import('@fastify/env'), options)
})
