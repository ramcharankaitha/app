#!/bin/bash

# Export All Data from Old Railway Database
# Usage: ./export_all_data.sh "postgresql://user:pass@host:port/database"

OLD_CONNECTION_STRING="$1"

if [ -z "$OLD_CONNECTION_STRING" ]; then
    echo "❌ Error: Please provide connection string"
    echo "Usage: ./export_all_data.sh \"postgresql://user:pass@host:port/database\""
    exit 1
fi

echo "📦 Starting data export from old Railway database..."
echo ""

# List of all tables to export
TABLES=(
    "users"
    "staff"
    "products"
    "customers"
    "suppliers"
    "stores"
    "services"
    "stock_transactions"
    "sales_orders"
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
    "sales_records"
)

# Export each table
for TABLE in "${TABLES[@]}"; do
    echo "📤 Exporting $TABLE..."
    pg_dump -t "$TABLE" "$OLD_CONNECTION_STRING" >> "backup_${TABLE}.sql" 2>/dev/null
    
    if [ $? -eq 0 ]; then
        echo "✅ $TABLE exported successfully"
    else
        echo "⚠️  $TABLE might not exist or error occurred (continuing...)"
    fi
done

# Also create complete backup
echo ""
echo "📦 Creating complete database backup..."
pg_dump "$OLD_CONNECTION_STRING" > "complete_backup.sql"

if [ $? -eq 0 ]; then
    echo "✅ Complete backup created: complete_backup.sql"
    echo ""
    echo "📊 Backup Summary:"
    ls -lh backup_*.sql complete_backup.sql 2>/dev/null
    echo ""
    echo "✅ All data exported successfully!"
    echo "📁 Files created:"
    echo "   - complete_backup.sql (full database)"
    echo "   - backup_*.sql (individual tables)"
else
    echo "❌ Error creating complete backup"
    exit 1
fi

