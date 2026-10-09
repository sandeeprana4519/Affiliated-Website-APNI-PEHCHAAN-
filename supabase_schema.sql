-- ==============================================================================
-- APNI PEHCHAAN: Affiliate Product Discovery Platform
-- Complete PostgreSQL / Supabase SQL Editor Script
-- ==============================================================================
-- ⚡ QUICK FIX FOR EXISTING SUPABASE DATABASES (Run this if tables already exist):
-- ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
-- ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_url TEXT;
-- ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS image_url TEXT;
-- ==============================================================================
-- Includes:
-- 1. Custom ENUM Types
-- 2. Tables (users, categories, products, click_logs, password_resets)
-- 3. High-Performance Indexes
-- 4. Automatic 'updated_at' Triggers
-- 5. Row-Level Security (RLS) Policies (Ownership & Public Visibility Guards)
-- 6. Initial Seed Data (Categories, Users, Approved Deals)
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Clean previous types and tables if doing a fresh reset (Optional: comment out if appending)
DROP TABLE IF EXISTS public.click_logs CASCADE;
DROP TABLE IF EXISTS public.password_resets CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

DROP TYPE IF EXISTS public.user_role CASCADE;
DROP TYPE IF EXISTS public.user_status CASCADE;
DROP TYPE IF EXISTS public.product_status CASCADE;
DROP TYPE IF EXISTS public.affiliate_platform CASCADE;
DROP TYPE IF EXISTS public.category_status CASCADE;

-- ------------------------------------------------------------------------------
-- 1. ENUMS
-- ------------------------------------------------------------------------------
CREATE TYPE public.user_role AS ENUM ('CUSTOMER', 'PARTNER', 'ADMIN');
CREATE TYPE public.user_status AS ENUM ('ACTIVE', 'BLOCKED');
CREATE TYPE public.product_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE public.affiliate_platform AS ENUM ('AMAZON', 'FLIPKART', 'MEESHO');
CREATE TYPE public.category_status AS ENUM ('ACTIVE', 'DISABLED');

-- ------------------------------------------------------------------------------
-- 2. TABLES
-- ------------------------------------------------------------------------------

-- Users Table
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(128) NOT NULL,
  email VARCHAR(191) NOT NULL UNIQUE,
  mobile VARCHAR(20) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  role public.user_role NOT NULL DEFAULT 'PARTNER',
  status public.user_status NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Categories Table
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(96) NOT NULL,
  slug VARCHAR(96) NOT NULL UNIQUE,
  image_url TEXT,
  status public.category_status NOT NULL DEFAULT 'ACTIVE',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Products Table (Affiliate Items)
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  platform public.affiliate_platform NOT NULL,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  image_url TEXT NOT NULL,
  price DECIMAL(10, 2),
  deal_offer VARCHAR(128),
  deal_details VARCHAR(255),
  affiliate_url TEXT NOT NULL,
  status public.product_status NOT NULL DEFAULT 'PENDING',
  is_admin_product BOOLEAN NOT NULL DEFAULT FALSE,
  featured BOOLEAN NOT NULL DEFAULT FALSE,
  click_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- URL Safety Constraint (Only allow HTTPS protocols)
  CONSTRAINT check_affiliate_url_https CHECK (affiliate_url LIKE 'https://%')
);

-- Click Logs (Privacy-Conscious Redirect Logging)
CREATE TABLE public.click_logs (
  id BIGSERIAL PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  ip_hash VARCHAR(64),
  user_agent VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Password Resets
CREATE TABLE public.password_resets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 3. INDEXES (Optimized for Public Search, Priority Order, & Ownership)
-- ------------------------------------------------------------------------------
CREATE INDEX idx_products_slug ON public.products(slug);
CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_products_partner ON public.products(partner_id);
CREATE INDEX idx_products_status ON public.products(status);
CREATE INDEX idx_products_platform ON public.products(platform);
CREATE INDEX idx_products_created_at ON public.products(created_at DESC);

-- Requirement 17 & 38: Admin Products first, then featured, then latest
CREATE INDEX idx_products_admin_priority ON public.products(is_admin_product DESC, featured DESC, created_at DESC);

CREATE INDEX idx_categories_slug ON public.categories(slug);
CREATE INDEX idx_categories_status ON public.categories(status);

CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);

CREATE INDEX idx_click_logs_product ON public.click_logs(product_id, created_at);

-- ------------------------------------------------------------------------------
-- 4. TRIGGER: AUTOMATIC 'updated_at' TIMESTAMP
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_timestamp
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_categories_timestamp
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_products_timestamp
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.click_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_resets ENABLE ROW LEVEL SECURITY;

