// src/types/fastify.d.ts
import type { FastifySQLite } from '@fastify/sqlite';

declare module 'fastify' {
  // On ajoute à l'interface native FastifyInstance la propriété "sqlite"
  interface FastifyInstance {
    sqlite: FastifySQLite;
  }
}
