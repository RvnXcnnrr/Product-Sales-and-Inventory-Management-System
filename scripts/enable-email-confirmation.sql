-- Re-enable email confirmation by removing any dev auto-confirm logic
-- Run this in Supabase SQL editor (safe to run multiple times)

-- 1) Drop the auto-confirm trigger if it exists
DROP TRIGGER IF EXISTS auto_confirm_user_trigger ON auth.users;

-- 2) Drop the auto-confirm function if it exists
DROP FUNCTION IF EXISTS public.auto_confirm_user();

-- 3) Ensure profiles.is_verified stays in sync with auth.users (requires migration added earlier)
-- If you added public.sync_profile_verification() trigger, it will keep profiles.is_verified current.
-- Optionally re-sync existing profiles from auth.users:
-- UPDATE public.profiles p
-- SET is_verified = (u.email_confirmed_at IS NOT NULL),
--     updated_at = timezone('utc'::text, now())
-- FROM auth.users u
-- WHERE p.id = u.id;

-- IMPORTANT: Do NOT mass NULL out email_confirmed_at here; use Dashboard or target specific test accounts only.
