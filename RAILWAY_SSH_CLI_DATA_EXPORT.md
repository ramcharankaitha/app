# 🔧 Export Data from Railway Using CLI/SSH Commands

## 🎯 Overview

Railway doesn't provide direct SSH access, but you can use:
1. **Railway CLI** - Connect to your Railway services
2. **psql** - PostgreSQL command-line tool
3. **pg_dump** - Export database directly

---

## ✅ Method 1: Using Railway CLI (Recommended)

### Step 1: Install Railway CLI

**Windows (PowerShell):**
```powershell
# Using npm (if you have Node.js)
npm install -g @railway/cli

# Or using Scoop
scoop install railway
```

**Mac:**
```bash
brew install railway
```

**Linux:**
```bash
# Using npm
npm install -g @railway/cli

# Or using curl
curl -fsSL https://railway.app/install.sh | sh
```

### Step 2: Login to Railway

```bash
railway login
```

This will open your browser to authenticate.

### Step 3: Link to Your Project

```bash
# List your projects
railway list

# Link to specific project
railway link

# Or link by project ID
railway link <project-id>
```

### Step 4: Connect to PostgreSQL and Export

**Option A: Export via Railway CLI (Easiest)**

```bash
# Connect to PostgreSQL service
railway connect postgres

# Once connected, export database
pg_dump $DATABASE_URL > backup.sql

# Or export specific table
pg_dump -t users $DATABASE_URL > users_backup.sql
```

**Option B: Get Connection String and Use pg_dump**

```bash
# Get database connection string
railway variables

# Or get specific variable
railway variables get DATABASE_URL

# Export using connection string
pg_dump $(railway variables get DATABASE_URL) > backup.sql
```

---

## ✅ Method 2: Direct psql Connection (If You Have Connection String)

### Step 1: Get Connection String from Railway

**Via Railway Dashboard:**
1. Go to Railway Dashboard → Your Project → PostgreSQL
2. Go to **"Variables"** tab
3. Copy `DATABASE_URL` or build from:
   - `PGHOST`
   - `PGPORT`
   - `PGDATABASE`
   - `PGUSER`
   - `PGPASSWORD`

**Via Railway CLI:**
```bash
railway variables get DATABASE_URL
```

### Step 2: Export Complete Database

```bash
# Export entire database
pg_dump "postgresql://postgres:password@host:port/database" > complete_backup.sql

# Example with your connection string
pg_dump "postgresql://postgres:YOUR_PASSWORD@centerbeam.proxy.rlwy.net:13307/railway" > complete_backup.sql
```

### Step 3: Export Specific Tables

```bash
# Export single table
pg_dump -t users "connection-string" > users_backup.sql

# Export multiple tables
pg_dump -t users -t products -t customers "connection-string" > selected_tables.sql

# Export all tables (one file per table)
for table in users staff products customers services; do
  pg_dump -t $table "connection-string" > ${table}_backup.sql
done
```

### Step 4: Export as CSV (Alternative)

```bash
# Connect to database
psql "connection-string"

# Then run SQL commands:
\copy users TO 'users.csv' CSV HEADER;
\copy products TO 'products.csv' CSV HEADER;
\copy customers TO 'customers.csv' CSV HEADER;
\copy services TO 'services.csv' CSV HEADER;
# ... repeat for all tables

# Exit psql
\q
```

---

## ✅ Method 3: Using Railway Shell (If Available)

### Step 1: Access Railway Shell

```bash
# Open shell in Railway project
railway shell

# Or connect to specific service
railway shell postgres
```

### Step 2: Export from Shell

```bash
# Once in shell, export database
pg_dump $DATABASE_URL > /tmp/backup.sql

# Or connect to psql
psql $DATABASE_URL

# Then export tables
\copy users TO '/tmp/users.csv' CSV HEADER;
\copy products TO '/tmp/products.csv' CSV HEADER;
# ... etc
```

---

## 📋 Complete Export Script

### Export All Tables Script

**Save as `export_railway_data.sh`:**