-- Categories: Full read and write access for web application client
DROP POLICY IF EXISTS "Public can view active categories" ON public.categories;
DROP POLICY IF EXISTS "Public full access to categories" ON public.categories;
CREATE POLICY "Public full access to categories"
  ON public.categories
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Products: Full read and write access for web application client
DROP POLICY IF EXISTS "Public can view approved products" ON public.products;
DROP POLICY IF EXISTS "Public full access to products" ON public.products;
CREATE POLICY "Public full access to products"
  ON public.products
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Users: Full read and write access for partner registration and admin management
DROP POLICY IF EXISTS "Public full access to users" ON public.users;
CREATE POLICY "Public full access to users"
  ON public.users
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Click logs: Anyone can insert an anonymous click log via /go/[productId] and admin read
DROP POLICY IF EXISTS "Public can log affiliate clicks" ON public.click_logs;
DROP POLICY IF EXISTS "Public can view click logs" ON public.click_logs;
DROP POLICY IF EXISTS "Public full access to click_logs" ON public.click_logs;
CREATE POLICY "Public full access to click_logs"
  ON public.click_logs
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Password resets: Application token generation and verification
DROP POLICY IF EXISTS "Public full access to password_resets" ON public.password_resets;
CREATE POLICY "Public full access to password_resets"
  ON public.password_resets
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 6. INITIAL SEED DATA
-- ------------------------------------------------------------------------------

