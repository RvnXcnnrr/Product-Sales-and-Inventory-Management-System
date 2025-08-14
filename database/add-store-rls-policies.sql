-- RLS policies to allow authenticated users to create their first store and map themselves
-- Run this in Supabase SQL editor after deploying schema (adjust as needed for tighter security)

-- Allow inserting a store (basic check: must be logged in)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'stores' AND policyname = 'Users can create stores'
  ) THEN
    CREATE POLICY "Users can create stores" ON public.stores
      FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- Allow updating a store only if user is mapped to it
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'stores' AND policyname = 'Users can update assigned stores'
  ) THEN
    CREATE POLICY "Users can update assigned stores" ON public.stores
      FOR UPDATE USING (
        id IN (SELECT store_id FROM public.store_users su WHERE su.user_id = auth.uid() AND su.is_active = true)
      ) WITH CHECK (
        id IN (SELECT store_id FROM public.store_users su WHERE su.user_id = auth.uid() AND su.is_active = true)
      );
  END IF;
END $$;

-- Allow selecting newly created store (already have a SELECT policy, but ensure it exists). OPTIONAL
-- CREATE POLICY "Users can view assigned stores" ... (already in schema)

-- Policies for store_users
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'store_users' AND policyname = 'Users can insert own store mapping'
  ) THEN
    CREATE POLICY "Users can insert own store mapping" ON public.store_users
      FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'store_users' AND policyname = 'Users can view own store mappings'
  ) THEN
    CREATE POLICY "Users can view own store mappings" ON public.store_users
      FOR SELECT USING (user_id = auth.uid());
  END IF;
END $$;

-- Optional: allow updates to mapping (role changes) only if same user (adjust if managers can change others)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'store_users' AND policyname = 'Users can update own store mapping'
  ) THEN
    CREATE POLICY "Users can update own store mapping" ON public.store_users
      FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
END $$;
