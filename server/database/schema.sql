-- Anitha Stores Database Schema

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'Staff',
    store_allocated VARCHAR(100),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(20),
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Staff Table
CREATE TABLE IF NOT EXISTS staff (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(200) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    store_allocated VARCHAR(100),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(20),
    phone VARCHAR(20),
    is_handler BOOLEAN DEFAULT FALSE,
    role VARCHAR(50) DEFAULT 'Staff',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products Table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    product_name VARCHAR(255) NOT NULL,
    item_code VARCHAR(100) UNIQUE NOT NULL,
    sku_code VARCHAR(100) UNIQUE NOT NULL,
    minimum_quantity INTEGER DEFAULT 0,
    current_quantity INTEGER DEFAULT 0,
    category VARCHAR(100),
    store_id INTEGER,
    status VARCHAR(50) DEFAULT 'STOCK',
    image_url TEXT,
    mrp DECIMAL(10, 2),
    discount DECIMAL(10, 2) DEFAULT 0,
    sell_rate DECIMAL(10, 2),
    supplier_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stores Table
CREATE TABLE IF NOT EXISTS stores (
    id SERIAL PRIMARY KEY,
    store_name VARCHAR(255) NOT NULL,
    store_code VARCHAR(100) UNIQUE NOT NULL,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(20),
    phone VARCHAR(20),
    email VARCHAR(255),
    status VARCHAR(50) DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Admin/Profile Table
CREATE TABLE IF NOT EXISTS admin_profile (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(200) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(50) DEFAULT 'Super Admin',
    primary_store VARCHAR(100),
    store_scope VARCHAR(100) DEFAULT 'All stores • Global scope',
    selected_stores TEXT, -- JSON array of store IDs
    timezone VARCHAR(100) DEFAULT 'IST (GMT+05:30)',
    avatar_url TEXT,
    password_hash VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add selected_stores column if it doesn't exist (for existing databases)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'admin_profile' AND column_name = 'selected_stores'
    ) THEN
        ALTER TABLE admin_profile ADD COLUMN selected_stores TEXT;
    END IF;
END $$;

-- Add is_handler column to staff table if it doesn't exist (for existing databases)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'staff' AND column_name = 'is_handler'
    ) THEN
        ALTER TABLE staff ADD COLUMN is_handler BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Add payment_mode, customer_name, and customer_phone columns to stock_transactions if they don't exist (for existing databases)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stock_transactions' AND column_name = 'payment_mode'
    ) THEN
        ALTER TABLE stock_transactions ADD COLUMN payment_mode VARCHAR(50);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stock_transactions' AND column_name = 'customer_name'
    ) THEN
        ALTER TABLE stock_transactions ADD COLUMN customer_name VARCHAR(200);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'stock_transactions' AND column_name = 'customer_phone'
    ) THEN
        ALTER TABLE stock_transactions ADD COLUMN customer_phone VARCHAR(20);
    END IF;
END $$;

-- Add password_hash column if it doesn't exist (for existing databases)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'admin_profile' AND column_name = 'password_hash'
    ) THEN
        ALTER TABLE admin_profile ADD COLUMN password_hash VARCHAR(255);
    END IF;
END $$;

-- Customers Table
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(200) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(20),
    store_id INTEGER,
    item_code VARCHAR(100),
    quantity INTEGER DEFAULT 0,
    mrp DECIMAL(10, 2),
    sell_rate DECIMAL(10, 2),
    discount DECIMAL(10, 2) DEFAULT 0,
    payment_mode VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add new columns to customers table if they don't exist (for existing databases)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'customers' AND column_name = 'item_code'
    ) THEN
        ALTER TABLE customers ADD COLUMN item_code VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'customers' AND column_name = 'quantity'
    ) THEN
        ALTER TABLE customers ADD COLUMN quantity INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'customers' AND column_name = 'mrp'
    ) THEN
        ALTER TABLE customers ADD COLUMN mrp DECIMAL(10, 2);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'customers' AND column_name = 'sell_rate'
    ) THEN
        ALTER TABLE customers ADD COLUMN sell_rate DECIMAL(10, 2);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'customers' AND column_name = 'discount'
    ) THEN
        ALTER TABLE customers ADD COLUMN discount DECIMAL(10, 2) DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'customers' AND column_name = 'payment_mode'
    ) THEN
        ALTER TABLE customers ADD COLUMN payment_mode VARCHAR(50);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'customers' AND column_name = 'created_by'
    ) THEN
        ALTER TABLE customers ADD COLUMN created_by VARCHAR(200);
    END IF;
