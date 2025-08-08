-- First, create a demo store
INSERT INTO stores (id, name, code, address, phone, email, tax_rate, currency) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 'Demo Store', 'DEMO001', '123 Main St, Demo City', '+1-555-123-4567', 'store@demo.com', 0.10, 'USD');

-- Note: The demo user will be created when they sign up through the app
-- But we need to ensure they get assigned to the demo store after registration

-- Create categories for the demo store
INSERT INTO categories (name, description, store_id) VALUES 
('Electronics', 'Electronic devices and accessories', '550e8400-e29b-41d4-a716-446655440000'),
('Clothing', 'Apparel and fashion items', '550e8400-e29b-41d4-a716-446655440000'),
('Food & Beverages', 'Food items and drinks', '550e8400-e29b-41d4-a716-446655440000'),
('Books', 'Books and educational materials', '550e8400-e29b-41d4-a716-446655440000');

-- Create sample products
INSERT INTO products (name, sku, barcode, description, category_id, store_id, cost_price, selling_price, stock_quantity, min_stock_level) VALUES 
('iPhone 15 Pro', 'IP15P-001', '1234567890123', 'Latest iPhone with advanced features', (SELECT id FROM categories WHERE name = 'Electronics' AND store_id = '550e8400-e29b-41d4-a716-446655440000' LIMIT 1), '550e8400-e29b-41d4-a716-446655440000', 800.00, 999.00, 25, 5),
('Samsung Galaxy S24', 'SGS24-001', '1234567890124', 'Flagship Samsung smartphone', (SELECT id FROM categories WHERE name = 'Electronics' AND store_id = '550e8400-e29b-41d4-a716-446655440000' LIMIT 1), '550e8400-e29b-41d4-a716-446655440000', 700.00, 899.00, 30, 5),
('MacBook Air M3', 'MBA-M3-001', '1234567890125', 'Apple laptop with M3 chip', (SELECT id FROM categories WHERE name = 'Electronics' AND store_id = '550e8400-e29b-41d4-a716-446655440000' LIMIT 1), '550e8400-e29b-41d4-a716-446655440000', 1000.00, 1299.00, 15, 3),
('Men''s T-Shirt', 'MT-001', '1234567890126', 'Cotton t-shirt for men', (SELECT id FROM categories WHERE name = 'Clothing' AND store_id = '550e8400-e29b-41d4-a716-446655440000' LIMIT 1), '550e8400-e29b-41d4-a716-446655440000', 8.00, 19.99, 100, 20),
('Coffee Premium Blend', 'CPB-001', '1234567890128', 'High-quality coffee beans', (SELECT id FROM categories WHERE name = 'Food & Beverages' AND store_id = '550e8400-e29b-41d4-a716-446655440000' LIMIT 1), '550e8400-e29b-41d4-a716-446655440000', 8.00, 15.99, 200, 50),
('Programming Book', 'PB-001', '1234567890130', 'Learn programming fundamentals', (SELECT id FROM categories WHERE name = 'Books' AND store_id = '550e8400-e29b-41d4-a716-446655440000' LIMIT 1), '550e8400-e29b-41d4-a716-446655440000', 20.00, 39.99, 50, 10);
