# NLD Logistics Assessment

A full-stack logistics ordering application built with Angular, Express, TypeORM, and PostgreSQL. It includes authentication, permissioned product browsing, transactional ordering, stock-safe cancellation, a signal-based cart, and order history.

## Architecture

```text
Angular 21 client (localhost:4200)
            |
            | HTTP / JSON
            v
Express 5 API (localhost:3000)
            |
            | TypeORM (explicit migrations)
            v
PostgreSQL 17 (localhost:5432)
```

- `frontend/` — standalone Angular application and browser UI.
- `backend/src/app.ts` — Express middleware and route composition.
- `backend/src/server.ts` — database initialization, HTTP listener, and graceful shutdown.
- `backend/src/config/env.ts` — runtime environment validation with Zod.
- `backend/src/database/entities/` — TypeORM object-to-table mappings.
- `backend/src/database/migrations/` — versioned, reversible database schema changes.
- `backend/src/database/seeds/` — deterministic development data.
- `docker-compose.yml` — local PostgreSQL service and persistent named volume.

## Requirements

- Node.js 24 (`.nvmrc`)
- npm
- Docker with Docker Compose (Colima is supported on macOS)

## Local setup

1. Install dependencies if they are not already installed:

   ```bash
   cd backend && npm ci
   cd ../frontend && npm ci
   ```

2. Create the backend environment file:

   ```bash
   cp backend/.env.example backend/.env
   ```

   The committed values are development placeholders. Use a long random `JWT_SECRET` and secret management in a deployed environment.

3. Start PostgreSQL and wait for it to become healthy:

   ```bash
   docker-compose up -d postgres
   docker-compose ps
   ```

4. Apply the schema and seed products:

   ```bash
   cd backend
   npm run migration:run
   npm run seed
   ```

   The seed uses product SKU as its stable key, so it is safe to run repeatedly without creating duplicates.

   Create or update a development ADMIN with credentials supplied only at execution time:

   ```bash
   ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD='a-long-development-password' npm run seed:admin
   ```

   The ADMIN can grant a registered user `CREATE` access with `PATCH /admin/users/:id/access`. The user should sign in again afterward because authorization claims are captured in the one-hour JWT.

5. Start the API and Angular app in separate terminals:

   ```bash
   cd backend && npm run dev
   cd frontend && npm start
   ```

6. Check `http://localhost:3000/health` and open `http://localhost:4200`.

## Verification commands

```bash
cd backend
npm run build
npm test
npm run migration:show
```

The Angular native macOS builder currently crashes on the development machine with an allocator error. The project builds successfully in Linux, so use the verified container path:

```bash
docker run --rm \
  --mount 'type=bind,src=/Users/kartikeykhosla/Desktop/nld-logistics-assessment/frontend,dst=/app' \
  --mount 'type=volume,src=nld_frontend_node_modules,dst=/app/node_modules' \
  --workdir /app \
  node:24-alpine \
  sh -lc 'npm ci && npm run build -- --progress=false'
```

## Schema and integrity choices

- TypeORM uses `synchronize: false`. Migrations are reviewed and deployed explicitly instead of allowing runtime code to mutate the schema.
- Money uses PostgreSQL `numeric(12,2)` and is represented as strings at the ORM boundary to avoid JavaScript floating-point rounding.
- Database checks prevent negative stock and money, and require positive order-item quantities.
- Order-item prices are snapshots. A later product price update cannot change historical order totals.
- Foreign keys preserve history: referenced users/products are restricted from deletion, while order items cascade only when their parent order is deleted.
- Timestamps use `TIMESTAMPTZ`; application and API date handling will use UTC.
- Indexes cover order ownership, status/date filtering, and order-item joins required by the assessment queries.

## Current API

- `POST /auth/register` — creates a `USER` with `VIEW` access. Body: `{ "email", "password" }`.
- `POST /auth/login` — returns a JWT and the public user profile.
- `GET /products?search=&page=1&limit=10` — authenticated, case-insensitive name/SKU search with pagination.
- `PATCH /admin/users/:id/access` — ADMIN-only; body `{ "access": "VIEW" | "CREATE" }`.
- `POST /orders` — ADMIN or `USER + CREATE`; transactionally locks products, validates/deducts stock, and creates the order/items.
- `GET /orders?status=&from=&to=&page=1&limit=10` — ADMIN sees all orders; USER sees only their own.
- `POST /orders/:id/cancel` — ADMIN or owning `USER + CREATE`; restores stock exactly once in a transaction.
- `GET /health` — verifies both API and database readiness.

Public callers cannot choose their role or access. Although accepting a registration role literally would be simple, it would allow anyone to create an ADMIN account. Administrative provisioning and access changes should use a protected workflow or seed—not public registration. The API, not Angular guards, is the authoritative security boundary.

## Assessment decisions and assumptions

- **Public registration:** creates `USER + VIEW`; ADMIN creation is a controlled seed and access changes are ADMIN-only.
- **Initial status:** new orders are `PENDING`; the assessment specifies no confirmation endpoint.
- **Cancellation:** allowed for ADMIN or the owning `USER + CREATE`, and only from `PENDING`/`CONFIRMED`.
- **Dates:** timestamps are UTC. A date-only `from` begins at `00:00:00.000Z`; a date-only `to` includes through `23:59:59.999Z`. Full timestamps must end in `Z`.
- **Money:** backend calculations use integer cents; PostgreSQL persists exact `numeric(12,2)` values.
- **Concurrency:** product and order rows use TypeORM pessimistic write locks inside transactions. Product locks are acquired in ascending ID order to reduce deadlock risk.

## Phase roadmap

- Phase 1: foundation, schema, seed, backend lifecycle, Angular shell — complete.
- Phase 2: authentication, authorization, and product browsing — complete.
- Phase 3: transactional order creation/listing/cancellation, concurrency verification, cart, checkout, and order history — complete.
- Phase 4: complete Angular workflows, end-to-end verification, and submission polish.
