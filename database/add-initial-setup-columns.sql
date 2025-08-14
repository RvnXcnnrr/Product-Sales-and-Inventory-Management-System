-- Add columns for initial setup workflow
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS setup_complete BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS receipt_footer TEXT DEFAULT 'Thank you for your purchase!';
ALTER TABLE stores ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5,4) DEFAULT 0; -- override default if previously 0.10
-- Ensure timezone & currency remain existing; add constraint examples if desired
-- You may run: psql -f database/add-initial-setup-columns.sql
