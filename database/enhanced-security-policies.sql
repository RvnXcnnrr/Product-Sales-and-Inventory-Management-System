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
DROP POLICY IF EXISTS "Users can view store users" ON store_users;
DROP POLICY IF EXISTS "Users can manage store users" ON store_users;

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

-- Store users policies
CREATE POLICY "Users can view store users" ON store_users 
  FOR SELECT USING (
    store_id IN (
      SELECT store_id FROM store_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can manage store users" ON store_users 
  FOR ALL USING (
    store_id IN (
      SELECT store_id FROM store_users 
      WHERE user_id = auth.uid() 
      AND role IN ('owner', 'manager') 
      AND is_active = true
    )
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
CREATE POLICY "Users can view store categories" ON categories 
  FOR SELECT USING (
    store_id IN (
      SELECT store_id FROM store_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can manage store categories" ON categories 
  FOR ALL USING (
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
