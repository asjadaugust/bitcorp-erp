FROM node:20-alpine AS base
WORKDIR /app

# Install Chromium and dependencies for Puppeteer
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    font-noto-emoji

# Tell Puppeteer to use the installed Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

FROM base AS development
COPY bff/package*.json ./
RUN npm install
COPY bff/ .
EXPOSE 3400 9229
CMD ["npm", "run", "dev"]

FROM base AS production
COPY bff/package*.json ./
RUN npm ci --only=production

# Add user for running Chromium (it won't run as root)
RUN addgroup -g 1001 -S nodejs \
    && adduser -S nodejs -u 1001

COPY bff/dist ./dist
COPY bff/src/templates ./src/templates
RUN chown -R nodejs:nodejs /app

USER nodejs
EXPOSE 3400
CMD ["npm", "start"]
