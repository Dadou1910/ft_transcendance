import { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import bcrypt from 'bcrypt';

interface User {
  id?: number;
  username: string;
  email: string;
  password?: string;
  score?: number;
  created_at?: string;
}

const userRoutes: FastifyPluginAsync = async (app) => {

  // 1. LISTER TOUS LES UTILISATEURS (GET /users)
  app.get('/', async (_request, reply: FastifyReply) => {
    const rows = await app.sqlite.all<Pick<User, 'id'|'username'|'email'|'score'|'created_at'>[]>(
      `SELECT id, username, email, score, created_at
       FROM users
       ORDER BY created_at DESC;`
    );
    return reply.send(rows);
  });

  // 2. RÉCUPÉRER UN UTILISATEUR PAR ID (GET /users/:id)
  app.get<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const { id } = request.params;
    const row = await app.sqlite.get<User>(
      `SELECT id, username, email, score, created_at
       FROM users
       WHERE id = ?;`,
      [Number(id)]
    );
    if (!row) {
      return reply.status(404).send({ error: 'Utilisateur non trouvé' });
    }
    return row;
  });

  // 3. CRÉER UN UTILISATEUR (POST /users)
  app.post<{ Body: User }>('/', async (request, reply) => {
    const { username, email, password, score } = request.body;
    if (!username || !email || !password) {
      return reply.status(400).send({ error: 'username, email et password sont requis' });
    }
    const saltRounds = 10;
    const hashed = await bcrypt.hash(password, saltRounds);
    const result = await app.sqlite.run(
      `INSERT INTO users (username, email, password, score)
         VALUES (?, ?, ?, ?);`,
      [username, email, hashed, score ?? 0]
    );
    return reply.status(201).send({ id: result.lastID });
  });

  // 4. METTRE À JOUR UN UTILISATEUR (PUT /users/:id)
  app.put<{ Params: { id: string }; Body: Partial<User> }>('/:id', async (request, reply) => {
    const { id } = request.params;
    const { username, email, password, score } = request.body;
    const sets: string[] = [];
    const values: unknown[] = [];

    if (username) {
      sets.push('username = ?');
      values.push(username);
    }
    if (email) {
      sets.push('email = ?');
      values.push(email);
    }
    if (typeof score === 'number') {
      sets.push('score = ?');
      values.push(score);
    }
    if (password) {
      const saltRounds = 10;
      const hashedPwd = await bcrypt.hash(password, saltRounds);
      sets.push('password = ?');
      values.push(hashedPwd);
    }
    if (sets.length === 0) {
      return reply.status(400).send({ error: 'Au moins un champ à mettre à jour est requis' });
    }
    values.push(Number(id));
    const sql = `UPDATE users SET ${sets.join(', ')} WHERE id = ?;`;
    await app.sqlite.run(sql, values);
    return { updated: true };
  });

  // 5. SUPPRIMER UN UTILISATEUR (DELETE /users/:id)
  app.delete<{ Params: { id: string } }>('/:id', async (request, reply) => {
    const { id } = request.params;
    const result = await app.sqlite.run(
      `DELETE FROM users WHERE id = ?;`,
      [Number(id)]
    );
    if (result.changes === 0) {
      return reply.status(404).send({ error: 'Utilisateur non trouvé' });
    }
    return { deleted: true };
  });
};

export default userRoutes;
