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

-- Ensure the 'authenticated' role has privileges on tables (RLS still applies)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.role_table_grants 
    WHERE grantee = 'authenticated' AND table_name = 'stores' AND privilege_type = 'INSERT'
  ) THEN
    GRANT USAGE ON SCHEMA public TO authenticated;
    GRANT SELECT, INSERT, UPDATE ON TABLE public.stores TO authenticated;
  END IF;
END $$;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view assigned stores" ON stores;
DROP POLICY IF EXISTS "Users can update assigned stores" ON stores;
DROP POLICY IF EXISTS "Users can create stores" ON stores;
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

-- Allow authenticated users to create stores (ownership mapping is created by the app)
CREATE POLICY "Users can create stores" ON stores 
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

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

-- Helper RPC: create store and attach current user (bypasses RLS safely)
CREATE OR REPLACE FUNCTION public.create_store_for_current_user(p_store_name text, p_role text DEFAULT 'owner')
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_store_id uuid;
  v_code text;
  v_now timestamptz := timezone('utc'::text, now());
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_code := upper(substr(regexp_replace(coalesce(p_store_name, 'My Store'), '[^a-zA-Z0-9]', '', 'g'), 1, 3))
            || lpad(floor(random()*1000)::int::text, 3, '0');

  INSERT INTO public.stores(name, code, created_at, updated_at)
  VALUES (coalesce(p_store_name, 'My Store'), v_code, v_now, v_now)
  RETURNING id INTO v_store_id;

  INSERT INTO public.store_users(store_id, user_id, role, is_active, created_at, updated_at)
  VALUES (v_store_id, v_user_id, coalesce(p_role, 'owner'), true, v_now, v_now)
  ON CONFLICT (store_id, user_id) DO UPDATE
    SET role = EXCLUDED.role,
        is_active = EXCLUDED.is_active,
        updated_at = v_now;

  UPDATE public.profiles
  SET store_id = v_store_id,
      updated_at = v_now
  WHERE id = v_user_id;

  RETURN v_store_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_store_for_current_user(text, text) TO authenticated;
