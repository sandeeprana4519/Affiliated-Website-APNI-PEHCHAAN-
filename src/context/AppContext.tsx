import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  Category,
  Product,
  ClickLog,
  ViewMode,
  Platform,
  ProductStatus,
  PlatformSettings,
} from '../types';
import {
  INITIAL_CATEGORIES,
  INITIAL_USERS,
  INITIAL_PRODUCTS,
  INITIAL_CLICK_LOGS,
} from '../data/initialData';
import { validateAffiliateUrl } from '../lib/validation/schemas';
import {
  SupabaseConfig,
  getStoredSupabaseConfig,
  saveSupabaseConfig,
  testSupabaseConnection,
  fetchAllFromSupabase,
  syncProductToSupabase,
  deleteProductFromSupabase,
  syncCategoryToSupabase,
  deleteCategoryFromSupabase,
  syncUserToSupabase,
  deleteUserFromSupabase,
  logClickToSupabase,
  generateUuid,
  isUuid,
} from '../lib/supabase';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
}

interface AppContextType {
  // Navigation & Routing
  currentView: ViewMode;
  setCurrentView: (view: ViewMode) => void;
  selectedProductSlug: string | null;
  openProductPage: (slug: string) => void;
  selectedCategorySlug: string | null;
  openCategoryPage: (slug: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  executeSearch: (query: string) => void;

  // Active Session & Authentication
  currentUser: User | null;
  loginAsUser: (email: string, passwordHash?: string) => { success: boolean; error?: string };
  registerPartner: (data: { name: string; email: string; mobile: string; password: string }) => { success: boolean; error?: string };
  logout: () => void;
  quickSwitchRole: (role: 'CUSTOMER' | 'PARTNER_25' | 'PARTNER_40' | 'BLOCKED_PARTNER' | 'ADMIN') => void;

  // Catalog & Entities
  categories: Category[];
  addCategory: (name: string, slug: string, imageUrl?: string) => void;
  updateCategory: (id: string, name: string, slug: string, status: 'ACTIVE' | 'DISABLED', imageUrl?: string) => void;
  deleteCategory: (id: string) => void;

  products: Product[];
  approvedProducts: Product[]; // Filtered for public view: Admin first, then featured, then latest
  getProductBySlug: (slug: string) => Product | undefined;

  // Product Ownership & Lifecycle
  createPartnerProduct: (input: {
    platform: Platform;
    categoryId: string;
    title: string;
    description: string;
    imageUrl: string;
    price?: number | null;
    dealOffer?: string | null;
    dealDetails?: string | null;
    affiliateUrl: string;
  }) => { success: boolean; error?: string };

  updatePartnerProduct: (
    productId: string,
    updates: Partial<Product>
  ) => { success: boolean; error?: string };

  deletePartnerProduct: (productId: string) => { success: boolean; error?: string };

  // Admin Controls
  adminApproveProduct: (productId: string) => void;
  adminRejectProduct: (productId: string) => void;
  adminToggleHideProduct: (productId: string) => void;
  adminCreateProduct: (input: {
    platform: Platform;
    categoryId: string;
    title: string;
    description: string;
    imageUrl: string;
    price?: number | null;
    dealOffer?: string | null;
    dealDetails?: string | null;
    affiliateUrl: string;
    featured?: boolean;
  }) => { success: boolean; error?: string };
  adminUpdateProduct: (productId: string, updates: Partial<Product>) => { success: boolean; error?: string };
  adminDeleteProduct: (productId: string) => void;

  // Partner Management
  partners: User[];
  toggleBlockPartner: (partnerId: string) => void;
  adminUpdatePartner: (partnerId: string, updates: Partial<User> & { plainPassword?: string }) => { success: boolean; error?: string };
  adminDeletePartner: (partnerId: string) => void;

  // Platform Settings & Backup
  platformSettings: PlatformSettings;
  updatePlatformSettings: (updates: Partial<PlatformSettings>) => void;
  exportPlatformDataJson: () => string;
  clearClickLogs: () => void;

  // Live Database (Supabase / Postgres) Integration
  supabaseConfig: SupabaseConfig;
  updateSupabaseConfig: (config: Partial<SupabaseConfig>) => void;
  testDatabaseConnection: (url: string, key: string) => Promise<{ success: boolean; message: string; tableCounts?: { categories: number; products: number; users: number } }>;
  syncWithDatabase: (silent?: boolean) => Promise<boolean>;
  isSyncingWithDb: boolean;
  pushAllLocalToDatabase: () => Promise<{ success: boolean; count: number; error?: string }>;

  // Affiliate Redirect & Click Tracking
  handleBuyNowRedirect: (productId: string) => { success: boolean; redirectUrl?: string; error?: string };
  clickLogs: ClickLog[];

  // Feedback Notifications
  toasts: Toast[];
  showToast: (message: string, type?: Toast['type']) => void;
  removeToast: (id: string) => void;

  // Data Reset
  resetToInitialSeeds: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation
  const [currentView, setCurrentView] = useState<ViewMode>('home');
  const [selectedProductSlug, setSelectedProductSlug] = useState<string | null>(null);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Users & Auth
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('aff_users');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0 && isUuid(parsed[0].id)) {
          return parsed;
        }
      } catch {}
    }
    return INITIAL_USERS;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('aff_current_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && isUuid(parsed.id)) return parsed;
      } catch {}
    }
    return null; // Customer by default (no login required)
  });

  // Categories
  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('aff_categories');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0 && isUuid(parsed[0].id)) {
          return parsed;
        }
      } catch {}
    }
    return INITIAL_CATEGORIES;
  });

  // Products
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('aff_products');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0 && isUuid(parsed[0].id)) {
          return parsed;
        }
      } catch {}
    }
    return INITIAL_PRODUCTS;
  });

  // Click Logs
  const [clickLogs, setClickLogs] = useState<ClickLog[]>(() => {
    const saved = localStorage.getItem('aff_click_logs');
    return saved ? JSON.parse(saved) : INITIAL_CLICK_LOGS;
  });

  // Platform Settings
  const [platformSettings, setPlatformSettings] = useState<PlatformSettings>(() => {
    const saved = localStorage.getItem('aff_settings');
    const DEFAULT_SETTINGS: PlatformSettings = {
      siteName: 'DealSphere',
      siteTagline: 'Affiliate Product Discovery Platform',
      supportEmail: 'support@dealsphere.internal',
      supportPhone: '+91 98765 43210',
      currencySymbol: '₹',
      autoApprovePartnerDeals: false,
      maintenanceMode: false,
      maintenanceMessage: 'Platform is undergoing routine maintenance. Check back shortly!',
      amazonAffiliateTag: 'dealhub_admin-21',
      flipkartAffiliateId: 'dealhub_admin',
      meeshoAffiliateTag: 'dealhub_admin',
      allowedDomains: ['amazon.in', 'amazon.com', 'flipkart.com', 'fkrt.it', 'meesho.com', 'myntra.com', 'ajio.com'],
      affiliateDisclaimer: 'As an affiliate platform, we earn from qualifying purchases at no extra cost to you. Prices and availability subject to merchant sites.',
      maxUploadSizeMb: 5,
    };
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  });

  // Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Live Database (Supabase) Integration State
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>(getStoredSupabaseConfig);
  const [isSyncingWithDb, setIsSyncingWithDb] = useState<boolean>(false);

  const updateSupabaseConfig = (config: Partial<SupabaseConfig>) => {
    const updated = saveSupabaseConfig(config);
    setSupabaseConfig(updated);
    if (updated.isConnected) {
      syncWithDatabase(false);
    }
  };

  const testDatabaseConnection = async (url: string, key: string) => {
    return await testSupabaseConnection(url, key);
  };

  const syncWithDatabase = async (silent: boolean = false): Promise<boolean> => {
    const cfg = getStoredSupabaseConfig();
    if (!cfg.isConnected || !cfg.url || !cfg.anonKey) {
      if (!silent) showToast('Database is not connected. Configure in Admin Settings.', 'warning');
      return false;
    }

    setIsSyncingWithDb(true);
    try {
      const data = await fetchAllFromSupabase();
      if (!data) {
        if (!silent) showToast('Failed to connect to Supabase. Check credentials in Admin Settings.', 'error');
        return false;
      }

      if (data.categories && data.categories.length > 0) setCategories(data.categories);
      if (data.products && data.products.length > 0) setProducts(data.products);
      if (data.users && data.users.length > 0) setUsers(data.users);
      if (data.clickLogs && data.clickLogs.length > 0) setClickLogs(data.clickLogs);

      if (!silent) {
        showToast(
          `Live Database Synced! Loaded ${data.products.length} products & ${data.categories.length} categories.`,
          'success'
        );
      }
      return true;
    } catch (err: any) {
      if (!silent) showToast(`Database sync error: ${err.message}`, 'error');
      return false;
    } finally {
      setIsSyncingWithDb(false);
    }
  };

  const pushAllLocalToDatabase = async () => {
    const cfg = getStoredSupabaseConfig();
    if (!cfg.isConnected) {
      return { success: false, count: 0, error: 'Database is not connected. Enter Supabase keys first.' };
    }

    setIsSyncingWithDb(true);
    let count = 0;
    try {
      // 1. Sync Categories first
      for (const cat of categories) {
        await syncCategoryToSupabase(cat);
      }
      // 2. Sync Users
      for (const u of users) {
        await syncUserToSupabase(u);
      }
      // 3. Sync Products
      for (const prod of products) {
        const res = await syncProductToSupabase(prod, categories);
        if (res.success) count++;
      }

      showToast(`Pushed ${count} products & ${categories.length} categories to Supabase database!`, 'success');
      return { success: true, count };
    } catch (err: any) {
      showToast(`Push failed: ${err.message}`, 'error');
      return { success: false, count, error: err.message };
    } finally {
      setIsSyncingWithDb(false);
    }
  };

  // Initial Sync from Database on App Load if connected
  useEffect(() => {
    const cfg = getStoredSupabaseConfig();
    if (cfg.isConnected && cfg.url && cfg.anonKey) {
      syncWithDatabase(true);
    }
  }, []);

  // Persistence
  useEffect(() => {
    localStorage.setItem('aff_settings', JSON.stringify(platformSettings));
  }, [platformSettings]);
  useEffect(() => {
    localStorage.setItem('aff_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('aff_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('aff_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('aff_click_logs', JSON.stringify(clickLogs));
  }, [clickLogs]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('aff_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('aff_current_user');
    }
  }, [currentUser]);

  const showToast = (message: string, type: Toast['type'] = 'info') => {
    const id = 'toast_' + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Navigation handlers
  const openProductPage = (slug: string) => {
    setSelectedProductSlug(slug);
    setCurrentView('product_detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openCategoryPage = (slug: string) => {
    setSelectedCategorySlug(slug);
    setCurrentView('category_detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const executeSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentView('search');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Authentication
  const loginAsUser = (email: string, _password?: string) => {
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return { success: false, error: 'Invalid email or password.' };
    }

    if (user.status === 'BLOCKED') {
      return { success: false, error: 'Your account has been blocked. Please contact support.' };
    }

    setCurrentUser(user);
    if (user.role === 'ADMIN') {
      setCurrentView('admin_dashboard');
      showToast(`Logged in as Administrator (${user.name})`, 'success');
    } else {
      setCurrentView('partner_dashboard');
      showToast(`Welcome back, ${user.name}!`, 'success');
    }

    return { success: true };
  };

  const registerPartner = (data: { name: string; email: string; mobile: string; password: string }) => {
    // Check duplicate email
    if (users.some((u) => u.email.toLowerCase() === data.email.toLowerCase())) {
      return { success: false, error: 'An account with this email address already exists.' };
    }

    const newUser: User = {
      id: generateUuid(),
      name: data.name,
      email: data.email.toLowerCase(),
      mobile: data.mobile,
      passwordHash: '$argon2id$v=19$hashed_' + Date.now(),
      role: 'PARTNER',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setUsers((prev) => [...prev, newUser]);
    setCurrentUser(newUser);
    setCurrentView('partner_dashboard');

    if (supabaseConfig.isConnected) {
      syncUserToSupabase(newUser).then((res) => {
        if (!res.success) console.warn('Supabase sync notice:', res.error);
      });
    }

    showToast('Partner account created successfully!', 'success');
    return { success: true };
  };

  const logout = () => {
    setCurrentUser(null);
    setCurrentView('home');
    showToast('Signed out successfully.', 'info');
  };

  const quickSwitchRole = (role: 'CUSTOMER' | 'PARTNER_25' | 'PARTNER_40' | 'BLOCKED_PARTNER' | 'ADMIN') => {
    switch (role) {
      case 'CUSTOMER':
        setCurrentUser(null);
        setCurrentView('home');
        showToast('Viewing as Public Customer (no login required)', 'info');
        break;
      case 'PARTNER_25': {
        const p25 = users.find((u) => u.email === 'kavita@partnerdeals.in' || u.id === 'a1000000-0000-0000-0000-000000000025') || users[1];
        setCurrentUser(p25);
        setCurrentView('partner_dashboard');
        showToast(`Impersonating Partner 25 (${p25.name})`, 'info');
        break;
      }
      case 'PARTNER_40': {
        const p40 = users.find((u) => u.email === 'rahul@techhunter.io' || u.id === 'a1000000-0000-0000-0000-000000000040') || users[2];
        setCurrentUser(p40);
        setCurrentView('partner_dashboard');
        showToast(`Impersonating Partner 40 (${p40.name})`, 'info');
        break;
      }
      case 'BLOCKED_PARTNER': {
        const blocked = users.find((u) => u.status === 'BLOCKED') || users[3];
        setCurrentUser(blocked);
        setCurrentView('partner_dashboard');
        showToast('Impersonating Blocked Partner (restricted access)', 'warning');
        break;
      }
      case 'ADMIN': {
        const adm = users.find((u) => u.role === 'ADMIN') || users[0];
        setCurrentUser(adm);
        setCurrentView('admin_dashboard');
        showToast('Logged in as Platform Admin', 'success');
        break;
      }
    }
  };

  // Categories CRUD
  const addCategory = (name: string, slug: string, imageUrl?: string) => {
    const newCat: Category = {
      id: generateUuid(),
      name,
      slug: slug.toLowerCase().replace(/[^a-z0-9-]+/g, '-'),
      imageUrl: imageUrl || 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=600&q=80',
      status: 'ACTIVE',
      sortOrder: categories.length + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setCategories((prev) => [...prev, newCat]);

    if (supabaseConfig.isConnected) {
      syncCategoryToSupabase(newCat).then((res) => {
        if (!res.success) showToast(`Database notice: ${res.error}`, 'warning');
      });
    }

    showToast(`Category "${name}" created.`, 'success');
  };

  const updateCategory = (id: string, name: string, slug: string, status: 'ACTIVE' | 'DISABLED', imageUrl?: string) => {
    let updatedCat: Category | null = null;
    setCategories((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          updatedCat = {
            ...c,
            name,
            slug,
            status,
            ...(imageUrl !== undefined ? { imageUrl } : {}),
            updatedAt: new Date().toISOString(),
          };
          return updatedCat;
        }
        return c;
      })
    );

    if (supabaseConfig.isConnected && updatedCat) {
      syncCategoryToSupabase(updatedCat).then((res) => {
        if (!res.success) showToast(`Database notice: ${res.error}`, 'warning');
      });
    }

    showToast('Category updated.', 'success');
  };

  const deleteCategory = (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
    if (supabaseConfig.isConnected) {
      deleteCategoryFromSupabase(id);
    }
    showToast('Category removed.', 'info');
  };

  // Product querying
  const getProductBySlug = (slug: string) => {
    return products.find((p) => p.slug === slug);
  };

  // ORDER REQUIREMENT 38: Admin Products first, then Featured, then Latest (Approved only!)
  const approvedProducts = [...products]
    .filter((p) => p.status === 'APPROVED')
    .sort((a, b) => {
      // 1. Admin products first
      if (a.isAdminProduct && !b.isAdminProduct) return -1;
      if (!a.isAdminProduct && b.isAdminProduct) return 1;

      // 2. Featured products second
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;

      // 3. Latest by createdAt
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  // Partner Product Creation
  const createPartnerProduct = (input: {
    platform: Platform;
    categoryId: string;
    title: string;
    description: string;
    imageUrl: string;
    price?: number | null;
    dealOffer?: string | null;
    dealDetails?: string | null;
    affiliateUrl: string;
  }) => {
    if (!currentUser || currentUser.role !== 'PARTNER') {
      return { success: false, error: "You don't have permission to access this resource." };
    }

    if (currentUser.status === 'BLOCKED') {
      return { success: false, error: 'Your account has been blocked. Please contact support.' };
    }

    const val = validateAffiliateUrl(input.affiliateUrl);
    if (!val.isValid) {
      return { success: false, error: val.error || 'Invalid affiliate URL' };
    }

    const cat = categories.find((c) => c.id === input.categoryId);
    const slug = input.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') + '-' + Math.floor(100 + Math.random() * 900);

    const newProd: Product = {
      id: generateUuid(),
      partnerId: currentUser.id,
      partnerName: currentUser.name,
      categoryId: input.categoryId,
      categoryName: cat?.name || 'General',
      categorySlug: cat?.slug || 'general',
      platform: input.platform,
      title: input.title,
      slug,
      description: input.description,
      imageUrl: input.imageUrl,
      price: input.price ? Number(input.price) : null,
      dealOffer: input.dealOffer || null,
      dealDetails: input.dealDetails || null,
      affiliateUrl: input.affiliateUrl,
      status: 'PENDING', // Always PENDING for partner submissions!
      isAdminProduct: false,
      featured: false,
      clickCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setProducts((prev) => [newProd, ...prev]);

    if (supabaseConfig.isConnected) {
      syncProductToSupabase(newProd, categories).then((res) => {
        if (!res.success) showToast(`Database notice: ${res.error}`, 'warning');
      });
    }

    showToast('Product submitted successfully. Waiting for admin approval.', 'success');
    return { success: true };
  };

  // CRITICAL OWNERSHIP SECURITY CHECK (Requirement 13 & 24)
  const updatePartnerProduct = (productId: string, updates: Partial<Product>) => {
    if (!currentUser) {
      return { success: false, error: "You don't have permission to access this resource." };
    }

    if (currentUser.status === 'BLOCKED') {
      return { success: false, error: 'Your account has been blocked. Please contact support.' };
    }

    const targetProduct = products.find((p) => p.id === productId);
    if (!targetProduct) {
      return { success: false, error: 'Sorry, this product is no longer available.' };
    }

    // Strict ownership verification:
    if (currentUser.role !== 'ADMIN' && targetProduct.partnerId !== currentUser.id) {
      showToast('HTTP 403 Forbidden: You do not own this product.', 'error');
      return {
        success: false,
        error: 'HTTP 403 Forbidden: You are not authorized to modify another partner’s product.',
      };
    }

    const sanitizedUpdates: Partial<Product> = { ...updates };
    if (currentUser.role !== 'ADMIN') {
      delete sanitizedUpdates.partnerId;
      delete sanitizedUpdates.isAdminProduct;
      sanitizedUpdates.status = 'PENDING';
    }

    if (sanitizedUpdates.affiliateUrl) {
      const val = validateAffiliateUrl(sanitizedUpdates.affiliateUrl);
      if (!val.isValid) {
        return { success: false, error: val.error };
      }
    }

    let updatedProd: Product | null = null;
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          updatedProd = {
            ...p,
            ...sanitizedUpdates,
            updatedAt: new Date().toISOString(),
          };
          return updatedProd;
        }
        return p;
      })
    );

    if (supabaseConfig.isConnected && updatedProd) {
      syncProductToSupabase(updatedProd, categories).then((res) => {
        if (!res.success) showToast(`Database notice: ${res.error}`, 'warning');
      });
    }

    if (currentUser.role !== 'ADMIN') {
      showToast('Product updated and submitted for admin re-approval.', 'info');
    } else {
      showToast('Product updated successfully.', 'success');
    }

    return { success: true };
  };

  const deletePartnerProduct = (productId: string) => {
    if (!currentUser) {
      return { success: false, error: "You don't have permission to access this resource." };
    }

    if (currentUser.status === 'BLOCKED') {
      return { success: false, error: 'Your account has been blocked. Please contact support.' };
    }

    const targetProduct = products.find((p) => p.id === productId);
    if (!targetProduct) {
      return { success: false, error: 'Sorry, this product is no longer available.' };
    }

    if (currentUser.role !== 'ADMIN' && targetProduct.partnerId !== currentUser.id) {
      showToast('HTTP 403 Forbidden: Cannot delete another partner’s product.', 'error');
      return {
        success: false,
        error: 'HTTP 403 Forbidden: You do not have permission to delete this product.',
      };
    }

    setProducts((prev) => prev.filter((p) => p.id !== productId));
    if (supabaseConfig.isConnected) {
      deleteProductFromSupabase(productId);
    }
    showToast('Product deleted from catalog.', 'info');
    return { success: true };
  };

  // Admin Controls
  const adminApproveProduct = (productId: string) => {
    if (!currentUser || currentUser.role !== 'ADMIN') {
      showToast('Admin authorization required', 'error');
      return;
    }
    let approvedProd: Product | null = null;
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          approvedProd = { ...p, status: 'APPROVED', updatedAt: new Date().toISOString() };
          return approvedProd;
        }
        return p;
      })
    );
    if (supabaseConfig.isConnected && approvedProd) {
      syncProductToSupabase(approvedProd, categories);
    }
    showToast('Product approved and now live on public website.', 'success');
  };

  const adminRejectProduct = (productId: string) => {
    if (!currentUser || currentUser.role !== 'ADMIN') {
      showToast('Admin authorization required', 'error');
      return;
    }
    let rejectedProd: Product | null = null;
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          rejectedProd = { ...p, status: 'REJECTED', updatedAt: new Date().toISOString() };
          return rejectedProd;
        }
        return p;
      })
    );
    if (supabaseConfig.isConnected && rejectedProd) {
      syncProductToSupabase(rejectedProd, categories);
    }
    showToast('Product rejected.', 'warning');
  };

  const adminCreateProduct = (input: {
    platform: Platform;
    categoryId: string;
    title: string;
    description: string;
    imageUrl: string;
    price?: number | null;
    dealOffer?: string | null;
    dealDetails?: string | null;
    affiliateUrl: string;
    featured?: boolean;
  }) => {
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return { success: false, error: 'Admin permission required' };
    }

    const val = validateAffiliateUrl(input.affiliateUrl);
    if (!val.isValid) {
      return { success: false, error: val.error };
    }

    const cat = categories.find((c) => c.id === input.categoryId);
    const slug = input.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') + '-' + Math.floor(100 + Math.random() * 900);

    const adminProd: Product = {
      id: generateUuid(),
      partnerId: null,
      partnerName: 'Editorial Staff',
      categoryId: input.categoryId,
      categoryName: cat?.name || 'General',
      categorySlug: cat?.slug || 'general',
      platform: input.platform,
      title: input.title,
      slug,
      description: input.description,
      imageUrl: input.imageUrl,
      price: input.price ? Number(input.price) : null,
      dealOffer: input.dealOffer || null,
      dealDetails: input.dealDetails || null,
      affiliateUrl: input.affiliateUrl,
      status: 'APPROVED',
      isAdminProduct: true,
      featured: input.featured ?? true,
      clickCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setProducts((prev) => [adminProd, ...prev]);

    if (supabaseConfig.isConnected) {
      syncProductToSupabase(adminProd, categories).then((res) => {
        if (!res.success) showToast(`Database sync: ${res.error}`, 'warning');
      });
    }

    showToast('Admin product published directly to database & storefront!', 'success');
    return { success: true };
  };

  const adminToggleHideProduct = (productId: string) => {
    if (!currentUser || currentUser.role !== 'ADMIN') return;
    let toggledProd: Product | null = null;
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          const nextStatus = p.status === 'APPROVED' ? 'REJECTED' : 'APPROVED';
          toggledProd = { ...p, status: nextStatus, updatedAt: new Date().toISOString() };
          showToast(`Product is now ${nextStatus === 'APPROVED' ? 'Published (Live)' : 'Hidden (Rejected)'}.`, 'info');
          return toggledProd;
        }
        return p;
      })
    );
    if (supabaseConfig.isConnected && toggledProd) {
      syncProductToSupabase(toggledProd, categories);
    }
  };

  const adminUpdateProduct = (productId: string, updates: Partial<Product>) => {
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return { success: false, error: 'Admin permission required' };
    }
    const targetProduct = products.find((p) => p.id === productId);
    if (!targetProduct) {
      return { success: false, error: 'Product not found' };
    }
    if (updates.affiliateUrl) {
      const val = validateAffiliateUrl(updates.affiliateUrl);
      if (!val.isValid) {
        return { success: false, error: val.error };
      }
    }
    let catUpdates = {};
    if (updates.categoryId && updates.categoryId !== targetProduct.categoryId) {
      const cat = categories.find((c) => c.id === updates.categoryId);
      if (cat) {
        catUpdates = { categoryName: cat.name, categorySlug: cat.slug };
      }
    }

    let updatedProd: Product | null = null;
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === productId) {
          updatedProd = {
            ...p,
            ...updates,
            ...catUpdates,
            updatedAt: new Date().toISOString(),
          };
          return updatedProd;
        }
        return p;
      })
    );

    if (supabaseConfig.isConnected && updatedProd) {
      syncProductToSupabase(updatedProd, categories).then((res) => {
        if (!res.success) showToast(`Database sync: ${res.error}`, 'warning');
      });
    }

    showToast('Product updated successfully in database.', 'success');
    return { success: true };
  };

  const adminDeleteProduct = (productId: string) => {
    if (!currentUser || currentUser.role !== 'ADMIN') return;
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    if (supabaseConfig.isConnected) {
      deleteProductFromSupabase(productId);
    }
    showToast('Product deleted by administrator.', 'info');
  };

  const partners = users.filter((u) => u.role === 'PARTNER');

  const toggleBlockPartner = (partnerId: string) => {
    if (!currentUser || currentUser.role !== 'ADMIN') return;
    let updatedUser: User | null = null;
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === partnerId) {
          const nextStatus = u.status === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE';
          updatedUser = { ...u, status: nextStatus, updatedAt: new Date().toISOString() };
          showToast(`Partner "${u.name}" is now ${nextStatus}.`, nextStatus === 'BLOCKED' ? 'warning' : 'success');
          return updatedUser;
        }
        return u;
      })
    );
    if (supabaseConfig.isConnected && updatedUser) {
      syncUserToSupabase(updatedUser);
    }
  };

  const adminUpdatePartner = (partnerId: string, updates: Partial<User> & { plainPassword?: string }) => {
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return { success: false, error: 'Admin permission required' };
    }
    const target = users.find((u) => u.id === partnerId);
    if (!target) {
      return { success: false, error: 'Partner not found' };
    }
    if (updates.email && updates.email.toLowerCase() !== target.email.toLowerCase()) {
      if (users.some((u) => u.id !== partnerId && u.email.toLowerCase() === updates.email!.toLowerCase())) {
        return { success: false, error: 'Email already registered to another user' };
      }
    }

    const { plainPassword, ...restUpdates } = updates;
    const newHash = plainPassword ? `$argon2id$v=19$m=65536,t=3,p=4$updated_${plainPassword.slice(0, 4)}_${Date.now()}` : undefined;

    let updatedUser: User | null = null;
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === partnerId) {
          updatedUser = {
            ...u,
            ...restUpdates,
            ...(newHash ? { passwordHash: newHash } : {}),
            updatedAt: new Date().toISOString(),
          };
          return updatedUser;
        }
        return u;
      })
    );

    if (supabaseConfig.isConnected && updatedUser) {
      syncUserToSupabase(updatedUser);
    }

    // Sync partnerName across their products if updated
    if (updates.name && updates.name !== target.name) {
      setProducts((prev) =>
        prev.map((p) => (p.partnerId === partnerId ? { ...p, partnerName: updates.name } : p))
      );
    }

    showToast(`Partner "${updates.name || target.name}" updated.`, 'success');
    return { success: true };
  };

  const adminDeletePartner = (partnerId: string) => {
    if (!currentUser || currentUser.role !== 'ADMIN') return;
    setUsers((prev) => prev.filter((u) => u.id !== partnerId));
    setProducts((prev) =>
      prev.map((p) =>
        p.partnerId === partnerId
          ? { ...p, partnerId: null, partnerName: 'Archived Partner Listing' }
          : p
      )
    );
    if (supabaseConfig.isConnected) {
      deleteUserFromSupabase(partnerId);
    }
    showToast('Partner removed and listings retained as archived.', 'info');
  };

  const updatePlatformSettings = (updates: Partial<PlatformSettings>) => {
    if (!currentUser || currentUser.role !== 'ADMIN') return;
    setPlatformSettings((prev) => ({ ...prev, ...updates }));
    showToast('Platform settings saved successfully.', 'success');
  };

  const exportPlatformDataJson = () => {
    const backup = {
      exportedAt: new Date().toISOString(),
      platform: 'DealSphere Hostinger VPS Instance',
      users,
      categories,
      products,
      clickLogs,
      settings: platformSettings,
    };
    return JSON.stringify(backup, null, 2);
  };

  const clearClickLogs = () => {
    if (!currentUser || currentUser.role !== 'ADMIN') return;
    setClickLogs([]);
    localStorage.removeItem('aff_click_logs');
    showToast('All click telemetry logs cleared.', 'info');
  };

  // CONTROLLED REDIRECT ROUTE (/go/[productId]) - Requirement 22 & 23
  const handleBuyNowRedirect = (productId: string) => {
    const product = products.find((p) => p.id === productId);

    if (!product) {
      showToast('Sorry, this product is no longer available.', 'error');
      return { success: false, error: 'Product not found.' };
    }

    if (product.status !== 'APPROVED') {
      showToast('This product is waiting for admin approval.', 'warning');
      return { success: false, error: 'Only approved products can be redirected.' };
    }

    // Security check on affiliate URL
    const val = validateAffiliateUrl(product.affiliateUrl);
    if (!val.isValid) {
      showToast(`Invalid affiliate link: ${val.error}`, 'error');
      return { success: false, error: val.error };
    }

    const ipHash = 'hash_' + Math.random().toString(36).substring(2, 8);
    const userAgent = navigator.userAgent.slice(0, 100);

    // Record privacy-conscious click log
    const newLog: ClickLog = {
      id: 'clk_' + Date.now().toString().slice(-7),
      productId: product.id,
      productTitle: product.title,
      platform: product.platform,
      timestamp: new Date().toISOString(),
      ipHash,
      userAgent,
    };

    setClickLogs((prev) => [newLog, ...prev.slice(0, 49)]);

    // Increment product click count
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, clickCount: p.clickCount + 1 } : p))
    );

    if (supabaseConfig.isConnected) {
      logClickToSupabase(product.id, ipHash, userAgent);
    }

    return {
      success: true,
      redirectUrl: product.affiliateUrl,
    };
  };

  const resetToInitialSeeds = () => {
    localStorage.removeItem('aff_users');
    localStorage.removeItem('aff_categories');
    localStorage.removeItem('aff_products');
    localStorage.removeItem('aff_click_logs');
    localStorage.removeItem('aff_current_user');

    setUsers(INITIAL_USERS);
    setCategories(INITIAL_CATEGORIES);
    setProducts(INITIAL_PRODUCTS);
    setClickLogs(INITIAL_CLICK_LOGS);
    setCurrentUser(null);
    setCurrentView('home');
    showToast('Platform reset to initial seed data.', 'info');
  };

  return (
    <AppContext.Provider
      value={{
        currentView,
        setCurrentView,
        selectedProductSlug,
        openProductPage,
        selectedCategorySlug,
        openCategoryPage,
        searchQuery,
        setSearchQuery,
        executeSearch,
        currentUser,
        loginAsUser,
        registerPartner,
        logout,
        quickSwitchRole,
        categories,
        addCategory,
        updateCategory,
        deleteCategory,
        products,
        approvedProducts,
        getProductBySlug,
        createPartnerProduct,
        updatePartnerProduct,
        deletePartnerProduct,
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
        platformSettings,
        updatePlatformSettings,
        exportPlatformDataJson,
        clearClickLogs,
        supabaseConfig,
        updateSupabaseConfig,
        testDatabaseConnection,
        syncWithDatabase,
        isSyncingWithDb,
        pushAllLocalToDatabase,
        handleBuyNowRedirect,
        clickLogs,
        toasts,
        showToast,
        removeToast,
        resetToInitialSeeds,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
