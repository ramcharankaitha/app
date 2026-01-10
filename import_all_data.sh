#!/bin/bash

# Import All Data to New Railway Database
# Usage: ./import_all_data.sh "postgresql://user:pass@host:port/database"

NEW_CONNECTION_STRING="$1"

if [ -z "$NEW_CONNECTION_STRING" ]; then
    echo "❌ Error: Please provide connection string"
    echo "Usage: ./import_all_data.sh \"postgresql://user:pass@host:port/database\""
    exit 1
fi

echo "📥 Starting data import to new Railway database..."
echo ""

# Check if complete backup exists
if [ -f "complete_backup.sql" ]; then
    echo "📦 Found complete backup, importing..."
    psql "$NEW_CONNECTION_STRING" < "complete_backup.sql"
    
    if [ $? -eq 0 ]; then
        echo "✅ Complete backup imported successfully!"
        exit 0
    else
        echo "⚠️  Complete backup import failed, trying individual tables..."
    fi
fi

# Import individual table backups
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

for TABLE in "${TABLES[@]}"; do
    if [ -f "backup_${TABLE}.sql" ]; then
        echo "📥 Importing $TABLE..."
        psql "$NEW_CONNECTION_STRING" < "backup_${TABLE}.sql" 2>/dev/null
        
        if [ $? -eq 0 ]; then
            echo "✅ $TABLE imported successfully"
        else
            echo "⚠️  Error importing $TABLE (continuing...)"
        fi
    fi
done

echo ""
echo "✅ Data import completed!"
echo ""
echo "🔍 Verifying data..."
psql "$NEW_CONNECTION_STRING" -c "
SELECT 
    'users' as table_name, COUNT(*) as count FROM users
UNION ALL SELECT 'staff', COUNT(*) FROM staff
UNION ALL SELECT 'products', COUNT(*) FROM products
UNION ALL SELECT 'customers', COUNT(*) FROM customers
UNION ALL SELECT 'services', COUNT(*) FROM services
UNION ALL SELECT 'stock_transactions', COUNT(*) FROM stock_transactions;
"

