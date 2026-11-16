# Stage 1: Build Frontend
FROM oven/bun:alpine AS builder

WORKDIR /app

ARG VITE_ENABLE_DEV_LOGIN=false
ENV VITE_ENABLE_DEV_LOGIN=$VITE_ENABLE_DEV_LOGIN

COPY package.json bun.lock* ./
RUN bun install

COPY . .
RUN bun run build

# Stage 2: Serve with Nginx Alpine
FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 3005

CMD ["nginx", "-g", "daemon off;"]
