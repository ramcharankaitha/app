# 🔧 Install PostgreSQL Client Tools on Windows

## ❌ Error You're Seeing

```
pg_dump : The term 'pg_dump' is not recognized
```

This means PostgreSQL client tools are not installed on your Windows system.

---

## ✅ Solution: Install PostgreSQL Client

### Method 1: Using Chocolatey (Easiest - Recommended)

**Step 1: Install Chocolatey (if not installed)**

Open **PowerShell as Administrator** and run:
```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

**Step 2: Install PostgreSQL Client**
```powershell
choco install postgresql --params '/Password:postgres' --version=15.5
```

**Or install just the client tools (smaller):**
```powershell
choco install postgresql15 --params '/Password:postgres'
```

**Step 3: Restart PowerShell**
- Close and reopen PowerShell
- Or refresh PATH:
```powershell
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
```

**Step 4: Verify Installation**
```powershell
pg_dump --version
psql --version
```

---

### Method 2: Direct Download (No Chocolatey)

**Step 1: Download PostgreSQL**

1. **Go to:** https://www.postgresql.org/download/windows/
2. **Click:** "Download the installer"
3. **Download:** PostgreSQL 15.x or 16.x (latest)
4. **Run installer**

**Step 2: Install PostgreSQL**

1. **Run the installer**
2. **Select components:**
   - ✅ PostgreSQL Server (optional, but includes client tools)
   - ✅ Command Line Tools (pg_dump, psql) - **REQUIRED**
   - ✅ pgAdmin (optional GUI tool)

3. **Set password** (remember this for local PostgreSQL, not Railway)

4. **Port:** Leave as 5432 (default)

5. **Complete installation**

**Step 3: Add to PATH (If Not Automatic)**

1. **Open System Properties:**
   - Press `Win + R`
   - Type: `sysdm.cpl`
   - Press Enter

2. **Go to Advanced → Environment Variables**

3. **Edit PATH:**
   - Select "Path" in System variables
   - Click "Edit"
   - Add: `C:\Program Files\PostgreSQL\15\bin` (or your version)
   - Click OK

4. **Restart PowerShell**

**Step 4: Verify**
```powershell
pg_dump --version
```

---

### Method 3: Using Scoop (Alternative Package Manager)

**Step 1: Install Scoop**
```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
irm get.scoop.sh | iex
```

**Step 2: Install PostgreSQL**
```powershell
scoop install postgresql
```

**Step 3: Verify**
```powershell
pg_dump --version
```

---

## ✅ After Installation: Export Data

Once `pg_dump` is installed, you can export:

### Using Railway CLI:
```powershell
# Get connection string
railway variables get DATABASE_URL

# Export
pg_dump $(railway variables get DATABASE_URL) > backup.sql
```

### Using Direct Connection:
```powershell
pg_dump "postgresql://postgres:YOUR_PASSWORD@centerbeam.proxy.rlwy.net:13307/railway" > backup.sql
```

---

## 🔍 Verify Installation

**Test if pg_dump works:**
```powershell
pg_dump --version
```

**Should show:**
```
pg_dump (PostgreSQL) 15.x
```

**If still not found:**
1. Restart PowerShell completely
2. Check PATH: `$env:Path`
3. Manually add PostgreSQL bin to PATH (see Method 2, Step 3)

---

## 🚀 Quick Install (One Command)

**If you have Chocolatey:**
```powershell
# Run PowerShell as Administrator
choco install postgresql15
```

**Then restart PowerShell and test:**
```powershell
pg_dump --version
```

---

## 📋 Alternative: Use Railway CLI to Export

**If you can't install PostgreSQL, use Railway CLI:**

```powershell
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link project
railway link

# Connect to database and export
railway connect postgres
# Then inside the connection:
pg_dump $DATABASE_URL > backup.sql
```

---

## ⚠️ Troubleshooting

### Issue: "pg_dump still not found after installation"

**Solutions:**
1. **Restart PowerShell completely** (close and reopen)
2. **Check PATH:**
   ```powershell
   $env:Path -split ';' | Select-String postgres
   ```
3. **Manually add to PATH** (see Method 2, Step 3)
4. **Use full path:**
   ```powershell
   & "C:\Program Files\PostgreSQL\15\bin\pg_dump.exe" "connection-string" > backup.sql
   ```

### Issue: "Permission denied"

**Solution:**
- Run PowerShell **as Administrator**
- Or install to user directory instead of Program Files

---

## 🎯 Quick Reference

**Install PostgreSQL:**
```powershell
choco install postgresql15
```

**Verify:**
```powershell
pg_dump --version
```

**Export:**
```powershell
pg_dump "connection-string" > backup.sql
```

---

**Last Updated:** PostgreSQL installation guide for Windows.

