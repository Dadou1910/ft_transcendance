FROM node:18-alpine
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --include=dev

# Copy all the source files
COPY . .

# Compile TypeScript
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
