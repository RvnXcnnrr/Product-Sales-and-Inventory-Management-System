-- Create function to handle new user registration and ensure they're added to store_users

-- First drop existing function/trigger if it exists
DROP FUNCTION IF EXISTS public.handle_new_user CASCADE;

-- Create the function that will be used by the trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_store_id UUID;
  v_existing_store UUID;
  v_role TEXT;
  v_now TIMESTAMPTZ := timezone('utc'::text, now());
  v_store_name TEXT;
  v_code TEXT;
BEGIN
  -- Determine intended role; default new users to 'owner' unless specified otherwise
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'owner');
  -- Normalize role values to supported set
  IF lower(v_role) = 'admin' THEN
    v_role := 'manager';
  END IF;
  IF v_role NOT IN ('owner','manager','staff') THEN
    v_role := 'owner';
  END IF;

  -- Ensure a profile exists (idempotent)
  INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'fullName', NEW.email),
    v_role,
    v_now,
    v_now
  )
  ON CONFLICT (id) DO NOTHING;

  -- If user already mapped to a store, make no new store; just ensure profile.store_id is set
  SELECT su.store_id INTO v_existing_store
  FROM public.store_users su
  WHERE su.user_id = NEW.id AND su.is_active = true
  LIMIT 1;

  IF v_existing_store IS NOT NULL THEN
    UPDATE public.profiles
    SET store_id = v_existing_store,
        updated_at = v_now,
        role = COALESCE(role, v_role)
    WHERE id = NEW.id;
    RETURN NEW;
  END IF;

  -- If metadata provided a store_id, use it; otherwise create a new store
  IF NEW.raw_user_meta_data->>'store_id' IS NOT NULL THEN
    v_store_id := (NEW.raw_user_meta_data->>'store_id')::uuid;
  ELSE
    -- Decide store name from metadata or derived from full_name/email
    v_store_name := COALESCE(
      NULLIF(TRIM(NEW.raw_user_meta_data->>'store_name'), ''),
      NULLIF(TRIM(NEW.raw_user_meta_data->>'storeName'), ''),
      NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''),
      NULLIF(TRIM(NEW.raw_user_meta_data->>'fullName'), ''),
      NEW.email
    );

    -- Generate a simple store code like ABC123
    v_code := upper(substr(regexp_replace(coalesce(v_store_name, 'My Store'), '[^a-zA-Z0-9]', '', 'g'), 1, 3))
             || lpad(floor(random()*1000)::int::text, 3, '0');

  INSERT INTO public.stores (name, code, currency, created_at, updated_at)
  VALUES (v_store_name, v_code, 'PHP', v_now, v_now)
    RETURNING id INTO v_store_id;
  END IF;

  -- Map the user to the store as the intended role (default owner) idempotently
  INSERT INTO public.store_users (user_id, store_id, role, is_active, created_at, updated_at)
  VALUES (NEW.id, v_store_id, v_role, TRUE, v_now, v_now)
  ON CONFLICT (user_id, store_id) DO UPDATE
    SET role = EXCLUDED.role,
        is_active = TRUE,
        updated_at = v_now;

  -- Update profile with store_id and role
  UPDATE public.profiles 
  SET store_id = v_store_id,
      role = v_role,
      updated_at = v_now
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on the auth.users table
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Optional: Add a trigger for user updates as well
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  WHEN (OLD.raw_user_meta_data IS DISTINCT FROM NEW.raw_user_meta_data)
  EXECUTE FUNCTION public.handle_new_user();
