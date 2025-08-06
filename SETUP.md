# Supabase Database Setup Guide

This guide will help you set up the Supabase database for the POS & Inventory Management System.

## Prerequisites

1. Supabase account (free tier available at [supabase.com](https://supabase.com))
2. Basic understanding of SQL

## Step 1: Create a New Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Choose your organization
4. Fill in project details:
   - **Name**: POS Inventory System
   - **Database Password**: Use a strong password
   - **Region**: Choose closest to your users
5. Click "Create new project"
6. Wait for the project to be created (takes 1-2 minutes)

## Step 2: Get Your Project Credentials

1. In your Supabase dashboard, go to **Settings** > **API**
2. Copy the following values:
   - **Project URL** (starts with `https://`)
   - **Anon Public Key** (starts with `eyJ`)
3. Save these for your `.env` file

## Step 3: Set Up Authentication

1. Go to **Authentication** > **Settings**
2. Configure the following:
   - **Site URL**: `http://localhost:3000` (for development)
   - **Redirect URLs**: Add your production domain when ready
3. Under **Auth Providers**, ensure Email is enabled
4. Optionally configure other providers (Google, GitHub, etc.)

## Step 4: Create Database Schema

1. Go to **SQL Editor** in your Supabase dashboard
2. Click **New Query**
3. Copy and paste the complete SQL schema from below
4. Click **Run** to execute

### Complete Database Schema

```sql
-- Enable RLS
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  email TEXT UNIQUE,
  phone TEXT,
  address TEXT,
  job_title TEXT,
  role TEXT DEFAULT 'staff' CHECK (role IN ('owner', 'manager', 'staff')),
  store_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create stores table
CREATE TABLE stores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  address TEXT,
  phone TEXT,
  email TEXT,
  tax_rate DECIMAL(5,4) DEFAULT 0.10,
  currency TEXT DEFAULT 'USD',
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create categories table
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create products table
CREATE TABLE products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  sku TEXT UNIQUE NOT NULL,
  barcode TEXT,
  description TEXT,
  category_id UUID REFERENCES categories(id),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  cost_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  selling_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  min_stock_level INTEGER DEFAULT 0,
  max_stock_level INTEGER DEFAULT 1000,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create transactions table
CREATE TABLE transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_number TEXT UNIQUE NOT NULL,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount_percentage DECIMAL(5,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  tax_rate DECIMAL(5,4) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_method TEXT CHECK (payment_method IN ('cash', 'card', 'digital_wallet', 'other')),
  amount_received DECIMAL(10,2),
  change_amount DECIMAL(10,2),
  status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled', 'refunded')),
  notes TEXT,
  processed_by UUID REFERENCES auth.users(id),
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create transaction_items table
CREATE TABLE transaction_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID REFERENCES transactions(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  product_name TEXT NOT NULL,
  product_sku TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create inventory_logs table
CREATE TABLE inventory_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('stock_in', 'stock_out', 'adjustment', 'transfer')),
  quantity_change INTEGER NOT NULL,
  previous_quantity INTEGER NOT NULL,
  new_quantity INTEGER NOT NULL,
  reason TEXT,
  reference_type TEXT, -- 'sale', 'purchase', 'adjustment', etc.
  reference_id UUID,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create store_users table (for multi-store management)
CREATE TABLE store_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'staff' CHECK (role IN ('owner', 'manager', 'staff')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(store_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX idx_products_store_id ON products(store_id);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_transactions_store_id ON transactions(store_id);
CREATE INDEX idx_transactions_processed_at ON transactions(processed_at);
CREATE INDEX idx_transaction_items_transaction_id ON transaction_items(transaction_id);
CREATE INDEX idx_transaction_items_product_id ON transaction_items(product_id);
CREATE INDEX idx_inventory_logs_product_id ON inventory_logs(product_id);
CREATE INDEX idx_inventory_logs_created_at ON inventory_logs(created_at);

-- Set up Row Level Security (RLS) policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_users ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Store policies (users can only access their assigned stores)
CREATE POLICY "Users can view assigned stores" ON stores FOR SELECT USING (
  id IN (SELECT store_id FROM store_users WHERE user_id = auth.uid() AND is_active = true)
);

-- Products policies
CREATE POLICY "Users can view store products" ON products FOR SELECT USING (
  store_id IN (SELECT store_id FROM store_users WHERE user_id = auth.uid() AND is_active = true)
);

CREATE POLICY "Users can manage store products" ON products FOR ALL USING (
  store_id IN (SELECT store_id FROM store_users WHERE user_id = auth.uid() AND role IN ('owner', 'manager') AND is_active = true)
);

-- Transactions policies
CREATE POLICY "Users can view store transactions" ON transactions FOR SELECT USING (
  store_id IN (SELECT store_id FROM store_users WHERE user_id = auth.uid() AND is_active = true)
);

CREATE POLICY "Users can create transactions" ON transactions FOR INSERT WITH CHECK (
  store_id IN (SELECT store_id FROM store_users WHERE user_id = auth.uid() AND is_active = true)
);

-- Transaction items policies
CREATE POLICY "Users can view transaction items" ON transaction_items FOR SELECT USING (
  transaction_id IN (
    SELECT id FROM transactions WHERE store_id IN (
      SELECT store_id FROM store_users WHERE user_id = auth.uid() AND is_active = true
    )
  )
);

-- Inventory logs policies
CREATE POLICY "Users can view inventory logs" ON inventory_logs FOR SELECT USING (
  store_id IN (SELECT store_id FROM store_users WHERE user_id = auth.uid() AND is_active = true)
);

-- Functions and triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_store_users_updated_at BEFORE UPDATE ON store_users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user registration
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to update inventory on transaction
CREATE OR REPLACE FUNCTION update_inventory_on_sale()
RETURNS TRIGGER AS $$
BEGIN
  -- Update product stock
  UPDATE products 
  SET stock_quantity = stock_quantity - NEW.quantity,
      updated_at = timezone('utc'::text, now())
  WHERE id = NEW.product_id;
  
  -- Log inventory change
  INSERT INTO inventory_logs (
    product_id,
    store_id,
    type,
    quantity_change,
    previous_quantity,
    new_quantity,
    reason,
    reference_type,
    reference_id,
    created_by
  ) VALUES (
    NEW.product_id,
    (SELECT store_id FROM transactions WHERE id = NEW.transaction_id),
    'stock_out',
    -NEW.quantity,
    (SELECT stock_quantity + NEW.quantity FROM products WHERE id = NEW.product_id),
    (SELECT stock_quantity FROM products WHERE id = NEW.product_id),
    'Sale transaction',
    'sale',
    NEW.transaction_id,
    (SELECT processed_by FROM transactions WHERE id = NEW.transaction_id)
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update inventory on sale
CREATE OR REPLACE TRIGGER update_inventory_after_sale
  AFTER INSERT ON transaction_items
  FOR EACH ROW EXECUTE PROCEDURE update_inventory_on_sale();
```

## Step 5: Add Sample Data (Optional)

Run this SQL to add sample data for testing:

```sql
-- Insert sample store
INSERT INTO stores (id, name, code, address, phone, email) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 'Demo Store', 'DEMO001', '123 Main St, City, State 12345', '+1-555-123-4567', 'demo@store.com');

-- Insert sample categories
INSERT INTO categories (name, description, store_id) VALUES 
('Electronics', 'Electronic devices and accessories', '550e8400-e29b-41d4-a716-446655440000'),
('Clothing', 'Apparel and fashion items', '550e8400-e29b-41d4-a716-446655440000'),
('Food & Beverages', 'Food items and drinks', '550e8400-e29b-41d4-a716-446655440000'),
('Books', 'Books and educational materials', '550e8400-e29b-41d4-a716-446655440000'),
('Home & Garden', 'Home improvement and garden supplies', '550e8400-e29b-41d4-a716-446655440000');

-- Insert sample products
INSERT INTO products (name, sku, barcode, description, category_id, store_id, cost_price, selling_price, stock_quantity, min_stock_level) VALUES 
('iPhone 15 Pro', 'IP15P-001', '1234567890123', 'Latest iPhone with advanced features', (SELECT id FROM categories WHERE name = 'Electronics' LIMIT 1), '550e8400-e29b-41d4-a716-446655440000', 800.00, 999.00, 25, 5),
('Samsung Galaxy S24', 'SGS24-001', '1234567890124', 'Flagship Samsung smartphone', (SELECT id FROM categories WHERE name = 'Electronics' LIMIT 1), '550e8400-e29b-41d4-a716-446655440000', 700.00, 899.00, 30, 5),
('MacBook Air M3', 'MBA-M3-001', '1234567890125', 'Apple laptop with M3 chip', (SELECT id FROM categories WHERE name = 'Electronics' LIMIT 1), '550e8400-e29b-41d4-a716-446655440000', 1000.00, 1299.00, 15, 3),
('Men''s T-Shirt', 'MT-001', '1234567890126', 'Cotton t-shirt for men', (SELECT id FROM categories WHERE name = 'Clothing' LIMIT 1), '550e8400-e29b-41d4-a716-446655440000', 8.00, 19.99, 100, 20),
('Women''s Jeans', 'WJ-001', '1234567890127', 'Denim jeans for women', (SELECT id FROM categories WHERE name = 'Clothing' LIMIT 1), '550e8400-e29b-41d4-a716-446655440000', 25.00, 59.99, 75, 15),
('Coffee Premium Blend', 'CPB-001', '1234567890128', 'High-quality coffee beans', (SELECT id FROM categories WHERE name = 'Food & Beverages' LIMIT 1), '550e8400-e29b-41d4-a716-446655440000', 8.00, 15.99, 200, 50),
('Energy Drink', 'ED-001', '1234567890129', 'Refreshing energy drink', (SELECT id FROM categories WHERE name = 'Food & Beverages' LIMIT 1), '550e8400-e29b-41d4-a716-446655440000', 1.50, 3.99, 150, 30),
('Programming Book', 'PB-001', '1234567890130', 'Learn programming fundamentals', (SELECT id FROM categories WHERE name = 'Books' LIMIT 1), '550e8400-e29b-41d4-a716-446655440000', 20.00, 39.99, 50, 10),
('Garden Hose', 'GH-001', '1234567890131', '50ft garden hose', (SELECT id FROM categories WHERE name = 'Home & Garden' LIMIT 1), '550e8400-e29b-41d4-a716-446655440000', 15.00, 29.99, 25, 5),
('Plant Fertilizer', 'PF-001', '1234567890132', 'Organic plant fertilizer', (SELECT id FROM categories WHERE name = 'Home & Garden' LIMIT 1), '550e8400-e29b-41d4-a716-446655440000', 8.00, 16.99, 40, 10);
```

## Step 6: Set Up Storage (Optional)

If you plan to upload product images:

1. Go to **Storage** in your Supabase dashboard
2. Create a new bucket called `product-images`
3. Set the bucket to **Public** if you want direct image access
4. Configure RLS policies for the storage bucket

## Step 7: Configure Environment Variables

1. Copy `.env.template` to `.env` in your project root
2. Fill in your Supabase credentials:

```env
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

## Step 8: Test the Connection

1. Start your development server: `npm run dev`
2. Try registering a new user
3. Check if the profile is created in the `profiles` table
4. Test the application functionality

## Troubleshooting

### Common Issues

1. **RLS Policy Errors**: Make sure all RLS policies are properly created
2. **Authentication Issues**: Check your Site URL and Redirect URLs in Auth settings
3. **Connection Errors**: Verify your Project URL and Anon Key are correct
4. **Permission Errors**: Ensure users are properly assigned to stores via the `store_users` table

### Helpful SQL Queries

```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Check RLS policies
SELECT schemaname, tablename, policyname FROM pg_policies;

-- View user profiles
SELECT * FROM profiles;

-- Check store assignments
SELECT * FROM store_users;
```

## Production Deployment

1. **Database Migration**: Use the same SQL schema in production
2. **Environment Variables**: Update URLs for production
3. **RLS Policies**: Ensure all security policies are in place
4. **Backup**: Set up regular database backups
5. **Monitoring**: Enable logging and monitoring in Supabase

## Security Best Practices

1. Never commit your `.env` file
2. Use strong passwords for database users
3. Regularly review and update RLS policies
4. Monitor authentication logs
5. Keep Supabase client libraries updated
6. Use HTTPS in production
7. Implement proper input validation
8. Regular security audits

## Support

If you encounter issues:

1. Check the [Supabase Documentation](https://supabase.com/docs)
2. Review the application logs
3. Check the browser developer console
4. Verify your database schema matches exactly
5. Test with sample data first

---

**Next Steps**: After completing this setup, you can run `npm run dev` to start developing with a fully functional backend!
