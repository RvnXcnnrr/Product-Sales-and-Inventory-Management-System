-- Quick fix for email confirmation issues
-- Run this SQL query in your Supabase SQL Editor to check current auth settings

-- Check current auth configuration
SELECT 
  raw_app_meta_data,
  raw_user_meta_data,
  email_confirmed_at,
  created_at
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;

-- Check if there are any pending email confirmations
SELECT 
  email,
  email_confirmed_at,
  CASE 
    WHEN email_confirmed_at IS NULL THEN 'Not Confirmed'
    ELSE 'Confirmed'
  END as confirmation_status
FROM auth.users
WHERE created_at > NOW() - INTERVAL '24 hours';
