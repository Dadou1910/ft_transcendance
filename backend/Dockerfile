# Use official Node.js image
FROM ubuntu:24.04

# Install Node.js 20 from NodeSource
RUN apt-get update && \
    apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs openssl && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Create data and certs directories and set permissions
RUN mkdir -p /app/data /app/certs
RUN chmod 777 /app/data
RUN chmod 755 /app/certs

# Generate self-signed certificates for development
RUN openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /app/certs/key.pem \
    -out /app/certs/cert.pem \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

# Build TypeScript code
RUN npm run build

# Expose ports for HTTP and HTTPS
EXPOSE 80 443

# Command to start the server
CMD ["npm", "start"]