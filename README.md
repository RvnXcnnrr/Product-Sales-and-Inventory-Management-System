# POS & Inventory Management System

A modern, responsive Point of Sale (POS) and Inventory Management System built with React.js and Supabase. Designed for small to medium retail businesses with offline-first capabilities and multi-store support.

## 🚀 Features

### Core Functionality
- **Point of Sale (POS)** - Fast and intuitive sales processing
- **Inventory Management** - Real-time stock tracking and alerts
- **Product Catalog** - Comprehensive product management
- **Sales Analytics** - Detailed reporting and insights
- **User Management** - Role-based access control
- **Offline Support** - Works without internet connec6tion

### Technical Features
- **Responsive Design** - Works on phones, tablets, and desktops
- **Real-time Updates** - Live inventory and sales tracking
- **Secure Authentication** - Supabase Auth integration
- **Modern UI/UX** - Clean, minimal design with Tailwind CSS
- **Progressive Web App** - Install as mobile/desktop app
- **Multi-store Ready** - Scalable architecture

## 🛠️ Tech Stack

- **Frontend**: React.js 18, Vite, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **State Management**: React Context API, TanStack Query
- **Charts**: Recharts
- **Forms**: React Hook Form
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

## 📋 Prerequisites

- Node.js 18+ and npm/yarn
- Supabase account (free tier available)
- Modern web browser

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd pos-inventory-system
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Environment Setup

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_APP_NAME="POS & Inventory Management"
VITE_APP_VERSION=1.0.0
VITE_ENABLE_OFFLINE_MODE=true
VITE_ENABLE_MULTI_STORE=true
VITE_ENABLE_ANALYTICS=true
VITE_DEV_MODE=true
VITE_DEFAULT_CURRENCY=PHP
```

## 📦 Database Setup

See [Supabase Setup](docs/setup/SUPABASE_SETUP.md) for complete setup instructions.

## 📚 Documentation

For more detailed documentation:

### Setup & Deployment
- [Supabase Setup](docs/setup/SUPABASE_SETUP.md)
- [General Setup](docs/setup/SETUP.md)
- [Deployment Guide](docs/setup/DEPLOY.md)
- [Netlify Deployment](docs/setup/NETLIFY_DEPLOY.md)
- [Supabase Trigger Setup](docs/setup/SUPABASE_TRIGGER_SETUP.md)
- [Authentication Security](docs/setup/AUTHENTICATION_SECURITY.md)

### Development
- [User Guide](docs/USER_GUIDE.md)
- [Developer Guide](docs/DEVELOPER_GUIDE.md)
- [API Documentation](docs/API_DOCS.md)

### Troubleshooting
- [Authentication Fixes](docs/troubleshooting/AUTHENTICATION_FIXES.md)
- [Email Verification](docs/troubleshooting/EMAIL_VERIFICATION_FIX.md)
- [Auth-Store User Fix](docs/troubleshooting/AUTH_STORE_USER_FIX.md)

## 🧩 Store Settings Persistence

Per-store settings are stored in two places:

- Base: `stores` (currency, tax_rate, timezone, contact info)
- Extended: `store_settings` (receipt footer, printing, payment method flags, notifications config)

Run the SQL in `database/enhanced-security-policies.sql` to create `store_settings` and its RLS policies. The Settings page will read and write using the current user's `profiles.store_id`.

### 4. Start the Development Server

```bash
# On Windows
./start.bat

# On macOS/Linux
./start.sh

# Or using npm directly
npm run dev
```

### 5. Authentication & Store Setup

> **IMPORTANT**: If you experience login issues, use the Migration Helper:
> 
> Navigate to: `http://localhost:5173/migration` after logging in.
> 
> This tool fixes user connections to stores. See [Authentication Fixes](docs/troubleshooting/AUTHENTICATION_FIXES.md) for details.
REACT_APP_DEV_MODE=true
```

### 4. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Copy your project URL and anon key to the `.env` file
3. Run the database migrations (see Database Setup section)

### 5. Start Development Server

```bash
npm run dev
# or
yarn dev
```

The application will be available at `http://localhost:3000`

## 🗄️ Database Setup

### Supabase Database Schema

Run these SQL commands in your Supabase SQL editor:

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

### Sample Data (Optional)

```sql
-- Insert sample store
INSERT INTO stores (id, name, code, address, phone, email) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 'Demo Store', 'DEMO001', '123 Main St, City, State 12345', '+1-555-123-4567', 'demo@store.com');

-- Insert sample categories
INSERT INTO categories (name, description, store_id) VALUES 
('Electronics', 'Electronic devices and accessories', '550e8400-e29b-41d4-a716-446655440000'),
('Clothing', 'Apparel and fashion items', '550e8400-e29b-41d4-a716-446655440000'),
('Food & Beverages', 'Food items and drinks', '550e8400-e29b-41d4-a716-446655440000');

-- You can add sample products and other data as needed
```

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Project Structure

### Project Structure

```
├── database/            # Database SQL files
│   └── demo/            # Demo data scripts
├── docs/                # Documentation
│   ├── setup/           # Setup and deployment guides
│   └── troubleshooting/ # Troubleshooting guides
├── public/              # Static assets
│   ├── icons/           # Application icons
│   └── screenshots/     # UI screenshots
├── scripts/             # Utility scripts
└── src/                 # Application source code
    ├── components/      # Reusable UI components
    │   ├── layout/      # Layout components (Header, Sidebar, etc.)
    │   └── ui/          # Basic UI components (Modal, Alert, etc.)
    ├── contexts/        # React Context providers
    ├── lib/             # Utility libraries and configurations
    ├── pages/           # Main application pages
    │   └── auth/        # Authentication pages
    └── utils/           # Utility functions
```

## 🚀 Deployment

### Frontend Deployment (Vercel/Netlify)

1. Connect your repository to Vercel or Netlify
2. Set environment variables in your hosting platform
3. Deploy with automatic builds on git push

### Supabase Configuration

1. Set up your production database with the provided schema
2. Configure Row Level Security policies
3. Set up authentication providers if needed

## 📱 Mobile/PWA Installation

The application is built as a Progressive Web App (PWA) and can be installed on mobile devices and desktops:

1. Open the app in a browser
2. Look for "Install" or "Add to Home Screen" option
3. Follow the installation prompts

## 🔒 Security Features

- Row Level Security (RLS) with Supabase
- Role-based access control
- Secure authentication with email/password
- Data encryption in transit and at rest
- XSS and CSRF protection

## 🌐 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 📊 Performance

- Lighthouse Score: 95+ (Performance, Accessibility, Best Practices, SEO)
- Bundle size: < 500KB gzipped
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3s

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📧 Email: support@possystem.com
- 📚 Documentation: [docs.possystem.com](https://docs.possystem.com)
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/pos-system/issues)

## 🙏 Acknowledgments

- React.js team for the amazing framework
- Supabase for the backend infrastructure
- Tailwind CSS for the styling system
- All open source contributors

---

**Built with ❤️ for small and medium businesses worldwide**
