-- Enforce verified email for data access

-- 1) Helper: function to check if current user is verified
CREATE OR REPLACE FUNCTION public.is_email_verified(uid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT email_confirmed_at IS NOT NULL FROM auth.users WHERE id = uid;
$$;

GRANT EXECUTE ON FUNCTION public.is_email_verified(uuid) TO anon, authenticated;

-- 2) Update policies to require verified users
-- Profiles: users can only view/update own profile if verified, but can still insert own profile
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id AND public.is_email_verified(auth.uid()));

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id AND public.is_email_verified(auth.uid()));

-- Keep insert policy lenient so initial profile can be created
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Stores
DROP POLICY IF EXISTS "Users can view assigned stores" ON stores;
CREATE POLICY "Users can view assigned stores" ON stores
  FOR SELECT USING (
    public.is_email_verified(auth.uid()) AND
    id IN (SELECT store_id FROM store_users WHERE user_id = auth.uid() AND is_active = true)
  );

-- Store users (avoid recursion): users can only view their own membership rows
DROP POLICY IF EXISTS "View store users (self or admin)" ON store_users;
DROP POLICY IF EXISTS "Users can view store users" ON store_users;
CREATE POLICY "Users can view own store_users" ON store_users
  FOR SELECT USING (
    public.is_email_verified(auth.uid()) AND user_id = auth.uid()
  );

-- Note: No INSERT/UPDATE/DELETE policies provided here to avoid recursion
-- Management of store users should be performed via privileged RPC or admin console

-- Products
DROP POLICY IF EXISTS "Users can view store products" ON products;
CREATE POLICY "Users can view store products" ON products
  FOR SELECT USING (
    public.is_email_verified(auth.uid()) AND
    store_id IN (SELECT store_id FROM store_users WHERE user_id = auth.uid() AND is_active = true)
  );

-- Transactions
DROP POLICY IF EXISTS "Users can view store transactions" ON transactions;
CREATE POLICY "Users can view store transactions" ON transactions
  FOR SELECT USING (
    public.is_email_verified(auth.uid()) AND
    store_id IN (SELECT store_id FROM store_users WHERE user_id = auth.uid() AND is_active = true)
  );

-- Transaction Items
DROP POLICY IF EXISTS "Users can view transaction items" ON transaction_items;
CREATE POLICY "Users can view transaction items" ON transaction_items
  FOR SELECT USING (
    public.is_email_verified(auth.uid()) AND
    transaction_id IN (
      SELECT id FROM transactions WHERE store_id IN (
        SELECT store_id FROM store_users WHERE user_id = auth.uid() AND is_active = true
      )
    )
  );

-- Inventory Logs
DROP POLICY IF EXISTS "Users can view inventory logs" ON inventory_logs;
CREATE POLICY "Users can view inventory logs" ON inventory_logs
  FOR SELECT USING (
    public.is_email_verified(auth.uid()) AND
    store_id IN (SELECT store_id FROM store_users WHERE user_id = auth.uid() AND is_active = true)
  );
