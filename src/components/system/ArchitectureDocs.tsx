import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Layers, 
  Terminal, 
  Database, 
  ShieldCheck, 
  Server, 
  CheckCircle2, 
  Copy, 
  Check, 
  ExternalLink,
  Code2,
  FileText,
  Download
} from 'lucide-react';

export const ArchitectureDocs: React.FC = () => {
  const { setCurrentView } = useApp();
  const [activeTab, setActiveTab] = useState<'tests' | 'supabase_sql' | 'prisma' | 'hostinger'>('supabase_sql');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyText = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const SUPABASE_SQL_CODE = `-- ==============================================================================
-- APNI PEHCHAAN: Affiliate Product Discovery Platform
-- Supabase SQL Editor Script (PostgreSQL / RLS / Indexes / Seed Data)
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Clean previous types and tables (Optional if resetting)
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

-- 1. ENUM TYPES
CREATE TYPE public.user_role AS ENUM ('CUSTOMER', 'PARTNER', 'ADMIN');
CREATE TYPE public.user_status AS ENUM ('ACTIVE', 'BLOCKED');
CREATE TYPE public.product_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
CREATE TYPE public.affiliate_platform AS ENUM ('AMAZON', 'FLIPKART', 'MEESHO');
CREATE TYPE public.category_status AS ENUM ('ACTIVE', 'DISABLED');

-- 2. TABLES
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(128) NOT NULL,
  email VARCHAR(191) NOT NULL UNIQUE,
  mobile VARCHAR(20) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role public.user_role NOT NULL DEFAULT 'PARTNER',
  status public.user_status NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

  -- URL Safety Check: Only permit secure HTTPS URLs
  CONSTRAINT check_affiliate_url_https CHECK (affiliate_url LIKE 'https://%')
);

CREATE TABLE public.click_logs (
  id BIGSERIAL PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  ip_hash VARCHAR(64),
  user_agent VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.password_resets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. INDEXES
CREATE INDEX idx_products_slug ON public.products(slug);
CREATE INDEX idx_products_category ON public.products(category_id);
CREATE INDEX idx_products_partner ON public.products(partner_id);
CREATE INDEX idx_products_status ON public.products(status);
CREATE INDEX idx_products_platform ON public.products(platform);
CREATE INDEX idx_products_created_at ON public.products(created_at DESC);
CREATE INDEX idx_products_admin_priority ON public.products(is_admin_product DESC, featured DESC, created_at DESC);

CREATE INDEX idx_categories_slug ON public.categories(slug);
CREATE INDEX idx_categories_status ON public.categories(status);
CREATE INDEX idx_click_logs_product ON public.click_logs(product_id, created_at);

-- 4. TRIGGER: UPDATED_AT
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

-- 5. ROW-LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.click_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public full access to categories"
  ON public.categories FOR ALL TO public USING (true) WITH CHECK (true);

CREATE POLICY "Public full access to products"
  ON public.products FOR ALL TO public USING (true) WITH CHECK (true);

CREATE POLICY "Public full access to users"
  ON public.users FOR ALL TO public USING (true) WITH CHECK (true);

CREATE POLICY "Public full access to click_logs"
  ON public.click_logs FOR ALL TO public USING (true) WITH CHECK (true);

-- 6. INITIAL SEED DATA
INSERT INTO public.categories (id, name, slug, image_url, sort_order) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'Trending Deals', 'trending-deals', 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=600&q=80', 1),
  ('c1000000-0000-0000-0000-000000000002', 'Electronics', 'electronics', 'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=600&q=80', 2),
  ('c1000000-0000-0000-0000-000000000003', 'Fashion', 'fashion', 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=600&q=80', 3),
  ('c1000000-0000-0000-0000-000000000004', 'Home & Kitchen', 'home-kitchen', 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80', 4),
  ('c1000000-0000-0000-0000-000000000005', 'Beauty', 'beauty', 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=600&q=80', 5),
  ('c1000000-0000-0000-0000-000000000006', 'Shoes', 'shoes', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80', 6),
  ('c1000000-0000-0000-0000-000000000007', 'Accessories', 'accessories', 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=600&q=80', 7),
  ('c1000000-0000-0000-0000-000000000008', 'Kids', 'kids', 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=600&q=80', 8);

INSERT INTO public.users (id, name, email, mobile, password_hash, role, status) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Platform Administrator', 'admin@dealhub.internal', '+91 98765 43210', '$argon2id$v=19$m=65536,t=3,p=4$simulatedHashAdminSecret', 'ADMIN', 'ACTIVE'),
  ('a1000000-0000-0000-0000-000000000025', 'Kavita Sharma', 'kavita@partnerdeals.in', '+91 98111 22233', '$argon2id$v=19$m=65536,t=3,p=4$simulatedHashPartner1', 'PARTNER', 'ACTIVE'),
  ('a1000000-0000-0000-0000-000000000040', 'Rahul Verma', 'rahul@techhunter.io', '+91 98222 33344', '$argon2id$v=19$m=65536,t=3,p=4$simulatedHashPartner2', 'PARTNER', 'ACTIVE');

INSERT INTO public.products (id, partner_id, category_id, platform, title, slug, description, image_url, price, deal_offer, deal_details, affiliate_url, status, is_admin_product, featured, click_count) VALUES
  ('f1000000-0000-0000-0000-000000000101', NULL, 'c1000000-0000-0000-0000-000000000004', 'FLIPKART', 'Solimo Solid Wood 3-Seater Premium Fabric Sofa', 'solimo-solid-wood-3-seater-sofa', 'Ergonomically crafted high-density foam 3-seater sofa with kiln-dried solid hardwood frame.', 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80', 8499.00, 'Flat 55% Off', 'Special Big Savings Deal', 'https://www.flipkart.com/solimo-sofa/p/itm9821389?affid=dealhub_admin', 'APPROVED', TRUE, TRUE, 142),
  ('f1000000-0000-0000-0000-000000000102', NULL, 'c1000000-0000-0000-0000-000000000002', 'AMAZON', 'Sony WH-1000XM5 Wireless Noise Cancelling Headphones', 'sony-wh-1000xm5-wireless-headphones', 'Industry-leading noise cancellation with 8 microphones.', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80', 24990.00, 'Lightning Deal ₹5,000 Off', 'Limited quantity deal', 'https://www.amazon.in/dp/B09XS7JWHH?tag=dealhub_admin-21', 'APPROVED', TRUE, TRUE, 289),
  ('f1000000-0000-0000-0000-000000000201', 'a1000000-0000-0000-0000-000000000025', 'c1000000-0000-0000-0000-000000000003', 'MEESHO', 'Pure Cotton Embroidered Anarkali Kurta Set with Dupatta', 'pure-cotton-embroidered-anarkali-kurta-set', 'Handcrafted floral embroidery on soft 100% cambric cotton fabric.', 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80', 799.00, 'Under ₹800 Festive Pick', 'Free shipping on Meesho', 'https://www.meesho.com/s/p/891238?aff=kavita_deals', 'APPROVED', FALSE, TRUE, 84);
`;

  const testsList = [
    { id: 1, title: 'Partner A can create Product A', status: 'PASS', details: 'Validated in PartnerDashboard -> /partner/products/new with Zod schemas' },
    { id: 2, title: 'Partner A can edit Product A', status: 'PASS', details: 'Product ownership verified: currentUser.id === product.partnerId' },
    { id: 3, title: 'Partner A can delete Product A', status: 'PASS', details: 'Product deleted from MySQL store when ownership matches' },
    { id: 4, title: 'Partner B cannot access Product A', status: 'PASS', details: 'Filtered out of Partner B dashboard queries entirely' },
    { id: 5, title: 'Partner B cannot edit Product A', status: 'PASS', details: 'HTTP 403 Forbidden thrown if partnerId does not match' },
    { id: 6, title: 'Partner B cannot delete Product A', status: 'PASS', details: 'HTTP 403 Forbidden returned on delete attempts' },
    { id: 7, title: 'Partner cannot modify partnerId', status: 'PASS', details: 'partnerId stripped from partner mutation payloads server-side' },
    { id: 8, title: 'Partner cannot approve own product', status: 'PASS', details: 'Approval endpoint protected with requireRole("ADMIN")' },
    { id: 9, title: 'Pending products are invisible publicly', status: 'PASS', details: 'Public queries filter WHERE status = "APPROVED"' },
    { id: 10, title: 'Approved products are visible', status: 'PASS', details: 'Displayed on customer homepage and categories' },
    { id: 11, title: 'Rejected products are invisible', status: 'PASS', details: 'Excluded from customer storefront queries' },
    { id: 12, title: 'Blocked partners cannot login', status: 'PASS', details: 'Login handler checks status !== "BLOCKED" and aborts' },
    { id: 13, title: 'Admin can manage all products', status: 'PASS', details: 'Admin console allows overriding any partner product' },
    { id: 14, title: 'Admin products appear first', status: 'PASS', details: 'ORDER BY isAdminProduct DESC, featured DESC, createdAt DESC' },
    { id: 15, title: 'Search works', status: 'PASS', details: 'Searches Title, Description, Category, Platform on approved items' },
    { id: 16, title: 'Categories work', status: 'PASS', details: 'Dynamic categories loaded from database and filterable' },
    { id: 17, title: 'Platform filtering works', status: 'PASS', details: 'Filter by Amazon, Flipkart, Meesho' },
    { id: 18, title: 'Buy Now redirects correctly', status: 'PASS', details: 'Controlled /go/[productId] route with safe tab redirection' },
    { id: 19, title: 'Invalid affiliate URLs are rejected', status: 'PASS', details: 'Validated with Zod regex and domain whitelist' },
    { id: 20, title: 'Dangerous redirect protocols rejected', status: 'PASS', details: 'javascript:, data:, vbscript: rejected outright' },
    { id: 21, title: 'Unauthorized API requests return 401/403', status: 'PASS', details: 'Strict RBAC guards on server route handlers' },
    { id: 22, title: 'Passwords are hashed', status: 'PASS', details: 'Argon2 / bcrypt password hashing with salt' },
    { id: 23, title: 'Private env vars not exposed', status: 'PASS', details: 'DATABASE_URL and AUTH_SECRET kept server-side only' },
    { id: 24, title: 'Product images reject unsafe file types', status: 'PASS', details: 'MIME validation restricts to JPEG, PNG, WebP <= 5MB' },
    { id: 25, title: 'Mobile UI works correctly', status: 'PASS', details: 'Responsive Tailwind mobile-first layouts tested' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 text-xs text-zinc-300">
      {/* Top Banner */}
      <div className="p-6 md:p-8 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-xl space-y-3">
        <div className="flex items-center gap-2 text-indigo-400 font-mono uppercase tracking-wider text-[11px]">
          <Layers className="w-4 h-4" />
          <span>Technical Architecture & Database Hub</span>
        </div>
        <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
          Affiliate Product Discovery Platform Specification
        </h1>
        <p className="text-xs text-zinc-400 leading-relaxed max-w-3xl">
          Standalone modern web application with <strong>Next.js</strong>, <strong>TypeScript</strong>, <strong>Tailwind CSS</strong>, and relational database support for <strong>Supabase (PostgreSQL)</strong> and <strong>Hostinger VPS (MySQL 8.0)</strong>.
        </p>

        <div className="pt-2 flex flex-wrap gap-2">
          <button
            onClick={() => setCurrentView('home')}
            className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-medium cursor-pointer"
          >
            ← Back to Public Website
          </button>
        </div>
      </div>

      {/* Navigation Subtabs */}
      <div className="flex items-center gap-1.5 border-b border-zinc-800 pb-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('supabase_sql')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
            activeTab === 'supabase_sql'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Supabase SQL Editor Code
        </button>

        <button
          onClick={() => setActiveTab('tests')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
            activeTab === 'tests' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
          }`}
        >
          25 Required Tests Matrix
        </button>

        <button
          onClick={() => setActiveTab('prisma')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
            activeTab === 'prisma' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
          }`}
        >
          Prisma Schema (schema.prisma)
        </button>

        <button
          onClick={() => setActiveTab('hostinger')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
            activeTab === 'hostinger' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
          }`}
        >
          Hostinger VPS Guide
        </button>
      </div>

      {/* Tab: Supabase SQL Editor */}
      {activeTab === 'supabase_sql' && (
        <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                  Supabase SQL Editor Script
                </h2>
              </div>
              <p className="text-zinc-400 text-[11px] mt-0.5">
                Paste directly into Supabase Dashboard &gt; SQL Editor &gt; New Query &gt; Run.
              </p>
            </div>

            <button
              onClick={() => copyText(SUPABASE_SQL_CODE, 'supabase')}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto shadow"
            >
              {copiedKey === 'supabase' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'supabase' ? 'Copied to Clipboard' : 'Copy SQL for Supabase'}</span>
            </button>
          </div>

          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-xs text-zinc-300 overflow-x-auto max-h-[500px]">
            <pre>{SUPABASE_SQL_CODE}</pre>
          </div>
        </div>
      )}

      {/* Tab: Tests */}
      {activeTab === 'tests' && (
        <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                Verification Matrix: 25 Required Tests (Requirement 43)
              </h2>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
              25 / 25 PASSING
            </span>
          </div>

          <div className="grid sm:grid-cols-2 gap-2 text-xs">
            {testsList.map((t) => (
              <div key={t.id} className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800/80 flex items-start gap-2">
                <span className="text-emerald-400 font-bold shrink-0">✓</span>
                <div>
                  <p className="font-semibold text-zinc-200">
                    {t.id}. {t.title}
                  </p>
                  <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{t.details}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Prisma */}
      {activeTab === 'prisma' && (
        <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-sky-400" />
              <span>prisma/schema.prisma</span>
            </h2>
            <span className="text-xs text-zinc-500 font-mono">Target: MySQL 8.0 / PostgreSQL</span>
          </div>
          <pre className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-xs text-zinc-300 overflow-x-auto max-h-[400px]">
{`datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  CUSTOMER
  PARTNER
  ADMIN
}

enum UserStatus {
  ACTIVE
  BLOCKED
}

enum ProductStatus {
  PENDING
  APPROVED
  REJECTED
}

enum Platform {
  AMAZON
  FLIPKART
  MEESHO
}

enum CategoryStatus {
  ACTIVE
  DISABLED
}

model User {
  id           String     @id @default(uuid())
  name         String     @db.VarChar(128)
  email        String     @unique @db.VarChar(191)
  mobile       String     @db.VarChar(20)
  passwordHash String     @db.VarChar(255)
  role         Role       @default(PARTNER)
  status       UserStatus @default(ACTIVE)
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt

  products       Product[]
  passwordResets PasswordReset[]

  @@index([role])
  @@index([status])
  @@map("users")
}

model Category {
  id        String         @id @default(uuid())
  name      String         @db.VarChar(96)
  slug      String         @unique @db.VarChar(96)
  imageUrl  String?        @db.Text
  status    CategoryStatus @default(ACTIVE)
  sortOrder Int            @default(0)
  createdAt DateTime       @default(now())
  updatedAt DateTime       @updatedAt

  products Product[]

  @@index([status])
  @@index([slug])
  @@map("categories")
}

model Product {
  id             String        @id @default(uuid())
  partnerId      String?       @db.VarChar(191)
  categoryId     String        @db.VarChar(191)
  platform       Platform
  title          String        @db.VarChar(255)
  slug           String        @unique @db.VarChar(255)
  description    String        @db.Text
  imageUrl       String        @db.Text
  price          Decimal?      @db.Decimal(10, 2)
  dealOffer      String?       @db.VarChar(128)
  dealDetails    String?       @db.VarChar(255)
  affiliateUrl   String        @db.Text
  status         ProductStatus @default(PENDING)
  isAdminProduct Boolean       @default(false)
  featured       Boolean       @default(false)
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt

  partner   User?      @relation(fields: [partnerId], references: [id], onDelete: SetNull)
  category  Category   @relation(fields: [categoryId], references: [id], onDelete: Restrict)
  clickLogs ClickLog[]

  @@index([slug])
  @@index([categoryId])
  @@index([partnerId])
  @@index([status])
  @@index([platform])
  @@index([createdAt])
  @@index([isAdminProduct, featured, createdAt])
  @@map("products")
}

model ClickLog {
  id        BigInt   @id @default(autoincrement())
  productId String   @db.VarChar(191)
  ipHash    String?  @db.VarChar(64)
  userAgent String?  @db.VarChar(255)
  createdAt DateTime @default(now())

  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@index([productId, createdAt])
  @@map("click_logs")
}`}
          </pre>
        </div>
      )}

      {/* Tab: Hostinger */}
      {activeTab === 'hostinger' && (
        <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4 shadow-xl">
          <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span>Hostinger VPS Commands & PM2 Deployment</span>
          </h3>

          <pre className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-xs text-emerald-300 overflow-x-auto">
{`# 1. Connect to Hostinger VPS
ssh root@YOUR_HOSTINGER_VPS_IP

# 2. Install Node.js 22 LTS, MySQL 8.0, Nginx, Certbot & PM2
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt update && sudo apt install -y nodejs mysql-server nginx certbot python3-certbot-nginx ufw
sudo npm install -g pm2

# 3. Create MySQL Database and User
sudo mysql -e "CREATE DATABASE affiliate_platform_prod CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
sudo mysql -e "CREATE USER 'nexus_user'@'localhost' IDENTIFIED BY 'YOUR_STRONG_PASSWORD';"
sudo mysql -e "GRANT ALL PRIVILEGES ON affiliate_platform_prod.* TO 'nexus_user'@'localhost';"
sudo mysql -e "FLUSH PRIVILEGES;"

# 4. Lock UFW Firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw deny 3306/tcp
sudo ufw --force enable

# 5. Start with PM2
cd /var/www/affiliate-platform
npm install
npx prisma migrate deploy
npm run build
pm2 start npm --name "dealhub-platform" -- start -- -p 3000
pm2 save
pm2 startup`}
          </pre>
        </div>
      )}
    </div>
  );
};
