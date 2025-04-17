# 🎮 ft_transcendence

> Projet final du tronc commun 42 — jeu Pong multijoueur en ligne avec interface web temps réel.

---

## ✅ Fonctionnalités obligatoires

- [x] 🎯 **SPA (Single Page Application)** avec TailwindCSS + TypeScript
- [x] 🕹️ **Pong local** (2 joueurs sur le même clavier)
- [x] 🧩 **Tournoi avec matchmaking**
- [x] 🧑‍🎤 **Alias joueur unique par tournoi**
- [x] 🐳 **Lancement via une seule commande Docker**
- [x] 🔒 **Connexion HTTPS + mots de passe hashés**
- [ ] 🛡️ **Protection contre les attaques XSS/SQLi + validation des entrées**
- [x] 🧪 **Aucune erreur JS dans Firefox dernière version**

---

## Modules **majeurs** (4)

| Module | Description |
|--------|-------------|
| Backend Framework | Fastify avec Node.js |
| Gestion utilisateurs | Auth, profils, avatars, amis, stats |
| Live chat | DM, blocage, invitations, accès profils |

---

## Modules **mineurs** (8)

| Module | Description |
|--------|-------------|
| Personnalisation du jeu | Power-ups, vitesse, map |
| Utilisation de frontend Framework | TailwindCSS |
| Tableaux de stats | Stats utilisateurs et parties |
| Support multi-appareils | Responsive sur mobile/tablette |
| Compatibilité navigateur | Support Chrome + Firefox |
| Multilingue | FR, EN, +1 autre |
| Accessibilité | Navigation clavier, contraste, alt text |
| Utilisation de Database en backend | Gestion de données |

---

## Stack technique

- **Frontend :** TypeScript + TailwindCSS
- **Backend :** Fastify (Node.js)
- **Base de données :** SQLite
- **WebSocket :** Socket.IO
- **Docker :** Conteneurisation totale

---
## Structure 
```
bash
ft_transcendence/
├── backend/
│   ├── src/
│   │   └── index.js
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── public/
│   │   └── assets/
│   │       ├── background.png
│   │       ├── dayBackground.png
│   │       ├── flower.png
│   │       ├── peopleBackground.png
│   │       └── setting.png
│   ├── src/
│   │   ├── bracket.ts
│   │   ├── game.ts
│   │   ├── index.tsx
│   │   ├── neonCityPong.tsx
│   │   ├── router.ts
│   │   ├── stats.ts
│   │   ├── style.css
│   │   ├── tournament.ts
│   │   └── ui.ts
│   ├── dist/  (généré lors du build)
│   ├── Dockerfile
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── vite.config.ts
├── .env
├── .gitignore
├── docker-compose.yml
├── README.md
└── update_translations.sh
```
---

## Lancement

```bash
docker-compose up --build
```
### Racine du projet

- **`.env`**  
  Contient les variables d'environnement pour configurer les ports (par exemple, `3000` pour le backend et `5173` pour le frontend), les URLs (comme celle du backend), ou d'autres paramètres sensibles. Cela permet de personnaliser l'application sans modifier le code.

- **`.gitignore`**  
  Liste les fichiers et dossiers à ignorer par Git, comme `node_modules`, `dist/` (dossier généré lors du build du frontend), ou les fichiers temporaires générés par Vite. Cela évite de versionner des fichiers inutiles ou sensibles.

- **`docker-compose.yml`**  
  Orchestre les services Docker pour le projet. Il inclut le backend (port `3000`) et le frontend (port `5173` en développement, `80` en production via Nginx). Ce fichier définit également les dépendances entre services, comme une éventuelle base de données.

---

### Backend

Le dossier `backend/` contient le serveur qui gère la logique métier, les API REST, et la communication avec une base de données.

- **`src/index.js`**  
  Point d'entrée du backend, ce fichier configure et démarre un serveur avec **Fastify** (version 4.24.0). Il écoute sur le port `3000` et définit les routes API (par exemple, `/api/users` pour gérer les utilisateurs, `/api/matches` pour les matchs, ou `/api/tournaments` pour les tournois). Il traite les requêtes HTTP provenant du frontend, comme l'enregistrement des scores ou la récupération des statistiques.

- **`Dockerfile`**  
  Définit comment construire l'image Docker pour le backend :
  - Utilise `node:18-alpine` comme image de base, une version légère de Node.js 18.
  - Définit `/app` comme répertoire de travail.
  - Copie les fichiers `package.json` et `package-lock.json` puis installe les dépendances avec `npm install`.
  - Copie le reste des fichiers du projet (y compris `src/index.js`).
  - Expose le port `3000`, sur lequel le serveur Fastify écoute.
  - Lance le serveur avec `npm start`, qui exécute `node src/index.js`.

- **`package.json`**  
  Contient les métadonnées et les scripts du backend :
  - `"name": "backend"` et `"version": "1.0.0"` : Identifient le projet.
  - **Scripts** :
    - `"start": "node src/index.js"` : Lance le serveur en mode production.
    - `"dev": "node src/index.js"` : Lance le serveur en mode développement (identique au mode production ici, sans rechargement à chaud).
  - **Dépendances** :
    - `fastify: "^4.24.0"`: Framework utilisé pour créer une API REST performante et rapide.

---

### Frontend

Le dossier `frontend/` contient l'application cliente, une interface utilisateur développée avec **TypeScript**, **Vite**, et **Tailwind CSS**.

