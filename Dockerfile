FROM node:24-slim

WORKDIR /app

# Install ca-certificates for TLS verification of outgoing HTTPS requests (e.g. Discord API)
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*

# Copy package.json and lockfile first for Docker caching
COPY package*.json ./

# Install deps inside container
RUN npm ci

# Copy the rest of the project
COPY . .

CMD ["npm", "run", "dev"]
