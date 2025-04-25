# Use official Node.js image
FROM node:20

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Install type definitions
RUN npm install --save-dev @types/node

# Copy source code
COPY . .

# Create data directory and set permissions
RUN mkdir -p /app/data
RUN chmod 777 /app/data

# Build TypeScript code
RUN npm run build

# Expose port
EXPOSE 4000

# Command to start the server
CMD ["npm", "start"]