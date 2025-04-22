import Fastify from 'fastify'
import cors from '@fastify/cors'
import fastifyEnv from './config'
import fastifySqlite from 'fastify-sqlite'
import { hash, compare } from 'bcrypt'
import { Env } from './config'

interface User {
  id?: number
  name: string
  email: string
  password: string
  score?: number
}

async function buildServer() {
  const fastify = Fastify({ logger: true })

  // 1) Charger .env
  await fastify.register(fastifyEnv)

  // 2) CORS
  fastify.register(cors, { origin: '*' })

  // 3) SQLite
  await fastify.register(fastifySqlite, {
    db: (fastify as any).config.DB_PATH
  })

  // 4) Initialiser la table users
  await fastify.after()
  ;(fastify as any).sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      score INTEGER NOT NULL DEFAULT 0
    );
  `)

  // 5) Route d'inscription
  fastify.post<{ Body: Pick<User, 'name' | 'email' | 'password'> }>(
    '/register',
    async (request, reply) => {
      const { name, email, password } = request.body
      const saltRounds = (fastify as any).config.BCRYPT_SALT_ROUNDS
      const hashed = await hash(password, saltRounds)
      try {
        const stmt = (fastify as any).sqlite.prepare(
          'INSERT INTO users (name,email,password) VALUES (?,?,?)'
        )
        const result = stmt.run(name, email, hashed)
        return { id: result.lastInsertRowid }
      } catch (err: any) {
        reply.code(400)
        return { error: 'Email déjà utilisé' }
      }
    }
  )

  // 6) Route de login
  fastify.post<{ Body: { email: string; password: string } }>(
    '/login',
    async (request, reply) => {
      const { email, password } = request.body
      const row = (fastify as any).sqlite
        .prepare('SELECT * FROM users WHERE email = ?')
        .get(email)
      if (!row) {
        reply.code(404)
        return { error: 'Utilisateur non trouvé' }
      }
      const match = await compare(password, row.password)
      if (!match) {
        reply.code(401)
        return { error: 'Mot de passe incorrect' }
      }
      return { id: row.id, name: row.name, email: row.email, score: row.score }
    }
  )

  // 7) Démarrage
  const port = (fastify as any).config.PORT
  await fastify.listen({ port, host: '0.0.0.0' })
  fastify.log.info(`Server listening on ${port}`)
}

buildServer().catch(console.error)
