-- Enhanced Row-Level Security Policies for Profiles and Store Users

-- Make sure RLS is enabled on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view assigned stores" ON stores;
DROP POLICY IF EXISTS "Users can update assigned stores" ON stores;
DROP POLICY IF EXISTS "Users can view store users" ON store_users;
DROP POLICY IF EXISTS "Users can manage store users" ON store_users;
DROP POLICY IF EXISTS "View own store_user mapping" ON store_users;
DROP POLICY IF EXISTS "Insert own store_user mapping" ON store_users;
DROP POLICY IF EXISTS "Update own store_user mapping" ON store_users;
-- Drop existing category policies to avoid duplicates
DROP POLICY IF EXISTS "Users can view store categories" ON categories;
DROP POLICY IF EXISTS "Users can manage store categories" ON categories;
DROP POLICY IF EXISTS "Users can insert store categories" ON categories;
DROP POLICY IF EXISTS "Users can update store categories" ON categories;
DROP POLICY IF EXISTS "Users can delete store categories" ON categories;
-- Drop existing product policies to avoid duplicates
DROP POLICY IF EXISTS "Users can view store products" ON products;
DROP POLICY IF EXISTS "Users can manage store products" ON products;
-- Drop existing transaction policies to avoid duplicates
DROP POLICY IF EXISTS "Users can view store transactions" ON transactions;
DROP POLICY IF EXISTS "Users can manage store transactions" ON transactions;
-- Drop existing transaction item policies to avoid duplicates
DROP POLICY IF EXISTS "Users can view transaction items" ON transaction_items;
DROP POLICY IF EXISTS "Users can manage transaction items" ON transaction_items;
-- Drop existing inventory log policies to avoid duplicates
DROP POLICY IF EXISTS "Users can view inventory logs" ON inventory_logs;
DROP POLICY IF EXISTS "Users can manage inventory logs" ON inventory_logs;

-- Recreate policies with stronger restrictions

-- Profile policies
CREATE POLICY "Users can view own profile" ON profiles 
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles 
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles 
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Store policies
CREATE POLICY "Users can view assigned stores" ON stores 
  FOR SELECT USING (
    id IN (
      SELECT store_id FROM store_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can update assigned stores" ON stores 
  FOR UPDATE USING (
    id IN (
      SELECT store_id FROM store_users 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'manager') 
      AND is_active = true
    )
  );

-- Store users policies (non-recursive)
-- Allow users to view only their own mapping rows
CREATE POLICY "View own store_user mapping" ON store_users 
  FOR SELECT USING (
    user_id = auth.uid() AND is_active = true
  );

-- Allow users to insert their own mapping row (if needed by app flows)
CREATE POLICY "Insert own store_user mapping" ON store_users 
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
  );

-- Allow users to update their own mapping row
CREATE POLICY "Update own store_user mapping" ON store_users 
  FOR UPDATE USING (
    user_id = auth.uid()
  );

-- Products policies - only see products from stores they belong to
CREATE POLICY "Users can view store products" ON products 
  FOR SELECT USING (
    store_id IN (
      SELECT store_id FROM store_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can manage store products" ON products 
  FOR ALL USING (
    store_id IN (
      SELECT store_id FROM store_users 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'manager', 'staff') 
      AND is_active = true
    )
  );

-- Categories policies
-- Read: any active store member can view
CREATE POLICY "Users can view store categories" ON categories 
  FOR SELECT USING (
    store_id IN (
      SELECT store_id FROM store_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Insert: any active store member (owner/manager/staff) can create
CREATE POLICY "Users can insert store categories" ON categories
  FOR INSERT WITH CHECK (
    store_id IN (
      SELECT store_id FROM store_users
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Update: restricted to owner/manager
CREATE POLICY "Users can update store categories" ON categories
  FOR UPDATE USING (
    store_id IN (
      SELECT store_id FROM store_users 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'manager') 
      AND is_active = true
    )
  );

-- Delete: restricted to owner/manager
CREATE POLICY "Users can delete store categories" ON categories
  FOR DELETE USING (
    store_id IN (
      SELECT store_id FROM store_users 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'manager') 
      AND is_active = true
    )
  );

-- Transactions policies
CREATE POLICY "Users can view store transactions" ON transactions 
  FOR SELECT USING (
    store_id IN (
      SELECT store_id FROM store_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can manage store transactions" ON transactions 
  FOR ALL USING (
    store_id IN (
      SELECT store_id FROM store_users 
      WHERE user_id = auth.uid() 
      AND is_active = true
    )
  );

-- Transaction items policies
CREATE POLICY "Users can view transaction items" ON transaction_items 
  FOR SELECT USING (
    transaction_id IN (
      SELECT id FROM transactions 
      WHERE store_id IN (
        SELECT store_id FROM store_users 
        WHERE user_id = auth.uid() AND is_active = true
      )
    )
  );

CREATE POLICY "Users can manage transaction items" ON transaction_items 
  FOR ALL USING (
    transaction_id IN (
      SELECT id FROM transactions 
      WHERE store_id IN (
        SELECT store_id FROM store_users 
        WHERE user_id = auth.uid() AND is_active = true
      )
    )
  );

-- Inventory logs policies
CREATE POLICY "Users can view inventory logs" ON inventory_logs 
  FOR SELECT USING (
    store_id IN (
      SELECT store_id FROM store_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can manage inventory logs" ON inventory_logs 
  FOR ALL USING (
    store_id IN (
      SELECT store_id FROM store_users 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'manager') 
      AND is_active = true
    )
  );
