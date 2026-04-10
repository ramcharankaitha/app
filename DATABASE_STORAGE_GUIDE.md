# Anitha Stores – Database Storage Analysis

> **Database:** PostgreSQL | **Application:** Anitha Stores ERP  
> **Analysis based on:** Full codebase and schema review (March 2026)

---

## How to Check Your ACTUAL Current Usage

Run these 3 queries in **pgAdmin** (connect to your database → Query Tool → paste and run):

```sql
-- 1. Total database size
SELECT pg_size_pretty(pg_database_size(current_database())) AS "Total DB Size";

-- 2. Size of every table (largest first)
SELECT
  relname                                               AS "Table",
  pg_size_pretty(pg_total_relation_size(relid))         AS "Size",
  to_char(n_live_tup, 'FM999,999,999')                  AS "Rows"
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC;

-- 3. How much space face photos are using
SELECT
  'Staff face photos'                                                        AS "Type",
  COUNT(*)                                                                   AS "Records",
  ROUND(SUM(COALESCE(LENGTH(check_in_image),0) + COALESCE(LENGTH(check_out_image),0)) / 1024.0 / 1024.0, 1) AS "MB Used"
FROM attendance
UNION ALL
SELECT
  'Supervisor face photos',
  COUNT(*),
  ROUND(SUM(COALESCE(LENGTH(check_in_image),0) + COALESCE(LENGTH(check_out_image),0)) / 1024.0 / 1024.0, 1)
FROM supervisor_attendance;
```

---

## What Each Table Stores and Why It Uses Space

### GROUP 1 — Face Photos (biggest storage by far)

| Table | What is stored inside | Size per record |
|---|---|---|
| `attendance` | Staff check-in photo + check-out photo (base64 face images stored as text) | **150 – 500 KB** |
| `supervisor_attendance` | Supervisor check-in photo + check-out photo (same) | **150 – 500 KB** |

> These two tables will hold **most of your total storage**. Every working day, each staff member adds 1 record with 2 photos. With 20 staff over 1 year (300 days): **~1.8 – 3 GB just from face photos**.

---

### GROUP 2 — Transaction Data (grows every day)

| Table | What is stored inside | Size per record |
|---|---|---|
| `stock_transactions` | Every stock-in and stock-out movement (item code, quantity, who did it, date) | ~1 KB |
| `notifications` | Every alert: late check-in, early logout, low stock, payment due | ~0.5 KB |
| `sales_records` | Each sales order + full list of products sold (stored as JSON) | ~3 – 8 KB |
| `purchase_orders` | Each purchase order + full list of items ordered (stored as JSON) | ~2 – 5 KB |
| `quotations` | Each quotation + list of quoted items (stored as JSON) | ~2 – 5 KB |
| `payments` | Payment records with supplier and amount details | ~1 KB |
| `dispatch` | Each dispatch/delivery entry with address and transport info | ~1 KB |
| `services` | Service/repair job records (customer, product, handler) | ~1 KB |

---

### GROUP 3 — Master Data (filled once, rarely changes)

| Table | What is stored inside | Size per record |
|---|---|---|
| `products` | Product name, item code, MRP, sell rate, category, supplier | ~1.5 KB |
| `customers` | Customer name, phone, address, purchase info, loyalty tokens | ~1 KB |
| `chit_customers` | Chit scheme customer details | ~1 KB |
| `staff` | Staff name, login, store, face recognition model data | ~1 – 50 KB |
| `users` | Supervisor name, login, face recognition model data | ~1 – 50 KB |
| `suppliers` | Supplier name, contact, address | ~0.8 KB |
| `transport` | Transport partner details and routes | ~1 KB |
| `categories` | Product categories (main / sub / common) | ~0.5 KB |
| `chit_plans` | Chit plan names and amounts | ~0.3 KB |
| `stores` | Store names, addresses, contact | ~0.5 KB |
| `admin_profile` | Admin account (1 record only) | ~1 KB |
| `customer_tokens` | Customer loyalty point balances | ~0.5 KB |
| `role_permissions` | Staff/supervisor permission settings | ~2 KB |

---

## Storage Used — By Category

| Category | Tables | Typical % of total storage |
|---|---|---|
| **Face attendance photos** | `attendance`, `supervisor_attendance` | **80 – 95%** |
| **Transaction records** | `stock_transactions`, `sales_records`, `purchase_orders`, `quotations`, `payments`, `dispatch`, `services` | **4 – 15%** |
| **Notifications** | `notifications` | **1 – 3%** |
| **Master / reference data** | `products`, `customers`, `staff`, `suppliers`, etc. | **1 – 3%** |

---

## Storage by Number of Staff and Time

| Staff count | After 6 months | After 1 year | After 2 years |
|---|---|---|---|
| 5 staff | ~150 MB | ~300 MB | ~600 MB |
| 10 staff | ~300 MB | ~600 MB | ~1.2 GB |
| 20 staff | ~600 MB | ~1.2 GB | ~2.4 GB |
| 30 staff | ~900 MB | ~1.8 GB | ~3.6 GB |
| 50 staff | ~1.5 GB | ~3 GB | ~6 GB |
| 100 staff | ~3 GB | ~6 GB | ~12 GB |

> Assumes 300 working days/year, 1 check-in + 1 check-out photo per day, avg 200 KB per photo.  
> Transaction data (stock, sales, etc.) adds approximately **100–300 MB per year** on top.

---

## What to Do When Storage Gets Full

**Option 1 — Delete old notifications** (safe, notifications are read-only alerts)
```sql
DELETE FROM notifications WHERE created_at < NOW() - INTERVAL '90 days';
```

**Option 2 — Remove face photos from old attendance** (keep the record, just remove the image)
```sql
UPDATE attendance SET check_in_image = NULL, check_out_image = NULL
WHERE attendance_date < CURRENT_DATE - INTERVAL '6 months';
```

**Option 3 — Archive old stock transactions** (export to CSV then delete)
```sql
-- First export via the Reports → Stock In Report page, then:
DELETE FROM stock_transactions WHERE created_at < NOW() - INTERVAL '1 year';
```

---

*Analysis based on full schema and source code review of Anitha Stores ERP application.*
