-- This script should be run AFTER the user registers with demo@posystem.com
-- It will assign the demo user to the demo store

-- First, find the demo user ID (run this after user registers)
-- You'll need to replace 'USER_ID_HERE' with the actual user ID from auth.users table

-- Assign demo user to demo store as owner
INSERT INTO store_users (store_id, user_id, role, is_active)
SELECT 
  '550e8400-e29b-41d4-a716-446655440000' as store_id,
  id as user_id,
  'owner' as role,
  true as is_active
FROM auth.users 
WHERE email = 'demo@posystem.com'
ON CONFLICT (store_id, user_id) DO NOTHING;

-- Update the profile with store assignment
UPDATE profiles 
SET 
  store_id = '550e8400-e29b-41d4-a716-446655440000',
  role = 'owner',
  full_name = COALESCE(full_name, 'Demo User'),
  job_title = 'Store Owner'
WHERE email = 'demo@posystem.com';
