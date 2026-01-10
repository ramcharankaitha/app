# 📦 Export Data Without pg_dump (Alternative Methods)

## 🎯 If You Can't Install PostgreSQL Client

If you can't install `pg_dump`, here are alternative methods to export your data:

---

## ✅ Method 1: Use Railway CLI (No pg_dump Needed)

### Step 1: Install Railway CLI

```powershell
npm install -g @railway/cli
```

### Step 2: Login and Connect

```powershell
# Login
railway login

# Link to project
railway link

# Connect to PostgreSQL (this opens an interactive session)
railway connect postgres
```

### Step 3: Export from Railway Connection

**Once connected, you can:**

```bash
# Export complete database (pg_dump is available inside Railway connection)
pg_dump $DATABASE_URL > backup.sql

# Or export specific table
pg_dump -t users $DATABASE_URL > users.sql
```

**Note:** When you run `railway connect postgres`, it connects you to a shell where PostgreSQL tools are already available!

---

## ✅ Method 2: Use API Endpoint (From Your Application)

I've already added a complete backup endpoint to your code!

### Step 1: Deploy Updated Code

Make sure the updated `server/routes/export.js` is deployed to Render.

### Step 2: Export via API

**Via Browser:**
```
https://your-backend.onrender.com/api/export/complete-backup
```
Right-click → Save As → `complete_backup.json`

**Via PowerShell:**
```powershell
# Export all data
Invoke-WebRequest -Uri "https://your-backend.onrender.com/api/export/complete-backup" -OutFile "complete_backup.json"

# Or using curl (if available)
curl https://your-backend.onrender.com/api/export/complete-backup -o complete_backup.json
```

### Step 3: Convert JSON to SQL

```powershell
# Run the conversion script
node convert_json_to_sql.js complete_backup.json complete_backup.sql
```

### Step 4: Import to New Database

Once you have PostgreSQL installed, import:
```powershell
psql "new-connection-string" < complete_backup.sql
```

---

## ✅ Method 3: Use Railway Dashboard (Web Interface)

### Step 1: Access Railway Database Console

1. **Go to Railway Dashboard:**
   - Visit: https://railway.app
   - Login to your account
   - Go to your project → PostgreSQL service

2. **Open Database Console:**
   - Click **"Connect"** tab
   - Click **"psql"** or **"Database Console"** button
   - This opens a web-based SQL editor

### Step 2: Export Data via SQL

**Export each table to CSV:**

```sql
-- Export users
\copy users TO '/tmp/users.csv' CSV HEADER;

-- Export products
\copy products TO '/tmp/products.csv' CSV HEADER;

-- Export customers
\copy customers TO '/tmp/customers.csv' CSV HEADER;

-- Export services
\copy services TO '/tmp/services.csv' CSV HEADER;

-- ... repeat for all tables
```

**Or export complete database:**

```sql
-- This might not work in web console, but try:
\! pg_dump $DATABASE_URL > /tmp/backup.sql
```

---

## ✅ Method 4: Use Online PostgreSQL Tools

### Option A: DBeaver (Free GUI Tool)

1. **Download DBeaver:**
   - Visit: https://dbeaver.io/download/
   - Download and install

2. **Connect to Railway:**
   - Create new PostgreSQL connection
   - Use connection string from Railway Variables
   - Connect

3. **Export Data:**
   - Right-click database → Tools → Export Data
   - Select all tables
   - Choose SQL format
   - Export

### Option B: pgAdmin (PostgreSQL GUI)

1. **Download pgAdmin:**
   - Visit: https://www.pgadmin.org/download/
   - Install (includes PostgreSQL client tools)

2. **Connect and Export:**
   - Add new server with Railway connection details
   - Right-click database → Backup
   - Choose format and export

---

## ✅ Method 5: Use Node.js Script (No pg_dump)

I can create a Node.js script that uses the `pg` library (already in your project) to export data:

**Save as `export_with_node.js`:**

```javascript
const { Pool } = require('pg');
const fs = require('fs');

const connectionString = process.argv[2];

if (!connectionString) {
  console.error('Usage: node export_with_node.js "postgresql://..."');
  process.exit(1);
}

const pool = new Pool({ connectionString });

async function exportAllTables() {
  const tables = [
    'users', 'staff', 'products', 'customers', 'suppliers', 'stores',
    'services', 'stock_transactions', 'sales_records', 'purchase_orders',
    'payments', 'quotations', 'chit_plans', 'chit_customers', 'chit_entries',
    'admin_profile', 'role_permissions', 'dispatch', 'transport',
    'attendance', 'supervisor_attendance', 'notifications', 'categories'
  ];

  const backup = {
    exportDate: new Date().toISOString(),
    tables: {}
  };

  for (const table of tables) {
    try {
      const result = await pool.query(`SELECT * FROM ${table}`);
      backup.tables[table] = result.rows;
      console.log(`✅ ${table}: ${result.rows.length} records`);
    } catch (error) {
      console.log(`⚠️  ${table}: ${error.message}`);
      backup.tables[table] = [];
    }
  }

  fs.writeFileSync('backup.json', JSON.stringify(backup, null, 2));
  console.log('\n✅ Backup saved to backup.json');
  
  await pool.end();
}

exportAllTables().catch(console.error);
```

**Run it:**
```powershell
node export_with_node.js "postgresql://postgres:PASSWORD@centerbeam.proxy.rlwy.net:13307/railway"
```

---

## 🎯 Recommended: Install PostgreSQL Client

**The easiest solution is to install PostgreSQL client:**

```powershell
# Run PowerShell as Administrator
choco install postgresql15
```

**Then restart PowerShell and:**
```powershell
pg_dump "connection-string" > backup.sql
```

---

## 📋 Quick Comparison

| Method | Requires Installation | Ease of Use | Completeness |
|--------|----------------------|-------------|--------------|
| Railway CLI | ✅ npm only | ⭐⭐⭐⭐⭐ | ✅ Complete |
| API Endpoint | ❌ None | ⭐⭐⭐⭐ | ✅ Complete |
| Railway Dashboard | ❌ None | ⭐⭐⭐ | ⚠️ Manual |
| DBeaver/pgAdmin | ✅ GUI tool | ⭐⭐⭐⭐ | ✅ Complete |
| Node.js Script | ❌ None | ⭐⭐⭐ | ✅ Complete |
| Install pg_dump | ✅ PostgreSQL | ⭐⭐⭐⭐⭐ | ✅ Complete |

---

## 🚀 Fastest Solution Right Now

**Since you're on Windows and don't have pg_dump:**

1. **Use Railway CLI (easiest):**
   ```powershell
   npm install -g @railway/cli
   railway login
   railway link
   railway connect postgres
   # Then inside connection:
   pg_dump $DATABASE_URL > backup.sql
   ```

2. **Or use API endpoint:**
   ```powershell
   Invoke-WebRequest -Uri "https://your-backend.onrender.com/api/export/complete-backup" -OutFile "backup.json"
   ```

---

**Last Updated:** Alternative methods to export data without pg_dump.

