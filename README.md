# 🎮 ft_transcendence

> Projet final du tronc commun 42 — jeu Pong multijoueur en ligne avec interface web temps réel.

---

## ✅ Fonctionnalités obligatoires

- [ ] 🎯 **SPA (Single Page Application)** avec React + TypeScript
- [ ] 🕹️ **Pong local** (2 joueurs sur le même clavier)
- [ ] 🧩 **Tournoi avec matchmaking**
- [ ] 🧑‍🎤 **Alias joueur unique par tournoi**
- [ ] 🐳 **Lancement via une seule commande Docker**
- [ ] 🔒 **Connexion HTTPS + mots de passe hashés**
- [ ] 🛡️ **Protection contre les attaques XSS/SQLi + validation des entrées**
- [ ] 🧪 **Aucune erreur JS dans Firefox dernière version**

---

## 🧩 Modules **majeurs** (4)

| Module | Description |
|--------|-------------|
| 🧱 Backend Framework | Fastify avec Node.js |
| 👤 Gestion utilisateurs | Auth, profils, avatars, amis, stats |
| 🌐 Joueurs distants | Multijoueur en ligne avec WebSocket |
| 💬 Chat en direct | DM, blocage, invitations, accès profils |

---

## 🧩 Modules **mineurs** (7)

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

## 🚀 Stack technique (prévisionnelle)

- **Frontend :** React + TypeScript + TailwindCSS
- **Backend :** Fastify (Node.js)
- **Base de données :** SQLite
- **WebSocket :** Socket.IO
- **Docker :** Conteneurisation totale
- **Outils divers :** ESLint, Prettier, .env, HTTPS local

---

## 📦 Lancement

```bash
docker-compose up --build
