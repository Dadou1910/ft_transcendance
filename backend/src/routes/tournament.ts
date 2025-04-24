import { FastifyInstance } from 'fastify'
import { Database } from 'sqlite3'
import { Tournament, TournamentPlayer, TournamentMatch } from '../types'

export async function tournamentRoutes(fastify: FastifyInstance, db: Database) {
  fastify.post<{ Body: { usernames: string[] } }>('/tournament', async (request, reply) => {
    const { usernames } = request.body

    if (!usernames || !Array.isArray(usernames) || usernames.length !== 4) {
      reply.code(400)
      return { error: 'Exactly four usernames are required' }
    }

    for (const username of usernames) {
      if (typeof username !== 'string' || username.trim().length === 0) {
        reply.code(400)
        return { error: 'All usernames must be non-empty strings' }
      }
    }

    try {
      const createdAt = new Date().toISOString()
      const tournamentId = await new Promise<number>((resolve, reject) => {
        db.run('INSERT INTO tournaments (createdAt) VALUES (?)', [createdAt], function(err) {
          if (err) reject(err)
          resolve(this.lastID)
        })
      })

      for (const username of usernames) {
        await new Promise<void>((resolve, reject) => {
          db.run('INSERT INTO tournament_players (tournamentId, username) VALUES (?, ?)', [tournamentId, username], (err) => {
            if (err) reject(err)
            resolve()
          })
        })
      }

      return { tournamentId }
    } catch (err) {
      fastify.log.error('Tournament creation error:', err)
      reply.code(500)
      return { error: 'Server error' }
    }
  })

  fastify.post<{ Body: { tournamentId: number; roundNumber: number; player1: string; player2: string } }>('/tournament/match', async (request, reply) => {
    const { tournamentId, roundNumber, player1, player2 } = request.body

    if (!tournamentId || !roundNumber || !player1 || !player2) {
      reply.code(400)
      return { error: 'tournamentId, roundNumber, player1, and player2 are required' }
    }

    try {
      const tournament = await new Promise<Tournament | undefined>((resolve, reject) => {
        db.get('SELECT id FROM tournaments WHERE id = ?', [tournamentId], (err, row: Tournament | undefined) => {
          if (err) reject(err)
          resolve(row)
        })
      })
      if (!tournament) {
        reply.code(404)
        return { error: 'Tournament not found' }
      }

      const player1Exists = await new Promise<TournamentPlayer | undefined>((resolve, reject) => {
        db.get('SELECT * FROM tournament_players WHERE tournamentId = ? AND username = ?', [tournamentId, player1], (err, row: TournamentPlayer | undefined) => {
          if (err) reject(err)
          resolve(row)
        })
      })
      const player2Exists = await new Promise<TournamentPlayer | undefined>((resolve, reject) => {
        db.get('SELECT * FROM tournament_players WHERE tournamentId = ? AND username = ?', [tournamentId, player2], (err, row: TournamentPlayer | undefined) => {
          if (err) reject(err)
          resolve(row)
        })
      })
      if (!player1Exists || !player2Exists) {
        reply.code(400)
        return { error: 'One or both players are not in the tournament' }
      }

      const matchId = await new Promise<number>((resolve, reject) => {
        db.run(
          'INSERT INTO tournament_matches (tournamentId, roundNumber, player1, player2) VALUES (?, ?, ?, ?)',
          [tournamentId, roundNumber, player1, player2],
          function(err) {
            if (err) reject(err)
            resolve(this.lastID)
          }
        )
      })

      return { matchId }
    } catch (err) {
      fastify.log.error('Tournament match creation error:', err)
      reply.code(500)
      return { error: 'Server error' }
    }
  })

  fastify.post<{ Body: { tournamentId: number; matchId: number; winner: string } }>('/tournament/match/winner', async (request, reply) => {
    const { tournamentId, matchId, winner } = request.body

    if (!tournamentId || !matchId || !winner) {
      reply.code(400)
      return { error: 'tournamentId, matchId, and winner are required' }
    }

    try {
      const match = await new Promise<TournamentMatch | undefined>((resolve, reject) => {
        db.get('SELECT * FROM tournament_matches WHERE id = ? AND tournamentId = ?', [matchId, tournamentId], (err, row: TournamentMatch | undefined) => {
          if (err) reject(err)
          resolve(row)
        })
      })
      if (!match) {
        reply.code(404)
        return { error: 'Match not found' }
      }

      if (match.player1 !== winner && match.player2 !== winner) {
        reply.code(400)
        return { error: 'Winner does not match either player' }
      }

      await new Promise<void>((resolve, reject) => {
        db.run('UPDATE tournament_matches SET winner = ? WHERE id = ?', [winner, matchId], (err) => {
          if (err) reject(err)
          resolve()
        })
      })

      const finalRound = await new Promise<{ maxRound: number } | undefined>((resolve, reject) => {
        db.get('SELECT MAX(roundNumber) as maxRound FROM tournament_matches WHERE tournamentId = ?', [tournamentId], (err, row: { maxRound: number } | undefined) => {
          if (err) reject(err)
          resolve(row)
        })
      })
      if (!finalRound) {
        reply.code(500)
        return { error: 'Failed to determine final round' }
      }

      return { status: 'Match winner set' }
    } catch (err) {
      fastify.log.error('Set tournament match winner error:', err)
      reply.code(500)
      return { error: 'Server error' }
    }
  })

  fastify.get<{ Params: { id: string } }>('/tournament/:id', async (request, reply) => {
    const { id } = request.params

    try {
      const tournament = await new Promise<Tournament | undefined>((resolve, reject) => {
        db.get('SELECT * FROM tournaments WHERE id = ?', [id], (err, row: Tournament | undefined) => {
          if (err) reject(err)
          resolve(row)
        })
      })
      if (!tournament) {
        reply.code(404)
        return { error: 'Tournament not found' }
      }

      const players = await new Promise<{ username: string }[]>((resolve, reject) => {
        db.all(
          `
          SELECT username
          FROM tournament_players
          WHERE tournamentId = ?
          `,
          [id],
          (err, rows: { username: string }[]) => {
            if (err) reject(err)
            resolve(rows || [])
          }
        )
      })

      const matches = await new Promise<TournamentMatch[]>((resolve, reject) => {
        db.all('SELECT * FROM tournament_matches WHERE tournamentId = ?', [id], (err, rows: TournamentMatch[]) => {
          if (err) reject(err)
          resolve(rows || [])
        })
      })

      return { tournament, players, matches }
    } catch (err) {
      fastify.log.error('Tournament fetch error:', err)
      reply.code(500)
      return { error: 'Server error' }
    }
  })
}