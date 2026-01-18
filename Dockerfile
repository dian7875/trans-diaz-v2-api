# =========================
# Builder
# =========================
FROM node:22-bookworm-slim AS build
WORKDIR /usr/src/app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# dejar solo deps de producción
RUN npm ci --only=production && npm cache clean --force

# instalar chromium dentro del proyecto
ENV PLAYWRIGHT_BROWSERS_PATH=0
RUN npx playwright install chromium

# =========================
# Imagen final
# =========================
FROM node:22-bookworm-slim AS prod
WORKDIR /usr/src/app

ENV NODE_ENV=production
ENV PLAYWRIGHT_BROWSERS_PATH=0

RUN apt-get update && apt-get install -y \
  libglib2.0-0 \
  libnss3 \
  libatk1.0-0 \
  libatk-bridge2.0-0 \
  libcups2 \
  libdrm2 \
  libxkbcommon0 \
  libxcomposite1 \
  libxdamage1 \
  libxfixes3 \
  libxrandr2 \
  libgbm1 \
  libasound2 \
  libpangocairo-1.0-0 \
  fonts-liberation \
  ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/prisma ./prisma
COPY --from=build /usr/src/app/generated ./generated

USER node
EXPOSE 3000

CMD ["node", "dist/src/main.js"]
