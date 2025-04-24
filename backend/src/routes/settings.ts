import { FastifyInstance } from 'fastify'
import { Database } from 'sqlite3'
import { User, UserSettings } from '../types'

export async function settingsRoutes(fastify: FastifyInstance, db: Database) {
  fastify.post<{ Body: { userId: number; backgroundColor?: string; ballSpeed?: number } }>('/settings', async (request, reply) => {
    const { userId, backgroundColor, ballSpeed } = request.body

    if (!userId) {
      reply.code(400)
      return { error: 'userId is required' }
    }

    try {
      const user = await new Promise<User | undefined>((resolve, reject) => {
        db.get('SELECT id FROM users WHERE id = ?', [userId], (err, row: User | undefined) => {
          if (err) reject(err)
          resolve(row)
        })
      })
      if (!user) {
        reply.code(404)
        return { error: 'User not found' }
      }

      await new Promise<void>((resolve, reject) => {
        db.run(
          `
          INSERT INTO user_settings (userId, backgroundColor, ballSpeed, updatedAt)
          VALUES (?, ?, ?, ?)
          ON CONFLICT(userId) DO UPDATE SET
            backgroundColor = COALESCE(?, backgroundColor),
            ballSpeed = COALESCE(?, ballSpeed),
            updatedAt = ?
          `,
          [userId, backgroundColor, ballSpeed, new Date().toISOString(), backgroundColor, ballSpeed, new Date().toISOString()],
          (err) => {
            if (err) reject(err)
            resolve()
          }
        )
      })

      return { status: 'Settings updated' }
    } catch (err) {
      fastify.log.error('Settings update error:', err)
      reply.code(500)
      return { error: 'Server error' }
    }
  })
}