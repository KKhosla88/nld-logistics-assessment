# NLD Logistics Assessment

A full-stack logistics ordering application built with Angular, Express, TypeORM, and PostgreSQL. Phase 1 establishes the database schema, repeatable seed data, backend lifecycle, health checks, and Angular application shell.

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

## Assessment decisions and assumptions

The following choices will be finalized while authentication and ordering are implemented:

- **Public ADMIN registration:** the PDF accepts a role during registration, but unrestricted public ADMIN creation is unsafe. The intended implementation will document whether literal assessment compatibility or protected/seeded ADMIN creation is chosen.
- **USER access assignment:** registration must decide whether callers can select `VIEW`/`CREATE` or whether the backend assigns a safe default.
- **Initial order status:** new orders will default to `PENDING`; no confirmation endpoint is required by the PDF.
- **Cancellation authorization:** proposed rule is ADMIN, or the owning USER with `CREATE` access.
- **Date filters:** timestamps are UTC. `from` will include the start instant and date-only `to` values will include the full final UTC day; exact API semantics will be documented with the endpoint.

## Phase roadmap

- Phase 1: foundation, schema, seed, backend lifecycle, Angular shell.
- Phase 2: authentication, authorization, and product browsing.
- Phase 3: transactional order creation, listing, cancellation, and concurrency tests.
- Phase 4: complete Angular workflows, end-to-end verification, and submission polish.
