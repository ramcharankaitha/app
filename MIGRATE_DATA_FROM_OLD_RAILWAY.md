# 📦 Migrate Data from Old Railway Database

## 🎯 Goal

Export all data from your **old Railway database** (expired account) and import it into your **new Railway database**.

---

## ✅ Step 1: Access Old Railway Database

### Option A: If Old Railway Account Still Works

1. **Login to Old Railway Account:**
   - Go to: https://railway.app
   - Login with your **old account credentials**
   - Navigate to your old project

2. **Get Connection String:**
   - Click on PostgreSQL service
   - Go to **"Variables"** tab or **"Connect"** tab
   - Copy the connection string
   - **Note:** Even if expired, you might still have access for a few days

### Option B: If Old Railway Account is Completely Expired

**Unfortunately, if the account is completely expired and you can't access it:**
- Railway may have deleted the database
- You might need to contact Railway support
- Or use any backups you might have

**If you have access, continue to Step 2.**

---

## ✅ Step 2: Export Data from Old Database

### Method 1: Using Railway Dashboard (Easiest)

1. **Go to Old Railway Project:**
   - Railway Dashboard → Your Old Project → PostgreSQL

2. **Open Database Console:**
   - Click **"Connect"** tab
   - Look for **"psql"** or **"Database Console"** button
   - Click to open SQL editor

3. **Export All Data:**
   - Run this command in the console:
   ```sql
   -- Export all tables data
   \copy (SELECT * FROM users) TO '/tmp/users.csv' CSV HEADER;
   \copy (SELECT * FROM staff) TO '/tmp/staff.csv' CSV HEADER;
   \copy (SELECT * FROM products) TO '/tmp/products.csv' CSV HEADER;
   \copy (SELECT * FROM customers) TO '/tmp/customers.csv' CSV HEADER;
   \copy (SELECT * FROM suppliers) TO '/tmp/suppliers.csv' CSV HEADER;
   \copy (SELECT * FROM stores) TO '/tmp/stores.csv' CSV HEADER;
   \copy (SELECT * FROM services) TO '/tmp/services.csv' CSV HEADER;
   \copy (SELECT * FROM stock_transactions) TO '/tmp/stock_transactions.csv' CSV HEADER;
   \copy (SELECT * FROM sales_orders) TO '/tmp/sales_orders.csv' CSV HEADER;
   \copy (SELECT * FROM purchase_orders) TO '/tmp/purchase_orders.csv' CSV HEADER;
   \copy (SELECT * FROM payments) TO '/tmp/payments.csv' CSV HEADER;
   \copy (SELECT * FROM quotations) TO '/tmp/quotations.csv' CSV HEADER;
   \copy (SELECT * FROM chit_plans) TO '/tmp/chit_plans.csv' CSV HEADER;
   \copy (SELECT * FROM chit_customers) TO '/tmp/chit_customers.csv' CSV HEADER;
   \copy (SELECT * FROM chit_entries) TO '/tmp/chit_entries.csv' CSV HEADER;
   \copy (SELECT * FROM admin_profile) TO '/tmp/admin_profile.csv' CSV HEADER;
   \copy (SELECT * FROM role_permissions) TO '/tmp/role_permissions.csv' CSV HEADER;
   ```

### Method 2: Using pg_dump (Recommended - Complete Backup)

**If you have access to the old connection string:**

1. **Install PostgreSQL Client (if not installed):**
   ```bash
   # Windows (using Chocolatey)
   choco install postgresql
   
   # Mac
   brew install postgresql
   
   # Linux
   sudo apt-get install postgresql-client
   ```

2. **Export Complete Database:**
   ```bash
   pg_dump "postgresql://user:password@old-host.railway.app:port/database" > backup.sql
   ```

   **Replace with your old connection string:**
   ```bash
   pg_dump "postgresql://postgres:OLD_PASSWORD@old-host.railway.app:5432/railway" > old_database_backup.sql
   ```

