-- EMERGENCY AUTH FIX - Run this in Supabase SQL Editor NOW
-- This will immediately fix your authentication issues

-- Step 1: Check current status
SELECT 
    'Current Users Status' as info,
    COUNT(*) as total_users,
    COUNT(email_confirmed_at) as confirmed_users,
    COUNT(*) - COUNT(email_confirmed_at) as unconfirmed_users
FROM auth.users;

-- Step 2: Show recent users and their confirmation status
SELECT 
    email,
    created_at,
    email_confirmed_at,
    CASE 
        WHEN email_confirmed_at IS NULL THEN '❌ NOT CONFIRMED - BLOCKING LOGIN'
        ELSE '✅ CONFIRMED - CAN LOGIN'
    END as status
FROM auth.users 
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- Step 3: IMMEDIATELY FIX - Auto-confirm all users (EMERGENCY SOLUTION)
UPDATE auth.users 
SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE email_confirmed_at IS NULL;

-- Step 4: Verify the fix worked
SELECT 
    'After Fix - Users Status' as info,
    COUNT(*) as total_users,
    COUNT(email_confirmed_at) as confirmed_users,
    COUNT(*) - COUNT(email_confirmed_at) as unconfirmed_users
FROM auth.users;

-- Step 5: Create auto-confirm trigger for future users (DEVELOPMENT ONLY)
CREATE OR REPLACE FUNCTION public.auto_confirm_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-confirm the user's email immediately
  NEW.email_confirmed_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS auto_confirm_user_trigger ON auth.users;

-- Create trigger to auto-confirm new users
CREATE TRIGGER auto_confirm_user_trigger
    BEFORE INSERT ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION public.auto_confirm_user();

-- Verification query
SELECT 'Setup Complete! All users should now be able to login.' as message;
