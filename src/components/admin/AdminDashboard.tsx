import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Product, Platform, Category, User, ProductStatus } from '../../types';
import { normalizeSupabaseUrl, getViteEnvStatus } from '../../lib/supabase';
import { 
  Shield, 
  Users, 
  Package, 
  Layers, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  Search, 
  ExternalLink, 
  AlertCircle,
  Eye,
  EyeOff,
  Settings,
  Lock,
  Unlock,
  Sparkles,
  Edit3,
  Upload,
  Image as ImageIcon,
  Copy,
  Check,
  Download,
  RefreshCw,
  Globe,
  Key,
  Phone,
  Mail,
  ToggleLeft,
  ToggleRight,
  Database,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';

const PRESET_PRODUCT_IMAGES = [
  { label: 'Headphones', url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80' },
  { label: 'Sofa / Furniture', url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=800&q=80' },
  { label: 'Sneakers / Shoes', url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80' },
  { label: 'Smartwatch', url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80' },
  { label: 'Skincare Serum', url: 'https://images.unsplash.com/photo-1608248597359-0744e892c57f?auto=format&fit=crop&w=800&q=80' },
  { label: 'Ethnic Fashion', url: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80' },
  { label: 'Ultrabook / Tech', url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80' },
  { label: 'DSLR Camera', url: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=800&q=80' }
];

const PRESET_CATEGORY_IMAGES = [
  { label: 'Trending Deals', url: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=600&q=80' },
  { label: 'Electronics', url: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=600&q=80' },
  { label: 'Fashion', url: 'https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=600&q=80' },
  { label: 'Home & Kitchen', url: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80' },
  { label: 'Beauty', url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=600&q=80' },
  { label: 'Shoes', url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80' },
  { label: 'Accessories', url: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?auto=format&fit=crop&w=600&q=80' },
  { label: 'Kids', url: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=600&q=80' }
];

export const AdminDashboard: React.FC = () => {
  const { 
    currentUser, 
    products, 
    adminApproveProduct, 
    adminRejectProduct, 
    adminToggleHideProduct,
    adminCreateProduct,
    adminUpdateProduct,
    adminDeleteProduct,
    partners, 
    toggleBlockPartner,
    adminUpdatePartner,
    adminDeletePartner,
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    clickLogs,
    clearClickLogs,
    platformSettings,
    updatePlatformSettings,
    exportPlatformDataJson,
    resetToInitialSeeds,
    supabaseConfig,
    updateSupabaseConfig,
    testDatabaseConnection,
    syncWithDatabase,
    isSyncingWithDb,
    pushAllLocalToDatabase,
    logout,
    setCurrentView,
    showToast
  } = useApp();

  const [activeTab, setActiveTab] = useState<'pending' | 'products' | 'partners' | 'categories' | 'add_admin_product' | 'settings' | 'database'>('pending');
  const [productSearch, setProductSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [partnerSearch, setPartnerSearch] = useState('');

  // Database Connection states
  const envStatus = getViteEnvStatus();
  const [dbUrl, setDbUrl] = useState(supabaseConfig.url || envStatus.url || '');
  const [dbKey, setDbKey] = useState(supabaseConfig.anonKey || '');
  const [isTestingDb, setIsTestingDb] = useState(false);
  const [isPushingDb, setIsPushingDb] = useState(false);
  const [copiedRlsSql, setCopiedRlsSql] = useState(false);
  const [dbTestResult, setDbTestResult] = useState<{ 
    success: boolean; 
    message: string; 
    rlsWarning?: boolean; 
    tableCounts?: { categories: number; products: number; users: number; clickLogs?: number };
    permissions?: { categories: string; products: string; users: string; clickLogs: string };
  } | null>(null);

  const RLS_FIX_SQL = `-- SUPABASE ROW LEVEL SECURITY (RLS) PERMISSION FIX
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
  ON public.click_logs FOR ALL TO public USING (true) WITH CHECK (true);`;

  // Modals state
  const [selectedPartnerDetails, setSelectedPartnerDetails] = useState<User | null>(null);
  const [editingPartner, setEditingPartner] = useState<User | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'product' | 'partner' | 'category'; id: string; name: string } | null>(null);

  // Password visibility in Partner Details Modal
  const [showPasswordHash, setShowPasswordHash] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Edit Partner Form state
  const [editPartnerName, setEditPartnerName] = useState('');
  const [editPartnerEmail, setEditPartnerEmail] = useState('');
  const [editPartnerMobile, setEditPartnerMobile] = useState('');
  const [editPartnerNewPassword, setEditPartnerNewPassword] = useState('');
  const [editPartnerStatus, setEditPartnerStatus] = useState<'ACTIVE' | 'BLOCKED'>('ACTIVE');

  // Edit Product Form state
  const [editProdTitle, setEditProdTitle] = useState('');
  const [editProdDesc, setEditProdDesc] = useState('');
  const [editProdPlatform, setEditProdPlatform] = useState<Platform>('AMAZON');
  const [editProdCatId, setEditProdCatId] = useState('');
  const [editProdPrice, setEditProdPrice] = useState('');
  const [editProdDealOffer, setEditProdDealOffer] = useState('');
  const [editProdDealDetails, setEditProdDealDetails] = useState('');
  const [editProdAffiliateUrl, setEditProdAffiliateUrl] = useState('');
  const [editProdImageUrl, setEditProdImageUrl] = useState('');
  const [editProdStatus, setEditProdStatus] = useState<ProductStatus>('APPROVED');
  const [editProdFeatured, setEditProdFeatured] = useState(false);

  // Category modal states
  const [newCatName, setNewCatName] = useState('');
  const [newCatSlug, setNewCatSlug] = useState('');
  const [newCatImage, setNewCatImage] = useState(PRESET_CATEGORY_IMAGES[0].url);
  const [editCatName, setEditCatName] = useState('');
  const [editCatSlug, setEditCatSlug] = useState('');
  const [editCatImage, setEditCatImage] = useState('');
  const [editCatStatus, setEditCatStatus] = useState<'ACTIVE' | 'DISABLED'>('ACTIVE');

  // Admin Direct Product Creation Form state
  const [adminPlatform, setAdminPlatform] = useState<Platform>('AMAZON');
  const [adminCatId, setAdminCatId] = useState(categories[0]?.id || '');
  const [adminTitle, setAdminTitle] = useState('');
  const [adminDesc, setAdminDesc] = useState('');
  const [adminImage, setAdminImage] = useState('https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80');
  const [adminPrice, setAdminPrice] = useState('9999');
  const [adminDealOffer, setAdminDealOffer] = useState('Editor Exclusive 50% Off');
  const [adminDealDetails, setAdminDealDetails] = useState('Staff Pick Verified Deal');
  const [adminAffiliateUrl, setAdminAffiliateUrl] = useState('https://www.amazon.in/dp/B09XS7JWHH?tag=dealhub_admin-21');
  const [adminFeatured, setAdminFeatured] = useState(true);

  // Settings local edit state
  const [settingsForm, setSettingsForm] = useState(platformSettings);
  const [newDomainInput, setNewDomainInput] = useState('');

  // File input refs for uploading images
  const adminImageFileInputRef = useRef<HTMLInputElement>(null);
  const editProdImageFileInputRef = useRef<HTMLInputElement>(null);
  const newCatImageFileInputRef = useRef<HTMLInputElement>(null);
  const editCatImageFileInputRef = useRef<HTMLInputElement>(null);

  const pendingProducts = products.filter((p) => p.status === 'PENDING');
  const approvedProducts = products.filter((p) => p.status === 'APPROVED');
  const rejectedProducts = products.filter((p) => p.status === 'REJECTED');

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(productSearch.toLowerCase()) ||
                          p.platform.toLowerCase().includes(productSearch.toLowerCase()) ||
                          (p.partnerName && p.partnerName.toLowerCase().includes(productSearch.toLowerCase()));
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredPartners = partners.filter((pt) => 
    pt.name.toLowerCase().includes(partnerSearch.toLowerCase()) ||
    pt.email.toLowerCase().includes(partnerSearch.toLowerCase()) ||
    pt.mobile.includes(partnerSearch) ||
    pt.id.toLowerCase().includes(partnerSearch.toLowerCase())
  );

  // File upload helper
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (JPEG, PNG, WEBP).', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image size exceeds 5MB limit.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setter(base64);
      showToast('Image uploaded and loaded into preview!', 'success');
    };
    reader.readAsDataURL(file);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    showToast(`Copied ${label} to clipboard!`, 'success');
    setTimeout(() => setCopiedText(null), 2500);
  };

  // Open Partner Edit Modal
  const openEditPartner = (p: User) => {
    setEditingPartner(p);
    setEditPartnerName(p.name);
    setEditPartnerEmail(p.email);
    setEditPartnerMobile(p.mobile);
    setEditPartnerNewPassword('');
    setEditPartnerStatus(p.status);
  };

  // Submit Partner Edit
  const handleSavePartner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPartner) return;
    const res = adminUpdatePartner(editingPartner.id, {
      name: editPartnerName,
      email: editPartnerEmail,
      mobile: editPartnerMobile,
      status: editPartnerStatus,
      plainPassword: editPartnerNewPassword || undefined,
    });
    if (res.success) {
      setEditingPartner(null);
      if (selectedPartnerDetails?.id === editingPartner.id) {
        setSelectedPartnerDetails((prev) => prev ? {
          ...prev,
          name: editPartnerName,
          email: editPartnerEmail,
          mobile: editPartnerMobile,
          status: editPartnerStatus,
        } : null);
      }
    }
  };

  // Open Product Edit Modal
  const openEditProduct = (p: Product) => {
    setEditingProduct(p);
    setEditProdTitle(p.title);
    setEditProdDesc(p.description);
    setEditProdPlatform(p.platform);
    setEditProdCatId(p.categoryId);
    setEditProdPrice(p.price ? p.price.toString() : '');
    setEditProdDealOffer(p.dealOffer || '');
    setEditProdDealDetails(p.dealDetails || '');
    setEditProdAffiliateUrl(p.affiliateUrl);
    setEditProdImageUrl(p.imageUrl);
    setEditProdStatus(p.status);
    setEditProdFeatured(p.featured);
  };

  // Submit Product Edit
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    const res = adminUpdateProduct(editingProduct.id, {
      title: editProdTitle,
      description: editProdDesc,
      platform: editProdPlatform,
      categoryId: editProdCatId,
      price: editProdPrice ? parseFloat(editProdPrice) : null,
      dealOffer: editProdDealOffer || null,
      dealDetails: editProdDealDetails || null,
      affiliateUrl: editProdAffiliateUrl,
      imageUrl: editProdImageUrl,
      status: editProdStatus,
      featured: editProdFeatured,
    });
    if (res.success) {
      setEditingProduct(null);
    }
  };

  // Open Category Edit Modal
  const openEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setEditCatName(cat.name);
    setEditCatSlug(cat.slug);
    setEditCatImage(cat.imageUrl || PRESET_CATEGORY_IMAGES[0].url);
    setEditCatStatus(cat.status);
  };

  // Submit Category Edit
  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    updateCategory(editingCategory.id, editCatName, editCatSlug, editCatStatus, editCatImage);
    setEditingCategory(null);
  };

  // Admin Product Submit
  const handleAdminProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminTitle || !adminAffiliateUrl) return;

    adminCreateProduct({
      platform: adminPlatform,
      categoryId: adminCatId || categories[0]?.id,
      title: adminTitle,
      description: adminDesc,
      imageUrl: adminImage,
      price: adminPrice ? parseFloat(adminPrice) : null,
      dealOffer: adminDealOffer || null,
      dealDetails: adminDealDetails || null,
      affiliateUrl: adminAffiliateUrl,
      featured: adminFeatured,
    });
    setAdminTitle('');
    setAdminDesc('');
    setActiveTab('products');
  };

  // Category Create Submit
  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName || !newCatSlug) return;
    addCategory(newCatName, newCatSlug, newCatImage);
    setNewCatName('');
    setNewCatSlug('');
    setNewCatImage(PRESET_CATEGORY_IMAGES[0].url);
  };

  // Settings Save Submit
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updatePlatformSettings(settingsForm);
  };

  const handleAddDomain = () => {
    if (!newDomainInput) return;
    const cleanDomain = newDomainInput.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    if (!settingsForm.allowedDomains.includes(cleanDomain)) {
      const updatedDomains = [...settingsForm.allowedDomains, cleanDomain];
      setSettingsForm((prev) => ({ ...prev, allowedDomains: updatedDomains }));
      updatePlatformSettings({ allowedDomains: updatedDomains });
      setNewDomainInput('');
      showToast(`Added ${cleanDomain} to whitelist.`, 'success');
    }
  };

  const handleRemoveDomain = (domain: string) => {
    const updated = settingsForm.allowedDomains.filter((d) => d !== domain);
    setSettingsForm((prev) => ({ ...prev, allowedDomains: updated }));
    updatePlatformSettings({ allowedDomains: updated });
    showToast(`Removed ${domain} from whitelist.`, 'info');
  };

  const handleDownloadBackup = () => {
    const jsonStr = exportPlatformDataJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dealsphere_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Platform JSON backup downloaded!', 'success');
  };

  if (!currentUser || currentUser.role !== 'ADMIN') {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <p className="text-zinc-400 text-xs">Admin credentials required.</p>
        <button
          onClick={() => setCurrentView('admin_login')}
          className="px-4 py-2 bg-purple-600 text-white font-bold rounded-lg text-xs"
        >
          Go to Admin Login
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700 shadow-xs">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">System Admin Console</h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md border border-purple-200 text-purple-700 bg-purple-50 uppercase font-semibold">
                Hostinger VPS Master Node
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Supervising {partners.length} partners, {products.length} products, and {categories.length} categories.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('add_admin_product')}
            className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add New Product</span>
          </button>
          <button
            onClick={logout}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-xl transition-colors cursor-pointer border border-slate-200"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Live Database Status Banner */}
      <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs ${
        supabaseConfig.isConnected 
          ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
          : 'bg-amber-50 border-amber-200 text-amber-800'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
            supabaseConfig.isConnected ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
          }`}>
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-slate-900 text-sm">
                {supabaseConfig.isConnected ? 'Live Database Connected (Supabase / PostgreSQL)' : 'Live Database Disconnected'}
              </span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                supabaseConfig.isConnected ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-amber-100 text-amber-800 border border-amber-300'
              }`}>
                {supabaseConfig.isConnected ? 'REAL-TIME DB SYNC ACTIVE' : 'SAVING LOCALLY IN BROWSER ONLY'}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mt-0.5">
              {supabaseConfig.isConnected 
                ? `Connected to: ${supabaseConfig.url} — Every product add, edit, delete & category change writes directly to PostgreSQL tables.`
                : 'Website changes will NOT appear in your Supabase SQL Editor until you enter your Supabase Project URL & API Key.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {supabaseConfig.isConnected ? (
            <button
              onClick={() => syncWithDatabase(false)}
              disabled={isSyncingWithDb}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center gap-1.5 cursor-pointer disabled:opacity-50 text-xs shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingWithDb ? 'animate-spin' : ''}`} />
              <span>{isSyncingWithDb ? 'Syncing...' : 'Sync Now'}</span>
            </button>
          ) : (
            <button
              onClick={() => setActiveTab('database')}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl flex items-center gap-1.5 cursor-pointer text-xs shadow-xs"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Connect Supabase Now</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('database')}
            className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs cursor-pointer font-medium shadow-xs"
          >
            DB Settings
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div 
          onClick={() => setActiveTab('pending')} 
          className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-amber-500/50 cursor-pointer transition-all shadow-xs"
        >
          <span className="text-[11px] text-slate-500 font-mono block">Pending Reviews</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-bold text-amber-700">{pendingProducts.length}</span>
            <span className="text-[10px] text-slate-400 font-mono">Requires Action</span>
          </div>
        </div>

        <div 
          onClick={() => setActiveTab('products')} 
          className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-emerald-500/50 cursor-pointer transition-all shadow-xs"
        >
          <span className="text-[11px] text-slate-500 font-mono block">Active Catalog</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-bold text-emerald-700">{approvedProducts.length}</span>
            <span className="text-[10px] text-slate-400 font-mono">{products.length} Total</span>
          </div>
        </div>

        <div 
          onClick={() => setActiveTab('partners')} 
          className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-blue-500/50 cursor-pointer transition-all shadow-xs"
        >
          <span className="text-[11px] text-slate-500 font-mono block">Registered Partners</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-bold text-blue-700">{partners.length}</span>
            <span className="text-[10px] text-emerald-600 font-mono">
              {partners.filter(p => p.status === 'ACTIVE').length} Active
            </span>
          </div>
        </div>

        <div 
          onClick={() => setActiveTab('settings')} 
          className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-purple-500/50 cursor-pointer transition-all shadow-xs"
        >
          <span className="text-[11px] text-slate-500 font-mono block">Click Telemetry</span>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-bold text-purple-700">{clickLogs.length}</span>
            <span className="text-[10px] text-slate-400 font-mono">Logged Clicks</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-zinc-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
            activeTab === 'pending'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              : 'text-zinc-400 hover:text-white'
          }`}
        >
          Pending Approvals ({pendingProducts.length})
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
            activeTab === 'products' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
          }`}
        >
          All Products ({products.length})
        </button>

        <button
          onClick={() => setActiveTab('partners')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
            activeTab === 'partners' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
          }`}
        >
          Partners & Accounts ({partners.length})
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
            activeTab === 'categories' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
          }`}
        >
          Categories ({categories.length})
        </button>

        <button
          onClick={() => setActiveTab('add_admin_product')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
            activeTab === 'add_admin_product' ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40' : 'text-zinc-400 hover:text-white'
          }`}
        >
          + Add New Product
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
            activeTab === 'settings' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'
          }`}
        >
          Settings & Policies
        </button>

        <button
          onClick={() => setActiveTab('database')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'database'
              ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
              : supabaseConfig.isConnected
              ? 'text-emerald-400 hover:text-white'
              : 'text-amber-400 hover:text-white'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Live Database {supabaseConfig.isConnected ? '● Connected' : '⚠️ Offline'}</span>
        </button>
      </div>

      {/* =========================================================================
          TAB 1: Pending Approvals Queue
      ========================================================================= */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span>Partner submissions waiting for editorial review:</span>
          </div>

          {pendingProducts.length === 0 ? (
            <div className="p-12 text-center rounded-xl bg-zinc-900/40 border border-zinc-800 text-zinc-500">
              <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500 mb-2" />
              <p className="text-sm font-semibold text-zinc-300">Approval queue is empty!</p>
              <p className="text-xs text-zinc-500 mt-1">All submitted partner deals have been reviewed.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {pendingProducts.map((prod) => (
                <div
                  key={prod.id}
                  className="p-4 rounded-xl bg-zinc-900 border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={prod.imageUrl}
                      alt={prod.title}
                      className="w-16 h-16 rounded-lg object-cover bg-zinc-950 border border-zinc-800 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-zinc-800 text-amber-400">
                          {prod.platform}
                        </span>
                        <span className="text-xs font-mono text-zinc-400">{prod.categoryName}</span>
                        <span className="text-zinc-600">·</span>
                        <span className="text-xs text-zinc-400 font-mono">
                          Submitted by: <strong className="text-zinc-200">{prod.partnerName}</strong>
                        </span>
                      </div>
                      <h3 className="font-semibold text-sm text-white mt-1 truncate">{prod.title}</h3>
                      <p className="text-xs text-zinc-400 truncate mt-0.5">{prod.description}</p>
                      <div className="mt-1 flex items-center gap-3 text-xs font-mono">
                        <span className="text-emerald-400 font-bold">
                          {prod.price ? `₹${prod.price.toLocaleString('en-IN')}` : 'No price set'}
                        </span>
                        <a
                          href={prod.affiliateUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-amber-400 hover:underline flex items-center gap-1 text-[11px]"
                        >
                          <span>Test Affiliate Link</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => adminApproveProduct(prod.id)}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => openEditProduct(prod)}
                      className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => adminRejectProduct(prod.id)}
                      className="px-3 py-2 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 2: All Products Management with Edit, Delete, Hide/Unhide
      ========================================================================= */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter by title, platform, partner..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white font-mono"
              >
                <option value="ALL">All Statuses ({products.length})</option>
                <option value="APPROVED">Approved ({approvedProducts.length})</option>
                <option value="PENDING">Pending ({pendingProducts.length})</option>
                <option value="REJECTED">Hidden / Rejected ({rejectedProducts.length})</option>
              </select>

              <button
                onClick={() => setActiveTab('add_admin_product')}
                className="px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Product</span>
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden shadow">
            {/* Mobile Cards View (Visible on screens < 640px) */}
            <div className="sm:hidden divide-y divide-zinc-800/80">
              {filteredProducts.map((p) => (
                <div key={p.id} className="p-4 space-y-3 bg-zinc-900/60">
                  <div className="flex items-start gap-3">
                    <img
                      src={p.imageUrl}
                      alt={p.title}
                      className="w-16 h-16 rounded-lg object-cover bg-zinc-950 border border-zinc-800 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[10px] font-bold">
                          {p.platform}
                        </span>
                        {p.isAdminProduct ? (
                          <span className="text-purple-400 font-semibold bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/20 text-[10px]">
                            Admin
                          </span>
                        ) : (
                          <span className="text-zinc-400 text-[10px] truncate max-w-[100px]">
                            {p.partnerName || 'Partner'}
                          </span>
                        )}
                        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${
                          p.status === 'APPROVED'
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                            : p.status === 'PENDING'
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                            : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                        }`}>
                          {p.status === 'REJECTED' ? 'HIDDEN' : p.status}
                        </span>
                      </div>
                      <h4 className="font-semibold text-xs text-white mt-1 line-clamp-2 leading-snug">
                        {p.title}
                      </h4>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        {p.categoryName} {p.featured && '· ★ Featured'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-zinc-800/80 text-xs">
                    <div>
                      <span className="text-[11px] text-zinc-500">Price: </span>
                      <span className="font-bold text-white text-sm">
                        {p.price ? `₹${p.price.toLocaleString('en-IN')}` : '—'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => openEditProduct(p)}
                        className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded text-xs font-medium flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-blue-400" />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => adminToggleHideProduct(p.id)}
                        className={`px-2.5 py-1.5 rounded text-xs font-medium flex items-center gap-1 cursor-pointer border ${
                          p.status === 'APPROVED'
                            ? 'bg-amber-950/40 text-amber-300 border-amber-800/60'
                            : 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60'
                        }`}
                      >
                        {p.status === 'APPROVED' ? (
                          <>
                            <EyeOff className="w-3.5 h-3.5" />
                            <span>Hide</span>
                          </>
                        ) : (
                          <>
                            <Eye className="w-3.5 h-3.5" />
                            <span>Unhide</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => setConfirmDelete({ type: 'product', id: p.id, name: p.title })}
                        className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-950/40 rounded border border-transparent hover:border-rose-900 cursor-pointer"
                        title="Delete Product"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View (Visible on screens >= 640px) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-xs text-left min-w-[760px]">
                <thead className="bg-zinc-950 text-zinc-400 font-mono border-b border-zinc-800 whitespace-nowrap">
                  <tr>
                    <th className="p-3 whitespace-nowrap">Product</th>
                    <th className="p-3 whitespace-nowrap">Owner / Partner</th>
                    <th className="p-3 whitespace-nowrap">Platform</th>
                    <th className="p-3 whitespace-nowrap">Price</th>
                    <th className="p-3 whitespace-nowrap">Status</th>
                    <th className="p-3 whitespace-nowrap text-right">Actions (Edit / Hide / Delete)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/80">
                  {filteredProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-zinc-900/60 transition-colors">
                      <td className="p-3 font-medium text-white flex items-center gap-3">
                        <img
                          src={p.imageUrl}
                          alt={p.title}
                          className="w-12 h-12 rounded-lg object-cover bg-zinc-950 border border-zinc-800 shrink-0"
                        />
                        <div className="max-w-xs">
                          <span className="font-semibold block truncate text-zinc-100">{p.title}</span>
                          <span className="text-[10px] text-zinc-500 font-mono block">
                            Category: {p.categoryName} {p.featured && '· ★ Featured'}
                          </span>
                        </div>
                      </td>

                      <td className="p-3 text-zinc-300 whitespace-nowrap">
                        {p.isAdminProduct ? (
                          <span className="text-purple-400 font-semibold font-mono bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20 text-[10px]">
                            Editorial (Admin)
                          </span>
                        ) : (
                          <span className="text-zinc-300 font-mono">{p.partnerName || 'Unknown Partner'}</span>
                        )}
                      </td>

                      <td className="p-3 font-mono whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[10px]">
                          {p.platform}
                        </span>
                      </td>

                      <td className="p-3 font-mono font-bold text-white whitespace-nowrap">
                        {p.price ? `₹${p.price.toLocaleString('en-IN')}` : '—'}
                      </td>

                      <td className="p-3 whitespace-nowrap">
                        <span
                          className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${
                            p.status === 'APPROVED'
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                              : p.status === 'PENDING'
                              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                          }`}
                        >
                          {p.status === 'REJECTED' ? 'HIDDEN' : p.status}
                        </span>
                      </td>

                      <td className="p-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                          {/* Edit button */}
                          <button
                            onClick={() => openEditProduct(p)}
                            className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded text-[11px] font-medium flex items-center gap-1 cursor-pointer whitespace-nowrap"
                            title="Edit Product Details"
                          >
                            <Edit3 className="w-3 h-3 text-blue-400" />
                            <span>Edit</span>
                          </button>

                          {/* Hide / Unhide Toggle */}
                          <button
                            onClick={() => adminToggleHideProduct(p.id)}
                            className={`px-2.5 py-1.5 rounded text-[11px] font-medium flex items-center gap-1 cursor-pointer border whitespace-nowrap ${
                              p.status === 'APPROVED'
                                ? 'bg-amber-950/40 text-amber-300 border-amber-800/60 hover:bg-amber-900/50'
                                : 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60 hover:bg-emerald-900/50'
                            }`}
                            title={p.status === 'APPROVED' ? 'Hide Product from public discovery' : 'Publish / Unhide Product'}
                          >
                            {p.status === 'APPROVED' ? (
                              <>
                                <EyeOff className="w-3 h-3" />
                                <span>Hide</span>
                              </>
                            ) : (
                              <>
                                <Eye className="w-3 h-3" />
                                <span>Unhide</span>
                              </>
                            )}
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => setConfirmDelete({ type: 'product', id: p.id, name: p.title })}
                            className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-950/40 rounded border border-transparent hover:border-rose-900 cursor-pointer"
                            title="Delete Product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: Partners Management (Edit, Delete, Block/Active, Show Details)
      ========================================================================= */}
      {activeTab === 'partners' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search partner by name, email, phone, ID..."
                value={partnerSearch}
                onChange={(e) => setPartnerSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-white"
              />
            </div>

            <div className="text-xs text-zinc-400">
              Total Partners: <strong className="text-white">{partners.length}</strong>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden shadow">
            {/* Mobile Cards View (Visible on screens < 640px) */}
            <div className="sm:hidden divide-y divide-zinc-800/80">
              {filteredPartners.map((partner) => {
                const partnerProds = products.filter((p) => p.partnerId === partner.id);
                const partnerClicks = partnerProds.reduce((sum, p) => sum + (p.clickCount || 0), 0);

                return (
                  <div key={partner.id} className="p-4 space-y-3 bg-zinc-900/60">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-white">{partner.name}</span>
                      <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${
                        partner.status === 'ACTIVE'
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                          : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                      }`}>
                        {partner.status}
                      </span>
                    </div>

                    <div className="text-xs space-y-1 text-zinc-400">
                      <div>Email: <span className="text-zinc-200">{partner.email}</span></div>
                      <div>Phone: <span className="text-zinc-200">{partner.mobile}</span></div>
                      <div>Catalog: <strong className="text-white">{partnerProds.length} products</strong> ({partnerClicks} clicks)</div>
                      <div className="text-[10px] text-zinc-500 font-mono break-all">ID: {partner.id}</div>
                    </div>

                    <div className="flex items-center gap-1.5 pt-2 border-t border-zinc-800/80 text-xs">
                      <button
                        onClick={() => {
                          setSelectedPartnerDetails(partner);
                          setShowPasswordHash(false);
                        }}
                        className="flex-1 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded text-xs font-medium flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-amber-400" />
                        <span>Details</span>
                      </button>

                      <button
                        onClick={() => openEditPartner(partner)}
                        className="flex-1 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded text-xs font-medium flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-blue-400" />
                        <span>Edit</span>
                      </button>

                      <button
                        onClick={() => toggleBlockPartner(partner.id)}
                        className={`px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1 cursor-pointer border ${
                          partner.status === 'ACTIVE'
                            ? 'bg-rose-950/40 text-rose-200 border-rose-800'
                            : 'bg-emerald-950/40 text-emerald-200 border-emerald-800'
                        }`}
                      >
                        {partner.status === 'ACTIVE' ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                        <span>{partner.status === 'ACTIVE' ? 'Block' : 'Activate'}</span>
                      </button>

                      <button
                        onClick={() => setConfirmDelete({ type: 'partner', id: partner.id, name: partner.name })}
                        className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-950/40 rounded border border-transparent hover:border-rose-900 cursor-pointer"
                        title="Delete Partner Account"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View (Visible on screens >= 640px) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-xs text-left min-w-[720px]">
                <thead className="bg-zinc-950 text-zinc-400 font-mono border-b border-zinc-800 whitespace-nowrap">
                  <tr>
                    <th className="p-3 whitespace-nowrap">Partner Name & ID</th>
                    <th className="p-3 whitespace-nowrap">Email & Contact</th>
                    <th className="p-3 whitespace-nowrap">Products</th>
                    <th className="p-3 whitespace-nowrap">Status</th>
                    <th className="p-3 whitespace-nowrap text-right">Actions (Details, Edit, Block, Delete)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/80">
                  {filteredPartners.map((partner) => {
                    const partnerProds = products.filter((p) => p.partnerId === partner.id);
                    const partnerClicks = partnerProds.reduce((sum, p) => sum + (p.clickCount || 0), 0);

                    return (
                      <tr key={partner.id} className="hover:bg-zinc-900/60 transition-colors">
                        <td className="p-3 font-semibold text-white whitespace-nowrap">
                          <div>
                            <span className="text-zinc-100">{partner.name}</span>
                            <span className="text-[10px] text-zinc-500 font-mono block">
                              ID: {partner.id}
                            </span>
                          </div>
                        </td>

                        <td className="p-3 font-mono text-zinc-300 whitespace-nowrap">
                          <div>
                            <span className="text-zinc-200">{partner.email}</span>
                            <span className="text-[10px] text-zinc-500 block">{partner.mobile}</span>
                          </div>
                        </td>

                        <td className="p-3 font-mono whitespace-nowrap">
                          <span className="text-white font-semibold">{partnerProds.length}</span>
                          <span className="text-zinc-500 text-[10px] block">({partnerClicks} clicks)</span>
                        </td>

                        <td className="p-3 whitespace-nowrap">
                          <span
                            className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${
                              partner.status === 'ACTIVE'
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                            }`}
                          >
                            {partner.status}
                          </span>
                        </td>

                        <td className="p-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                            {/* View Full Details Modal */}
                            <button
                              onClick={() => {
                                setSelectedPartnerDetails(partner);
                                setShowPasswordHash(false);
                              }}
                              className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded text-[11px] font-medium flex items-center gap-1 cursor-pointer whitespace-nowrap"
                              title="View Full Credentials & Statistics"
                            >
                              <Eye className="w-3 h-3 text-amber-400" />
                              <span>Details</span>
                            </button>

                            {/* Edit Partner */}
                            <button
                              onClick={() => openEditPartner(partner)}
                              className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded text-[11px] font-medium flex items-center gap-1 cursor-pointer whitespace-nowrap"
                              title="Edit Partner Name, Email, Password"
                            >
                              <Edit3 className="w-3 h-3 text-blue-400" />
                              <span>Edit</span>
                            </button>

                            {/* Block / Unblock Toggle */}
                            <button
                              onClick={() => toggleBlockPartner(partner.id)}
                              className={`px-2.5 py-1.5 rounded text-[11px] font-medium flex items-center gap-1 cursor-pointer border whitespace-nowrap ${
                                partner.status === 'ACTIVE'
                                  ? 'bg-rose-950/40 text-rose-200 border-rose-800 hover:bg-rose-900/60'
                                  : 'bg-emerald-950/40 text-emerald-200 border-emerald-800 hover:bg-emerald-900/60'
                              }`}
                              title={partner.status === 'ACTIVE' ? 'Block Partner Login' : 'Unblock Partner Account'}
                            >
                              {partner.status === 'ACTIVE' ? (
                                <>
                                  <Lock className="w-3 h-3" />
                                  <span>Block</span>
                                </>
                              ) : (
                                <>
                                  <Unlock className="w-3 h-3" />
                                  <span>Activate</span>
                                </>
                              )}
                            </button>

                            {/* Delete Partner */}
                            <button
                              onClick={() => setConfirmDelete({ type: 'partner', id: partner.id, name: partner.name })}
                              className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-950/40 rounded border border-transparent hover:border-rose-900 cursor-pointer"
                              title="Delete Partner Account"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: Categories Management with Image Upload & Edit
      ========================================================================= */}
      {activeTab === 'categories' && (
        <div className="space-y-6">
          {/* Add New Category Card */}
          <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Plus className="w-4 h-4 text-amber-400" />
              <span>Add New Category (With Name & Image)</span>
            </h3>

            <form onSubmit={handleCreateCategory} className="space-y-4 text-xs">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Category Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Smart Home, Gaming, Books"
                    value={newCatName}
                    onChange={(e) => {
                      setNewCatName(e.target.value);
                      setNewCatSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                    }}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">URL Slug</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. smart-home"
                    value={newCatSlug}
                    onChange={(e) => setNewCatSlug(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white font-mono"
                  />
                </div>
              </div>

              {/* Category Image Selector & Upload */}
              <div className="space-y-2 p-3 rounded-xl bg-zinc-950 border border-zinc-800/80">
                <label className="block text-zinc-300 font-semibold flex items-center justify-between">
                  <span>Category Image:</span>
                  <span className="text-[11px] text-zinc-500 font-normal">Choose preset or upload file</span>
                </label>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <img
                    src={newCatImage}
                    alt="Category Preview"
                    className="w-16 h-16 rounded-lg object-cover border border-zinc-800 shrink-0 bg-zinc-900"
                  />

                  <div className="flex-1 w-full space-y-2">
                    <input
                      type="text"
                      placeholder="Image URL (HTTPS)"
                      value={newCatImage}
                      onChange={(e) => setNewCatImage(e.target.value)}
                      className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-white font-mono text-[11px]"
                    />

                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        ref={newCatImageFileInputRef}
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, setNewCatImage)}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => newCatImageFileInputRef.current?.click()}
                        className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-[11px] flex items-center gap-1.5 cursor-pointer"
                      >
                        <Upload className="w-3 h-3 text-amber-400" />
                        <span>Upload From Device</span>
                      </button>

                      <span className="text-[10px] text-zinc-500">Presets:</span>
                      <div className="flex flex-wrap gap-1">
                        {PRESET_CATEGORY_IMAGES.slice(0, 4).map((p) => (
                          <button
                            key={p.label}
                            type="button"
                            onClick={() => setNewCatImage(p.url)}
                            className="px-2 py-0.5 bg-zinc-900 hover:bg-zinc-800 text-[10px] text-zinc-300 rounded border border-zinc-800 cursor-pointer"
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-lg cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Create Category</span>
              </button>
            </form>
          </div>

          {/* Categories List Table */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 overflow-hidden shadow">
            {/* Mobile Cards View (Visible on screens < 640px) */}
            <div className="sm:hidden divide-y divide-zinc-800/80">
              {categories.map((cat) => {
                const catProdCount = products.filter((p) => p.categoryId === cat.id).length;

                return (
                  <div key={cat.id} className="p-4 space-y-3 bg-zinc-900/60">
                    <div className="flex items-center gap-3">
                      <img
                        src={cat.imageUrl || PRESET_CATEGORY_IMAGES[0].url}
                        alt={cat.name}
                        className="w-12 h-12 rounded-lg object-cover bg-zinc-950 border border-zinc-800 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-white text-sm truncate">{cat.name}</h4>
                          <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border shrink-0 ${
                            cat.status === 'ACTIVE'
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                              : 'bg-zinc-800 text-zinc-500'
                          }`}>
                            {cat.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 font-mono mt-0.5 truncate">/category/{cat.slug}</p>
                        <p className="text-xs text-zinc-300 font-medium mt-0.5">{catProdCount} Deals</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800/80">
                      <button
                        onClick={() => openEditCategory(cat)}
                        className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded text-xs font-medium flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => setConfirmDelete({ type: 'category', id: cat.id, name: cat.name })}
                        className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-950/40 rounded border border-transparent hover:border-rose-900 cursor-pointer"
                        title="Delete Category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View (Visible on screens >= 640px) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-xs text-left min-w-[650px]">
                <thead className="bg-zinc-950 text-zinc-400 font-mono border-b border-zinc-800 whitespace-nowrap">
                  <tr>
                    <th className="p-3 whitespace-nowrap">Category</th>
                    <th className="p-3 whitespace-nowrap">Slug</th>
                    <th className="p-3 whitespace-nowrap">Products Count</th>
                    <th className="p-3 whitespace-nowrap">Status</th>
                    <th className="p-3 whitespace-nowrap text-right">Actions (Edit / Delete)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/80">
                  {categories.map((cat) => {
                    const catProdCount = products.filter((p) => p.categoryId === cat.id).length;

                    return (
                      <tr key={cat.id} className="hover:bg-zinc-900/60 transition-colors">
                        <td className="p-3 font-semibold text-white flex items-center gap-3">
                          <img
                            src={cat.imageUrl || PRESET_CATEGORY_IMAGES[0].url}
                            alt={cat.name}
                            className="w-10 h-10 rounded-lg object-cover bg-zinc-950 border border-zinc-800 shrink-0"
                          />
                          <div>
                            <span className="text-zinc-100 font-bold block">{cat.name}</span>
                            <span className="text-[10px] text-zinc-500 font-mono">ID: {cat.id}</span>
                          </div>
                        </td>

                        <td className="p-3 font-mono text-zinc-400 whitespace-nowrap">/category/{cat.slug}</td>

                        <td className="p-3 font-mono text-white whitespace-nowrap">
                          {catProdCount} Deals
                        </td>

                        <td className="p-3 whitespace-nowrap">
                          <span
                            className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${
                              cat.status === 'ACTIVE'
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                                : 'bg-zinc-800 text-zinc-500'
                            }`}
                          >
                            {cat.status}
                          </span>
                        </td>

                        <td className="p-3 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                            <button
                              onClick={() => openEditCategory(cat)}
                              className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded text-[11px] font-medium flex items-center gap-1 cursor-pointer whitespace-nowrap"
                              title="Edit Category Name, Slug, Image"
                            >
                              <Edit3 className="w-3 h-3 text-amber-400" />
                              <span>Edit</span>
                            </button>

                            <button
                              onClick={() => setConfirmDelete({ type: 'category', id: cat.id, name: cat.name })}
                              className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-950/40 rounded border border-transparent hover:border-rose-900 cursor-pointer"
                              title="Delete Category"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 5: Admin Add New Product (WITH PRODUCT IMAGE UPLOAD OPTION)
      ========================================================================= */}
      {activeTab === 'add_admin_product' && (
        <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-6 max-w-4xl">
          <div className="space-y-1">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Admin Add New Product (Priority Guaranteed Placement)</span>
            </h2>
            <p className="text-xs text-zinc-400">
              Admin products are instantly marked as <strong>APPROVED</strong>, priority placed at top of storefront, and bypass the partner queue.
            </p>
          </div>

          <form onSubmit={handleAdminProductSubmit} className="space-y-5 text-xs">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-zinc-400 mb-1 font-semibold">Affiliate Platform</label>
                <select
                  value={adminPlatform}
                  onChange={(e) => setAdminPlatform(e.target.value as Platform)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white font-mono"
                >
                  <option value="AMAZON">Amazon</option>
                  <option value="FLIPKART">Flipkart</option>
                  <option value="MEESHO">Meesho</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1 font-semibold">Category</label>
                <select
                  value={adminCatId}
                  onChange={(e) => setAdminCatId(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white font-mono"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-zinc-400 mb-1 font-semibold">Product Title</label>
              <input
                type="text"
                required
                value={adminTitle}
                onChange={(e) => setAdminTitle(e.target.value)}
                placeholder="e.g. Sony WH-1000XM5 Noise Cancelling Headphones"
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white"
              />
            </div>

            <div>
              <label className="block text-zinc-400 mb-1 font-semibold">Short Description</label>
              <textarea
                rows={3}
                required
                value={adminDesc}
                onChange={(e) => setAdminDesc(e.target.value)}
                placeholder="Key specifications, why it's a great deal, savings info..."
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white"
              />
            </div>

            {/* PRODUCT IMAGE UPLOAD SECTION */}
            <div className="p-4 rounded-xl bg-zinc-950 border border-purple-500/30 space-y-3">
              <label className="block text-purple-300 font-bold flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-purple-400" />
                  Product Image (Upload or URL)
                </span>
                <span className="text-[10px] text-zinc-400 font-mono font-normal">
                  Required · Recommended ratio 1:1 or 4:3
                </span>
              </label>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                {/* Live Preview Box */}
                <div className="w-28 h-28 rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden shrink-0 flex items-center justify-center relative shadow-inner">
                  {adminImage ? (
                    <img
                      src={adminImage}
                      alt="Product preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-zinc-600 text-[10px]">No image</span>
                  )}
                </div>

                <div className="flex-1 w-full space-y-2.5">
                  <div>
                    <span className="text-[11px] text-zinc-400 block mb-1">Image URL:</span>
                    <input
                      type="url"
                      required
                      value={adminImage}
                      onChange={(e) => setAdminImage(e.target.value)}
                      placeholder="https://images.unsplash.com/photo-..."
                      className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-white font-mono text-xs"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="file"
                      ref={adminImageFileInputRef}
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, setAdminImage)}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => adminImageFileInputRef.current?.click()}
                      className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shadow"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Product Photo</span>
                    </button>
                    <span className="text-zinc-500 text-[10px]">Or choose sample preset below:</span>
                  </div>

                  {/* Preset chips */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {PRESET_PRODUCT_IMAGES.map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => setAdminImage(p.url)}
                        className={`px-2 py-1 rounded text-[10px] font-medium border cursor-pointer transition-colors ${
                          adminImage === p.url
                            ? 'bg-purple-500/20 text-purple-300 border-purple-500/50'
                            : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-zinc-400 mb-1 font-semibold">Price in ₹</label>
                <input
                  type="number"
                  value={adminPrice}
                  onChange={(e) => setAdminPrice(e.target.value)}
                  placeholder="e.g. 1999"
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-zinc-400 mb-1 font-semibold">Deal Badge / Discount</label>
                <input
                  type="text"
                  value={adminDealOffer}
                  onChange={(e) => setAdminDealOffer(e.target.value)}
                  placeholder="e.g. Flat 40% Off"
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-zinc-400 mb-1 font-semibold">Offer Details</label>
                <input
                  type="text"
                  value={adminDealDetails}
                  onChange={(e) => setAdminDealDetails(e.target.value)}
                  placeholder="e.g. Extra ₹500 bank offer"
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-zinc-400 mb-1 font-semibold">Affiliate Target URL (HTTPS)</label>
              <input
                type="url"
                required
                value={adminAffiliateUrl}
                onChange={(e) => setAdminAffiliateUrl(e.target.value)}
                placeholder="https://www.amazon.in/dp/...?tag=dealhub_admin-21"
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white font-mono"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="feat_admin"
                checked={adminFeatured}
                onChange={(e) => setAdminFeatured(e.target.checked)}
                className="rounded border-zinc-800 bg-zinc-950 text-purple-600 focus:ring-0"
              />
              <label htmlFor="feat_admin" className="text-zinc-300 font-medium cursor-pointer">
                Mark as Featured Product (Pin to Homepage Featured section)
              </label>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg cursor-pointer shadow-lg shadow-purple-600/20 flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Publish Priority Admin Deal</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('products')}
                className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =========================================================================
          TAB 6: Admin Settings Center & Whitelist (Production Ready)
      ========================================================================= */}
      {activeTab === 'settings' && (
        <div className="space-y-6 max-w-4xl">
          {/* Platform General Settings */}
          <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Settings className="w-4 h-4 text-purple-400" />
                  <span>Platform General Settings</span>
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Configure storefront branding, affiliate tracking IDs, and contact info.
                </p>
              </div>

              <button
                onClick={handleSaveSettings}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer shadow"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save All Changes</span>
              </button>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">Platform Brand Name</label>
                <input
                  type="text"
                  value={settingsForm.siteName}
                  onChange={(e) => setSettingsForm({ ...settingsForm, siteName: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Tagline</label>
                <input
                  type="text"
                  value={settingsForm.siteTagline}
                  onChange={(e) => setSettingsForm({ ...settingsForm, siteTagline: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Support Email</label>
                <input
                  type="email"
                  value={settingsForm.supportEmail}
                  onChange={(e) => setSettingsForm({ ...settingsForm, supportEmail: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Support Phone</label>
                <input
                  type="text"
                  value={settingsForm.supportPhone}
                  onChange={(e) => setSettingsForm({ ...settingsForm, supportPhone: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white font-mono"
                />
              </div>
            </div>

            {/* Affiliate Tracking IDs */}
            <div className="pt-2 border-t border-zinc-800/80 space-y-3">
              <span className="text-xs font-bold text-zinc-200 block">Default Affiliate Tracking Identifiers:</span>
              <div className="grid sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-zinc-400 mb-1 text-[11px]">Amazon Associates Tag</label>
                  <input
                    type="text"
                    value={settingsForm.amazonAffiliateTag}
                    onChange={(e) => setSettingsForm({ ...settingsForm, amazonAffiliateTag: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1 text-[11px]">Flipkart Affiliate ID</label>
                  <input
                    type="text"
                    value={settingsForm.flipkartAffiliateId}
                    onChange={(e) => setSettingsForm({ ...settingsForm, flipkartAffiliateId: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1 text-[11px]">Meesho Affiliate Tag</label>
                  <input
                    type="text"
                    value={settingsForm.meeshoAffiliateTag}
                    onChange={(e) => setSettingsForm({ ...settingsForm, meeshoAffiliateTag: e.target.value })}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Moderation & Maintenance Policies */}
            <div className="pt-3 border-t border-zinc-800/80 space-y-3 text-xs">
              <span className="text-xs font-bold text-zinc-200 block">Editorial Moderation & Operations:</span>
              <div className="flex flex-col sm:flex-row gap-4">
                <label className="flex items-center gap-2 p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settingsForm.autoApprovePartnerDeals}
                    onChange={(e) => {
                      const updated = { ...settingsForm, autoApprovePartnerDeals: e.target.checked };
                      setSettingsForm(updated);
                      updatePlatformSettings({ autoApprovePartnerDeals: e.target.checked });
                    }}
                    className="rounded bg-zinc-900 border-zinc-700 text-purple-600 focus:ring-0"
                  />
                  <div>
                    <span className="font-semibold text-white block">Auto-Approve Partner Submissions</span>
                    <span className="text-[10px] text-zinc-400 block">Skip editorial queue and publish deals immediately.</span>
                  </div>
                </label>

                <label className="flex items-center gap-2 p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settingsForm.maintenanceMode}
                    onChange={(e) => {
                      const updated = { ...settingsForm, maintenanceMode: e.target.checked };
                      setSettingsForm(updated);
                      updatePlatformSettings({ maintenanceMode: e.target.checked });
                    }}
                    className="rounded bg-zinc-900 border-zinc-700 text-amber-500 focus:ring-0"
                  />
                  <div>
                    <span className="font-semibold text-white block">Maintenance Mode</span>
                    <span className="text-[10px] text-zinc-400 block">Show maintenance alert across customer discovery pages.</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Affiliate Disclaimer */}
            <div className="pt-2 border-t border-zinc-800/80">
              <label className="block text-zinc-400 mb-1 text-xs font-semibold">Storefront Legal Affiliate Disclaimer</label>
              <textarea
                rows={2}
                value={settingsForm.affiliateDisclaimer}
                onChange={(e) => setSettingsForm({ ...settingsForm, affiliateDisclaimer: e.target.value })}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white text-xs"
              />
            </div>
          </div>

          {/* Domain Whitelist Management */}
          <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-sky-400" />
                <span>Authorized Affiliate Domains Whitelist</span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Only affiliate redirect links pointing to domains in this whitelist are permitted.
              </p>
            </div>

            <div className="flex gap-2 text-xs">
              <input
                type="text"
                placeholder="e.g. myntra.com, tatacliq.com, ajio.com"
                value={newDomainInput}
                onChange={(e) => setNewDomainInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddDomain()}
                className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white font-mono"
              />
              <button
                type="button"
                onClick={handleAddDomain}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg cursor-pointer"
              >
                Add Domain
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {settingsForm.allowedDomains.map((domain) => (
                <div
                  key={domain}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-300"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{domain}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveDomain(domain)}
                    className="text-zinc-500 hover:text-rose-400 cursor-pointer ml-1 text-sm font-bold"
                    title="Remove Domain"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Disaster Recovery & Data Operations */}
          <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                <span>Platform Backup & Database Maintenance</span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Export platform data, reset seeds, or prune click logs.
              </p>
            </div>

            <div className="grid sm:grid-cols-3 gap-3 text-xs">
              <button
                type="button"
                onClick={handleDownloadBackup}
                className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-emerald-500/50 flex flex-col items-center justify-center gap-2 text-center cursor-pointer transition-colors"
              >
                <Download className="w-5 h-5 text-emerald-400" />
                <span className="font-bold text-white">Download JSON Backup</span>
                <span className="text-[10px] text-zinc-500">Users, Categories, Products, Clicks</span>
              </button>

              <button
                type="button"
                onClick={clearClickLogs}
                className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-amber-500/50 flex flex-col items-center justify-center gap-2 text-center cursor-pointer transition-colors"
              >
                <Trash2 className="w-5 h-5 text-amber-400" />
                <span className="font-bold text-white">Clear Click Logs</span>
                <span className="text-[10px] text-zinc-500">{clickLogs.length} Records In Telemetry</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Reset platform to original factory demo data? Any new additions will be replaced.')) {
                    resetToInitialSeeds();
                  }
                }}
                className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-rose-500/50 flex flex-col items-center justify-center gap-2 text-center cursor-pointer transition-colors"
              >
                <RefreshCw className="w-5 h-5 text-rose-400" />
                <span className="font-bold text-white">Reset Initial Seeds</span>
                <span className="text-[10px] text-zinc-500">Restore default demo dataset</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 7: LIVE DATABASE & SUPABASE REALTIME SYNC
      ========================================================================= */}
      {activeTab === 'database' && (
        <div className="space-y-6 max-w-4xl">
          {/* Status Header */}
          <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Database className={`w-5 h-5 ${supabaseConfig.isConnected ? 'text-emerald-400' : 'text-amber-400'}`} />
                  <span>Live Database Connection & Real-Time Sync</span>
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Connect your remote Supabase PostgreSQL database to make all website edits, new products, and categories persist directly in your database.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className={`px-2.5 py-1 rounded text-xs font-mono font-bold flex items-center gap-1.5 border ${
                  supabaseConfig.isConnected
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                    : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${supabaseConfig.isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                  <span>{supabaseConfig.isConnected ? 'CONNECTED' : 'DISCONNECTED'}</span>
                </span>
              </div>
            </div>

            {/* Connection Credentials Form */}
            <div className="pt-2 border-t border-zinc-800 space-y-4">
              {/* Vite Environment Variables Status Card */}
              <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white flex items-center gap-1.5 text-xs">
                    <ShieldCheck className="w-4 h-4 text-sky-400" />
                    <span>Vite Environment Variables (Client Context)</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-sky-500/10 text-sky-400 border border-sky-500/30">
                    {envStatus.isUrlPresent && envStatus.isKeyPresent ? 'VITE ENV LOADED' : 'ACTIVE & CONFIGURED'}
                  </span>
                </div>
                <div className="grid sm:grid-cols-2 gap-2 text-[11px] font-mono text-zinc-400">
                  <div className="p-2 rounded bg-zinc-900 border border-zinc-800/80 truncate">
                    <span className="text-zinc-500 block text-[10px]">VITE_SUPABASE_URL:</span>
                    <span className="text-zinc-200 truncate block">{envStatus.url}</span>
                  </div>
                  <div className="p-2 rounded bg-zinc-900 border border-zinc-800/80 truncate">
                    <span className="text-zinc-500 block text-[10px]">VITE_SUPABASE_ANON_KEY:</span>
                    <span className="text-zinc-200 truncate block">{envStatus.keyPrefix}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">
                    Supabase Project URL
                  </label>
                  <input
                    type="url"
                    value={dbUrl}
                    onChange={(e) => setDbUrl(e.target.value)}
                    onBlur={() => {
                      if (dbUrl.trim()) {
                        setDbUrl(normalizeSupabaseUrl(dbUrl));
                      }
                    }}
                    placeholder="https://xxxxxxxxxxxxxxxxxxxx.supabase.co or project ref"
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-[10px] text-zinc-500 mt-0.5 block">
                    Found in Supabase: Project Settings → API → Project URL (or paste your Project ID / Dashboard URL)
                  </span>
                </div>

                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">
                    Supabase API Key (Anon Public or Service Role)
                  </label>
                  <input
                    type="password"
                    value={dbKey}
                    onChange={(e) => setDbKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-[10px] text-zinc-500 mt-0.5 block">
                    Found in Supabase: Project Settings → API → Project API Keys (anon public or service_role)
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  disabled={isTestingDb || !dbUrl || !dbKey}
                  onClick={async () => {
                    const cleanUrl = normalizeSupabaseUrl(dbUrl);
                    setDbUrl(cleanUrl);
                    setIsTestingDb(true);
                    setDbTestResult(null);
                    const res = await testDatabaseConnection(cleanUrl, dbKey);
                    setIsTestingDb(false);
                    setDbTestResult(res);
                    if (res.success) {
                      showToast('Database connection test successful!', 'success');
                    } else {
                      showToast(res.message, 'error');
                    }
                  }}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shadow"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTestingDb ? 'animate-spin' : ''}`} />
                  <span>{isTestingDb ? 'Testing Connection...' : 'Test Connection'}</span>
                </button>

                <button
                  type="button"
                  disabled={!dbUrl || !dbKey}
                  onClick={async () => {
                    const cleanUrl = normalizeSupabaseUrl(dbUrl);
                    setDbUrl(cleanUrl);
                    setIsTestingDb(true);
                    const test = await testDatabaseConnection(cleanUrl, dbKey);
                    setIsTestingDb(false);
                    setDbTestResult(test);

                    if (test.success) {
                      updateSupabaseConfig({
                        url: cleanUrl,
                        anonKey: dbKey.trim(),
                        isConnected: true,
                        lastTestedAt: new Date().toISOString(),
                      });
                      showToast('Connected and synced with Supabase PostgreSQL database!', 'success');
                    } else {
                      showToast(`Could not connect: ${test.message}`, 'error');
                    }
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shadow"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save & Connect Database</span>
                </button>

                {supabaseConfig.isConnected && (
                  <button
                    type="button"
                    onClick={() => {
                      updateSupabaseConfig({ isConnected: false });
                      setDbTestResult(null);
                      showToast('Database disconnected. Now running in local browser mode.', 'info');
                    }}
                    className="px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-lg text-xs cursor-pointer"
                  >
                    Disconnect
                  </button>
                )}
              </div>

              {/* Diagnostic Test Result Box */}
              {dbTestResult && (
                <div className={`p-4 rounded-xl border text-xs space-y-2 mt-3 ${
                  dbTestResult.success 
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200' 
                    : 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                }`}>
                  <div className="flex items-center gap-2 font-bold">
                    {dbTestResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
                    <span>{dbTestResult.message}</span>
                  </div>

                  {dbTestResult.tableCounts && (
                    <div className="space-y-2 pt-1">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px]">
                        <div className="p-2 rounded bg-zinc-950/60 border border-zinc-800">
                          <span className="text-zinc-400 block text-[10px]">Categories:</span>
                          <strong className="text-white text-sm">{dbTestResult.tableCounts.categories}</strong>
                          {dbTestResult.permissions && (
                            <span className="text-[9px] block text-emerald-400 mt-0.5">{dbTestResult.permissions.categories}</span>
                          )}
                        </div>
                        <div className="p-2 rounded bg-zinc-950/60 border border-zinc-800">
                          <span className="text-zinc-400 block text-[10px]">Products:</span>
                          <strong className="text-white text-sm">{dbTestResult.tableCounts.products}</strong>
                          {dbTestResult.permissions && (
                            <span className="text-[9px] block text-emerald-400 mt-0.5">{dbTestResult.permissions.products}</span>
                          )}
                        </div>
                        <div className="p-2 rounded bg-zinc-950/60 border border-zinc-800">
                          <span className="text-zinc-400 block text-[10px]">Users / Partners:</span>
                          <strong className="text-white text-sm">{dbTestResult.tableCounts.users}</strong>
                          {dbTestResult.permissions && (
                            <span className="text-[9px] block text-emerald-400 mt-0.5">{dbTestResult.permissions.users}</span>
                          )}
                        </div>
                        <div className="p-2 rounded bg-zinc-950/60 border border-zinc-800">
                          <span className="text-zinc-400 block text-[10px]">Click Logs:</span>
                          <strong className="text-white text-sm">{dbTestResult.tableCounts.clickLogs ?? 0}</strong>
                          {dbTestResult.permissions && (
                            <span className="text-[9px] block text-emerald-400 mt-0.5">{dbTestResult.permissions.clickLogs}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Database Synchronization Operations */}
          <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-purple-400" />
              <span>Two-Way Data Synchronization</span>
            </h3>
            <p className="text-xs text-zinc-400">
              Synchronize records between your Supabase PostgreSQL database and this web interface.
            </p>

            <div className="grid sm:grid-cols-2 gap-4 text-xs">
              {/* Pull from Database */}
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3 flex flex-col justify-between">
                <div>
                  <span className="font-bold text-white block">1. Pull from Supabase to Website</span>
                  <p className="text-[11px] text-zinc-400 mt-1">
                    Fetches the latest products, categories, and partners from your Supabase database into the storefront.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={!supabaseConfig.isConnected || isSyncingWithDb}
                  onClick={() => syncWithDatabase(false)}
                  className="w-full py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold rounded-lg cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingWithDb ? 'animate-spin' : ''}`} />
                  <span>{isSyncingWithDb ? 'Pulling Data...' : 'Pull From Database'}</span>
                </button>
              </div>

              {/* Push Local Data to Database */}
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3 flex flex-col justify-between">
                <div>
                  <span className="font-bold text-white block">2. Push Current Website Data to Supabase</span>
                  <p className="text-[11px] text-zinc-400 mt-1">
                    Uploads all current products ({products.length}), categories ({categories.length}), and partners ({partners.length}) directly into your Supabase SQL tables.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={!supabaseConfig.isConnected || isPushingDb}
                  onClick={async () => {
                    setIsPushingDb(true);
                    await pushAllLocalToDatabase();
                    setIsPushingDb(false);
                  }}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-lg cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isPushingDb ? 'Uploading to Supabase...' : 'Push Website Data to Supabase'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Critical: Row-Level Security (RLS) Permission Fix Card */}
          <div className="p-6 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-3 text-xs">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Fix: Website Changes Not Saving to Supabase (Error 42501 / RLS Policy)</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(RLS_FIX_SQL);
                  setCopiedRlsSql(true);
                  showToast('RLS Fix SQL copied to clipboard! Paste and Run in Supabase SQL Editor.', 'success');
                  setTimeout(() => setCopiedRlsSql(false), 3000);
                }}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-lg cursor-pointer flex items-center gap-1.5 text-xs shadow"
              >
                {copiedRlsSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedRlsSql ? 'SQL Copied!' : 'Copy RLS Fix SQL'}</span>
              </button>
            </div>

            <p className="text-zinc-300 leading-relaxed">
              If adding products or editing categories returns an error like <code className="text-rose-400 font-mono">new row violates row-level security policy</code> (code 42501), Supabase is blocking write permissions. Click <strong>"Copy RLS Fix SQL"</strong> above, open your <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-sky-400 underline">Supabase SQL Editor</a>, paste it, and click <strong>Run</strong>.
            </p>

            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-[11px] text-zinc-400 overflow-x-auto max-h-36">
              <pre>{RLS_FIX_SQL}</pre>
            </div>
          </div>

          {/* Setup Guide Card */}
          <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3 text-xs">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>How To Connect & Verify Your Supabase Database</span>
            </h3>

            <ol className="list-decimal list-inside space-y-2 text-zinc-300 leading-relaxed pt-1">
              <li>
                Log in to your <strong>Supabase Dashboard</strong> at <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-sky-400 hover:underline">supabase.com</a>.
              </li>
              <li>
                Click on your project, then open <strong>Project Settings</strong> (gear icon in left sidebar) → <strong>API</strong>.
              </li>
              <li>
                Copy the <strong>Project URL</strong> (e.g. <code className="text-amber-300 font-mono">https://xyzcompany.supabase.co</code>) and paste it into the URL field above.
              </li>
              <li>
                Under <strong>Project API Keys</strong>, copy the <code className="text-amber-300 font-mono">anon public</code> or <code className="text-amber-300 font-mono">service_role</code> key and paste it above.
              </li>
              <li>
                Click <strong>"Save & Connect Database"</strong>. 
              </li>
              <li>
                Click <strong>"Push Website Data to Supabase"</strong> to seed your database tables. Now any product you add or edit on this website will immediately appear in your Supabase SQL Editor and Table Editor!
              </li>
            </ol>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 1: PARTNER DETAILS MODAL
      ========================================================================= */}
      {selectedPartnerDetails && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Partner Account Profile</h3>
                  <span className="text-[11px] text-zinc-400 font-mono">
                    System Identity & Credentials
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedPartnerDetails(null)}
                className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Partner ID with Copy */}
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="text-zinc-500 text-[10px] font-mono block">PARTNER UNIQUE ID</span>
                  <span className="font-mono text-zinc-200 text-xs font-bold">{selectedPartnerDetails.id}</span>
                </div>
                <button
                  onClick={() => copyToClipboard(selectedPartnerDetails.id, 'Partner ID')}
                  className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-[11px] flex items-center gap-1 cursor-pointer"
                >
                  {copiedText === 'Partner ID' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedText === 'Partner ID' ? 'Copied' : 'Copy ID'}</span>
                </button>
              </div>

              {/* Name & Contact */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                  <span className="text-zinc-500 text-[10px] font-mono block">PARTNER NAME</span>
                  <span className="font-semibold text-white text-sm">{selectedPartnerDetails.name}</span>
                </div>
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                  <span className="text-zinc-500 text-[10px] font-mono block">ACCOUNT STATUS</span>
                  <span
                    className={`inline-block text-[10px] font-mono uppercase px-2 py-0.5 mt-1 rounded border ${
                      selectedPartnerDetails.status === 'ACTIVE'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    }`}
                  >
                    {selectedPartnerDetails.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                  <span className="text-zinc-500 text-[10px] font-mono block">EMAIL ADDRESS</span>
                  <span className="font-mono text-zinc-300 truncate block">{selectedPartnerDetails.email}</span>
                </div>
                <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                  <span className="text-zinc-500 text-[10px] font-mono block">MOBILE PHONE</span>
                  <span className="font-mono text-zinc-300">{selectedPartnerDetails.mobile}</span>
                </div>
              </div>

              {/* Password Hash with Reveal/Hide */}
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500 text-[10px] font-mono">ENCRYPTED CREDENTIAL / HASH (Argon2id)</span>
                  <button
                    onClick={() => setShowPasswordHash(!showPasswordHash)}
                    className="text-[10px] text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {showPasswordHash ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showPasswordHash ? 'Hide Hash' : 'Show Hash'}</span>
                  </button>
                </div>
                <div className="flex items-center justify-between gap-2 bg-zinc-900 p-2 rounded border border-zinc-850">
                  <span className="font-mono text-[11px] text-zinc-300 truncate max-w-[280px]">
                    {showPasswordHash ? selectedPartnerDetails.passwordHash : '••••••••••••••••••••••••••••••••••••••••'}
                  </span>
                  <button
                    onClick={() => copyToClipboard(selectedPartnerDetails.passwordHash, 'Password Hash')}
                    className="p-1 text-zinc-400 hover:text-white cursor-pointer"
                    title="Copy Hash"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Published products summary */}
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="text-zinc-500 text-[10px] font-mono block">CATALOG INVENTORY</span>
                  <span className="font-bold text-white">
                    {products.filter((p) => p.partnerId === selectedPartnerDetails.id).length} Products Submitted
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-zinc-500 text-[10px] font-mono block">TOTAL ENGAGEMENT</span>
                  <span className="font-bold text-emerald-400">
                    {products
                      .filter((p) => p.partnerId === selectedPartnerDetails.id)
                      .reduce((sum, p) => sum + (p.clickCount || 0), 0)}{' '}
                    Clicks
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-zinc-800">
              <button
                onClick={() => {
                  setSelectedPartnerDetails(null);
                  openEditPartner(selectedPartnerDetails);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit This Partner</span>
              </button>

              <button
                onClick={() => setSelectedPartnerDetails(null)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-lg text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: EDIT PARTNER MODAL
      ========================================================================= */}
      {editingPartner && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-blue-400" />
                <span>Edit Partner Account</span>
              </h3>
              <button
                onClick={() => setEditingPartner(null)}
                className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePartner} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">Partner Full Name</label>
                <input
                  type="text"
                  required
                  value={editPartnerName}
                  onChange={(e) => setEditPartnerName(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={editPartnerEmail}
                  onChange={(e) => setEditPartnerEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Mobile Phone</label>
                <input
                  type="text"
                  required
                  value={editPartnerMobile}
                  onChange={(e) => setEditPartnerMobile(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">
                  Change Password <span className="text-[10px] text-zinc-500">(Leave blank to keep existing)</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter new plain text password..."
                  value={editPartnerNewPassword}
                  onChange={(e) => setEditPartnerNewPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Account Access Status</label>
                <select
                  value={editPartnerStatus}
                  onChange={(e) => setEditPartnerStatus(e.target.value as 'ACTIVE' | 'BLOCKED')}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white font-mono"
                >
                  <option value="ACTIVE">ACTIVE (Authorized to publish)</option>
                  <option value="BLOCKED">BLOCKED (Login and submissions locked)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditingPartner(null)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg cursor-pointer"
                >
                  Save Partner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: EDIT PRODUCT MODAL (WITH IMAGE UPLOAD)
      ========================================================================= */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-purple-400" />
                <span>Edit Product Details</span>
              </h3>
              <button
                onClick={() => setEditingProduct(null)}
                className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Platform</label>
                  <select
                    value={editProdPlatform}
                    onChange={(e) => setEditProdPlatform(e.target.value as Platform)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white font-mono"
                  >
                    <option value="AMAZON">Amazon</option>
                    <option value="FLIPKART">Flipkart</option>
                    <option value="MEESHO">Meesho</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">Category</label>
                  <select
                    value={editProdCatId}
                    onChange={(e) => setEditProdCatId(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white font-mono"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Product Title</label>
                <input
                  type="text"
                  required
                  value={editProdTitle}
                  onChange={(e) => setEditProdTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Description</label>
                <textarea
                  rows={3}
                  required
                  value={editProdDesc}
                  onChange={(e) => setEditProdDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white"
                />
              </div>

              {/* Product Image Selector */}
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-850 space-y-2">
                <label className="block text-zinc-300 font-semibold flex items-center justify-between">
                  <span>Product Image:</span>
                  <span className="text-[10px] text-zinc-500 font-normal">Upload or paste URL</span>
                </label>

                <div className="flex items-center gap-3">
                  <img
                    src={editProdImageUrl}
                    alt="Preview"
                    className="w-16 h-16 rounded-lg object-cover border border-zinc-800 shrink-0 bg-zinc-900"
                  />
                  <div className="flex-1 space-y-1.5">
                    <input
                      type="url"
                      required
                      value={editProdImageUrl}
                      onChange={(e) => setEditProdImageUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-white font-mono text-[11px]"
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        ref={editProdImageFileInputRef}
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, setEditProdImageUrl)}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => editProdImageFileInputRef.current?.click()}
                        className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-[11px] flex items-center gap-1 cursor-pointer"
                      >
                        <Upload className="w-3 h-3 text-purple-400" />
                        <span>Upload File</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-zinc-400 mb-1">Price in ₹</label>
                  <input
                    type="number"
                    value={editProdPrice}
                    onChange={(e) => setEditProdPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Deal Badge</label>
                  <input
                    type="text"
                    value={editProdDealOffer}
                    onChange={(e) => setEditProdDealOffer(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 mb-1">Offer Details</label>
                  <input
                    type="text"
                    value={editProdDealDetails}
                    onChange={(e) => setEditProdDealDetails(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Affiliate Destination URL (HTTPS)</label>
                <input
                  type="url"
                  required
                  value={editProdAffiliateUrl}
                  onChange={(e) => setEditProdAffiliateUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white font-mono"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-zinc-400 mb-1">Moderation Status</label>
                  <select
                    value={editProdStatus}
                    onChange={(e) => setEditProdStatus(e.target.value as ProductStatus)}
                    className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white font-mono"
                  >
                    <option value="APPROVED">APPROVED (Live on website)</option>
                    <option value="PENDING">PENDING (In review)</option>
                    <option value="REJECTED">REJECTED / HIDDEN</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="edit_feat"
                    checked={editProdFeatured}
                    onChange={(e) => setEditProdFeatured(e.target.checked)}
                    className="rounded border-zinc-800 bg-zinc-950 text-purple-600 focus:ring-0"
                  />
                  <label htmlFor="edit_feat" className="text-zinc-300 font-medium cursor-pointer">
                    Mark as Featured Product
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg cursor-pointer shadow-lg shadow-purple-600/20"
                >
                  Save Product Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 4: EDIT CATEGORY MODAL (WITH IMAGE UPLOAD)
      ========================================================================= */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-400" />
                <span>Edit Category</span>
              </h3>
              <button
                onClick={() => setEditingCategory(null)}
                className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  value={editCatName}
                  onChange={(e) => setEditCatName(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">URL Slug</label>
                <input
                  type="text"
                  required
                  value={editCatSlug}
                  onChange={(e) => setEditCatSlug(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white font-mono"
                />
              </div>

              {/* Category Image */}
              <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                <label className="block text-zinc-300 font-semibold">Category Thumbnail Image</label>
                <div className="flex items-center gap-3">
                  <img
                    src={editCatImage}
                    alt="Category"
                    className="w-14 h-14 rounded-lg object-cover border border-zinc-800 shrink-0 bg-zinc-900"
                  />
                  <div className="flex-1 space-y-1.5">
                    <input
                      type="url"
                      value={editCatImage}
                      onChange={(e) => setEditCatImage(e.target.value)}
                      className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-white font-mono text-[11px]"
                    />
                    <input
                      type="file"
                      ref={editCatImageFileInputRef}
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, setEditCatImage)}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => editCatImageFileInputRef.current?.click()}
                      className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-[11px] flex items-center gap-1 cursor-pointer"
                    >
                      <Upload className="w-3 h-3 text-amber-400" />
                      <span>Upload New Image</span>
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">Status</label>
                <select
                  value={editCatStatus}
                  onChange={(e) => setEditCatStatus(e.target.value as 'ACTIVE' | 'DISABLED')}
                  className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-white font-mono"
                >
                  <option value="ACTIVE">ACTIVE (Visible in navigation)</option>
                  <option value="DISABLED">DISABLED (Hidden)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-lg cursor-pointer"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 5: DELETE CONFIRMATION MODAL
      ========================================================================= */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-bold text-white text-base">
                Confirm Deletion
              </h3>
              <p className="text-xs text-zinc-400">
                Are you sure you want to permanently delete{' '}
                <strong className="text-white">"{confirmDelete.name}"</strong>?
              </p>
              <p className="text-[11px] text-rose-400 pt-1">
                This operation cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-lg text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (confirmDelete.type === 'product') {
                    adminDeleteProduct(confirmDelete.id);
                  } else if (confirmDelete.type === 'partner') {
                    adminDeletePartner(confirmDelete.id);
                  } else if (confirmDelete.type === 'category') {
                    deleteCategory(confirmDelete.id);
                  }
                  setConfirmDelete(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-xs cursor-pointer shadow-lg shadow-rose-600/20"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