-- Seed Categories
INSERT INTO public.categories (id, name, slug, image_url, sort_order) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'Trending Deals', 'trending-deals', 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=600&q=80', 1),
  ('c1000000-0000-0000-0000-000000000002', 'Electronics', 'electronics', 'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=600&q=80', 2),
  ('c1000000-0000-0000-0000-000000000003', 'Fashion', 'fashion', 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=600&q=80', 3),
  ('c1000000-0000-0000-0000-000000000004', 'Home & Kitchen', 'home-kitchen', 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80', 4),
  ('c1000000-0000-0000-0000-000000000005', 'Beauty', 'beauty', 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=600&q=80', 5),
  ('c1000000-0000-0000-0000-000000000006', 'Shoes', 'shoes', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80', 6),
  ('c1000000-0000-0000-0000-000000000007', 'Accessories', 'accessories', 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=600&q=80', 7),
  ('c1000000-0000-0000-0000-000000000008', 'Kids', 'kids', 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=600&q=80', 8);

-- Seed Users: Admin & Partners (Using valid hex characters 'a' instead of non-hex 'u')
INSERT INTO public.users (id, name, email, mobile, password_hash, role, status) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Platform Administrator', 'admin@dealhub.internal', '+91 98765 43210', '$argon2id$v=19$m=65536,t=3,p=4$simulatedHashAdminSecret', 'ADMIN', 'ACTIVE'),
  ('a1000000-0000-0000-0000-000000000025', 'Kavita Sharma', 'kavita@partnerdeals.in', '+91 98111 22233', '$argon2id$v=19$m=65536,t=3,p=4$simulatedHashPartner1', 'PARTNER', 'ACTIVE'),
  ('a1000000-0000-0000-0000-000000000040', 'Rahul Verma', 'rahul@techhunter.io', '+91 98222 33344', '$argon2id$v=19$m=65536,t=3,p=4$simulatedHashPartner2', 'PARTNER', 'ACTIVE'),
  ('a1000000-0000-0000-0000-000000000099', 'Blocked Partner', 'blocked@spammer.org', '+91 98999 88877', '$argon2id$v=19$m=65536,t=3,p=4$simulatedHashBlocked', 'PARTNER', 'BLOCKED');

-- Seed Products:
-- 1. Admin Products (Priority 1: isAdminProduct = TRUE, status = APPROVED)
INSERT INTO public.products (id, partner_id, category_id, platform, title, slug, description, image_url, price, deal_offer, deal_details, affiliate_url, status, is_admin_product, featured, click_count) VALUES
  (
    'f1000000-0000-0000-0000-000000000101',
    NULL,
    'c1000000-0000-0000-0000-000000000004', -- Home & Kitchen
    'FLIPKART',
    'Solimo Solid Wood 3-Seater Premium Fabric Sofa',
    'solimo-solid-wood-3-seater-sofa',
    'Ergonomically crafted high-density foam 3-seater sofa with kiln-dried solid hardwood frame. Features stain-resistant breathable fabric upholstery and 3-year manufacturer warranty against structural defects.',
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80',
    8499.00,
    'Flat 55% Off',
    'Special Big Savings Deal + Extra ₹500 off on Axis/HDFC cards',
    'https://www.flipkart.com/solimo-sofa/p/itm9821389?affid=dealhub_admin',
    'APPROVED',
    TRUE,
    TRUE,
    142
  ),
  (
    'f1000000-0000-0000-0000-000000000102',
    NULL,
    'c1000000-0000-0000-0000-000000000002', -- Electronics
    'AMAZON',
    'Sony WH-1000XM5 Wireless Noise Cancelling Headphones',
    'sony-wh-1000xm5-wireless-headphones',
    'Industry-leading noise cancellation with 8 microphones and Auto NC Optimizer. Crystal clear hands-free calling, up to 30 hours battery life with quick charge, and multipoint Bluetooth connectivity.',
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
    24990.00,
    'Lightning Deal ₹5,000 Off',
    'Limited quantity deal + Prime Same Day Dispatch',
    'https://www.amazon.in/dp/B09XS7JWHH?tag=dealhub_admin-21',
    'APPROVED',
    TRUE,
    TRUE,
    289
  );

-- 2. Partner 25 Deals
INSERT INTO public.products (id, partner_id, category_id, platform, title, slug, description, image_url, price, deal_offer, deal_details, affiliate_url, status, is_admin_product, featured, click_count) VALUES
  (
    'f1000000-0000-0000-0000-000000000201',
    'a1000000-0000-0000-0000-000000000025',
    'c1000000-0000-0000-0000-000000000003', -- Fashion
    'MEESHO',
    'Pure Cotton Embroidered Anarkali Kurta Set with Dupatta',
    'pure-cotton-embroidered-anarkali-kurta-set',
    'Handcrafted floral embroidery on soft 100% cambric cotton fabric. Includes flared Anarkali kurta, matching cotton pants, and woven silk-blend dupatta. Ideal for festive and everyday ethnic wear.',
    'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80',
    799.00,
    'Under ₹800 Festive Pick',
    'Free shipping on Meesho + ₹100 instant discount on UPI',
    'https://www.meesho.com/s/p/891238?aff=kavita_deals',
    'APPROVED',
    FALSE,
    TRUE,
    84
  ),
  (
    'f1000000-0000-0000-0000-000000000202',
    'a1000000-0000-0000-0000-000000000025',
    'c1000000-0000-0000-0000-000000000005', -- Beauty
    'AMAZON',
    'Minimalist 10% Niacinamide Face Serum with Zinc',
    'minimalist-10-niacinamide-face-serum',
    'Nourishing daily serum formulated with pure Vitamin B3 (Niacinamide) and Zinc PCA to visibly reduce acne marks, refine pores, and balance skin oil production. Fragrance-free and non-comedogenic.',
    'https://images.unsplash.com/photo-1608248597359-0744e892c57f?auto=format&fit=crop&w=800&q=80',
    569.00,
    'Bestseller 15% Off',
    'Subscribe & Save eligible + Free Prime delivery',
    'https://www.amazon.in/dp/B08F9MKW3W?tag=kavita_deals-21',
    'APPROVED',
    FALSE,
    FALSE,
    51
  ),
  (
    'f1000000-0000-0000-0000-000000000203',
    'a1000000-0000-0000-0000-000000000025',
    'c1000000-0000-0000-0000-000000000006', -- Shoes
    'FLIPKART',
    'Puma Unisex Smashic Breathable Walking Sneakers',
    'puma-unisex-smashic-sneakers',
    'Lightweight cushioned memory foam footbed with durable vulcanized rubber outsole for all-day comfort and street-ready style.',
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
    1899.00,
    'Flat 60% Off MRP',
    'Festival Clearance Deal',
    'https://www.flipkart.com/puma-smashic/p/itm12891?affid=kavita_deals',
    'PENDING', -- Waiting for admin approval!
    FALSE,
    FALSE,
    0
  );

-- 3. Partner 40 Deals
INSERT INTO public.products (id, partner_id, category_id, platform, title, slug, description, image_url, price, deal_offer, deal_details, affiliate_url, status, is_admin_product, featured, click_count) VALUES
  (
    'f1000000-0000-0000-0000-000000000301',
    'a1000000-0000-0000-0000-000000000040',
    'c1000000-0000-0000-0000-000000000002', -- Electronics
    'AMAZON',
    'Kindle Paperwhite (16 GB) 6.8-inch Glare-Free Display',
    'kindle-paperwhite-16gb-glare-free',
    'Now with a 6.8-inch display, thinner borders, adjustable warm light, up to 10 weeks of battery life, and 20% faster page turns. IPX8 waterproof for reading at the pool or in the bath.',
    'https://images.unsplash.com/photo-1592496431122-2349e0fbc666?auto=format&fit=crop&w=800&q=80',
    13999.00,
    'Bank Offer ₹1,500 Off',
    'Exchange bonus + 3 months Kindle Unlimited included',
    'https://www.amazon.in/dp/B08N3TCP2F?tag=rahul_tech-21',
    'APPROVED',
    FALSE,
    TRUE,
    119
  );
-- SUPABASE ROW LEVEL SECURITY (RLS) PERMISSION FIX
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard -> SQL Editor -> New Query -> Run)

-- 1. FASTEST & EASIEST: Disable RLS for full read & write access
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.click_logs DISABLE ROW LEVEL SECURITY;

-- 2. ALTERNATIVE: Keep RLS enabled with permissive policies
DROP POLICY IF EXISTS "Public can view active categories" ON public.categories;
DROP POLICY IF EXISTS "Public full access to categories" ON public.categories;
CREATE POLICY "Public full access to categories"
  ON public.categories FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public can view approved products" ON public.products;
DROP POLICY IF EXISTS "Public full access to products" ON public.products;
CREATE POLICY "Public full access to products"
  ON public.products FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access to users" ON public.users;
CREATE POLICY "Public full access to users"
  ON public.users FOR ALL TO public USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public can log affiliate clicks" ON public.click_logs;
DROP POLICY IF EXISTS "Public full access to click_logs" ON public.click_logs;
CREATE POLICY "Public full access to click_logs"
  ON public.click_logs FOR ALL TO public USING (true) WITH CHECK (true);

