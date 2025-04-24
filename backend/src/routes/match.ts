import { FastifyInstance } from 'fastify';
import { Database } from 'sqlite3';

export async function matchRoutes(fastify: FastifyInstance, db: Database) {
    fastify.post<{
        Body: {
          userId?: number;
          opponentId?: number;
          userName: string;
          opponentName: string;
          userScore: number;
          opponentScore: number;
          gameType: string;
        }
      }>('/match', async (request, reply) => {
        const { userId, opponentId, userName, opponentName, userScore, opponentScore, gameType } = request.body;
      
        fastify.log.info('Received /match request:', { userId, opponentId, userName, opponentName, userScore, opponentScore, gameType });
      
        // Validate required fields
        if (!userName || !opponentName || userScore === undefined || opponentScore === undefined || !gameType) {
          fastify.log.warn('Validation failed: Missing required fields');
          reply.code(400);
          return { error: 'userName, opponentName, userScore, opponentScore, and gameType are required' };
        }
      
        // Validate gameType
        const validGameTypes = ['Pong', 'Neon City Pong', 'AI Pong', 'Space Battle'];
        if (!validGameTypes.includes(gameType)) {
          fastify.log.warn('Validation failed: Invalid gameType:', gameType);
          reply.code(400);
          return { error: `Invalid gameType. Must be one of: ${validGameTypes.join(', ')}` };
        }
      
        try {
          const date = new Date().toISOString();
      
          // Use a transaction to ensure atomicity
          const matchId = await new Promise<number>((resolve, reject) => {
            db.serialize(() => {
              // Begin transaction
              db.run('BEGIN TRANSACTION', (err) => {
                if (err) {
                  fastify.log.error('Error starting transaction:', err);
                  return reject(err);
                }
      
                // Insert the match into the matches table
                fastify.log.info('Inserting into matches table...');
                db.run(
                  'INSERT INTO matches (userId, opponentId, userName, opponentName, userScore, opponentScore, gameType, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                  [userId || null, opponentId || null, userName, opponentName, userScore, opponentScore, gameType, date],
                  function(err) {
                    if (err) {
                      fastify.log.error('Error inserting into matches table:', err);
                      db.run('ROLLBACK', () => reject(err));
                      return;
                    }
      
                    fastify.log.info('Inserted into matches table, matchId:', this.lastID);
      
                    // Update wins/losses for registered users (if userId or opponentId exists)
                    const updates: Promise<void>[] = [];
      
                    if (userScore > opponentScore) {
                      // User wins
                      if (userId) {
                        updates.push(
                          new Promise<void>((resolve, reject) => {
                            db.run('UPDATE users SET wins = wins + 1 WHERE id = ?', [userId], (err) => {
                              if (err) {
                                fastify.log.error('Error updating wins for userId:', userId, err);
                                reject(err);
                              } else {
                                fastify.log.info('Updated wins for userId:', userId);
                                resolve();
                              }
                            });
                          })
                        );
                      }
                      if (opponentId) {
                        updates.push(
                          new Promise<void>((resolve, reject) => {
                            db.run('UPDATE users SET losses = losses + 1 WHERE id = ?', [opponentId], (err) => {
                              if (err) {
                                fastify.log.error('Error updating losses for opponentId:', opponentId, err);
                                reject(err);
                              } else {
                                fastify.log.info('Updated losses for opponentId:', opponentId);
                                resolve();
                              }
                            });
                          })
                        );
                      }
                    } else {
                      // Opponent wins
                      if (opponentId) {
                        updates.push(
                          new Promise<void>((resolve, reject) => {
                            db.run('UPDATE users SET wins = wins + 1 WHERE id = ?', [opponentId], (err) => {
                              if (err) {
                                fastify.log.error('Error updating wins for opponentId:', opponentId, err);
                                reject(err);
                              } else {
                                fastify.log.info('Updated wins for opponentId:', opponentId);
                                resolve();
                              }
                            });
                          })
                        );
                      }
                      if (userId) {
                        updates.push(
                          new Promise<void>((resolve, reject) => {
                            db.run('UPDATE users SET losses = losses + 1 WHERE id = ?', [userId], (err) => {
                              if (err) {
                                fastify.log.error('Error updating losses for userId:', userId, err);
                                reject(err);
                              } else {
                                fastify.log.info('Updated losses for userId:', userId);
                                resolve();
                              }
                            });
                          })
                        );
                      }
                    }
      
                    // Wait for all updates to complete
                    Promise.all(updates)
                      .then(() => {
                        // Commit the transaction
                        db.run('COMMIT', (err) => {
                          if (err) {
                            fastify.log.error('Error committing transaction:', err);
                            db.run('ROLLBACK', () => reject(err));
                            return;
                          }
                          fastify.log.info('Transaction committed successfully');
                          resolve(this.lastID);
                        });
                      })
                      .catch((err) => {
                        fastify.log.error('Error during updates, rolling back:', err);
                        db.run('ROLLBACK', () => reject(err));
                      });
                  }
                );
              });
            });
          });
      
          fastify.log.info('Match recorded successfully, matchId:', matchId);
          return { status: 'Match recorded', matchId };
        } catch (err) {
          fastify.log.error('Match recording error:', err);
          reply.code(500);
          return { error: 'Server error' };
        }
      });
}