#!/bin/bash

# Railway Database Export Script
# Usage: ./export_railway_data.sh "postgresql://user:pass@host:port/database"

CONNECTION_STRING="$1"

if [ -z "$CONNECTION_STRING" ]; then
    echo "❌ Error: Please provide connection string"
    echo ""
    echo "Usage:"
    echo "  ./export_railway_data.sh \"postgresql://user:pass@host:port/database\""
    echo ""
    echo "Or get connection string from Railway:"
    echo "  1. Railway Dashboard → PostgreSQL → Variables"
    echo "  2. Copy DATABASE_URL or build from PGHOST, PGPORT, etc."
    echo ""
    echo "Example:"
    echo "  ./export_railway_data.sh \"postgresql://postgres:password@centerbeam.proxy.rlwy.net:13307/railway\""
    exit 1
fi

echo "📦 Starting Railway database export..."
echo "Connection: ${CONNECTION_STRING//:*@/*:****@}"  # Hide password
echo ""

# Test connection first
echo "🔍 Testing database connection..."
if ! psql "$CONNECTION_STRING" -c "SELECT 1;" > /dev/null 2>&1; then
    echo "❌ Error: Cannot connect to database"
    echo "   Please check your connection string"
    exit 1
fi
echo "✅ Connection successful!"
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
EXPORTED_COUNT=0
for TABLE in "${TABLES[@]}"; do
    echo -n "📤 Exporting $TABLE... "
    pg_dump -t "$TABLE" "$CONNECTION_STRING" > "$BACKUP_DIR/${TABLE}.sql" 2>/dev/null
    
    if [ $? -eq 0 ] && [ -s "$BACKUP_DIR/${TABLE}.sql" ]; then
        RECORD_COUNT=$(grep -c "INSERT INTO" "$BACKUP_DIR/${TABLE}.sql" 2>/dev/null || echo "0")
        if [ "$RECORD_COUNT" -gt 0 ]; then
            echo "✅ $RECORD_COUNT records"
            EXPORTED_COUNT=$((EXPORTED_COUNT + 1))
        else
            echo "⚠️  Empty table"
            rm -f "$BACKUP_DIR/${TABLE}.sql"
        fi
    else
        echo "⚠️  Table doesn't exist or error"
        rm -f "$BACKUP_DIR/${TABLE}.sql"
    fi
done

# Create complete backup
echo ""
echo "📦 Creating complete database backup..."
pg_dump "$CONNECTION_STRING" > "$BACKUP_DIR/complete_backup.sql" 2>&1

if [ $? -eq 0 ] && [ -s "$BACKUP_DIR/complete_backup.sql" ]; then
    BACKUP_SIZE=$(du -h "$BACKUP_DIR/complete_backup.sql" | cut -f1)
    echo "✅ Complete backup created: $BACKUP_DIR/complete_backup.sql ($BACKUP_SIZE)"
else
    echo "❌ Error creating complete backup"
    echo "   Check connection string and database access"
fi

# Create summary file
echo ""
echo "📊 Creating backup summary..."
cat > "$BACKUP_DIR/README.txt" << EOF
Railway Database Backup
=======================
Export Date: $(date)
Connection: ${CONNECTION_STRING//:*@/*:****@}

Tables Exported: $EXPORTED_COUNT
Total Tables Attempted: ${#TABLES[@]}

Files:
- complete_backup.sql (Full database backup)
- *.sql (Individual table backups)

To import:
psql "new-connection-string" < complete_backup.sql
EOF

# Display summary
echo ""
echo "📊 Backup Summary:"
echo "=================="
echo "Backup Directory: $BACKUP_DIR"
echo "Tables Exported: $EXPORTED_COUNT"
echo ""
echo "Files:"
ls -lh "$BACKUP_DIR"/*.sql 2>/dev/null | awk '{printf "  %-30s %6s\n", $9, $5}'
echo ""
echo "✅ Export completed!"
echo "📁 Backup location: $BACKUP_DIR/"
echo ""
echo "📥 To import to new database:"
echo "   psql \"new-connection-string\" < $BACKUP_DIR/complete_backup.sql"

