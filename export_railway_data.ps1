# Railway Database Export Script for Windows PowerShell
# Usage: .\export_railway_data.ps1 "postgresql://user:pass@host:port/database"

param(
    [Parameter(Mandatory=$true)]
    [string]$ConnectionString
)

Write-Host "📦 Starting Railway database export..." -ForegroundColor Cyan
Write-Host ""

# Test if pg_dump is available
$pgDumpPath = Get-Command pg_dump -ErrorAction SilentlyContinue
if (-not $pgDumpPath) {
    Write-Host "❌ Error: pg_dump not found" -ForegroundColor Red
    Write-Host "   Please install PostgreSQL client:" -ForegroundColor Yellow
    Write-Host "   choco install postgresql" -ForegroundColor Yellow
    Write-Host "   Or download from: https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
    exit 1
}

# Test connection
Write-Host "🔍 Testing database connection..." -ForegroundColor Cyan
$testResult = psql $ConnectionString -c "SELECT 1;" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error: Cannot connect to database" -ForegroundColor Red
    Write-Host "   Please check your connection string" -ForegroundColor Yellow
    exit 1
}
Write-Host "✅ Connection successful!" -ForegroundColor Green
Write-Host ""

# List of all tables
$tables = @(
    "users",
    "staff",
    "products",
    "customers",
    "suppliers",
    "stores",
    "services",
    "stock_transactions",
    "sales_records",
    "purchase_orders",
    "payments",
    "quotations",
    "chit_plans",
    "chit_customers",
    "chit_entries",
    "admin_profile",
    "role_permissions",
    "dispatch",
    "transport",
    "attendance",
    "supervisor_attendance",
    "notifications",
    "categories"
)

# Create backup directory
$backupDir = "railway_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

Write-Host "📁 Creating backup directory: $backupDir" -ForegroundColor Cyan
Write-Host ""

# Export each table
$exportedCount = 0
foreach ($table in $tables) {
    Write-Host -NoNewline "📤 Exporting $table... " -ForegroundColor Cyan
    $outputFile = Join-Path $backupDir "$table.sql"
    
    pg_dump -t $table $ConnectionString > $outputFile 2>&1
    
    if ($LASTEXITCODE -eq 0 -and (Test-Path $outputFile) -and (Get-Item $outputFile).Length -gt 0) {
        $recordCount = (Select-String -Path $outputFile -Pattern "INSERT INTO" -AllMatches).Matches.Count
        if ($recordCount -gt 0) {
            Write-Host "✅ $recordCount records" -ForegroundColor Green
            $exportedCount++
        } else {
            Write-Host "⚠️  Empty table" -ForegroundColor Yellow
            Remove-Item $outputFile -Force
        }
    } else {
        Write-Host "⚠️  Table doesn't exist or error" -ForegroundColor Yellow
        Remove-Item $outputFile -Force -ErrorAction SilentlyContinue
    }
}

# Create complete backup
Write-Host ""
Write-Host "📦 Creating complete database backup..." -ForegroundColor Cyan
$completeBackup = Join-Path $backupDir "complete_backup.sql"
pg_dump $ConnectionString > $completeBackup 2>&1

if ($LASTEXITCODE -eq 0 -and (Test-Path $completeBackup) -and (Get-Item $completeBackup).Length -gt 0) {
    $backupSize = "{0:N2} MB" -f ((Get-Item $completeBackup).Length / 1MB)
    Write-Host "✅ Complete backup created: $completeBackup ($backupSize)" -ForegroundColor Green
} else {
    Write-Host "❌ Error creating complete backup" -ForegroundColor Red
    Write-Host "   Check connection string and database access" -ForegroundColor Yellow
}

# Create summary
Write-Host ""
Write-Host "📊 Creating backup summary..." -ForegroundColor Cyan
$readmeContent = @"
Railway Database Backup
=======================
Export Date: $(Get-Date)
Connection: $($ConnectionString -replace ':[^@]+@', ':****@')

Tables Exported: $exportedCount
Total Tables Attempted: $($tables.Count)

Files:
- complete_backup.sql (Full database backup)
- *.sql (Individual table backups)

To import:
psql "new-connection-string" < complete_backup.sql
"@
$readmeContent | Out-File -FilePath (Join-Path $backupDir "README.txt") -Encoding UTF8

# Display summary
Write-Host ""
Write-Host "📊 Backup Summary:" -ForegroundColor Cyan
Write-Host "=================="
Write-Host "Backup Directory: $backupDir"
Write-Host "Tables Exported: $exportedCount"
Write-Host ""
Write-Host "Files:"
Get-ChildItem $backupDir -Filter "*.sql" | ForEach-Object {
    $size = "{0:N2} KB" -f ($_.Length / 1KB)
    Write-Host "  $($_.Name.PadRight(30)) $size"
}
Write-Host ""
Write-Host "✅ Export completed!" -ForegroundColor Green
Write-Host "📁 Backup location: $backupDir\" -ForegroundColor Cyan
Write-Host ""
Write-Host "📥 To import to new database:" -ForegroundColor Yellow
Write-Host "   psql `"new-connection-string`" < $backupDir\complete_backup.sql" -ForegroundColor Yellow

