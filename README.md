# Production E-Commerce Web Application

A full-stack, production-grade e-commerce application built with React 18, Vite, Express, and PostgreSQL, strictly configured according to production engineering rules, security standards, and modern design aesthetics.

---

## 🏗️ Architecture & Technology Stack

```
+-----------------------------------------------------------------------------------+
|                                  CLIENT LAYER                                     |
|  React 18 + Vite SPA | React Router v6 | TanStack Query | Zustand State Stores    |
|  Vanilla CSS Design Tokens | Sora & Inter Fonts | Nginx Production Reverse Proxy  |
+-----------------------------------------------------------------------------------+
                                       |
                                  HTTP / HTTPS
                               (REST / JSON API)
                                       v
+-----------------------------------------------------------------------------------+
|                                  SERVER LAYER                                     |
|  Node.js 20 + Express | Helmet Security Headers | CORS Origin Whitelisting        |
|  Pino Structured Logging | Tiered Rate Limiters | Zod Schema Validation           |
|  JWT Auth (15-min Access + 7-day Rotating Refresh Cookies)                        |
|  Layered Architecture: Routes -> Controllers -> Services -> Repositories          |
+-----------------------------------------------------------------------------------+
                                       |
                           Parameterized SQL Queries
                          (SELECT ... FOR UPDATE)
                                       v
+-----------------------------------------------------------------------------------+
|                                 DATABASE LAYER                                    |
|  PostgreSQL 16 (Native Pool via 'pg' / Fallback to Embedded PGlite)               |
|  18 Relational Tables | Composite & GIN Indexes | Automated updated_at Triggers   |
|  Analytics Event Stream & Incrementally Syncable SQL Analytical Views            |
+-----------------------------------------------------------------------------------+
                                       |
                                Webhooks & SDK
                                       v
+-----------------------------------------------------------------------------------+
|                             EXTERNAL INTEGRATIONS                                 |
|  Razorpay Payment Gateway (Test Mode) | Cryptographic HMAC-SHA256 Verification    |
+-----------------------------------------------------------------------------------+
```

- **Frontend (`/client`)**: React 18 SPA built with Vite. Fast, accessible, and code-split routes via `React.lazy()` and `Suspense`. Zero Tailwind dependency; styled using custom Vanilla CSS design tokens with responsive typography (`Sora` for headings, `Inter` for body).
- **Backend (`/server`)**: Node.js + Express structured in strict functional layers: `config`, `routes`, `controllers`, `services`, `repositories`, `middleware`, `utils`, `db`. Includes comprehensive security controls (Helmet, CORS, rate limiting, Zod payload validation).
- **Database (`/server/src/db`)**: PostgreSQL 16 schema with 18 normalized tables, integer paise pricing (no floating-point rounding errors), GIN tsvector full-text search, and database row-level locking (`SELECT ... FOR UPDATE`) during checkout. Automatic zero-config fallback to embedded `@electric-sql/pglite` if local PostgreSQL is offline.
- **Containerization**: Multi-stage production `Dockerfile` for server (Node 20 Alpine, non-root `nodeapp` user) and client (Vite build served by Nginx Alpine with SPA routing and API proxy), orchestrated via `docker-compose.yml`.
- **CI/CD & Testing**: GitHub Actions workflow (`.github/workflows/ci.yml`), 117 integration tests (`vitest`), and complete end-to-end user journey test (`playwright`).

---

## 📋 Environment Variables

### Backend (`server/.env` or Docker Environment)

| Variable | Type | Default | Description |
|---|---|---|---|
| `NODE_ENV` | `string` | `development` | Runtime environment (`development`, `production`, `test`) |
| `PORT` | `number` | `5000` | Express HTTP server listen port |
| `DATABASE_URL` | `string` | `postgresql://postgres:postgres@localhost:5432/ecommerce_db` | PostgreSQL connection URI |
| `JWT_ACCESS_SECRET` | `string` | *(32+ chars secret)* | Cryptographic HMAC secret for 15-minute access JWTs |
| `JWT_REFRESH_SECRET` | `string` | *(32+ chars secret)* | Cryptographic HMAC secret for 7-day refresh JWTs |
| `JWT_ACCESS_EXPIRES_IN` | `string` | `15m` | Lifetime of short-lived access tokens |
| `JWT_REFRESH_EXPIRES_IN` | `string` | `7d` | Lifetime of rotating refresh tokens |
| `CORS_ORIGIN` | `string` | `http://localhost:5173` | Allowed frontend origin(s), comma-separated |
| `RAZORPAY_KEY_ID` | `string` | `rzp_test_1DP5mmOlF5G5ag` | Razorpay public test key identifier |
| `RAZORPAY_KEY_SECRET` | `string` | `s9x1W8oH8vQ2wM3L4k5J6i7H` | Razorpay private secret for HMAC signature verification |
| `RAZORPAY_WEBHOOK_SECRET`| `string` | `test_webhook_secret_key` | Razorpay webhook cryptographic signing secret |
| `ENABLE_RETENTION_JOB` | `boolean`| `false` | Enable nightly archival cron job for 90+ day data |
| `RETENTION_DAYS` | `number` | `90` | Cutoff age in days for archival retention job |

