// backend/src/types/fastify-sqlite.d.ts

import { FastifyPluginAsync } from 'fastify';

// 1) On définit l'API de la base SQLite telle qu'exposée par fastify-sqlite
export interface SqliteDb {
  run(sql: string, ...args: any[]): Promise<{ lastID: number; changes: number }>;
  get<T = any>(sql: string, ...args: any[]): Promise<T>;
  all<T = any>(sql: string, ...args: any[]): Promise<T[]>;
}

// 2) On déclare le module
declare const fastifySqlite: FastifyPluginAsync<{
  db: SqliteDb;
}>;
export = fastifySqlite;

// 3) On étend FastifyInstance pour avoir `app.sqlite`
declare module 'fastify' {
  interface FastifyInstance {
    sqlite: SqliteDb;
  }
}
