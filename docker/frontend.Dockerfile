FROM node:20 AS base
WORKDIR /app

# Set npm configuration for faster builds and better caching
RUN npm config set fetch-timeout 600000 && \
    npm config set fetch-retries 5

FROM base AS development
COPY frontend/package*.json ./
# Install dependencies with legacy peer deps to resolve conflicts
# Note: --legacy-peer-deps resolves Angular 19 dependency conflicts
RUN npm install --legacy-peer-deps --loglevel=info && \
    npm install --no-save @rollup/rollup-linux-x64-gnu
COPY frontend/ .
RUN rm -rf .angular node_modules/.cache
EXPOSE 3420
CMD ["npm", "start"]

FROM base AS build
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
RUN npm run build

FROM nginx:1.25-alpine AS production
RUN rm -rf /usr/share/nginx/html/*
COPY --from=build /app/dist/bitcorp-erp-frontend /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
