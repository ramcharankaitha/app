# 🚀 Install PostgreSQL and Export Data - Step by Step

## ✅ Step 1: Install PostgreSQL Client (Using Chocolatey)

**Open PowerShell as Administrator** and run:

```powershell
choco install postgresql15
```

**Or if you want the latest version:**
```powershell
choco install postgresql
```

**Wait for installation to complete** (may take 2-5 minutes)

---

## ✅ Step 2: Restart PowerShell

**Important:** Close and reopen PowerShell after installation so PATH is updated.

**Or refresh PATH in current session:**
```powershell
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
```

---

## ✅ Step 3: Verify Installation

```powershell
pg_dump --version
psql --version
```

**Should show:**
```
pg_dump (PostgreSQL) 15.x
psql (PostgreSQL) 15.x
```

**If still not found:**
- Make sure you restarted PowerShell
- Or use full path: `C:\Program Files\PostgreSQL\15\bin\pg_dump.exe`

---

## ✅ Step 4: Get Railway Connection String

**Option A: From Railway Dashboard**
1. Go to Railway Dashboard → Your Project → PostgreSQL → Variables
2. Copy these values:
   - `PGHOST` = `centerbeam.proxy.rlwy.net`
   - `PGPORT` = `13307`
   - `PGDATABASE` = `railway`
   - `PGUSER` = `postgres`
   - `PGPASSWORD` = (your password)

**Option B: Using Railway CLI**
```powershell
# Install Railway CLI (if not installed)
npm install -g @railway/cli

# Login
railway login

# Link to project
railway link

# Get connection string
railway variables get DATABASE_URL
```

---

## ✅ Step 5: Export Database

### Method 1: Direct Export (If you have connection string)

```powershell
# Replace with your actual connection string
pg_dump "postgresql://postgres:YOUR_PASSWORD@centerbeam.proxy.rlwy.net:13307/railway" > backup.sql
```

### Method 2: Using Railway CLI

```powershell
# Get connection string and export in one command
pg_dump $(railway variables get DATABASE_URL) > backup.sql
```

### Method 3: Export Specific Tables

```powershell
# Export single table
pg_dump -t users "connection-string" > users.sql

# Export multiple tables
pg_dump -t users -t products -t customers "connection-string" > selected_tables.sql
```

---

## ✅ Step 6: Verify Export

```powershell
# Check file exists and size
Get-Item backup.sql | Select-Object Name, Length

# View first few lines
Get-Content backup.sql -Head 20

# Count INSERT statements (approximate record count)
(Select-String -Path backup.sql -Pattern "INSERT INTO").Count
```

---

## ✅ Step 7: Import to New Railway Database

**After you set up new Railway:**

```powershell
# Get new connection string from Railway
# Then import:
psql "postgresql://postgres:NEW_PASSWORD@centerbeam.proxy.rlwy.net:13307/railway" < backup.sql
```

---

## 🔍 Troubleshooting

### Issue: "pg_dump still not found"

**Solutions:**
1. **Restart PowerShell completely** (close and reopen)
2. **Check if installed:**
   ```powershell
   Test-Path "C:\Program Files\PostgreSQL\15\bin\pg_dump.exe"
   ```
3. **Use full path:**
   ```powershell
   & "C:\Program Files\PostgreSQL\15\bin\pg_dump.exe" "connection-string" > backup.sql
   ```
4. **Add to PATH manually:**
   ```powershell
   $env:Path += ";C:\Program Files\PostgreSQL\15\bin"
   ```

### Issue: "Connection refused"

**Check:**
- Connection string is correct
- Using external hostname (not `postgres.railway.internal`)
- Using correct port (13307 for public networking)
- Public networking is enabled in Railway

---

## 🎯 Complete Workflow

```powershell
# 1. Install PostgreSQL
choco install postgresql15

# 2. Restart PowerShell (important!)

# 3. Verify
pg_dump --version

# 4. Get connection string from Railway Variables
# Format: postgresql://postgres:PASSWORD@centerbeam.proxy.rlwy.net:13307/railway

# 5. Export
pg_dump "postgresql://postgres:YOUR_PASSWORD@centerbeam.proxy.rlwy.net:13307/railway" > backup.sql

# 6. Verify export
Get-Item backup.sql

# 7. Later, import to new database
psql "new-connection-string" < backup.sql
```

---

**Last Updated:** Step-by-step guide after Chocolatey installation.

