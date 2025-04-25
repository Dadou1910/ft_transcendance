import { FastifyInstance } from 'fastify';
import { Database } from 'sqlite3';
import { User, Match, UserSettings } from '../types';
import { compare, hash } from 'bcrypt';

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

  fastify.get('/profile/me', async (request, reply) => {
    try {
      const user = request.user;
      const matches = await new Promise<Match[]>((resolve, reject) => {
        db.all(
          `SELECT * FROM matches 
           WHERE userId = ? OR opponentId = ? 
           ORDER BY date DESC 
           LIMIT 5`,
          [user.id, user.id],
          (err, rows: Match[]) => {
            if (err) reject(err);
            resolve(rows || []);
          }
        );
      });

      const settings = await new Promise<UserSettings | undefined>((resolve, reject) => {
        db.get('SELECT backgroundColor, ballSpeed FROM user_settings WHERE userId = ?', [user.id], (err, row: UserSettings | undefined) => {
          if (err) reject(err);
          resolve(row);
        });
      });

      // Get the full user data including stats
      const fullUserData = await new Promise<User | undefined>((resolve, reject) => {
        db.get('SELECT id, name, email, wins, losses, tournamentsWon FROM users WHERE id = ?', [user.id], (err, row: User | undefined) => {
          if (err) reject(err);
          resolve(row);
        });
      });

      if (!fullUserData) {
        reply.code(404);
        return { error: 'User not found' };
      }

      return {
        user: {
          id: fullUserData.id,
          name: fullUserData.name,
          email: fullUserData.email,
          avatarUrl: undefined,
          wins: fullUserData.wins,
          losses: fullUserData.losses,
          tournamentsWon: fullUserData.tournamentsWon
        },
        matches,
        settings: settings || {},
      };
    } catch (err) {
      fastify.log.error('Current user profile fetch error:', err);
      reply.code(500);
      return { error: 'Server error' };
    }
  });

  fastify.post<{
    Body: {
      username?: string;
      email?: string;
      currentPassword?: string;
      newPassword?: string;
    }
  }>('/profile/update', async (request, reply) => {
    const user = request.user;
    if (!user) {
      reply.code(401);
      return { error: 'Unauthorized' };
    }

    const { username, email, currentPassword, newPassword } = request.body;

    try {
      await new Promise<void>((resolve, reject) => {
        db.run('BEGIN TRANSACTION', (err) => {
          if (err) reject(err);
          resolve();
        });
      });

      if (currentPassword && newPassword) {
        const userWithPassword = await new Promise<User | undefined>((resolve, reject) => {
          db.get('SELECT password FROM users WHERE id = ?', [user.id], (err, row: User | undefined) => {
            if (err) reject(err);
            resolve(row);
          });
        });

        if (!userWithPassword) {
          throw new Error('User not found');
        }

        const isPasswordValid = await compare(currentPassword, userWithPassword.password);
        if (!isPasswordValid) {
          throw new Error('Current password is incorrect');
        }

        if (newPassword.length < 8) {
          throw new Error('New password must be at least 8 characters long');
        }

        const hashedPassword = await hash(newPassword, fastify.config.BCRYPT_SALT_ROUNDS);
        await new Promise<void>((resolve, reject) => {
          db.run('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, user.id], (err) => {
            if (err) reject(err);
            resolve();
          });
        });
      }

      if (username && username !== user.name) {
        const existingUser = await new Promise<User | undefined>((resolve, reject) => {
          db.get('SELECT id FROM users WHERE name = ? AND id != ?', [username, user.id], (err, row: User | undefined) => {
            if (err) reject(err);
            resolve(row);
          });
        });

        if (existingUser) {
          throw new Error('Username already taken');
        }

        await new Promise<void>((resolve, reject) => {
          db.run('UPDATE users SET name = ? WHERE id = ?', [username, user.id], (err) => {
            if (err) reject(err);
            resolve();
          });
        });

        await new Promise<void>((resolve, reject) => {
          db.run('UPDATE matches SET userName = ? WHERE userId = ?', [username, user.id], (err) => {
            if (err) reject(err);
            resolve();
          });
        });

        await new Promise<void>((resolve, reject) => {
          db.run('UPDATE matches SET opponentName = ? WHERE opponentId = ?', [username, user.id], (err) => {
            if (err) reject(err);
            resolve();
          });
        });

        await new Promise<void>((resolve, reject) => {
          db.run('UPDATE tournament_players SET username = ? WHERE username = ?', [username, user.name], (err) => {
            if (err) reject(err);
            resolve();
          });
        });

        await new Promise<void>((resolve, reject) => {
          db.run('UPDATE tournament_matches SET player1 = ? WHERE player1 = ?', [username, user.name], (err) => {
            if (err) reject(err);
            resolve();
          });
        });

        await new Promise<void>((resolve, reject) => {
          db.run('UPDATE tournament_matches SET player2 = ? WHERE player2 = ?', [username, user.name], (err) => {
            if (err) reject(err);
            resolve();
          });
        });

        await new Promise<void>((resolve, reject) => {
          db.run('UPDATE tournament_matches SET winner = ? WHERE winner = ?', [username, user.name], (err) => {
            if (err) reject(err);
            resolve();
          });
        });
      }

      if (email && email !== user.email) {
        if (!email.includes('@')) {
          throw new Error('Invalid email format');
        }

        const existingUser = await new Promise<User | undefined>((resolve, reject) => {
          db.get('SELECT id FROM users WHERE email = ? AND id != ?', [email, user.id], (err, row: User | undefined) => {
            if (err) reject(err);
            resolve(row);
          });
        });

        if (existingUser) {
          throw new Error('Email already taken');
        }

        await new Promise<void>((resolve, reject) => {
          db.run('UPDATE users SET email = ? WHERE id = ?', [email, user.id], (err) => {
            if (err) reject(err);
            resolve();
          });
        });
      }

      await new Promise<void>((resolve, reject) => {
        db.run('COMMIT', (err) => {
          if (err) reject(err);
          resolve();
        });
      });

      return { 
        status: 'Profile updated successfully',
        user: {
          ...user,
          name: username || user.name,
          email: email || user.email
        }
      };

    } catch (err) {
      await new Promise<void>((resolve) => {
        db.run('ROLLBACK', () => resolve());
      });

      fastify.log.error('Profile update error:', err);
      reply.code(400);
      return { error: err instanceof Error ? err.message : 'Failed to update profile' };
    }
  });
}