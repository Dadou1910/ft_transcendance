import { FastifyInstance } from 'fastify'

declare module 'fastify' {
  interface FastifyInstance {
    config: {
      PORT: number
      DB_PATH: string
      BCRYPT_SALT_ROUNDS: number
    }
  }
}

export {}