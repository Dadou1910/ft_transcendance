# ⚠️ Utilise une version plus récente de Node pour éviter l’erreur vite/crypto

# === STAGE DE DEV ===
FROM node:18-alpine AS dev
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5173
CMD ["npm", "run", "dev"]

# === STAGE DE BUILD ===
FROM node:18-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# === STAGE DE PROD ===
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
