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
-- Enable RLS for notifications if table exists/when created


-- Create store_settings table for extended per-store configuration (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'store_settings'
  ) THEN
    CREATE TABLE public.store_settings (
      store_id uuid PRIMARY KEY REFERENCES public.stores(id) ON DELETE CASCADE,
      -- Extended settings not present on stores table
      receipt_footer text DEFAULT 'Thank you for your purchase!',
      enable_email_receipts boolean DEFAULT true,
      date_format text DEFAULT 'MM/dd/yyyy',
      offline_mode text DEFAULT 'auto',
      auto_print_receipt boolean DEFAULT false,
      enable_cash boolean DEFAULT true,
      enable_card boolean DEFAULT true,
      enable_digital_wallet boolean DEFAULT false,
      notifications jsonb DEFAULT '{}'::jsonb,
      created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
      updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
    );

    ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
  END IF;
END$$;

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
DROP POLICY IF EXISTS "Owners/managers can view store users" ON store_users;
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
-- Drop existing store_settings policies to avoid duplicates
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='store_settings' AND policyname='Users can view store settings') THEN
    DROP POLICY "Users can view store settings" ON store_settings;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='store_settings' AND policyname='Users can update store settings') THEN
    DROP POLICY "Users can update store settings" ON store_settings;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='store_settings' AND policyname='Users can insert store settings') THEN
    DROP POLICY "Users can insert store settings" ON store_settings;
  END IF;
END$$;

-- Create notifications table (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'notifications'
  ) THEN
    CREATE TABLE public.notifications (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
      user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
      type text NOT NULL DEFAULT 'info',
      title text NOT NULL,
      message text,
      data jsonb NOT NULL DEFAULT '{}'::jsonb,
      is_read boolean NOT NULL DEFAULT false,
      created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
    );
    ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
    CREATE INDEX IF NOT EXISTS idx_notifications_store_created ON public.notifications(store_id, created_at DESC);
  END IF;
END$$;

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

-- Owners and managers can view all members of their store (avoid recursion by checking profiles)
CREATE POLICY "Owners/managers can view store users" ON store_users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.store_id = store_users.store_id
        AND p.role IN ('owner','manager')
    )
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

-- Notifications policies
DROP POLICY IF EXISTS "Users can view store notifications" ON notifications;
DROP POLICY IF EXISTS "Users can insert store notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update store notifications" ON notifications;

