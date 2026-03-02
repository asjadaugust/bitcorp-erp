FROM node:20
WORKDIR /app

RUN npm config set fetch-timeout 600000 && \
    npm config set fetch-retries 5

COPY frontend/package*.json ./
RUN npm install --legacy-peer-deps --loglevel=info && \
    npm install --no-save @rollup/rollup-linux-arm64-gnu 2>/dev/null || \
    npm install --no-save @rollup/rollup-linux-x64-gnu 2>/dev/null || true

COPY frontend/ .
RUN rm -rf .angular node_modules/.cache

EXPOSE 3420
CMD ["npm", "start"]
