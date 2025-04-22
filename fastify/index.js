const fastify = require('fastify')({ logger: true });
const Database = require('better-sqlite3');

const db = new Database('/data/base.db');

fastify.get('/messages', async () => {
  const rows = db.prepare('SELECT * FROM messages').all();
  return rows;
});

fastify.post('/messages', async (request, reply) => {
  const { content } = request.body;

  if (!content) {
    reply.code(400);
    return { error: 'Le champ "content" est requis.' };
  }

  const stmt = db.prepare('INSERT INTO messages (content) VALUES (?)');
  const result = stmt.run(content);

  return {
    status: 'OK',
    id: result.lastInsertRowid,
    content
  };
});

fastify.get('/', async () => {
  return { message: 'Hello Fastify + SQLite !' };
});

const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
    console.log('OKKKK Serveur lancé sur http://localhost:3000');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();