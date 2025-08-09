-- Add a verification flag to profiles and keep it in sync with auth.users

-- 1) Add column to profiles if not exists
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_verified boolean NOT NULL DEFAULT false;

-- 2) Backfill current values from auth.users
UPDATE public.profiles p
SET is_verified = (u.email_confirmed_at IS NOT NULL),
    updated_at = timezone('utc'::text, now())
FROM auth.users u
WHERE p.id = u.id;

-- 3) Create a SECURITY DEFINER function to sync verification status
CREATE OR REPLACE FUNCTION public.sync_profile_verification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Update the linked profile's verification flag
  UPDATE public.profiles p
  SET is_verified = (NEW.email_confirmed_at IS NOT NULL),
      updated_at = timezone('utc'::text, now())
  WHERE p.id = NEW.id;

  RETURN NEW;
END;
$$;

-- 4) Create triggers on auth.users to keep profiles.is_verified in sync
DROP TRIGGER IF EXISTS on_auth_user_status_changed ON auth.users;
CREATE TRIGGER on_auth_user_status_changed
AFTER INSERT OR UPDATE OF email_confirmed_at ON auth.users
FOR EACH ROW
EXECUTE PROCEDURE public.sync_profile_verification();

-- 5) Permissions
GRANT EXECUTE ON FUNCTION public.sync_profile_verification() TO anon, authenticated;

-- Optional: quick sanity check (can be run manually)
-- SELECT p.id, p.email, p.is_verified, u.email_confirmed_at
-- FROM public.profiles p JOIN auth.users u ON p.id = u.id
-- ORDER BY u.created_at DESC LIMIT 20;
