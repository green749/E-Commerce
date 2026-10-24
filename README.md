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