-- Read: any active member of the store can read
CREATE POLICY "Users can view store notifications" ON notifications
  FOR SELECT USING (
    store_id IN (
      SELECT store_id FROM store_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Insert: any active member can insert (clients may create notifications on events)
CREATE POLICY "Users can insert store notifications" ON notifications
  FOR INSERT WITH CHECK (
    store_id IN (
      SELECT store_id FROM store_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Update: allow members to mark as read or edit their store notifications
CREATE POLICY "Users can update store notifications" ON notifications
  FOR UPDATE USING (
    store_id IN (
      SELECT store_id FROM store_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- store_settings policies
-- Read: any active member of the store can read settings
CREATE POLICY "Users can view store settings" ON store_settings
  FOR SELECT USING (
    store_id IN (
      SELECT store_id FROM store_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Insert: allow owner/manager to initialize settings row
CREATE POLICY "Users can insert store settings" ON store_settings
  FOR INSERT WITH CHECK (
    store_id IN (
      SELECT store_id FROM store_users 
      WHERE user_id = auth.uid() AND role IN ('owner','manager') AND is_active = true
    )
  );

-- Update: only owner/manager can update settings
CREATE POLICY "Users can update store settings" ON store_settings
  FOR UPDATE USING (
    store_id IN (
      SELECT store_id FROM store_users 
      WHERE user_id = auth.uid() AND role IN ('owner','manager') AND is_active = true
    )
  );

-- Trigger to maintain updated_at on store_settings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_store_settings_updated_at'
  ) THEN
    CREATE TRIGGER update_store_settings_updated_at
      BEFORE UPDATE ON public.store_settings
      FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
  END IF;
END$$;

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

-- User management RPCs
-- Helper: ensure caller is active member of store (optionally role check)
CREATE OR REPLACE FUNCTION public.is_store_member(p_store_id uuid, p_user_id uuid, p_roles text[] DEFAULT ARRAY['owner','manager','staff'])
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.store_users su
    WHERE su.store_id = p_store_id
      AND su.user_id = p_user_id
      AND su.is_active = true
      AND su.role = ANY(p_roles)
  );
$$;

-- List users in a store with profile info
CREATE OR REPLACE FUNCTION public.get_store_users(p_store_id uuid)
RETURNS TABLE(
  user_id uuid,
  full_name text,
  email text,
  role text,
  is_active boolean,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_user uuid := auth.uid();
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF NOT public.is_store_member(p_store_id, v_user) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  RETURN QUERY
  SELECT su.user_id, p.full_name, p.email, su.role, su.is_active, su.created_at, su.updated_at
  FROM public.store_users su
  LEFT JOIN public.profiles p ON p.id = su.user_id
  WHERE su.store_id = p_store_id
  ORDER BY p.full_name NULLS LAST, p.email;
END;
$$;

-- Add a user to a store by email (user must already exist)
CREATE OR REPLACE FUNCTION public.add_user_to_store(p_store_id uuid, p_email text, p_role text DEFAULT 'staff')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_target uuid;
  v_now timestamptz := timezone('utc'::text, now());
  v_allowed boolean;
BEGIN
  IF v_caller IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  -- Only owner/manager can manage members
  SELECT public.is_store_member(p_store_id, v_caller, ARRAY['owner','manager']) INTO v_allowed;
  IF NOT v_allowed THEN RAISE EXCEPTION 'Forbidden'; END IF;

  SELECT id INTO v_target FROM public.profiles WHERE lower(email) = lower(p_email);
  IF v_target IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', p_email;
  END IF;

  INSERT INTO public.store_users(store_id, user_id, role, is_active, created_at, updated_at)
  VALUES (p_store_id, v_target, COALESCE(p_role, 'staff'), true, v_now, v_now)
  ON CONFLICT (store_id, user_id) DO UPDATE
    SET role = EXCLUDED.role,
        is_active = true,
        updated_at = v_now;

  -- Ensure the user's profile points to this store so the UI can scope queries
  UPDATE public.profiles
  SET store_id = p_store_id,
      updated_at = v_now
  WHERE id = v_target AND (store_id IS NULL OR store_id <> p_store_id);
END;
$$;

-- Update a store user's role/status
CREATE OR REPLACE FUNCTION public.update_store_user(p_store_id uuid, p_user_id uuid, p_role text, p_is_active boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_caller uuid := auth.uid(); v_allowed boolean; v_now timestamptz := timezone('utc'::text, now());
BEGIN
  IF v_caller IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT public.is_store_member(p_store_id, v_caller, ARRAY['owner','manager']) INTO v_allowed;
  IF NOT v_allowed THEN RAISE EXCEPTION 'Forbidden'; END IF;

  UPDATE public.store_users
  SET role = COALESCE(p_role, role),
      is_active = COALESCE(p_is_active, is_active),
      updated_at = v_now
  WHERE store_id = p_store_id AND user_id = p_user_id;
END;
$$;

-- Remove a user from a store (prevent removing the last owner)
CREATE OR REPLACE FUNCTION public.remove_store_user(p_store_id uuid, p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_caller uuid := auth.uid(); v_allowed boolean; v_owner_count int;
BEGIN
  IF v_caller IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  SELECT public.is_store_member(p_store_id, v_caller, ARRAY['owner','manager']) INTO v_allowed;
  IF NOT v_allowed THEN RAISE EXCEPTION 'Forbidden'; END IF;

  SELECT COUNT(*) INTO v_owner_count FROM public.store_users WHERE store_id = p_store_id AND role = 'owner' AND is_active = true;
  IF v_owner_count <= 1 THEN
    -- Prevent removing the last active owner
    IF EXISTS (SELECT 1 FROM public.store_users WHERE store_id = p_store_id AND user_id = p_user_id AND role = 'owner' AND is_active = true) THEN
      RAISE EXCEPTION 'Cannot remove the last active owner';
    END IF;
  END IF;

  DELETE FROM public.store_users WHERE store_id = p_store_id AND user_id = p_user_id;

  -- If the user's profile was scoped to this store, clear it
  UPDATE public.profiles
  SET store_id = NULL,
      updated_at = timezone('utc'::text, now())
  WHERE id = p_user_id AND store_id = p_store_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_store_users(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_user_to_store(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_store_user(uuid, uuid, text, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_store_user(uuid, uuid) TO authenticated;

-- Keep profiles verification state in sync with auth.users
DO $$
BEGIN
  -- Add columns if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'email_verified'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN email_verified boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'verified_at'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN verified_at timestamptz;
  END IF;
END$$;

-- Function to sync profile verification state from auth.users
CREATE OR REPLACE FUNCTION public.sync_profile_verification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_verified boolean;
  v_when timestamptz;
BEGIN
  v_is_verified := (NEW.email_confirmed_at IS NOT NULL);
  v_when := NEW.email_confirmed_at;

  UPDATE public.profiles
  SET email_verified = v_is_verified,
      verified_at = COALESCE(v_when, verified_at),
      updated_at = timezone('utc'::text, now())
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

-- Triggers on auth.users to sync verification on insert/update
DROP TRIGGER IF EXISTS on_auth_user_verification_insert ON auth.users;
CREATE TRIGGER on_auth_user_verification_insert
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_verification();

DROP TRIGGER IF EXISTS on_auth_user_verification_update ON auth.users;
CREATE TRIGGER on_auth_user_verification_update
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_verification();
