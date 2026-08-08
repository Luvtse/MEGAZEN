# MEGAZEN - Enterprise Maritime Logistics Platform

A comprehensive, production-grade maritime logistics platform for managing bookings, containers, vessels, release orders, delivery orders, and bills of lading with multi-tenant support, real-time tracking, and advanced approval workflows.

## Features

- **Multi-tenant Architecture**: Complete tenant isolation with shared infrastructure
- **Booking Management**: Auto-approval workflows with intelligent business rules
- **Container Registry**: Real-time tracking and smart assignment based on cargo types
- **Release Orders (RO)**: Auto-generation with financial clearance verification
- **Delivery Orders (DO)**: Physical cargo release with pickup tracking
- **Bill of Lading (B/L)**: Draft/Submit/Preview workflow with 3-amendment limit, PDF generation, QR verification
- **Vessel & Voyage**: Complete maritime schedule management
- **Yard Management**: Visual slot management with movement tracking
- **EDI Integration**: Support for EDIFACT and JSON payloads
- **Audit & Compliance**: Complete audit trails, sanctions screening
- **Real-time Updates**: WebSocket-powered live notifications
- **Dark Theme UI**: Professional Shadcn UI components

## Tech Stack

**Backend**
- Node.js with Express.js
- TypeScript (strict mode)
- Prisma ORM
- PostgreSQL
- Redis
- Socket.IO for real-time updates
- Zod for validation

**Frontend**
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Shadcn UI components
- Socket.IO client
- TanStack Query

**DevOps**
- Docker & Docker Compose
- Turbo for monorepo management
- Prisma migrations

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 18+
- pnpm 8+

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Luvtse/MEGAZEN.git
   cd MEGAZEN
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Setup environment**
   ```bash
   cp .env.example .env.local
   ```

4. **Start Docker services**
   ```bash
   docker-compose up -d
   ```

5. **Run database migrations**
   ```bash
   pnpm run db:migrate
   ```

6. **Seed database with initial data**
   ```bash
   pnpm run db:seed
   ```

7. **Start development servers**
   ```bash
   pnpm run dev
   ```

   - API: http://localhost:3001
   - Web: http://localhost:3000
   - Prisma Studio: `pnpm run db:studio`

## Database Models (80+)

See `packages/database/schema.prisma` for complete schema.

## API Endpoints (100+)

See `apps/api/README.md` for complete API documentation.

## Frontend Pages (11)

See `apps/web/README.md` for complete UI guide.

## Development

```bash
# Type check
pnpm run type-check

# Lint
pnpm run lint

# Test
pnpm run test

# Database migrations
pnpm run db:migrate

# Prisma Studio
pnpm run db:studio

# Seed database
pnpm run db:seed
```

## License

MIT
