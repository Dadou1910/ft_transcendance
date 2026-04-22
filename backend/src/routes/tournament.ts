import { FastifyInstance } from 'fastify';
import { Database } from 'sqlite3';
import { Tournament, TournamentPlayer, TournamentMatch } from '../types';

export async function tournamentRoutes(fastify: FastifyInstance, db: Database) {
  fastify.post<{ Body: { usernames: string[] } }>('/tournament', async (request, reply) => {
    const { usernames } = request.body;

    // Validate request body
    if (!usernames || !Array.isArray(usernames) || usernames.length !== 4) {
      reply.code(400);
      return { error: 'Exactly four usernames are required' };
    }

    // Validate all usernames are non-empty strings
    for (let i = 0; i < usernames.length; i++) {
      if (typeof usernames[i] !== 'string' || usernames[i].trim().length === 0) {
        reply.code(400);
        return { error: `Username at position ${i + 1} must be a non-empty string` };
      }
    }

    // Check for duplicate usernames
    const uniqueUsernames = new Set(usernames);
    if (uniqueUsernames.size !== usernames.length) {
      reply.code(400);
      return { error: 'Usernames must be unique' };
    }

    // Use user from session
    const user = request.user;
    if (usernames[0] !== user.name) {
      reply.code(400);
      return { error: "First username must be the logged-in user's username" };
    }

    try {
      const createdAt = new Date().toISOString();
      const tournamentId = await new Promise<number>((resolve, reject) => {
        db.run('INSERT INTO tournaments (createdAt) VALUES (?)', [createdAt], function(err) {
          if (err) reject(err);
          resolve(this.lastID);
        });
      });

      for (const username of usernames) {
        await new Promise<void>((resolve, reject) => {
          db.run('INSERT INTO tournament_players (tournamentId, username, position) VALUES (?, ?, ?)', [tournamentId, username, null], (err) => {
            if (err) reject(err);
            resolve();
          });
        });
      }

      fastify.log.info({ tournamentId, usernames }, 'Created tournament with players:');
      return { tournamentId };
    } catch (err) {
      fastify.log.error(err, 'Tournament creation error:');
      reply.code(500);
      return { error: 'Server error' };
    }
  });

  fastify.post<{ Body: { tournamentId: number; roundNumber: number; player1: string; player2: string } }>('/tournament/match', async (request, reply) => {
    const { tournamentId, roundNumber, player1, player2 } = request.body;

    // Validate presence and types
    if (tournamentId == null || typeof tournamentId !== 'number') {
      reply.code(400);
      return { error: 'tournamentId must be a number' };
    }
    if (roundNumber == null || typeof roundNumber !== 'number') {
      reply.code(400);
      return { error: 'roundNumber must be a number' };
    }
    if (typeof player1 !== 'string' || player1.trim() === '') {
      reply.code(400);
      return { error: 'player1 must be a non-empty string' };
    }
    if (typeof player2 !== 'string' || player2.trim() === '') {
      reply.code(400);
      return { error: 'player2 must be a non-empty string' };
    }

    try {
      const tournament = await new Promise<Tournament | undefined>((resolve, reject) => {
        db.get('SELECT id FROM tournaments WHERE id = ?', [tournamentId], (err, row: Tournament | undefined) => {
          if (err) reject(err);
          resolve(row);
        });
      });
      if (!tournament) {
        reply.code(404);
        return { error: 'Tournament not found' };
      }

      const player1Exists = await new Promise<TournamentPlayer | undefined>((resolve, reject) => {
        db.get('SELECT * FROM tournament_players WHERE tournamentId = ? AND username = ?', [tournamentId, player1], (err, row: TournamentPlayer | undefined) => {
          if (err) reject(err);
          resolve(row);
        });
      });
      const player2Exists = await new Promise<TournamentPlayer | undefined>((resolve, reject) => {
        db.get('SELECT * FROM tournament_players WHERE tournamentId = ? AND username = ?', [tournamentId, player2], (err, row: TournamentPlayer | undefined) => {
          if (err) reject(err);
          resolve(row);
        });
      });
      if (!player1Exists || !player2Exists) {
        fastify.log.error({ player1, player2, tournamentId }, 'Players not found in tournament:');
        reply.code(400);
        return { error: 'One or both players are not in the tournament' };
      }

      const matchId = await new Promise<number>((resolve, reject) => {
        db.run(
          'INSERT INTO tournament_matches (tournamentId, roundNumber, player1, player2) VALUES (?, ?, ?, ?)',
          [tournamentId, roundNumber, player1, player2],
          function(err) {
            if (err) reject(err);
            resolve(this.lastID);
          }
        );
      });

      fastify.log.info({ matchId, tournamentId, player1, player2, roundNumber }, 'Created tournament match:');
      return { matchId };
    } catch (err) {
      fastify.log.error(err, 'Tournament match creation error:');
      reply.code(500);
      return { error: 'Server error' };
    }
  });

  fastify.post<{ Body: { tournamentId: number; matchId: number; winner: string } }>('/tournament/match/winner', async (request, reply) => {
    const { tournamentId, matchId, winner } = request.body;

    if (!tournamentId || !matchId || !winner) {
      reply.code(400);
      return { error: 'tournamentId, matchId, and winner are required' };
    }

    try {
      const match = await new Promise<TournamentMatch | undefined>((resolve, reject) => {
        db.get('SELECT * FROM tournament_matches WHERE id = ? AND tournamentId = ?', [matchId, tournamentId], (err, row: TournamentMatch | undefined) => {
          if (err) reject(err);
          resolve(row);
        });
      });
      if (!match) {
        reply.code(404);
        return { error: 'Match not found' };
      }

      if (match.player1 !== winner && match.player2 !== winner) {
        reply.code(400);
        return { error: 'Winner does not match either player' };
      }

      // Check if the match already has a winner to prevent duplicate updates
      if (match.winner) {
        fastify.log.info({ matchId, existingWinner: match.winner }, 'Match winner already set, skipping update:');
        return { status: 'Match winner already set', winner: match.winner };
      }

      await new Promise<void>((resolve, reject) => {
        db.run('UPDATE tournament_matches SET winner = ? WHERE id = ?', [winner, matchId], (err) => {
          if (err) reject(err);
          resolve();
        });
      });

      // Log the round number for debugging
      fastify.log.info({ tournamentId, matchId, roundNumber: match.roundNumber, winner }, 'Processing match winner:');

      // For a 4-player tournament, the final match is Round 1 as per frontend definition
      if (match.roundNumber === 1) {
        fastify.log.info({ winner }, 'Final match (Round 1) detected, updating positions and tournamentsWon:');

        const loser = match.player1 === winner ? match.player2 : match.player1;

        await new Promise<void>((resolve, reject) => {
          db.run('UPDATE tournament_players SET position = ? WHERE tournamentId = ? AND username = ?', [1, tournamentId, winner], (err) => {
            if (err) reject(err);
            resolve();
          });
        });
        await new Promise<void>((resolve, reject) => {
          db.run('UPDATE tournament_players SET position = ? WHERE tournamentId = ? AND username = ?', [2, tournamentId, loser], (err) => {
            if (err) reject(err);
            resolve();
          });
        });

        const semifinalMatches = await new Promise<TournamentMatch[]>((resolve, reject) => {
          db.all('SELECT * FROM tournament_matches WHERE tournamentId = ? AND roundNumber = ?', [tournamentId, 0], (err, rows: TournamentMatch[]) => {
            if (err) reject(err);
            resolve(rows || []);
          });
        });

        const semifinalLosers: string[] = [];
        for (const sfMatch of semifinalMatches) {
          if (sfMatch.winner) {
            const sfLoser = sfMatch.player1 === sfMatch.winner ? sfMatch.player2 : sfMatch.player1;
            semifinalLosers.push(sfLoser);
          }
        }

        semifinalLosers.sort();

        if (semifinalLosers.length >= 1) {
          await new Promise<void>((resolve, reject) => {
            db.run('UPDATE tournament_players SET position = ? WHERE tournamentId = ? AND username = ?', [3, tournamentId, semifinalLosers[0]], (err) => {
              if (err) reject(err);
              resolve();
            });
          });
        }
        if (semifinalLosers.length >= 2) {
          await new Promise<void>((resolve, reject) => {
            db.run('UPDATE tournament_players SET position = ? WHERE tournamentId = ? AND username = ?', [4, tournamentId, semifinalLosers[1]], (err) => {
              if (err) reject(err);
              resolve();
            });
          });
        }

        // Check if the winner is a registered user before updating tournamentsWon
        const winnerUser = await new Promise<any>((resolve, reject) => {
          db.get('SELECT * FROM users WHERE name = ?', [winner], (err, row) => {
            if (err) reject(err);
            resolve(row);
          });
        });

        if (winnerUser) {
          await new Promise<void>((resolve, reject) => {
            db.run('UPDATE users SET tournamentsWon = tournamentsWon + 1 WHERE name = ?', [winner], (err) => {
              if (err) {
                console.error('[Tournament Debug] Error incrementing tournamentsWon for user:', winner, err);
                reject(err);
              } else {
                console.log('[Tournament Debug] Incremented tournamentsWon for user:', winner);
                resolve();
              }
            });
          });
          fastify.log.info({ winner }, 'Updated tournamentsWon for user:');
        } else {
          fastify.log.info({ winner }, 'Winner is a placeholder, skipping tournamentsWon update:');
        }
      } else {
        fastify.log.info({ roundNumber: match.roundNumber }, 'Not the final match (Round 1), skipping tournamentsWon update:');
      }

      return { status: 'Match winner set' };
    } catch (err) {
      fastify.log.error(err, 'Set tournament match winner error:');
      reply.code(500);
      return { error: 'Server error' };
    }
  });

  fastify.get<{ Params: { id: string } }>('/tournament/:id', async (request, reply) => {
    const { id } = request.params;

    try {
      const tournament = await new Promise<Tournament | undefined>((resolve, reject) => {
        db.get('SELECT * FROM tournaments WHERE id = ?', [id], (err, row: Tournament | undefined) => {
          if (err) reject(err);
          resolve(row);
        });
      });
      if (!tournament) {
        reply.code(404);
        return { error: 'Tournament not found' };
      }

      const players = await new Promise<TournamentPlayer[]>((resolve, reject) => {
        db.all(
          `
          SELECT username, position
          FROM tournament_players
          WHERE tournamentId = ?
          `,
          [id],
          (err, rows: TournamentPlayer[]) => {
            if (err) reject(err);
            resolve(rows || []);
          }
        );
      });

      const matches = await new Promise<TournamentMatch[]>((resolve, reject) => {
        db.all('SELECT * FROM tournament_matches WHERE tournamentId = ?', [id], (err, rows: TournamentMatch[]) => {
          if (err) reject(err);
          resolve(rows || []);
        });
      });

      return { tournament, players, matches };
    } catch (err) {
      fastify.log.error(err, 'Tournament fetch error:');
      reply.code(500);
      return { error: 'Server error' };
    }
  });
}