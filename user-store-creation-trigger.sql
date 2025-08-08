-- Drop and recreate the store_users creation trigger
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  default_store_id UUID;
  store_name TEXT;
  store_code TEXT;
BEGIN
  -- Create profile for the new user
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    role,
    created_at,
    updated_at
  ) VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'staff'),
    NOW(),
    NOW()
  );
  
  -- Check if we need to create a store
  store_name := NEW.raw_user_meta_data->>'store_name';
  
  IF store_name IS NOT NULL AND store_name != '' THEN
    -- Generate a unique store code
    store_code := UPPER(SUBSTRING(store_name FROM 1 FOR 3)) || FLOOR(RANDOM() * 1000)::TEXT;
    
    -- Create a new store
    INSERT INTO public.stores (
      name,
      code,
      created_at,
      updated_at
    ) VALUES (
      store_name,
      store_code,
      NOW(),
      NOW()
    )
    RETURNING id INTO default_store_id;
    
    -- Update the profile with the store_id
    UPDATE public.profiles
    SET store_id = default_store_id
    WHERE id = NEW.id;
    
    -- Add user to store_users
    INSERT INTO public.store_users (
      store_id,
      user_id,
      role,
      is_active,
      created_at,
      updated_at
    ) VALUES (
      default_store_id,
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'role', 'owner'),
      TRUE,
      NOW(),
      NOW()
    );
    
    RAISE NOTICE 'Created store % with ID % and added user % to it', store_name, default_store_id, NEW.id;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Failed to create profile or store for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
