-- Create function to handle new user registration and ensure they're added to store_users

-- First drop existing function/trigger if it exists
DROP FUNCTION IF EXISTS public.handle_new_user CASCADE;

-- Create the function that will be used by the trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  default_store_id UUID;
  store_record RECORD;
  user_role TEXT;
  timestamp TIMESTAMP;
BEGIN
  -- Set timestamp for consistent usage
  timestamp := NOW();
  
  -- Set default role for new users
  user_role := 'staff';
  
  -- Check if the user has specified a role in their metadata
  IF NEW.raw_user_meta_data->>'role' IS NOT NULL THEN
    user_role := NEW.raw_user_meta_data->>'role';
  END IF;
  
  -- First ensure the user has a profile
  INSERT INTO public.profiles (id, email, full_name, created_at, updated_at, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'fullName', NEW.email),
    timestamp,
    timestamp,
    user_role
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- Check if the user already has a store
  -- First try to use store_id from their metadata if available
  IF NEW.raw_user_meta_data->>'store_id' IS NOT NULL THEN
    default_store_id := NEW.raw_user_meta_data->>'store_id';
  ELSE
    -- If no store_id in metadata, try to find a default store
    SELECT id INTO default_store_id FROM public.stores LIMIT 1;
    
    -- If no store exists, create a default one
    IF default_store_id IS NULL THEN
      INSERT INTO public.stores (name, code, created_at, updated_at)
      VALUES (
        'Default Store',
        'DEF' || floor(random() * 1000)::text,
        timestamp,
        timestamp
      )
      RETURNING id INTO default_store_id;
    END IF;
  END IF;
  
  -- If we have a store_id, add the user to store_users if not already there
  IF default_store_id IS NOT NULL THEN
    -- Update the profile with store_id
    UPDATE public.profiles 
    SET store_id = default_store_id
    WHERE id = NEW.id AND (store_id IS NULL OR store_id <> default_store_id);
    
    -- Insert into store_users if not exists
    INSERT INTO public.store_users (user_id, store_id, role, is_active, created_at, updated_at)
    VALUES (
      NEW.id,
      default_store_id,
      user_role,
      TRUE,
      timestamp,
      timestamp
    )
    ON CONFLICT (user_id, store_id) DO NOTHING;
  END IF;
  
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
