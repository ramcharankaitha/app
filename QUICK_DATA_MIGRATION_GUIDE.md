# ⚡ Quick Data Migration Guide

## 🎯 Fastest Way to Migrate Your Data

### Step 1: Export from Old Railway (5 minutes)

**Option A: Using pg_dump (Recommended)**

1. **Install PostgreSQL Client** (if not installed):
   ```bash
   # Windows (PowerShell as Admin)
   choco install postgresql
   
   # Mac
   brew install postgresql
   
   # Linux
   sudo apt-get install postgresql-client
   ```

2. **Get Old Connection String:**
   - Go to Old Railway → PostgreSQL → Variables
   - Build connection string:
     ```
     postgresql://postgres:OLD_PASSWORD@old-host.railway.app:5432/railway
     ```

3. **Export Complete Database:**
   ```bash
   pg_dump "postgresql://postgres:OLD_PASSWORD@old-host.railway.app:5432/railway" > old_data_backup.sql
   ```

   **Replace with your actual old connection string!**

### Step 2: Import to New Railway (5 minutes)

1. **Get New Connection String:**
   - Go to New Railway → PostgreSQL → Variables
   - Build connection string:
     ```
     postgresql://postgres:NEW_PASSWORD@centerbeam.proxy.rlwy.net:13307/railway
     ```

2. **Import Data:**
   ```bash
   psql "postgresql://postgres:NEW_PASSWORD@centerbeam.proxy.rlwy.net:13307/railway" < old_data_backup.sql
   ```

   **Replace with your actual new connection string!**

### Step 3: Verify (2 minutes)

1. **Check if data imported:**
   ```bash
   psql "new-connection-string" -c "SELECT COUNT(*) FROM users; SELECT COUNT(*) FROM products; SELECT COUNT(*) FROM customers;"
   ```

2. **Test your application:**
   - Login to your website
   - Check if all data is visible

---

## 📋 All Tables That Will Be Migrated

Your data includes these tables:
- ✅ `users` - Supervisor accounts
- ✅ `staff` - Staff members
- ✅ `products` - Product catalog
- ✅ `customers` - Customer records
- ✅ `suppliers` - Supplier information
- ✅ `stores` - Store locations
- ✅ `services` - Service records
- ✅ `stock_transactions` - Stock movements
- ✅ `sales_orders` - Sales orders
- ✅ `purchase_orders` - Purchase orders
- ✅ `payments` - Payment records
- ✅ `quotations` - Quotations
- ✅ `chit_plans` - Chit plans
- ✅ `chit_customers` - Chit customers
- ✅ `chit_entries` - Chit entries
- ✅ `admin_profile` - Admin profiles
- ✅ `role_permissions` - Role permissions
- ✅ `dispatch` - Dispatch records
- ✅ `transport` - Transport records
- ✅ `attendance` - Attendance records
- ✅ `notifications` - Notifications
- ✅ `categories` - Product categories
- ✅ `sales_records` - Sales records

---

## 🚨 Important Notes

1. **Old Railway Access:**
   - You need access to old Railway account
   - If expired, you might still have access for a few days
   - Contact Railway support if completely locked out

2. **Connection Strings:**
   - Old: Uses internal hostname (might still work)
   - New: Must use external/public hostname

3. **Data Preservation:**
   - IDs will be preserved if using `pg_dump`
   - All relationships (foreign keys) will be maintained
   - All data including dates, amounts, etc. will be preserved

4. **Timing:**
   - Small databases: 1-2 minutes
   - Large databases: 5-10 minutes
   - Very large: 15-30 minutes

---

## ⚠️ If Old Railway is Completely Inaccessible

**If you cannot access old Railway:**

1. **Check for Local Backups:**
   - Search your computer for `.sql` files
   - Check Downloads folder
   - Check any backup folders

2. **Contact Railway Support:**
   - Email: support@railway.app
   - Explain you need to recover data from expired account
   - They might be able to help

3. **Check Render Logs:**
   - Some data might be in application logs
   - But this won't be complete database

4. **Start Fresh:**
   - If data cannot be recovered
   - New database will have default data
   - You'll need to re-enter data manually

---

## ✅ Success Checklist

After migration:
- [ ] Backup file created (`old_data_backup.sql`)
- [ ] Data imported to new database
- [ ] Record counts match (check a few tables)
- [ ] Can login to application
- [ ] All products visible
- [ ] All customers visible
- [ ] All services visible
- [ ] Everything works as before

---

## 🎯 One-Line Commands

**Export:**
```bash
pg_dump "old-connection-string" > backup.sql
```

**Import:**
```bash
psql "new-connection-string" < backup.sql
```

**That's it!** These two commands will migrate all your data.

---

**Last Updated:** Quick data migration guide.

