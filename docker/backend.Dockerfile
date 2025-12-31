FROM node:20-alpine AS base
WORKDIR /app

FROM base AS development
COPY backend/package*.json ./
RUN npm install
COPY backend/ .
EXPOSE 3400 9229
CMD ["npm", "run", "dev"]

FROM base AS production
COPY backend/package*.json ./
RUN npm ci --only=production
COPY backend/dist ./dist
EXPOSE 3400
CMD ["npm", "start"]
