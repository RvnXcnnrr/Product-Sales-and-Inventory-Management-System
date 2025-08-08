-- Complete Demo Setup Script
-- Run this AFTER successfully registering demo@posystem.com and the user shows up in auth.users

-- 1. Create demo store
INSERT INTO stores (id, name, code, address, phone, email, tax_rate, currency) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 'Demo Store', 'DEMO001', '123 Main St, Demo City', '+1-555-123-4567', 'store@demo.com', 0.10, 'USD')
ON CONFLICT (id) DO NOTHING;

-- 2. Assign demo user to demo store as owner
INSERT INTO store_users (store_id, user_id, role, is_active)
SELECT 
  '550e8400-e29b-41d4-a716-446655440000' as store_id,
  id as user_id,
  'owner' as role,
  true as is_active
FROM auth.users 
WHERE email = 'demo@posystem.com'
ON CONFLICT (store_id, user_id) DO NOTHING;

-- 3. Update the profile with store assignment
UPDATE profiles 
SET 
  store_id = '550e8400-e29b-41d4-a716-446655440000',
  role = 'owner',
  full_name = COALESCE(full_name, 'Demo User'),
  job_title = 'Store Owner'
WHERE email = 'demo@posystem.com';

-- 4. Create categories for the demo store
INSERT INTO categories (name, description, store_id) VALUES 
('Electronics', 'Electronic devices and accessories', '550e8400-e29b-41d4-a716-446655440000'),
('Clothing', 'Apparel and fashion items', '550e8400-e29b-41d4-a716-446655440000'),
('Food & Beverages', 'Food items and drinks', '550e8400-e29b-41d4-a716-446655440000'),
('Books', 'Books and educational materials', '550e8400-e29b-41d4-a716-446655440000')
ON CONFLICT DO NOTHING;

-- 5. Create sample products
INSERT INTO products (name, sku, barcode, description, category_id, store_id, cost_price, selling_price, stock_quantity, min_stock_level) VALUES 
('iPhone 15 Pro', 'IP15P-001', '1234567890123', 'Latest iPhone with advanced features', (SELECT id FROM categories WHERE name = 'Electronics' AND store_id = '550e8400-e29b-41d4-a716-446655440000' LIMIT 1), '550e8400-e29b-41d4-a716-446655440000', 800.00, 999.00, 25, 5),
('Samsung Galaxy S24', 'SGS24-001', '1234567890124', 'Flagship Samsung smartphone', (SELECT id FROM categories WHERE name = 'Electronics' AND store_id = '550e8400-e29b-41d4-a716-446655440000' LIMIT 1), '550e8400-e29b-41d4-a716-446655440000', 700.00, 899.00, 30, 5),
('MacBook Air M3', 'MBA-M3-001', '1234567890125', 'Apple laptop with M3 chip', (SELECT id FROM categories WHERE name = 'Electronics' AND store_id = '550e8400-e29b-41d4-a716-446655440000' LIMIT 1), '550e8400-e29b-41d4-a716-446655440000', 1000.00, 1299.00, 15, 3),
('Men''s T-Shirt', 'MT-001', '1234567890126', 'Cotton t-shirt for men', (SELECT id FROM categories WHERE name = 'Clothing' AND store_id = '550e8400-e29b-41d4-a716-446655440000' LIMIT 1), '550e8400-e29b-41d4-a716-446655440000', 8.00, 19.99, 100, 20),
('Coffee Premium Blend', 'CPB-001', '1234567890128', 'High-quality coffee beans', (SELECT id FROM categories WHERE name = 'Food & Beverages' AND store_id = '550e8400-e29b-41d4-a716-446655440000' LIMIT 1), '550e8400-e29b-41d4-a716-446655440000', 8.00, 15.99, 200, 50),
('Programming Book', 'PB-001', '1234567890130', 'Learn programming fundamentals', (SELECT id FROM categories WHERE name = 'Books' AND store_id = '550e8400-e29b-41d4-a716-446655440000' LIMIT 1), '550e8400-e29b-41d4-a716-446655440000', 20.00, 39.99, 50, 10)
ON CONFLICT (sku) DO NOTHING;

-- 6. Verification query - check if everything is set up correctly
SELECT 
  'Demo user exists' as check_name,
  CASE WHEN EXISTS (SELECT 1 FROM auth.users WHERE email = 'demo@posystem.com') 
       THEN '✅ SUCCESS' 
       ELSE '❌ FAILED' 
  END as status
UNION ALL
SELECT 
  'Demo profile exists' as check_name,
  CASE WHEN EXISTS (SELECT 1 FROM profiles WHERE email = 'demo@posystem.com') 
       THEN '✅ SUCCESS' 
       ELSE '❌ FAILED' 
  END as status
UNION ALL
SELECT 
  'Demo store exists' as check_name,
  CASE WHEN EXISTS (SELECT 1 FROM stores WHERE id = '550e8400-e29b-41d4-a716-446655440000') 
       THEN '✅ SUCCESS' 
       ELSE '❌ FAILED' 
  END as status
UNION ALL
SELECT 
  'Demo user assigned to store' as check_name,
  CASE WHEN EXISTS (SELECT 1 FROM store_users su JOIN auth.users u ON su.user_id = u.id WHERE u.email = 'demo@posystem.com' AND su.store_id = '550e8400-e29b-41d4-a716-446655440000') 
       THEN '✅ SUCCESS' 
       ELSE '❌ FAILED' 
  END as status
UNION ALL
SELECT 
  'Products exist' as check_name,
  CASE WHEN (SELECT COUNT(*) FROM products WHERE store_id = '550e8400-e29b-41d4-a716-446655440000') > 0
       THEN '✅ SUCCESS (' || (SELECT COUNT(*) FROM products WHERE store_id = '550e8400-e29b-41d4-a716-446655440000') || ' products)'
       ELSE '❌ FAILED' 
  END as status;
