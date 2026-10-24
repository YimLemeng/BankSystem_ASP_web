
# Stage 1: Build static assets
FROM node:20-alpine AS build
WORKDIR /app

# Copy dependency manifests and install packages
COPY package*.json ./
RUN npm ci || npm install

# Copy application source code and compile production bundle
COPY . .
RUN npm run build

# Stage 2: Serve with production-grade Nginx
FROM nginx:alpine AS runtime

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy compiled SPA bundle from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration (handles SPA routing and /api reverse proxy)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose HTTP port
EXPOSE 80

# Run Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
