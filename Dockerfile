# Backend Dockerfile
FROM node:18-alpine

# Ustaw katalog roboczy
WORKDIR /app

# Kopiuj package.json i package-lock.json
COPY package*.json ./

# Zainstaluj zależności
RUN npm ci --only=production

# Kopiuj kod źródłowy backendu
COPY server ./server

# Eksponuj port
EXPOSE 5000

# Zdrowy punkt kontrolny
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Uruchom aplikację
CMD ["node", "server/index.js"]

