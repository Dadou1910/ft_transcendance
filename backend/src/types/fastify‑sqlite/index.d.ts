// declare module principal
declare module 'fastify-sqlite';

// étend FastifyInstance pour y injecter `sqlite`
import 'fastify';
declare module 'fastify' {
  interface FastifyInstance {
    sqlite: any;
  }
}