```bash
#!/bin/bash

# Railway Database Export Script
# Usage: ./export_railway_data.sh "postgresql://user:pass@host:port/database"

CONNECTION_STRING="$1"

if [ -z "$CONNECTION_STRING" ]; then
    echo "❌ Error: Please provide connection string"
    echo "Usage: ./export_railway_data.sh \"postgresql://user:pass@host:port/database\""
    exit 1
fi

echo "📦 Starting Railway database export..."
echo ""

# List of all tables
TABLES=(
    "users"
    "staff"
    "products"
    "customers"
    "suppliers"
    "stores"
    "services"
    "stock_transactions"
    "sales_records"
    "purchase_orders"
    "payments"
    "quotations"
    "chit_plans"
    "chit_customers"
    "chit_entries"
    "admin_profile"
    "role_permissions"
    "dispatch"
    "transport"
    "attendance"
    "supervisor_attendance"
    "notifications"
    "categories"
)

# Create backup directory
BACKUP_DIR="railway_backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "📁 Creating backup directory: $BACKUP_DIR"
echo ""

# Export each table
for TABLE in "${TABLES[@]}"; do
    echo "📤 Exporting $TABLE..."
    pg_dump -t "$TABLE" "$CONNECTION_STRING" > "$BACKUP_DIR/${TABLE}.sql" 2>/dev/null
    
    if [ $? -eq 0 ] && [ -s "$BACKUP_DIR/${TABLE}.sql" ]; then
        RECORD_COUNT=$(grep -c "INSERT INTO" "$BACKUP_DIR/${TABLE}.sql" 2>/dev/null || echo "0")
        echo "   ✅ $TABLE: $RECORD_COUNT records"
    else
        echo "   ⚠️  $TABLE: Table might not exist or is empty"
        rm -f "$BACKUP_DIR/${TABLE}.sql"
    fi
done

# Create complete backup
echo ""
echo "📦 Creating complete database backup..."
pg_dump "$CONNECTION_STRING" > "$BACKUP_DIR/complete_backup.sql"

if [ $? -eq 0 ]; then
    echo "✅ Complete backup created: $BACKUP_DIR/complete_backup.sql"
else
    echo "❌ Error creating complete backup"
fi

# Create summary
echo ""
echo "📊 Backup Summary:"
echo "=================="
ls -lh "$BACKUP_DIR"/*.sql 2>/dev/null | awk '{print $9, $5}'
echo ""
echo "✅ Export completed!"
echo "📁 Backup location: $BACKUP_DIR/"
```

**Make it executable:**
```bash
chmod +x export_railway_data.sh
```

**Run it:**
```bash
./export_railway_data.sh "postgresql://postgres:password@host:port/database"
```

---

## 🔧 Railway CLI Commands Reference

### Basic Commands

```bash
# Login
railway login

# List projects
railway list

# Link to project
railway link

# View variables
railway variables

# Get specific variable
railway variables get DATABASE_URL

# Connect to service
railway connect postgres

# Open shell
railway shell

# View logs
railway logs
```

### Database-Specific Commands

```bash
# Connect to PostgreSQL
railway connect postgres

# Get database URL
railway variables get DATABASE_URL

# Run SQL command
railway run psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"

# Export via Railway
railway run pg_dump $DATABASE_URL > backup.sql
```

---

## 📋 Step-by-Step: Export from Railway

### Quick Method (Using Railway CLI)

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Link to project
railway link

# 4. Get connection string
railway variables get DATABASE_URL

# 5. Export database
pg_dump $(railway variables get DATABASE_URL) > backup.sql
```

### Alternative Method (Direct Connection)

```bash
# 1. Get connection string from Railway Dashboard
# Format: postgresql://postgres:password@host:port/database

# 2. Export database
pg_dump "postgresql://postgres:YOUR_PASSWORD@centerbeam.proxy.rlwy.net:13307/railway" > backup.sql

