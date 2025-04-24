import { FastifyInstance } from 'fastify'
import { hash, compare } from 'bcrypt'
import { Database } from 'sqlite3'
import { User } from '../types'

export async function authRoutes(fastify: FastifyInstance, db: Database) {
  fastify.post<{ Body: Pick<User, 'name' | 'email' | 'password'> }>('/register', async (request, reply) => {
    const { name, email, password } = request.body

    if (!name || !email || !password) {
      reply.code(400)
      return { error: 'Name, email, and password are required' }
    }
    if (!email.includes('@')) {
      reply.code(400)
      return { error: 'Invalid email format' }
    }
    if (password.length < 8) {
      reply.code(400)
      return { error: 'Password must be at least 8 characters long' }
    }

    try {
      const hashedPassword = await hash(password, fastify.config.BCRYPT_SALT_ROUNDS)
      fastify.log.info(`Hashed password for user ${email}: ${hashedPassword}`)
      if (!hashedPassword.startsWith('$2b$') || hashedPassword.length !== 60) {
        fastify.log.error('Invalid bcrypt hash generated:', hashedPassword)
        reply.code(500)
        return { error: 'Failed to hash password' }
      }

      const lastID = await new Promise<number>((resolve, reject) => {
        db.run(
          'INSERT INTO users (name, email, password, wins, losses, tournamentsWon) VALUES (?, ?, ?, 0, 0, 0)',
          [name, email, hashedPassword],
          function(err) {
            if (err) {
              fastify.log.error('Database insertion error:', err)
              reject(err)
              return
            }
            fastify.log.info(`Insert successful, lastID: ${this.lastID}`)
            resolve(this.lastID)
          }
        )
      })

      if (!lastID) {
        fastify.log.error(`Failed to insert user into database (no lastID). Name: ${name}, Email: ${email}`)
        reply.code(500)
        return { error: 'Failed to register user' }
      }

      const insertedUser = await new Promise<User | undefined>((resolve, reject) => {
        db.get('SELECT password FROM users WHERE id = ?', [lastID], (err, row: User | undefined) => {
          if (err) reject(err)
          resolve(row)
        })
      })
      if (!insertedUser) {
        fastify.log.error(`Failed to fetch inserted user. ID: ${lastID}`)
        reply.code(500)
        return { error: 'Failed to fetch inserted user' }
      }
      fastify.log.info(`Stored password for user ${email}: ${insertedUser.password}`)

      return { id: lastID }
    } catch (err: any) {
      fastify.log.error('Registration error:', err)
      if (err.message.includes('UNIQUE constraint failed')) {
        reply.code(400)
        return { error: 'Name or email already in use' }
      }
      reply.code(500)
      return { error: 'Server error' }
    }
  })

  fastify.post<{ Body: { email: string; password: string } }>('/login', async (request, reply) => {
    const { email, password } = request.body

    if (!email || !password) {
      reply.code(400)
      return { error: 'Email and password are required' }
    }

    try {
      const user = await new Promise<User | undefined>((resolve, reject) => {
        db.get('SELECT * FROM users WHERE email = ?', [email], (err, row: User | undefined) => {
          if (err) reject(err)
          resolve(row)
        })
      })

      if (!user) {
        reply.code(404)
        return { error: 'User not found' }
      }

      if (!user.password || typeof user.password !== 'string' || !user.password.startsWith('$2b$')) {
        fastify.log.error(`Invalid password hash for user ${email}: ${user.password}`)
        reply.code(401)
        return { error: 'Invalid user credentials' }
      }

      fastify.log.info(`Comparing password for user ${email}`)
      fastify.log.info(`Stored password hash: ${user.password}`)
      let match: boolean
      try {
        match = await compare(password, user.password)
      } catch (compareErr) {
        fastify.log.error('bcrypt compare error:', compareErr)
        reply.code(500)
        return { error: 'Password verification failed' }
      }
      fastify.log.info(`Password match result: ${match}`)

      if (!match) {
        reply.code(401)
        return { error: 'Incorrect password' }
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        wins: user.wins,
        losses: user.losses,
        tournamentsWon: user.tournamentsWon
      }
    } catch (err) {
      fastify.log.error('Login error:', err)
      reply.code(500)
      return { error: 'Server error' }
    }
  })
}