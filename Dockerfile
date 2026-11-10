# syntax=docker/dockerfile:1
#
# Production image for FreshBasket (Next.js standalone server).
#
#   docker build -t freshbasket \
#     --build-arg NEXT_PUBLIC_BASE_URL=https://shop.example.com .
#   docker run -p 3000:3000 --env-file .env.production freshbasket
#
# NEXT_PUBLIC_* values are compiled into the browser bundle, so they are build
# arguments. Every other setting (database, secrets, email) is read at runtime from
# the container environment and never baked into the image. See docs/DEPLOYMENT.md.

FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM node:22-alpine AS build
WORKDIR /app
ARG NEXT_PUBLIC_BASE_URL=http://localhost:3000
ARG NEXT_PUBLIC_MAP_TILE_URL=
ARG NEXT_PUBLIC_MAP_TILE_ATTRIBUTION=
ENV NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL \
    NEXT_PUBLIC_MAP_TILE_URL=$NEXT_PUBLIC_MAP_TILE_URL \
    NEXT_PUBLIC_MAP_TILE_ATTRIBUTION=$NEXT_PUBLIC_MAP_TILE_ATTRIBUTION \
    NEXT_OUTPUT=standalone \
    NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-alpine AS run
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
# Run as an unprivileged user, never root.
RUN addgroup -S app && adduser -S app -G app
COPY --from=build --chown=app:app /app/public ./public
COPY --from=build --chown=app:app /app/.next/standalone ./
COPY --from=build --chown=app:app /app/.next/static ./.next/static
# Database setup scripts (indexes, seed); they use mongoose/bcryptjs from the standalone bundle.
COPY --from=build --chown=app:app /app/database ./database
USER app
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/settings > /dev/null || exit 1
CMD ["node", "server.js"]
