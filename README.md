# 🎮 ft_transcendence

> Projet final du tronc commun 42 — jeu Pong multijoueur en ligne avec interface web temps réel.

---

## ✅ Fonctionnalités obligatoires

- [x] 🎯 **SPA (Single Page Application)** avec TailwindCSS + TypeScript
- [x] 🕹️ **Pong local** (2 joueurs sur le même clavier)
- [ ] 🧩 **Tournoi avec matchmaking**
- [x] 🧑‍🎤 **Alias joueur unique par tournoi**
- [x] 🐳 **Lancement via une seule commande Docker**
- [ ] 🔒 **Connexion HTTPS + mots de passe hashés**
- [ ] 🛡️ **Protection contre les attaques XSS/SQLi + validation des entrées**
- [ ] 🧪 **Aucune erreur JS dans Firefox dernière version**

---

## Modules **majeurs** (4)

| Module | Description |
|--------|-------------|
| 🧱 Backend Framework | Fastify avec Node.js |
| 👤 Gestion utilisateurs | Auth, profils, avatars, amis, stats |
| 🌐 Joueurs distants | Multijoueur en ligne avec WebSocket |
| 💬 Chat en direct | DM, blocage, invitations, accès profils |

---

## Modules **mineurs** (7)

| Module | Description |
|--------|-------------|
| 🎨 Personnalisation du jeu | Power-ups, vitesse, map |
| 📊 Tableaux de stats | Stats utilisateurs et parties |
| 📱 Support multi-appareils | Responsive sur mobile/tablette |
| 🧭 Compatibilité navigateur | Support Chrome + Firefox |
| 🌍 Multilingue | FR, EN, +1 autre |
| 🦯 Accessibilité | Navigation clavier, contraste, alt text |
| ⚡ Server-Side Rendering | Amélioration perf + SEO |

---

## Stack technique (prévisionnelle)

- **Frontend :** React + TypeScript + TailwindCSS
- **Backend :** Fastify (Node.js)
- **Base de données :** SQLite
- **WebSocket :** Socket.IO
- **Docker :** Conteneurisation totale
- **Outils divers :** ESLint, Prettier, .env, HTTPS local

---
## Structure 
```
bash
ft_transcendence/
├── .gitignore
├── docker-compose.yml
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       └── index.js
├── frontend/
│   ├── Dockerfile
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── public/
│   │   └── assets/
│   │       ├── background.png
│   │       ├── dayBackground.png
│   │       ├── flower.png
│   │       ├── peopleBackground.png
│   │       └── setting.png
│   └── src/
│       ├── game.ts
│       ├── index.ts
│       ├── router.ts
│       ├── style.css
│       ├── tournament.ts
│       └── ui.ts
```
---

## 📦 Lancement

```bash
docker-compose up --build
