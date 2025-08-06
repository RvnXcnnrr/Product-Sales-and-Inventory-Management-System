-- Fix Authentication Issues
-- Run this SQL in your Supabase SQL Editor to resolve login problems

-- Step 1: Check current users and their confirmation status
SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  CASE 
    WHEN email_confirmed_at IS NULL THEN 'NOT CONFIRMED'
    ELSE 'CONFIRMED'
  END as status
FROM auth.users
ORDER BY created_at DESC;

-- Step 2: Auto-confirm all unconfirmed users (DEVELOPMENT ONLY)
UPDATE auth.users 
SET email_confirmed_at = COALESCE(email_confirmed_at, NOW())
WHERE email_confirmed_at IS NULL;

-- Step 3: Verify the fix worked
SELECT 
  COUNT(*) as total_users,
  COUNT(email_confirmed_at) as confirmed_users,
  COUNT(*) - COUNT(email_confirmed_at) as unconfirmed_users
FROM auth.users;

-- Step 4: Check if profiles exist for users
SELECT 
  u.email,
  u.email_confirmed_at,
  p.id as profile_exists,
  p.full_name,
  p.role
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
ORDER BY u.created_at DESC;

-- If profiles are missing, they'll be created by the handle_new_user trigger
-- You can manually create missing profiles if needed:
-- INSERT INTO profiles (id, email, full_name, role)
-- SELECT id, email, 'User Name', 'staff'
-- FROM auth.users
-- WHERE id NOT IN (SELECT id FROM profiles);
