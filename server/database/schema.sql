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
    phone VARCHAR(20),
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
END $$;

-- Suppliers Table
CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    supplier_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_staff_email ON staff(email);
CREATE INDEX IF NOT EXISTS idx_products_item_code ON products(item_code);
CREATE INDEX IF NOT EXISTS idx_products_sku_code ON products(sku_code);
CREATE INDEX IF NOT EXISTS idx_stores_store_code ON stores(store_code);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_name);

