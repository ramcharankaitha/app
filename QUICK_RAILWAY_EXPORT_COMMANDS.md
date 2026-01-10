# ⚡ Quick Railway Export Commands

## 🎯 Fastest Method (Using Railway CLI)

### Step 1: Install Railway CLI
```bash
npm install -g @railway/cli
```

### Step 2: Login and Export
```bash
# Login
railway login

# Link to project
railway link

# Export database
pg_dump $(railway variables get DATABASE_URL) > backup.sql
```

**That's it!** Your backup is in `backup.sql`

---

## 🔧 Direct Connection Method

### Get Connection String from Railway

1. **Railway Dashboard → PostgreSQL → Variables**
2. **Copy these values:**
   - `PGHOST` = `centerbeam.proxy.rlwy.net`
   - `PGPORT` = `13307`
   - `PGDATABASE` = `railway`
   - `PGUSER` = `postgres`
   - `PGPASSWORD` = (your password)

3. **Build connection string:**
   ```
   postgresql://postgres:YOUR_PASSWORD@centerbeam.proxy.rlwy.net:13307/railway
   ```

### Export Commands

**Windows (PowerShell):**
```powershell
# Export complete database
pg_dump "postgresql://postgres:YOUR_PASSWORD@centerbeam.proxy.rlwy.net:13307/railway" > backup.sql

# Or use the script
.\export_railway_data.ps1 "postgresql://postgres:YOUR_PASSWORD@centerbeam.proxy.rlwy.net:13307/railway"
```

**Mac/Linux:**
```bash
# Export complete database
pg_dump "postgresql://postgres:YOUR_PASSWORD@centerbeam.proxy.rlwy.net:13307/railway" > backup.sql

# Or use the script
chmod +x export_railway_data.sh
./export_railway_data.sh "postgresql://postgres:YOUR_PASSWORD@centerbeam.proxy.rlwy.net:13307/railway"
```

---

## 📋 All Export Commands

### Complete Database Backup
```bash
pg_dump "connection-string" > complete_backup.sql
```

### Export Specific Tables
```bash
# Single table
pg_dump -t users "connection-string" > users.sql

# Multiple tables
pg_dump -t users -t products -t customers "connection-string" > selected_tables.sql
```

### Export Data Only (No Schema)
```bash
pg_dump --data-only "connection-string" > data_only.sql
```

### Export Schema Only (No Data)
```bash
pg_dump --schema-only "connection-string" > schema_only.sql
```

### Export with INSERT Statements
```bash
pg_dump --inserts "connection-string" > backup_with_inserts.sql
```

---

## 🔍 Verify Export

```bash
# Check file exists and has content
ls -lh backup.sql

# View first few lines
head -20 backup.sql

# Count records (approximate)
grep -c "INSERT INTO" backup.sql
```

---

## 📥 Import to New Database

```bash
psql "new-connection-string" < backup.sql
```

**Example:**
```bash
psql "postgresql://postgres:NEW_PASSWORD@centerbeam.proxy.rlwy.net:13307/railway" < backup.sql
```

---

## 🎯 One-Line Commands

**Export:**
```bash
pg_dump "postgresql://postgres:PASSWORD@HOST:PORT/DATABASE" > backup.sql
```

**Import:**
```bash
psql "postgresql://postgres:PASSWORD@HOST:PORT/DATABASE" < backup.sql
```

---

**Last Updated:** Quick reference for Railway export commands.

