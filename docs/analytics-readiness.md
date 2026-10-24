# Analytics Readiness Specification

This document details the architecture, database schema, event ingestion pipeline, SQL views, read-only access configuration, and data retention policies designed to decouple the transactional e-commerce platform from downstream analytics and business intelligence (BI) systems.

---

## 1. Architecture Overview

```mermaid
flowchart TD
    subgraph Client Application
        Browser[Client Storefront / Admin]
        Tracker[Analytics Tracker Queue<br/>client/src/utils/tracker.js]
        Beacon[navigator.sendBeacon<br/>on pagehide / visibilitychange]
        Browser -->|User actions| Tracker
        Tracker -->|Periodic Batch (4s)| API[POST /api/events]
        Tracker -->|Page Unload| Beacon
        Beacon --> API
    end

    subgraph Backend Core
        API --> Limiter[Rate Limiter<br/>1,200 req/15 min]
        Limiter --> Validator[Zod Validation<br/>Batched Schema]
        Validator --> Repo[Event Repository<br/>Multi-row INSERT]
        Repo --> EventsTable[(events Table)]
    end

    subgraph Database Layer
        EventsTable
        OrdersTable[(orders Table)]
        InvTable[(inventory Table)]
        ReturnsTable[(returns Table)]

        Views[[Analytics SQL Views<br/>Incremental Sync via updated_at]]
        EventsTable -.-> Views
        OrdersTable -.-> Views
        InvTable -.-> Views
        ReturnsTable -.-> Views

        RetentionJob[Retention Job<br/>Daily 3:00 AM]
        EventsTable -->|Occurred > 90d| EventsArchive[(events_archive)]
        OrdersTable -->|Closed & > 90d| OrdersArchive[(orders_archive)]
    end

    subgraph External Analytics System
        ExtBI[Data Warehouse / Metabase / BI Tool]
        ReadOnlyUser[analytics_readonly User]
        ReadOnlyUser -->|SELECT only| Views
        ExtBI --> ReadOnlyUser
    end
```

---

## 2. Event Ingestion Pipeline

### 2.1 Endpoint Specification: `POST /api/events`

The ingestion endpoint accepts single event payloads or batched arrays (up to 100 events per request) with built-in IP rate limiting and schema validation.

- **URL**: `/api/events`
- **Method**: `POST`
- **Headers**:
  - `Content-Type: application/json`
  - `x-session-id: <session_uuid>` (optional; extracted from cookies if omitted)
  - `User-Agent: <client_ua>` (used for device type auto-detection if omitted)
- **Rate Limit**: 1,200 requests per 15-minute window per IP (10,000 in test mode).
- **Authentication**: Optional (`optionalAuth` middleware). If authenticated, `user_id` is automatically attached.

#### Supported Event Types
1. `page_view`: Route transitions and landing pages.
2. `search`: Catalog queries, keyword filters, and suggestion triggers.
3. `product_view`: Product detail page views and modal previews.
4. `add_to_cart`: Items added to guest or authenticated carts.
5. `remove_from_cart`: Items removed from cart or cart drawer.
6. `begin_checkout`: Customer initiates step 1 of the checkout funnel.
7. `purchase`: Successfully verified Razorpay transaction.

#### Request Payload Examples

**Batch Array (Preferred):**
```json
[
  {
    "event_type": "product_view",
    "page_url": "https://shoppe.example.com/product/sennheiser-hd660s2",
    "device_type": "desktop",
    "properties": {
      "slug": "sennheiser-hd660s2",
      "price": 4999900
    }
  },
  {
    "event_type": "add_to_cart",
    "page_url": "https://shoppe.example.com/product/sennheiser-hd660s2",
    "device_type": "desktop",
    "properties": {
      "sku": "SENN-660-BLK",
      "quantity": 1,
      "price": 4999900
    }
  }
]
```

**Single Event Format:**
```json
{
  "event_type": "search",
  "properties": {
    "query": "planar magnetic",
    "results_count": 8
  }
}
```

---

## 3. Frontend Tracking Utility (`client/src/utils/tracker.js`)

A lightweight client-side utility coordinates event collection without blocking the main render thread.

