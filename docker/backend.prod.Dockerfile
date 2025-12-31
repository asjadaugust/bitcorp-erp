FROM node:20-alpine AS builder

WORKDIR /app

# Copy backend package files only
COPY backend/package*.json ./
RUN npm install

# Copy backend source code
COPY backend/ .
RUN npm run build

FROM node:20-alpine

WORKDIR /app

# Copy backend package files only  
COPY backend/package*.json ./
# Remove prepare script to prevent husky from running, but allow other scripts (like bcrypt)
RUN npm pkg delete scripts.prepare
# Install production dependencies (bcrypt needs scripts to run)
RUN npm install --only=production

# Copy compiled code from builder
COPY --from=builder /app/dist ./dist

EXPOSE 3400

CMD ["node", "dist/index.js"]



