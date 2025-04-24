import { FastifyInstance } from 'fastify';
import { Database } from 'sqlite3';
import { User, Match, UserSettings } from '../types';

export async function profileRoutes(fastify: FastifyInstance, db: Database) {
  fastify.get<{ Params: { id: string } }>('/profile/:id', async (request, reply) => {
    const { id } = request.params;

    try {
      const isId = !isNaN(parseInt(id));
      let user: User | undefined;
      if (isId) {
        user = await new Promise<User | undefined>((resolve, reject) => {
          db.get('SELECT id, name, email, wins, losses, tournamentsWon FROM users WHERE id = ?', [parseInt(id)], (err, row: User | undefined) => {
            if (err) reject(err);
            resolve(row);
          });
        });
      } else {
        user = await new Promise<User | undefined>((resolve, reject) => {
          db.get('SELECT id, name, email, wins, losses, tournamentsWon FROM users WHERE name = ?', [id], (err, row: User | undefined) => {
            if (err) reject(err);
            resolve(row);
          });
        });
      }

      if (!user) {
        reply.code(404);
        return { error: 'User not found' };
      }

      const matches = await new Promise<Match[]>((resolve, reject) => {
        db.all('SELECT * FROM matches WHERE userId = ? OR opponentId = ?', [user.id, user.id], (err, rows: Match[]) => {
          if (err) reject(err);
          resolve(rows || []);
        });
      });

      const settings = await new Promise<UserSettings | undefined>((resolve, reject) => {
        db.get('SELECT backgroundColor, ballSpeed FROM user_settings WHERE userId = ?', [user.id], (err, row: UserSettings | undefined) => {
          if (err) reject(err);
          resolve(row);
        });
      });

      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatarUrl: undefined,
        },
        matches,
        settings: settings || {},
      };
    } catch (err) {
      fastify.log.error('Profile fetch error:', err);
      reply.code(500);
      return { error: 'Server error' };
    }
  });
}