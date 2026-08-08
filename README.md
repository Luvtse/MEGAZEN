# MEGAZEN v0.2.0 Foundation

Initial executable monorepo foundation for the MEGAZEN Digital Trade & Logistics Operating System.

## Stack
- Next.js 14 / React / TypeScript
- Express / TypeScript
- PostgreSQL 15 / Prisma
- Redis
- Socket.io
- Zod
- Pino

## Run
cp .env.example .env
docker compose up -d
pnpm install
pnpm db:generate
pnpm db:migrate
pnpm db:seed
pnpm dev

API: http://localhost:4000
Web: http://localhost:3000
Health: http://localhost:4000/health
