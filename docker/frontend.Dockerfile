FROM node:20-alpine AS base
WORKDIR /app

FROM base AS development
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
RUN rm -rf .angular node_modules/.cache
EXPOSE 3420
# Install deps at startup since volume mount will override node_modules
CMD ["sh", "-c", "npm install && npm start"]

FROM base AS build
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

FROM nginx:alpine AS production
COPY --from=build /app/dist/bitcorp-erp-frontend /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
