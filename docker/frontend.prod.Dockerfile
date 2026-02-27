FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build -- --configuration=production

FROM nginx:alpine

COPY --from=builder /app/dist/bitcorp-erp-frontend/browser /usr/share/nginx/html
RUN chmod -R 755 /usr/share/nginx/html
COPY nginx-https.conf /etc/nginx/conf.d/default.conf

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
