-- Disable Email Confirmation for Development/Testing
-- WARNING: Only use this in development environment!
-- This will auto-confirm all new users without email verification

-- Option 1: Manually confirm existing unconfirmed users
UPDATE auth.users 
SET email_confirmed_at = NOW()
WHERE email_confirmed_at IS NULL;

-- Option 2: Create a function to auto-confirm users on signup
CREATE OR REPLACE FUNCTION public.auto_confirm_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-confirm the user's email
  UPDATE auth.users 
  SET email_confirmed_at = NOW()
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-confirm users (DEVELOPMENT ONLY)
DROP TRIGGER IF EXISTS auto_confirm_user_trigger ON auth.users;
CREATE TRIGGER auto_confirm_user_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.auto_confirm_user();

-- To remove auto-confirmation later (for production), run:
-- DROP TRIGGER IF EXISTS auto_confirm_user_trigger ON auth.users;
-- DROP FUNCTION IF EXISTS public.auto_confirm_user();
