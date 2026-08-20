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

## Database Models

The runtime API schema and migration source of truth is `apps/api/prisma/schema.prisma`. `packages/database/schema.prisma` is retained as an existing package artifact and is not used by the runtime API.


### Canonical shipment reference

Every booking receives one backend-generated, immutable 10-digit shipment reference. The final digit is a Luhn check digit. The same booking number is inherited by the Bill of Lading; there is no independent B/L number generator.

```text
Booking:  8372946155
B/L:      ZENU8372946155
Container prefix: ZENU
SCAC:     ZENU
```

The booking number is generated only by the API using `node:crypto` and is protected by a database uniqueness constraint. Concurrent creation retries on a database unique conflict. Search and reference endpoints validate the complete check digit before performing exact lookups.

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


## MEGAZEN consolidated working baseline

This repository preserves the complete source tree supplied for the MEGAZEN build and adds the repaired operational B/L integration. The API uses PostgreSQL 15, Redis, Express, Prisma, and the shared document engine. The web application uses Next.js 14.

### Local development

```bash
npm install
npm run db:push
npm run db:seed
npm run dev
```

The API listens on `http://localhost:4000` and the web application on `http://localhost:3000`.

For tenant-scoped API requests use `x-tenant-id: MEGAZEN-DEMO` when using the seeded demo tenant.

### Bill of Lading

The consolidated implementation includes controlled draft/review/approval/issuance workflow, container attachment, amendment history, A4 single-page and continuation-page PDF rendering, QR verification, and document integrity hashing.

Final PDFs are available from:

`GET /api/bills-of-lading/:id/pdf`

Public verification is available from:

`GET /public/verify/bl/:verificationCode`


### Booking number and B/L number protocol

Every newly created booking receives its identifier **only from the backend**:

- exactly 10 digits;
- the first 9 digits are generated with a cryptographically secure random source;
- digit 10 is a Luhn check digit;
- the database enforces global uniqueness;
- booking creation retries on a concurrent unique-key collision;
- the booking number is indexed by its unique database constraint;
- the number is immutable and is the shipment's primary business reference;
- the B/L does not generate another number: it inherits the booking number as `ZENU` + 10 digits.

Example:

```text
Booking: 8372946155
B/L:     ZENU8372946155
```

`8372946155` is valid for the implemented check-digit rule. The illustrative `8372946150` value is not a valid Luhn check-digit value.

Exact-number lookup endpoints:

```text
GET /api/bookings/by-number/:bookingNumber
GET /api/bills-of-lading/by-number/:blNumber
```

Container registration for MEGAZEN-generated containers requires the `ZENU` owner prefix followed by seven serial digits.

## Booking Number & B/L Reference Convention

MEGAZEN generates the booking number exclusively on the backend when a booking is created. The value is exactly 10 digits: nine cryptographically secure random digits plus a deterministic Luhn check digit. The database `UNIQUE` constraint is the authoritative uniqueness guarantee and booking creation retries on concurrent unique conflicts.

The booking number is the permanent shipment business reference. A B/L never generates another number; when the B/L is created it inherits the booking number with the carrier prefix:

```text
Booking: 8372946155
B/L:     ZENU8372946155
```

Container numbers use the `ZENU` prefix followed by seven serial digits. Backend validation rejects booking numbers with an invalid format/check digit and rejects invalid container prefixes.

Exact business-reference endpoints:

- `GET /api/bookings/by-number/:bookingNumber`
- `GET /api/bills-of-lading/by-number/:blNumber`

The web application exposes `/bookings` for booking lookup/creation and `/bookings/number/:bookingNumber` for number-first references. B/L creation begins with booking-number lookup and then inherits the booking's reference automatically.


### Universal shipment reference search

The permanent booking number is the system-wide business reference. Both the 10-digit booking number and its derived `ZENU` B/L number resolve to the same shipment record.

```text
GET /api/references/:reference
```

Supported references:

```text
8372946155
ZENU8372946155
```

The response resolves the booking, shipment, customer, container and all associated B/L versions. The web application exposes the same workflow at:

```text
/search
```

A B/L creation also synchronizes `Shipment.blNumber` to the inherited `ZENU` reference, preventing the shipment record from carrying a separate document number.


### Booking / B/L reference convention

Booking numbers are generated exclusively by the API. Clients must not provide a booking number during booking creation. The database enforces the 10-digit shape and uniqueness; the API enforces the Luhn check digit and retries unique conflicts. A B/L never generates its own number: it inherits the booking number and formats it as `ZENU<bookingNumber>`. SCAC is fixed to `ZENU` and is backend/database controlled.

## B/L lifecycle hardening

The issued document records its actual issuance timestamp when the B/L transitions to `ISSUED`. A B/L may be surrendered from `ISSUED` or `RELEASED`; the transition is tenant-scoped and version-checked.


## B/L issuance-date invariant

A Bill of Lading draft does not receive an issuance date. `issueDate` is assigned only when the document transitions from `APPROVED` to `ISSUED`, and that timestamp is used consistently for the final document hash and PDF.

## Reference integrity invariant

MEGAZEN uses the backend-generated 10-digit booking number as the immutable shipment identity. A Bill of Lading never generates an independent number: its number is always `ZENU` plus the booking number. Container attachment must reference the booking's assigned container and remain tenant-scoped.