### Frontend (`client/.env` or Docker Build Args)

| Variable | Type | Default | Description |
|---|---|---|---|
| `VITE_API_URL` | `string` | `http://localhost:5000/api` | Base URL for backend REST API (`/api` in production Nginx) |
| `VITE_RAZORPAY_KEY_ID` | `string` | `rzp_test_1DP5mmOlF5G5ag` | Razorpay public key ID for checkout modal |

---

## 🗄️ Database Architecture & Migrations

All 18 tables feature:
- Primary key: `id UUID DEFAULT gen_random_uuid()`
- Audit timestamps: `created_at TIMESTAMPTZ` and `updated_at TIMESTAMPTZ`
- Shared trigger: `update_updated_at_column()` attached to all tables for incremental ETL/analytics sync.
- Financial integrity: `BIGINT` integer paise (e.g., ₹499.00 = `49900` paise) avoiding floating-point math bugs.
- Data integrity: Strict `CHECK` constraints on prices, quantities, discount bounds, and statuses.

### Table Schema Overview

| # | Table | Description | Key Constraints & Indexes |
|---|---|---|---|
| 1 | `users` | Customer & admin credentials and profile | `email UNIQUE`, `role IN ('customer', 'admin')` |
| 2 | `refresh_tokens` | Hashed refresh tokens for JWT rotation | `token_hash UNIQUE`, `user_id FK CASCADE` |
| 3 | `addresses` | Customer shipping & billing addresses | `user_id FK CASCADE`, `is_default` flag |
| 4 | `categories` | Product hierarchy & departments | `slug UNIQUE`, `parent_id FK SET NULL` |
| 5 | `products` | Base product catalog | `slug UNIQUE`, `base_price >= 0`, `mrp >= base_price`, GIN tsvector |
| 6 | `variants` | Specific SKUs (size, color, price) | `sku UNIQUE`, `product_id FK CASCADE`, `price >= 0` |
| 7 | `inventory` | Stock levels per SKU | `variant_id UNIQUE FK CASCADE`, `quantity_on_hand >= 0` |
| 8 | `inventory_reservations`| 15-minute checkout reservation hold locks | `status IN ('held', 'committed', 'released')`, `expires_at` |
| 9 | `carts` | User and guest shopping carts | `user_id FK CASCADE`, `session_id`, `status` |
| 10 | `cart_items` | Items inside shopping cart | `UNIQUE (cart_id, variant_id)`, `quantity > 0` |
| 11 | `wishlist_items` | Saved customer products | `UNIQUE (user_id, product_id)` |
| 12 | `coupons` | Discounts (percent or flat) | `code UNIQUE`, `type IN ('percent', 'flat')`, date bounds |
| 13 | `orders` | Placed and pending orders | `order_number UNIQUE`, `idempotency_key UNIQUE`, `status` |
| 14 | `order_items` | Snapshot items for placed orders | `order_id FK CASCADE`, `unit_price`, `quantity`, `line_total` |
| 15 | `order_status_history` | Audit trail of order status transitions | `order_id FK CASCADE`, `from_status`, `to_status`, `changed_by` |
| 16 | `payments` | Gateway transactions | `order_id FK CASCADE`, `gateway_payment_id UNIQUE`, `amount` |
| 17 | `returns` | Return & refund requests | `order_item_id FK CASCADE`, `status`, `refund_amount` |
| 18 | `events` | Analytics tracking stream | `event_type`, `properties JSONB`, `occurred_at DESC` index |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v20.x or higher
- **npm**: v10.x or higher
- **Docker & Docker Compose** (optional for local dev; mandatory for containerized production)

### Local Development Setup

1. **Clone repository & install all workspace dependencies**:
   ```bash
   npm run install:all
   ```

2. **Start the database**:
   - Option A (Docker): `docker compose up -d postgres`
   - Option B (PGlite): If Docker is absent, the backend automatically boots an embedded PostgreSQL instance at `.postgres-data`.

3. **Run database migrations & seed initial catalog**:
   ```bash
   npm run db:seed
   ```

