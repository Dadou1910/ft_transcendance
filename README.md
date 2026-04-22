# ft_transcendence

Final project of the 42 common core — real-time multiplayer Pong with a web interface.

## Stack

- **Frontend**: TypeScript, Tailwind CSS, i18next
- **Backend**: Fastify, Node.js, SQLite3
- **Infrastructure**: Docker, Docker Compose, HTTPS (self-signed)

## Modules

| Module | Classification |
|--------|----------------|
| Backend Framework (Fastify) | Major |
| Remote Players (WebSocket multiplayer) | Major |
| User Management (auth, profiles, friends) | Major |
| AI Opponent | Major |
| Space Battle (second game mode) | Major |
| Game Customization (power-ups, speed, themes) | Minor |
| Frontend Framework (TypeScript + Tailwind) | Minor |
| Multi-Device Support (mobile/tablet) | Minor |
| Browser Compatibility (Chrome, Firefox, Safari, Edge) | Minor |
| Multiple Languages (EN, FR, ES, JP) | Minor |
| Database (SQLite) | Minor |

## Requirements

- Docker
- Docker Compose
- An `.env` file at the project root (see below)

## Environment variables

Create a `.env` file at the root of the project:

```
PORT=4000
DB_PATH=/app/data/transcendance.db
BCRYPT_SALT_ROUNDS=10
```

## Running

```bash
docker-compose up --build
```

The app will be available at `https://localhost`.
