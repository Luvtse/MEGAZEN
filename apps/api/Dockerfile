FROM node:20-alpine
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-workspace.yaml tsconfig.base.json turbo.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/kernel/package.json packages/kernel/package.json
COPY packages/shared-config/package.json packages/shared-config/package.json
COPY packages/shared-types/package.json packages/shared-types/package.json
COPY packages/shared-validation/package.json packages/shared-validation/package.json
COPY packages/document-engine/package.json packages/document-engine/package.json
COPY packages/database/package.json packages/database/package.json
RUN pnpm install
COPY apps/api apps/api
COPY packages packages
RUN pnpm --filter @megazen/api prisma:generate && pnpm --filter @megazen/api build
EXPOSE 4000
CMD ["pnpm","--filter","@megazen/api","start"]