3. **This creates a complete backup file** with all tables, data, and structure

### Method 3: Using Railway CLI

1. **Install Railway CLI:**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login:**
   ```bash
   railway login
   ```

3. **Connect to old project:**
   ```bash
   railway link
   # Select your old project
   ```

4. **Export database:**
   ```bash
   railway connect postgres
   pg_dump $DATABASE_URL > backup.sql
   ```

---

## ✅ Step 3: Import Data to New Railway Database

### Method 1: Using pg_restore (From pg_dump)

1. **Get New Railway Connection String:**
   - Go to **New Railway** → PostgreSQL → Variables
   - Build connection string:
     ```
     postgresql://postgres:NEW_PASSWORD@centerbeam.proxy.rlwy.net:13307/railway
     ```

2. **Import Complete Backup:**
   ```bash
   psql "postgresql://postgres:NEW_PASSWORD@centerbeam.proxy.rlwy.net:13307/railway" < old_database_backup.sql
   ```

   **Or using pg_restore:**
   ```bash
   pg_restore -d "postgresql://postgres:NEW_PASSWORD@centerbeam.proxy.rlwy.net:13307/railway" old_database_backup.sql
   ```

### Method 2: Using Railway Dashboard

1. **Go to New Railway Project:**
   - Railway Dashboard → Your New Project → PostgreSQL

2. **Open Database Console:**
   - Click **"Connect"** tab
   - Click **"psql"** or **"Database Console"**

3. **Import Data:**
   - If you exported to CSV files, you can import them:
   ```sql
   -- Import CSV files (if you have them)
   \copy users FROM '/tmp/users.csv' CSV HEADER;
   \copy staff FROM '/tmp/staff.csv' CSV HEADER;
   \copy products FROM '/tmp/products.csv' CSV HEADER;
   -- ... repeat for all tables
   ```

### Method 3: Import Specific Tables Only

**If you only want specific data:**

1. **Export specific table:**
   ```bash
   pg_dump -t users "old-connection-string" > users_backup.sql
   pg_dump -t products "old-connection-string" > products_backup.sql
   ```

2. **Import specific table:**
   ```bash
   psql "new-connection-string" < users_backup.sql
   psql "new-connection-string" < products_backup.sql
   ```

---

## ✅ Step 4: Verify Data Migration

### 4.1 Check Tables in New Database

1. **Connect to New Railway Database:**
   - Railway Dashboard → New Project → PostgreSQL → Connect

2. **Check if data exists:**
   ```sql
   -- Count records in each table
   SELECT 'users' as table_name, COUNT(*) as count FROM users
   UNION ALL
   SELECT 'staff', COUNT(*) FROM staff
   UNION ALL
   SELECT 'products', COUNT(*) FROM products
   UNION ALL
   SELECT 'customers', COUNT(*) FROM customers
   UNION ALL
   SELECT 'services', COUNT(*) FROM services
   UNION ALL
   SELECT 'stock_transactions', COUNT(*) FROM stock_transactions;
   ```

### 4.2 Test Application

1. **Go to your website**
2. **Login with old credentials:**
   - Email: `admin@anithastores.com`
   - Password: (your old password, or `admin123` if reset)

3. **Check if data appears:**
   - Products
   - Customers
   - Services
   - Staff
   - All other data

---

## 🔧 Troubleshooting

### Issue: "Cannot connect to old database"

**Solutions:**
1. **Check if old Railway account still works:**
   - Try logging in
   - Check if project still exists

2. **Contact Railway Support:**
   - They might be able to help recover data
   - Email: support@railway.app

3. **Check for backups:**
   - Do you have any local backups?
   - Check your computer for `.sql` files
   - Check if you exported data before

### Issue: "Foreign key constraint errors" during import

**Problem:** Tables imported in wrong order

**Solution:**
1. **Import in correct order:**
   - Base tables first (users, staff, stores, products)
   - Then dependent tables (customers, services, orders)