# 3. Verify export
ls -lh backup.sql
```

---

## 🎯 Export Specific Data

### Export Only Data (No Schema)

```bash
pg_dump --data-only "connection-string" > data_only_backup.sql
```

### Export Only Schema (No Data)

```bash
pg_dump --schema-only "connection-string" > schema_only_backup.sql
```

### Export with INSERT Statements (Preserve IDs)

```bash
pg_dump --inserts "connection-string" > backup_with_inserts.sql
```

### Export Specific Schema

```bash
pg_dump -n public "connection-string" > backup.sql
```

---

## 📊 Verify Export

### Check Backup File

```bash
# Check file size (should be > 0)
ls -lh backup.sql

# Check file contents
head -20 backup.sql

# Count INSERT statements (approximate record count)
grep -c "INSERT INTO" backup.sql
```

### Test Import (Dry Run)

```bash
# Test if SQL file is valid
psql "new-connection-string" -f backup.sql --dry-run 2>&1 | head -20
```

---

## 🔍 Troubleshooting

### Issue: "railway: command not found"

**Solution:**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Or using other methods (see Step 1 above)
```

### Issue: "pg_dump: command not found"

**Solution:**
```bash
# Windows
choco install postgresql

# Mac
brew install postgresql

# Linux
sudo apt-get install postgresql-client
```

### Issue: "Connection refused"

**Solutions:**
1. **Check connection string:**
   - Use external/public hostname
   - Use correct port (13307 for public networking)

2. **Verify public networking is enabled:**
   - Railway Dashboard → PostgreSQL → Settings
   - Enable "Public Networking"

3. **Check database is active:**
   - Railway Dashboard → PostgreSQL
   - Status should be "Active"

### Issue: "Authentication failed"

**Solutions:**
1. **Get fresh password:**
   - Railway Dashboard → PostgreSQL → Variables
   - Copy `PGPASSWORD` again

2. **Check password:**
   - No extra spaces
   - Case-sensitive
   - Copy exactly as shown

---

## ✅ Complete Example

**Full workflow:**

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Link to project
railway link
# Select your project from list

# 4. Get connection string
CONNECTION_STRING=$(railway variables get DATABASE_URL)
echo "Connection: $CONNECTION_STRING"

# 5. Export complete database
pg_dump "$CONNECTION_STRING" > railway_backup_$(date +%Y%m%d).sql

# 6. Verify
ls -lh railway_backup_*.sql
echo "✅ Backup created successfully!"

# 7. (Optional) Export individual tables
for table in users products customers services; do
    pg_dump -t "$table" "$CONNECTION_STRING" > "${table}_backup.sql"
done
```

---

## 🎯 Quick Reference

### Railway CLI Commands:
```bash
railway login              # Login to Railway
railway list               # List projects
railway link               # Link to project
railway variables          # View all variables
railway variables get DATABASE_URL  # Get connection string
railway connect postgres   # Connect to PostgreSQL
railway shell              # Open shell
```

### pg_dump Commands:
```bash
pg_dump "connection" > backup.sql                    # Complete backup
pg_dump -t table "connection" > table.sql            # Single table
pg_dump --data-only "connection" > data.sql         # Data only
pg_dump --schema-only "connection" > schema.sql     # Schema only
pg_dump --inserts "connection" > backup.sql         # With INSERTs
```

### psql Commands:
```bash
psql "connection"                                    # Connect
\copy table TO 'file.csv' CSV HEADER;               # Export CSV
\dt                                                   # List tables
\d table_name                                        # Describe table
\q                                                    # Quit
```

---

## 📝 Example: Export All Tables to Individual Files

```bash
#!/bin/bash

CONNECTION="postgresql://postgres:password@host:port/database"

# Get list of tables
TABLES=$(psql "$CONNECTION" -t -c "SELECT tablename FROM pg_tables WHERE schemaname='public';")

# Export each table
for table in $TABLES; do
    echo "Exporting $table..."
    pg_dump -t "$table" "$CONNECTION" > "${table}.sql"
done

echo "✅ All tables exported!"
```

---

**Last Updated:** Railway CLI and SSH command guide for data export.

