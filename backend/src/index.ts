import Fastify from 'fastify';
import cors from '@fastify/cors';
import sqlite from 'fastify-sqlite';
import userRoutes from './routes/users';


async function buildServer() {
  const app = Fastify({ logger: true });


  // CORS – à restreindre en prod
  await app.register(cors, { origin: '*' });

  // SQLite : base ./database.sqlite à la racine du projet
  await app.register(sqlite, { dbFile: './database.sqlite' });

  // Initialisation de la table users
  app.ready().then(() => {
    app.sqlite.exec(`
      -- Table des utilisateurs
      CREATE TABLE IF NOT EXISTS users (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        username   TEXT    NOT NULL UNIQUE,
        email      TEXT    NOT NULL UNIQUE,
        password   TEXT    NOT NULL,        -- stocke le hash
        score      INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      -- Table des messages de chat (pré‑préparée pour la suite)
      CREATE TABLE IF NOT EXISTS messages (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id     INTEGER NOT NULL,
        content     TEXT    NOT NULL,
        sent_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE

      );
    `);
  });

  // Routes
  app.register(userRoutes, { prefix: '/users' });

  return app;
}

async function start() {
  const server = await buildServer();
  try {
    await server.listen({ port: 3000 });
    console.log('🚀 Serveur Fastify démarré sur http://localhost:3000');
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

start();



// const fastify = Fastify({ logger: true });

// fastify.get("/", async (request, reply) => {
//   return { message: "Backend ft_transcendence prêt !" };
// });

// const start = async () => {
//   try {
//     await fastify.listen({ port: 3000, host: "0.0.0.0" });
//     console.log("Serveur lancé sur http://localhost:3000");
//   } catch (err) {
//     fastify.log.error(err);
//     process.exit(1);
//   }
// };
// start();