4. **Launch development servers**:
   ```bash
   npm run dev
   ```
   - **Frontend**: [http://localhost:5173](http://localhost:5173)
   - **Backend API**: [http://localhost:5000](http://localhost:5000)
   - **API Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 🐳 Production Deployment with Docker Compose

To build and run the complete stack (PostgreSQL 16, Express API, and Nginx SPA client):

```bash
# Build and run containers in detached mode
docker compose up --build -d

# Check service health and logs
docker compose ps
docker compose logs -f server

# Stop all containers
docker compose down
```

Services exposed:
- **Client Web Application**: `http://localhost:80` (or `http://localhost`)
- **Backend API**: `http://localhost:5000` (and proxied via `http://localhost/api/`)
- **PostgreSQL Database**: `localhost:5432`

---

## 📜 Complete Workspace Scripts

| Script | Working Directory | Description |
|---|---|---|
| `npm run dev` | Root | Starts both backend server and client concurrently |
| `npm run dev:server` | Root / `server` | Starts Express server in watch mode |
| `npm run dev:client` | Root / `client` | Starts Vite dev server with HMR |
| `npm run lint` | Root | Runs ESLint checks across both server and client |
| `npm run format` | Root | Formats code with Prettier across entire workspace |
| `npm run format:check`| Root | Verifies code formatting compliance |
| `npm run db:migrate` | Root / `server` | Applies all pending SQL migrations |
| `npm run db:rollback`| Root / `server` | Reverts the latest applied SQL migration |
| `npm run db:seed` | Root / `server` | Migrates schema and seeds 40 products, 91 variants, coupons, admin & users |
| `npm run db:reset` | Root / `server` | Completely resets database schema and reapplies seeds |
| `npm test` | Root / `server` | Executes full Vitest backend integration test suite (117 tests) |
| `npm run test:e2e` | Root | Runs Playwright end-to-end browser tests |
| `npm run build` | `client` | Compiles production client bundle to `client/dist/` |

---

## 🔒 Security Architecture & Review

1. **HTTP Security Headers (Helmet)**:
   - Configured with Content Security Policy (`CSP`), HSTS with subdomains, X-Frame-Options `SAMEORIGIN`, X-Content-Type-Options `nosniff`, and Origin-Agent-Cluster.
2. **Strict CORS Whitelisting**:
   - Strictly validates `Origin` against `CORS_ORIGIN` environment variable in production.
3. **Cookie Hardening**:
   - Refresh tokens and guest session cookies are configured with `HttpOnly: true`, `SameSite: 'lax'`, `Path: '/'`, and conditional `Secure: true` in production.
4. **SQL Injection Immunity**:
   - 100% of database interactions use parameterized SQL statements (`$1, $2, ...`). Dynamic query parameters (sorting, pagination, column filters) are whitelisted against rigid static arrays.
5. **Cross-Site Scripting (XSS)**:
   - React JSX engine auto-escapes all rendered user and catalog content. Zero instances of `dangerouslySetInnerHTML`.
6. **Tiered Rate Limiting**:
   - `globalLimiter`: 300 requests per 15 minutes per IP on `/api`.
   - `authLimiter`: 30 requests per 15 minutes on sensitive authentication paths.
   - `strictAuthLimiter`: 10 requests per 15 minutes on `/auth/login`, `/auth/register`, `/auth/forgot-password`.
   - `eventsLimiter`: 1,200 requests per 15 minutes for analytics event streaming.
7. **Secret Exclusion**:
   - `.gitignore` configured to prevent `.env*`, `.postgres-data`, and credentials from being committed to Git.

---

## 🧪 Testing

### Backend Integration Tests (Vitest)
```bash
npm test
```
- Tests 117 assertions across 6 suites: authentication, products catalog & search, cart & coupons, checkout & inventory reservations, admin operational APIs, and analytics event batching.

### End-to-End Tests (Playwright)
```bash
npm run test:e2e
```
- Simulates complete customer journey in headless Chromium:
  1. Browse homepage and shop catalog.
  2. Select product and add to cart.
  3. Register new user account with inline validation.
  4. Advance through 3-step checkout (address, shipping, payment).
  5. Mock Razorpay payment gateway authorization with cryptographic HMAC-SHA256 signature verification.
  6. Verify placed order on `/order-success/:orderNumber`.

---

## 👥 Seeded User Accounts

Running `npm run db:seed` inserts:

- **Admin Account**:
  - Email: `admin@shoppe.com`
  - Password: `Admin@123`
- **Customer Accounts**:
  - `alex@example.com` (includes default address in Bengaluru)
  - `elena@example.com`
  - `marcus@example.com`
  - Password for all customers: `User@123`
- **Active Promotional Coupons**:
  - `WELCOME10`: 10% off (min order ₹1,000, max discount ₹500)
  - `STUDIO20`: 20% off (min order ₹3,000, max discount ₹2,000)
  - `FLAT500`: Flat ₹500 off (min order ₹2,500)
  - `VIPAUDIO`: 15% off (min order ₹5,000, max discount ₹3,500)
  - `FREESHIP`: Flat ₹99 shipping waiver (min order ₹500)