END $$;

-- Add new columns to products table if they don't exist (for existing databases)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'mrp'
    ) THEN
        ALTER TABLE products ADD COLUMN mrp DECIMAL(10, 2);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'discount'
    ) THEN
        ALTER TABLE products ADD COLUMN discount DECIMAL(10, 2) DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'sell_rate'
    ) THEN
        ALTER TABLE products ADD COLUMN sell_rate DECIMAL(10, 2);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'supplier_name'
    ) THEN
        ALTER TABLE products ADD COLUMN supplier_name VARCHAR(255);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'purchase_rate'
    ) THEN
        ALTER TABLE products ADD COLUMN purchase_rate DECIMAL(10, 2);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'discount_1'
    ) THEN
        ALTER TABLE products ADD COLUMN discount_1 DECIMAL(10, 2) DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'discount_2'
    ) THEN
        ALTER TABLE products ADD COLUMN discount_2 DECIMAL(10, 2) DEFAULT 0;
    END IF;
END $$;

-- Suppliers Table
CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    supplier_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(20),
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Chit Plans Table
CREATE TABLE IF NOT EXISTS chit_plans (
    id SERIAL PRIMARY KEY,
    plan_name VARCHAR(100) UNIQUE NOT NULL,
    plan_amount DECIMAL(10, 2) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Chit Customers Table
CREATE TABLE IF NOT EXISTS chit_customers (
    id SERIAL PRIMARY KEY,
    customer_name VARCHAR(200) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(20),
    email VARCHAR(255),
    chit_plan_id INTEGER REFERENCES chit_plans(id),
    payment_mode VARCHAR(50),
    enrollment_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Role Permissions Table
CREATE TABLE IF NOT EXISTS role_permissions (
    id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL,
    permissions JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Dispatch Table
CREATE TABLE IF NOT EXISTS dispatch (
    id SERIAL PRIMARY KEY,
    customer VARCHAR(200) NOT NULL,
    name VARCHAR(200) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(20),
    transport_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add address columns to dispatch table if they don't exist (for existing databases)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dispatch' AND column_name = 'address') THEN
        ALTER TABLE dispatch ADD COLUMN address TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dispatch' AND column_name = 'city') THEN
        ALTER TABLE dispatch ADD COLUMN city VARCHAR(100);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dispatch' AND column_name = 'state') THEN
        ALTER TABLE dispatch ADD COLUMN state VARCHAR(100);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dispatch' AND column_name = 'pincode') THEN
        ALTER TABLE dispatch ADD COLUMN pincode VARCHAR(20);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dispatch' AND column_name = 'packaging') THEN
        ALTER TABLE dispatch ADD COLUMN packaging VARCHAR(255);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dispatch' AND column_name = 'llr_number') THEN
        ALTER TABLE dispatch ADD COLUMN llr_number VARCHAR(100);
    END IF;
END $$;

-- Transport Table
CREATE TABLE IF NOT EXISTS transport (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    travels_name VARCHAR(255) NOT NULL,
    address TEXT,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    pincode VARCHAR(20),
    service VARCHAR(255) NOT NULL,
    llr_number VARCHAR(100),
    vehicle_number VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add address, state, pincode columns to transport table if they don't exist (for existing databases)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transport' AND column_name = 'address') THEN
        ALTER TABLE transport ADD COLUMN address TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transport' AND column_name = 'state') THEN
        ALTER TABLE transport ADD COLUMN state VARCHAR(100);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transport' AND column_name = 'pincode') THEN
        ALTER TABLE transport ADD COLUMN pincode VARCHAR(20);
    END IF;
END $$;

-- Add new columns to transport table if they don't exist (for existing databases)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transport' AND column_name = 'llr_number'
    ) THEN
        ALTER TABLE transport ADD COLUMN llr_number VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transport' AND column_name = 'vehicle_number'
    ) THEN
        ALTER TABLE transport ADD COLUMN vehicle_number VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transport' AND column_name = 'addresses'
    ) THEN
        ALTER TABLE transport ADD COLUMN addresses JSONB;
    END IF;
