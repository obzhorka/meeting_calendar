# Frontend Dockerfile - Multi-stage build
FROM node:18-alpine as build

# Ustaw katalog roboczy
WORKDIR /app

# Kopiuj package.json
COPY package*.json ./

# Zainstaluj zależności
RUN npm ci

# Kopiuj kod źródłowy
COPY . .

# Zbuduj aplikację dla produkcji
RUN npm run build

# Stage 2 - Serwuj przez nginx
FROM nginx:alpine

# Kopiuj zbudowaną aplikację
COPY --from=build /app/dist /usr/share/nginx/html

# Kopiuj konfigurację nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Eksponuj port
EXPOSE 80

# Uruchom nginx
CMD ["nginx", "-g", "daemon off;"]