2. **Or disable constraints temporarily:**
   ```sql
   -- Disable foreign key checks
   SET session_replication_role = 'replica';
   
   -- Import data
   \i backup.sql
   
   -- Re-enable foreign key checks
   SET session_replication_role = 'origin';
   ```

### Issue: "Table already exists" errors

**Problem:** New database already has tables from initialization

**Solution:**
1. **Option 1: Drop and recreate (WARNING: Deletes new data)**
   ```sql
   DROP TABLE IF EXISTS users CASCADE;
   DROP TABLE IF EXISTS staff CASCADE;
   -- ... repeat for all tables
   ```
   Then import backup

2. **Option 2: Import only data (safer)**
   ```bash
   pg_restore --data-only -d "new-connection-string" backup.sql
   ```

### Issue: "Connection timeout" when connecting to old database

**Problem:** Old database might be paused or deleted

**Solutions:**
1. **Check old Railway account:**
   - Is database still active?
   - Is it paused? Try to resume

2. **Use Railway CLI:**
   - Sometimes CLI works when dashboard doesn't

3. **Contact Railway Support:**
   - They might help recover data

---

## 📋 Complete Migration Checklist

### Before Migration:
- [ ] Old Railway account accessible
- [ ] Old database connection string obtained
- [ ] Backup file created (`backup.sql`)
- [ ] Backup file verified (check file size > 0)

### During Migration:
- [ ] New Railway database created
- [ ] New database connection string obtained
- [ ] Backup imported to new database
- [ ] No errors during import

### After Migration:
- [ ] Data verified in new database (record counts match)
- [ ] Application tested (can login)
- [ ] All data visible in application
- [ ] No missing records
- [ ] Foreign keys working correctly

---

## 🎯 Quick Migration Commands

### Complete Backup & Restore:

**Export from old:**
```bash
pg_dump "postgresql://postgres:OLD_PASS@old-host.railway.app:5432/railway" > backup.sql
```

**Import to new:**
```bash
psql "postgresql://postgres:NEW_PASS@centerbeam.proxy.rlwy.net:13307/railway" < backup.sql
```

### Export Specific Tables:
```bash
pg_dump -t users -t products -t customers "old-connection" > specific_tables.sql
```

### Import with Error Handling:
```bash
psql "new-connection" < backup.sql 2>&1 | tee import_log.txt
```

---

## ⚠️ Important Notes

1. **Backup First:**
   - Always backup new database before importing
   - In case something goes wrong

2. **Test Import:**
   - Import to a test database first if possible
   - Verify data before importing to production

3. **Preserve IDs:**
   - If you need to preserve record IDs, use `pg_dump` with `--inserts` flag
   - Otherwise, new IDs will be generated

4. **Timing:**
   - Large databases may take time to import
   - Be patient, don't interrupt the process

---

## 🚨 If Old Database is Completely Inaccessible

**If you cannot access the old Railway database:**

1. **Check for Local Backups:**
   - Search your computer for `.sql` files
   - Check if you exported data before

2. **Check Application Logs:**
   - Render logs might have some data
   - But this won't have complete database

3. **Contact Railway Support:**
   - Email: support@railway.app
   - Explain your situation
   - They might be able to help

4. **Start Fresh:**
   - If data cannot be recovered
   - New database will initialize with default data
   - You'll need to re-enter data manually

---

## ✅ Success Indicators

After successful migration:

1. **Database:**
   - Record counts match old database
   - All tables have data
   - Foreign keys work correctly

2. **Application:**
   - Can login with old credentials
   - All products visible
   - All customers visible
   - All services visible
   - Everything works as before

---

## 📞 Need Help?

**If you're stuck:**

1. **Check Railway Support:**
   - https://railway.app/docs
   - support@railway.app

2. **PostgreSQL Documentation:**
   - https://www.postgresql.org/docs/

3. **Common Issues:**
   - See Troubleshooting section above

---

**Last Updated:** Complete guide for migrating data from old Railway to new Railway database.

