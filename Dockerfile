# syntax=docker/dockerfile:1

FROM node:24-slim AS base
WORKDIR /app
ENV NODE_ENV=production
# OpenSSL is required by the Prisma migration engine
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# Install all dependencies and build
FROM base AS build
COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma
RUN npm ci --include=dev
COPY . .
RUN npm run build && npm prune --omit=dev

# Runtime image
FROM base AS runtime
ENV HOST=0.0.0.0 \
    PORT=4321
COPY --from=build --chown=node:node /app/package.json /app/prisma.config.ts ./
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/prisma ./prisma
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/scripts ./scripts
USER node
EXPOSE 4321
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s \
  CMD [ "$DEPLOYMENT_TYPE" = "worker" ] || node -e "fetch('http://127.0.0.1:'+process.env.PORT+'/internal-api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
ENTRYPOINT ["sh", "scripts/docker-entrypoint.sh"]
