# Implementing the Store User Trigger in Supabase

This document explains how to implement the database trigger that ensures all new users are automatically added to the store_users table in Supabase.

## Why This is Important

The trigger provides a crucial server-side safety mechanism that ensures:

1. Every new user gets a profile record
2. Every user is associated with a store in the store_users table
3. Even if client-side code fails, users will still be properly set up

## Step 1: Access Supabase SQL Editor

1. Log in to your Supabase dashboard
2. Select your project
3. In the left sidebar, click on "SQL Editor"
4. Click "New Query" to create a new SQL script

## Step 2: Copy and Run the Trigger SQL

Copy the entire contents of the `supabase/functions/handle_new_user.sql` file and paste it into the SQL editor window.

The script will:
- Create a function called `handle_new_user()`
- Set up a trigger that runs this function whenever a new user signs up
- Set up a trigger that runs when user metadata is updated

## Step 3: Execute the SQL

Click the "Run" button to execute the SQL. You should see a success message.

## Step 4: Verify the Implementation

To verify the trigger is working correctly:

1. Go to "Database" → "Functions" in the left sidebar
2. You should see `handle_new_user()` listed as a function
3. Go to "Database" → "Triggers" in the left sidebar
4. You should see `on_auth_user_created` and `on_auth_user_updated` triggers listed

## Step 5: Testing the Trigger

Test the trigger by:

1. Creating a new user through the Supabase authentication UI or API
2. Check that the user appears in the `profiles` table
3. Check that the user appears in the `store_users` table

## What the Trigger Does

When a new user signs up:

1. Creates a profile for the user if one doesn't exist
2. Finds or creates a store for the user
3. Adds the user to the store_users table with the appropriate role
4. Updates the user's profile with the store_id

## Troubleshooting

If you encounter issues:

1. Check the Supabase logs for any error messages
2. Verify the tables exist: `profiles`, `stores`, and `store_users`
3. Ensure the schema matches the expected columns in the trigger function
4. Try manually running the function on an existing user to see if it works

## Manual Override

If you need to manually add a user to a store, you can use the Migration Helper tool at `/migration` or run the following SQL:

```sql
INSERT INTO store_users (user_id, store_id, role, is_active, created_at, updated_at)
VALUES (
  'user-id-here',
  'store-id-here',
  'staff',
  TRUE,
  NOW(),
  NOW()
)
ON CONFLICT (user_id, store_id) DO NOTHING;
```

## Need Help?

If you're having trouble implementing this trigger, please contact the development team for assistance.
