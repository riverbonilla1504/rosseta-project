# Imagen de desarrollo del frontend (docker compose --profile app). docs/03-arquitectura/08-infraestructura-y-entornos.md
FROM node:22-slim

RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .

EXPOSE 3000
CMD ["pnpm", "dev", "--hostname", "0.0.0.0"]
