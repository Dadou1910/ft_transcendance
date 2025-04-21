// types/fastify-sqlite.d.ts
import 'fastify';

declare module 'fastify' {
  interface FastifyInstance {
    sqlite: any; // or better: sqlite: Database; if you import the actual type
  }
}

declare module 'fastify-sqlite' {
  import { FastifyPluginAsync } from 'fastify';

  const fastifySqlite: FastifyPluginAsync<{
    dbFile: string;
  }>;

  export default fastifySqlite;
}
