-- AI Agent Data Catalog - Database Setup Script
-- 
-- This script creates a sample database schema for demonstrating
-- the AI agent's ability to explore and query a data catalog.

-- Create the database (run as postgres superuser)
-- CREATE DATABASE data_catalog;
-- \c data_catalog

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    category VARCHAR(100),
    stock_quantity INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    shipping_address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_status CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled'))
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    CONSTRAINT positive_quantity CHECK (quantity > 0)
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    parent_category_id INTEGER REFERENCES categories(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL,
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_rating CHECK (rating >= 1 AND rating <= 5)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);

-- Insert sample data

-- Sample users
INSERT INTO users (username, email, first_name, last_name) VALUES 
    ('john_doe', 'john.doe@example.com', 'John', 'Doe'),
    ('jane_smith', 'jane.smith@example.com', 'Jane', 'Smith'),
    ('bob_wilson', 'bob.wilson@example.com', 'Bob', 'Wilson'),
    ('alice_brown', 'alice.brown@example.com', 'Alice', 'Brown')
ON CONFLICT (username) DO NOTHING;

-- Sample categories
INSERT INTO categories (name, description) VALUES 
    ('Electronics', 'Electronic devices and accessories'),
    ('Computers', 'Desktop and laptop computers'),
    ('Smartphones', 'Mobile phones and accessories'),
    ('Home & Garden', 'Home improvement and garden supplies'),
    ('Books', 'Physical and digital books')
ON CONFLICT (name) DO NOTHING;

-- Sample products
INSERT INTO products (name, description, price, category, stock_quantity) VALUES 
    ('Laptop Pro 15"', 'High-performance laptop with 16GB RAM', 999.99, 'Electronics', 50),
    ('Wireless Mouse', 'Ergonomic wireless mouse with USB receiver', 29.99, 'Electronics', 200),
    ('Mechanical Keyboard', 'RGB mechanical keyboard with cherry switches', 149.99, 'Electronics', 75),
    ('USB-C Cable', 'Fast charging USB-C cable 6ft', 12.99, 'Electronics', 500),
    ('Monitor 27"', '4K Ultra HD monitor with HDR support', 399.99, 'Electronics', 30),
    ('Smartphone X', 'Latest smartphone with 5G support', 799.99, 'Electronics', 100),
    ('Desk Lamp', 'LED desk lamp with adjustable brightness', 45.00, 'Home & Garden', 150),
    ('Office Chair', 'Ergonomic office chair with lumbar support', 299.99, 'Home & Garden', 25),
    ('Programming Book', 'Learn advanced programming concepts', 49.99, 'Books', 80),
    ('Webcam HD', '1080p webcam for video conferencing', 79.99, 'Electronics', 120)
ON CONFLICT DO NOTHING;

-- Sample orders
INSERT INTO orders (user_id, total, status, shipping_address) 
SELECT 
    u.id,
    CASE 
        WHEN u.username = 'john_doe' THEN 999.99
        WHEN u.username = 'jane_smith' THEN 42.98
        WHEN u.username = 'bob_wilson' THEN 1299.97
        ELSE 79.99
    END,
    CASE 
        WHEN u.username = 'john_doe' THEN 'delivered'
        WHEN u.username = 'jane_smith' THEN 'shipped'
        WHEN u.username = 'bob_wilson' THEN 'processing'
        ELSE 'pending'
    END,
    '123 Main St, City, State 12345'
FROM users u
WHERE u.username IN ('john_doe', 'jane_smith', 'bob_wilson', 'alice_brown')
ON CONFLICT DO NOTHING;

-- Sample order items
INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
SELECT 
    o.id,
    p.id,
    1,
    p.price,
    p.price
FROM orders o
CROSS JOIN products p
WHERE o.user_id = (SELECT id FROM users WHERE username = 'john_doe' LIMIT 1)
    AND p.name = 'Laptop Pro 15"'
ON CONFLICT DO NOTHING;

INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal)
SELECT 
    o.id,
    p.id,
    1,
    p.price,
    p.price
FROM orders o
CROSS JOIN products p
WHERE o.user_id = (SELECT id FROM users WHERE username = 'jane_smith' LIMIT 1)
    AND p.name IN ('Wireless Mouse', 'USB-C Cable')
ON CONFLICT DO NOTHING;

-- Sample reviews
INSERT INTO reviews (product_id, user_id, rating, comment)
SELECT 
    p.id,
    u.id,
    5,
    'Excellent product! Highly recommended.'
FROM products p
CROSS JOIN users u
WHERE p.name = 'Laptop Pro 15"'
    AND u.username = 'john_doe'
ON CONFLICT DO NOTHING;

INSERT INTO reviews (product_id, user_id, rating, comment)
SELECT 
    p.id,
    u.id,
    4,
    'Good quality mouse, very comfortable to use.'
FROM products p
CROSS JOIN users u
WHERE p.name = 'Wireless Mouse'
    AND u.username = 'jane_smith'
ON CONFLICT DO NOTHING;

-- Create a read-only user for the catalog agent (optional but recommended)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'catalog_reader') THEN
        CREATE USER catalog_reader WITH PASSWORD 'catalog_password_change_me';
    END IF;
END
$$;

GRANT CONNECT ON DATABASE data_catalog TO catalog_reader;
GRANT USAGE ON SCHEMA public TO catalog_reader;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO catalog_reader;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO catalog_reader;

-- Ensure future tables are also accessible
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO catalog_reader;

-- Display summary
SELECT 'Database setup completed!' as message;
SELECT 'Tables created:' as info, COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'public';
SELECT 'Sample users inserted:' as info, COUNT(*) as count FROM users;
SELECT 'Sample products inserted:' as info, COUNT(*) as count FROM products;
SELECT 'Sample orders inserted:' as info, COUNT(*) as count FROM orders;