END $$;

-- Customer Tokens Table (Loyalty Points System)
-- Attendance Table
CREATE TABLE IF NOT EXISTS attendance (
    id SERIAL PRIMARY KEY,
    staff_id INTEGER NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL DEFAULT CURRENT_DATE,
    check_in_time TIMESTAMP,
    check_out_time TIMESTAMP,
    check_in_image TEXT,
    check_out_image TEXT,
    is_late BOOLEAN DEFAULT FALSE,
    is_early_logout BOOLEAN DEFAULT FALSE,
    late_minutes INTEGER DEFAULT 0,
    early_logout_minutes INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(staff_id, attendance_date)
);

-- Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER,
    user_type VARCHAR(50) NOT NULL, -- 'staff', 'supervisor', 'admin'
    notification_type VARCHAR(50) NOT NULL, -- 'warning', 'info', 'success'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    related_id INTEGER, -- ID of related record (e.g., attendance_id)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Supervisor Attendance Table (for tracking supervisor check-in/out)
CREATE TABLE IF NOT EXISTS supervisor_attendance (
    id SERIAL PRIMARY KEY,
    supervisor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL DEFAULT CURRENT_DATE,
    check_in_time TIMESTAMP,
    check_out_time TIMESTAMP,
    check_in_image TEXT,
    check_out_image TEXT,
    is_late BOOLEAN DEFAULT FALSE,
    is_early_logout BOOLEAN DEFAULT FALSE,
    late_minutes INTEGER DEFAULT 0,
    early_logout_minutes INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(supervisor_id, attendance_date)
);

CREATE TABLE IF NOT EXISTS customer_tokens (
    id SERIAL PRIMARY KEY,
    customer_phone VARCHAR(20),
    customer_email VARCHAR(255),
    tokens INTEGER DEFAULT 0,
    total_purchased DECIMAL(10, 2) DEFAULT 0,
    tokens_earned INTEGER DEFAULT 0,
    tokens_redeemed INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(customer_phone, customer_email)
);

-- Add tokens column to customers table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'customers' AND column_name = 'tokens_used'
    ) THEN
        ALTER TABLE customers ADD COLUMN tokens_used INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'customers' AND column_name = 'tokens_earned'
    ) THEN
        ALTER TABLE customers ADD COLUMN tokens_earned INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'customers' AND column_name = 'whatsapp'
    ) THEN
        ALTER TABLE customers ADD COLUMN whatsapp VARCHAR(10);
    END IF;
END $$;

-- Add city, state, pincode columns to existing tables (for existing databases)
DO $$ 
BEGIN
    -- Users table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'city') THEN
        ALTER TABLE users ADD COLUMN city VARCHAR(100);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'state') THEN
        ALTER TABLE users ADD COLUMN state VARCHAR(100);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'pincode') THEN
        ALTER TABLE users ADD COLUMN pincode VARCHAR(20);
    END IF;
    
    -- Staff table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'city') THEN
        ALTER TABLE staff ADD COLUMN city VARCHAR(100);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'state') THEN
        ALTER TABLE staff ADD COLUMN state VARCHAR(100);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'pincode') THEN
        ALTER TABLE staff ADD COLUMN pincode VARCHAR(20);
    END IF;
    
    -- Add face_data column to staff table for face recognition
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'face_data') THEN
        ALTER TABLE staff ADD COLUMN face_data JSONB;
    END IF;
    
    -- Add face_data column to users table for face recognition (supervisors)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'face_data') THEN
        ALTER TABLE users ADD COLUMN face_data JSONB;
    END IF;
    
    -- Customers table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'city') THEN
        ALTER TABLE customers ADD COLUMN city VARCHAR(100);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'state') THEN
        ALTER TABLE customers ADD COLUMN state VARCHAR(100);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'pincode') THEN
        ALTER TABLE customers ADD COLUMN pincode VARCHAR(20);
    END IF;
    
    -- Suppliers table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'suppliers' AND column_name = 'city') THEN
        ALTER TABLE suppliers ADD COLUMN city VARCHAR(100);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'suppliers' AND column_name = 'state') THEN
        ALTER TABLE suppliers ADD COLUMN state VARCHAR(100);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'suppliers' AND column_name = 'pincode') THEN
        ALTER TABLE suppliers ADD COLUMN pincode VARCHAR(20);
    END IF;
    
    -- Chit Customers table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chit_customers' AND column_name = 'city') THEN
        ALTER TABLE chit_customers ADD COLUMN city VARCHAR(100);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chit_customers' AND column_name = 'state') THEN
        ALTER TABLE chit_customers ADD COLUMN state VARCHAR(100);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'chit_customers' AND column_name = 'pincode') THEN
        ALTER TABLE chit_customers ADD COLUMN pincode VARCHAR(20);
    END IF;