### Key Capabilities
- **Queue & Batching**: Events are queued in memory and flushed every 4,000 ms or immediately when the batch threshold (10 events) is reached.
- **Unload Resilience (`navigator.sendBeacon`)**: Listens to `visibilitychange` (`hidden`), `pagehide`, and `beforeunload`. Unsent events are dispatched via `navigator.sendBeacon` with a fallback to `fetch(..., { keepalive: true })`.
- **Automatic Context Enrichment**: Automatically enriches every event with:
  - `session_id`: Persisted in `sessionStorage` or cookies.
  - `device_type`: Detected as `'mobile'`, `'tablet'`, or `'desktop'`.
  - `page_url`: Full current URL (`window.location.href`).
  - `occurred_at`: ISO timestamp string.
- **Automatic Route Tracking**: `<RouteTracker />` in [`App.jsx`](file:///c:/Users/DELL%205430/Desktop/Domo%20Learning/E-commerce/client/src/App.jsx) fires a `page_view` event on every router path change.

### API Reference
```javascript
import { tracker } from './utils/tracker.js';

tracker.pageView({ path: '/shop', title: 'Catalog' });
tracker.search('open back', { resultsCount: 12 });
tracker.productView(product);
tracker.addToCart(item);
tracker.removeFromCart(item);
tracker.beginCheckout(cart);
tracker.purchase(order);
```

---

## 4. SQL Views for Incremental Sync

Four dedicated database views aggregate core transactional data for analytics. Every view exposes a unified `updated_at` column so downstream extract-transform-load (ETL) or change-data-capture (CDC) pipelines can execute incremental sync queries:

```sql
SELECT * FROM <view_name> WHERE updated_at > :last_sync_timestamp;
```

### 4.1 `daily_sales`
Daily financial and order volume breakdown.

| Column | Type | Description |
|---|---|---|
| `sale_date` | `DATE` | Calendar date of order creation |
| `total_orders` | `BIGINT` | Total orders created on that date |
| `completed_orders` | `BIGINT` | Placed, packed, shipped, or delivered orders |
| `cancelled_orders` | `BIGINT` | Cancelled orders |
| `total_items_sold` | `BIGINT` | Sum of item quantities sold |
| `gross_sales_amount` | `BIGINT` | Sum of item subtotals (paise) |
| `total_discounts` | `BIGINT` | Sum of coupon discounts (paise) |
| `total_tax` | `BIGINT` | Sum of GST tax collections (paise) |
| `total_shipping` | `BIGINT` | Sum of shipping fees (paise) |
| `net_sales_amount` | `BIGINT` | Final net revenue received (paise) |
| `updated_at` | `TIMESTAMPTZ` | **Incremental sync watermarking timestamp** |

### 4.2 `order_funnel`
Aggregated customer behavioral funnel segmented by date and device.

| Column | Type | Description |
|---|---|---|
| `funnel_date` | `DATE` | Event timestamp date |
| `device_type` | `VARCHAR` | `'desktop'`, `'mobile'`, or `'tablet'` |
| `page_views` | `BIGINT` | Total page view count |
| `searches` | `BIGINT` | Total catalog search count |
| `product_views` | `BIGINT` | Product detail page views |
| `add_to_carts` | `BIGINT` | Items added to cart |
| `remove_from_carts` | `BIGINT` | Items removed from cart |
| `checkout_starts` | `BIGINT` | Checkout step 1 entries |
| `purchases` | `BIGINT` | Completed paid orders |
| `unique_sessions` | `BIGINT` | Distinct session count |
| `unique_users` | `BIGINT` | Distinct logged-in user count |
| `updated_at` | `TIMESTAMPTZ` | **Incremental sync watermarking timestamp** |

### 4.3 `inventory_snapshot`
Real-time SKU-level inventory status, reservation holds, and stock valuation.

| Column | Type | Description |
|---|---|---|
| `variant_id` | `UUID` | Variant primary key |
| `sku` | `VARCHAR` | SKU identifier (e.g. `SENN-660-BLK`) |
| `product_id` | `UUID` | Parent product primary key |
| `product_name` | `VARCHAR` | Product title |
| `brand` | `VARCHAR` | Brand name |
| `category_id` | `UUID` | Category primary key |
| `category_name` | `VARCHAR` | Category title |
| `size` | `VARCHAR` | Variant size specification |
| `color` | `VARCHAR` | Variant color finish |
| `price` | `BIGINT` | Retail price in paise |
| `mrp` | `BIGINT` | MRP in paise |
| `quantity_on_hand` | `INT` | Physical inventory on hand |
| `quantity_reserved` | `INT` | Active 15-minute checkout holds |
| `available_quantity`| `INT` | `quantity_on_hand - quantity_reserved` |
| `reorder_level` | `INT` | Safety stock threshold |
| `is_low_stock` | `BOOLEAN` | True when `available_quantity <= reorder_level` |
| `is_out_of_stock` | `BOOLEAN` | True when `available_quantity <= 0` |
| `inventory_valuation`| `BIGINT` | Value of on-hand inventory (`qty * price`) |
| `product_is_active` | `BOOLEAN` | Active publishing status |
| `updated_at` | `TIMESTAMPTZ` | **Incremental sync watermarking timestamp** |

### 4.4 `returns_summary`
Return Merchandise Authorization (RMA) statistics by date and resolution state.

| Column | Type | Description |
|---|---|---|
| `return_date` | `DATE` | Creation date of return claim |
| `status` | `VARCHAR` | `'requested'`, `'approved'`, `'rejected'`, or `'refunded'` |
| `total_requests` | `BIGINT` | Number of return requests |
| `total_refund_amount` | `BIGINT` | Total refunds authorized in paise |
| `distinct_products_returned`| `BIGINT` | Count of unique product titles returned |
| `updated_at` | `TIMESTAMPTZ` | **Incremental sync watermarking timestamp** |

---

## 5. Read-Only Analytics User

To ensure zero risk to operational transactional performance, a dedicated read-only role `analytics_readonly` is provisioned:

```sql
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'analytics_readonly') THEN
        CREATE ROLE analytics_readonly WITH LOGIN PASSWORD 'analytics_read_secret_2026';
    END IF;
END $$;

GRANT USAGE ON SCHEMA public TO analytics_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO analytics_readonly;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO analytics_readonly;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO analytics_readonly;
```

### Connection String for External Systems
```
postgresql://analytics_readonly:analytics_read_secret_2026@<db_host>:5432/ecommerce_db
```

---

## 6. Data Retention & Archival Job

Transactional databases should not retain high-volume raw event logs indefinitely. The automated retention worker archives historic records older than 90 days into dedicated `*_archive` tables.

### 6.1 Archive Tables
1. **`events_archive`**: Contains raw tracking events older than 90 days.
2. **`orders_archive`**: Contains closed orders (`delivered`, `cancelled`, `returned`) older than 90 days.
3. **`order_items_archive`**: Contains line items corresponding to archived orders.

All archive tables preserve the original UUID primary keys and add an `archived_at TIMESTAMPTZ` timestamp.

### 6.2 Configuration
The retention job is **disabled by default** to prevent unexpected automated deletions in staging/demo environments:

```env
# Server .env options
ENABLE_RETENTION_JOB=false   # Set to true in production
RETENTION_DAYS=90            # Archive records older than 90 days
```

### 6.3 Scheduling & Programmatic Execution
- **Cron**: When enabled, runs daily at 03:00 AM (`0 3 * * *`).
- **Programmatic Run**: Can be executed on-demand in scripts or maintenance jobs:
  ```javascript
  import { runRetentionArchival } from './jobs/retention.job.js';

  const result = await runRetentionArchival({ days: 90 });
  console.log(`Archived ${result.archivedEventsCount} events and ${result.archivedOrdersCount} closed orders.`);
  ```

---

## 7. Verification & Test Suite

The analytics readiness implementation is covered by automated integration tests in [`server/tests/analytics_events.test.js`](file:///c:/Users/DELL%205430/Desktop/Domo%20Learning/E-commerce/server/tests/analytics_events.test.js):
- Single event ingestion with device type and URL tracking.
- Batched event arrays (6 events in one round-trip).
- Rejection of invalid event types.
- Verification that all 4 SQL views return valid `updated_at` Date instances.
- End-to-end retention archival verification confirming transfer to `*_archive` tables and deletion from active tables.