- **`public/assets/`**  
  Contient les ressources statiques utilisées dans l'interface utilisateur :
  - `background.png` : Image de fond générale pour le jeu.
  - `dayBackground.png` : Image de fond pour un thème "jour".
  - `flower.png` : Image décorative (utilisée dans les formulaires d'inscription/connexion).
  - `peopleBackground.png` : Image de fond pour la page post-login.
  - `setting.png` : Icône pour le bouton des paramètres dans l'interface du jeu.

- **`src/`**  
  Contient le code source du frontend, écrit en TypeScript (avec `rootDir: "./src"` dans `tsconfig.json`) :

  - **`bracket.ts`**  
    Gère la logique des tournois sous forme de "bracket" (arbre de tournoi). Organise les matchs, suit les progrès des joueurs, et détermine les gagnants des rondes.

  - **`game.ts`**  
    Contient la logique principale du jeu Pong. Gère le rendu sur un canvas HTML, les mouvements des raquettes, le déplacement de la balle, les collisions, et les scores. Inclut des fonctionnalités comme la pause et le redémarrage.

  - **`index.ts`**  
    Point d'entrée du frontend. Configure l'application, rend le composant racine dans `<div id="app">` (défini dans `index.html`), et intègre le routeur (`router.ts`) pour gérer la navigation.

  - **`neonCityPong.tsx`**  
    Implémente une variante du jeu Pong avec un thème "Neon City", incluant des effets visuels spécifiques (couleurs néon, animations) tout en réutilisant la logique de `game.ts`.

  - **`router.ts`**  
    Gère la navigation côté client, permettant de passer d'une page à une autre (page d'accueil, jeu, tournois) sans recharger la page, en utilisant l'API `history`.

  - **`stats.ts`**  
    Gère les statistiques et les données du jeu. Stocke l'historique des matchs, les statistiques des joueurs (victoires, défaites), les joueurs dans un tournoi, et les préférences utilisateur (couleur de fond, vitesse de la balle). Utilise `uuid` pour générer des identifiants uniques.

  - **`style.css`**  
    Contient les styles CSS de l'application, utilisant **Tailwind CSS**. Inclut des styles personnalisés pour des éléments comme le slider de vitesse, le canvas du jeu, et les formulaires.

  - **`tournament.ts`**  
    Gère la logique des tournois. Permet d'ajouter des joueurs, récupérer la liste des participants, et réinitialiser un tournoi. Interagit avec `stats.ts` pour stocker les données.

  - **`ui.ts`**  
    Gère l'interface utilisateur. Contient des fonctions pour rendre les pages (page d'accueil, formulaire d'inscription/connexion, page de jeu, écran de fin de tournoi) et configure les écouteurs d'événements pour l'interaction utilisateur.

- **`dist/`**  
  Dossier généré lors du build (`npm run build`). Contient les fichiers compilés et optimisés (HTML, CSS, JS) pour la production. Selon `tsconfig.json`, `outDir` est défini comme `./dist`. Ces fichiers sont servis par Nginx en production.

- **`Dockerfile`**  
  Définit trois stages pour le frontend :
  - **Stage `dev`** : Utilise `node:18-alpine`, copie les fichiers, installe les dépendances, expose le port `5173`, et lance le serveur de développement avec `npm run dev`.
  - **Stage `build`** : Compile l'application avec `npm run build`, générant les fichiers statiques dans `dist/`.
  - **Stage `prod`** : Utilise `nginx:alpine` pour servir les fichiers statiques générés sur le port `80`.

- **`index.html`**  
  Fichier HTML principal chargé par le navigateur :
  - Inclut un `<div id="app">` où React rend l'application.
  - Charge les styles via `<link href="src/style.css" rel="stylesheet">`.
  - Charge le script principal via `<script type="module" src="/src/index.ts">`.
  - Utilise des classes Tailwind CSS pour centrer le contenu.
  - Contient un script inline (probablement Cloudflare) pour des fonctionnalités de sécurité.

- **`package.json`**  
  Contient les métadonnées et les scripts du frontend :
  - **Scripts** : `dev`, `build`, `serve` pour lancer, construire, et prévisualiser l'application.
  - **Dépendances** : Inclut `uuid`, `vite`, `typescript`, `tailwindcss`, `postcss`, `autoprefixer`, et `@types/node`.

- **`postcss.config.js`**  
  Configure **PostCSS**, utilisé avec Tailwind CSS pour transformer les styles, intégrant `autoprefixer`.

- **`tailwind.config.js`**  
  Configure **Tailwind CSS**, définissant les couleurs personnalisées (comme `#f4c2c2`), les polices, et les chemins pour les classes.

- **`tsconfig.json`**  
  Configure TypeScript :
  - `target` et `module` : `ESNext`.
  - `strict: true` pour un typage strict.
  - `outDir: "./dist"` et `rootDir: "./src"`.
  - `esModuleInterop: true` et `skipLibCheck: true` pour la compatibilité et la performance.

- **`vite.config.ts`**  
  Configure Vite :
  - `server.host: "0.0.0.0"` pour l'accès externe.
  - `server.port: 5173` pour le développement.

---

## Résumé général

- **Backend** : Fournit une API REST avec **Fastify** (version 4.24.0) pour gérer les données (utilisateurs, matchs, tournois). Écoute sur le port `3000`. Construit avec Node.js 18 et lancé avec `npm start` (qui exécute `node src/index.js`).
- **Frontend** : Application avec TypeScript, utilisant Vite et Tailwind CSS. Le jeu Pong est rendu dans un canvas, avec des fonctionnalités comme des tournois et des statistiques. Accessible sur le port `5173` en développement et `80` en production (via Nginx).
- **Docker** : Le backend utilise `node:18-alpine` pour construire et lancer le serveur sur le port `3000`. Le frontend utilise trois stages (dev, build, prod) pour construire et servir l'application. Le `docker-compose.yml` orchestre les services, reliant le frontend et le backend.