END $$;

-- Stock Transactions Table (for tracking all stock movements)
CREATE TABLE IF NOT EXISTS stock_transactions (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    item_code VARCHAR(100) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('STOCK_IN', 'STOCK_OUT', 'SALE', 'SUPPLIER', 'ADJUSTMENT')),
    quantity INTEGER NOT NULL,
    previous_quantity INTEGER NOT NULL,
    new_quantity INTEGER NOT NULL,
    reference_type VARCHAR(50), -- 'CUSTOMER', 'SUPPLIER', 'DISPATCH', 'MANUAL', etc.
    reference_id INTEGER, -- ID of the related record (customer_id, supplier_id, dispatch_id, etc.)
    payment_mode VARCHAR(50), -- Payment mode for customer transactions
    customer_name VARCHAR(200), -- Customer name for stock out transactions
    customer_phone VARCHAR(20), -- Customer phone for stock out transactions
    notes TEXT,
    created_by VARCHAR(100), -- username or user identifier
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_staff_email ON staff(email);
CREATE INDEX IF NOT EXISTS idx_products_item_code ON products(item_code);
CREATE INDEX IF NOT EXISTS idx_products_sku_code ON products(sku_code);
CREATE INDEX IF NOT EXISTS idx_stores_store_code ON stores(store_code);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_name);
CREATE INDEX IF NOT EXISTS idx_stock_transactions_product_id ON stock_transactions(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_transactions_item_code ON stock_transactions(item_code);
CREATE INDEX IF NOT EXISTS idx_stock_transactions_type ON stock_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_stock_transactions_created_at ON stock_transactions(created_at);

-- Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    main VARCHAR(100) NOT NULL,
    sub VARCHAR(100) NOT NULL,
    common VARCHAR(100) NOT NULL,
    city VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for categories
CREATE INDEX IF NOT EXISTS idx_categories_main ON categories(main);
CREATE INDEX IF NOT EXISTS idx_categories_sub ON categories(sub);
CREATE INDEX IF NOT EXISTS idx_categories_common ON categories(common);

-- Services Table
CREATE TABLE IF NOT EXISTS services (
    id SERIAL PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    warranty BOOLEAN DEFAULT FALSE,
    unwarranty BOOLEAN DEFAULT FALSE,
    item_code VARCHAR(100),
    brand_name VARCHAR(255),
    product_name VARCHAR(255),
    serial_number VARCHAR(255),
    service_date DATE NOT NULL,
    handler_id INTEGER,
    handler_name VARCHAR(255),
    handler_phone VARCHAR(20),
    created_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sales Records Table
CREATE TABLE IF NOT EXISTS sales_records (
    id SERIAL PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    customer_contact VARCHAR(20) NOT NULL,
    handler_id INTEGER,
    handler_name VARCHAR(255),
    handler_mobile VARCHAR(20),
    date_of_duration DATE NOT NULL,
    supplier_name VARCHAR(255),
    supplier_number VARCHAR(20),
    products JSONB NOT NULL, -- Array of product objects
    total_amount DECIMAL(10, 2),
    created_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sales Records Table
CREATE TABLE IF NOT EXISTS sales_records (
    id SERIAL PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    customer_contact VARCHAR(20) NOT NULL,
    handler_id INTEGER,
    handler_name VARCHAR(255),
    handler_mobile VARCHAR(20),
    date_of_duration DATE NOT NULL,
    supplier_name VARCHAR(255),
    supplier_number VARCHAR(20),
    product_details JSONB, -- Array of product items: [{itemCode, productName, quantity, mrp, sellRate, discount, etc.}]
    created_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

