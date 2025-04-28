import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyEnv from './config';
import { initializeDatabase } from './database';
import { authRoutes } from './routes/auth';
import { profileRoutes } from './routes/profile';
import { settingsRoutes } from './routes/settings';
import { matchRoutes } from './routes/match';
import { tournamentRoutes } from './routes/tournament';
import { statsRoutes } from './routes/stats';
import { matchmakingRoutes } from './routes/matchmaking';
import { sessionMiddleware } from './routes/middleware';
import { wsRoutes } from './routes/ws';

async function buildServer() {
  const fastify = Fastify({ logger: true });

  await fastify.register(fastifyEnv);

  await fastify.register(cors, { origin: '*' });

  const db = await initializeDatabase(fastify);

  await sessionMiddleware(fastify, db);

  // Register routes
  await authRoutes(fastify, db);
  await profileRoutes(fastify, db);
  await settingsRoutes(fastify, db);
  await matchRoutes(fastify, db);
  await tournamentRoutes(fastify, db);
  await statsRoutes(fastify, db);
  await matchmakingRoutes(fastify);
  await wsRoutes(fastify, db);

  fastify.get('/', async (request, reply) => {
    return { status: 'Server is running' };
  });

  fastify.addHook('onClose', (instance, done) => {
    db.close((err) => {
      if (err) {
        fastify.log.error('Error closing database:', err);
      }
      done();
    });
  });

  const port = fastify.config.PORT;
  await fastify.listen({ port, host: '0.0.0.0' });
  fastify.log.info(`Server listening on ${port}`);
}

buildServer().catch((err) => {
  console.error('Server failed to start:', err);
  process.exit(1);
});