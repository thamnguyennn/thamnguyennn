FROM node:22-slim AS build
RUN apt-get update && apt-get install -y --no-install-recommends openssl python3 make g++ && rm -rf /var/lib/apt/lists/*
WORKDIR /repo
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
RUN npm ci -w apps/api
COPY apps/api apps/api
RUN npm run build -w apps/api

FROM node:22-slim
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
ENV NODE_ENV=production
WORKDIR /repo
COPY --from=build /repo/node_modules node_modules
COPY --from=build /repo/apps/api apps/api
WORKDIR /repo/apps/api
USER node
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
