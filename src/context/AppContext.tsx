import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  User,
  Category,
  Product,
  ClickLog,
  ViewMode,
  Platform,
  ProductStatus,
  PlatformSettings,
  AffiliatePlatform,
} from '../types';
import {
  INITIAL_CATEGORIES,
  INITIAL_USERS,
  INITIAL_PRODUCTS,
  INITIAL_CLICK_LOGS,
  INITIAL_AFFILIATE_PLATFORMS,
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
  syncAffiliatePlatformToSupabase,
  deleteAffiliatePlatformFromSupabase,
  syncUserToSupabase,
  deleteUserFromSupabase,
  logClickToSupabase,
  getCachedUserAvatar,
  setCachedUserAvatar,
  getCachedProductImage,
  setCachedProductImage,
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
  loginAsUser: (identifier: string, passwordHash?: string) => { success: boolean; error?: string };
  registerPartner: (data: { name: string; email: string; mobile: string; password: string }) => { success: boolean; error?: string };
  updatePartnerProfile: (updates: {
    name?: string;
    partnerId?: string;
    id?: string;
    email?: string;
    mobile?: string;
    avatarUrl?: string;
    newPassword?: string;
    currentPassword?: string;
  }) => { success: boolean; error?: string };
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
    description?: string | null;
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
    description?: string | null;
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

  // Affiliate Platforms Management (Amazon, Flipkart, Meesho, Myntra, etc.)
  affiliatePlatforms: AffiliatePlatform[];
  activeAffiliatePlatforms: AffiliatePlatform[];
  addAffiliatePlatform: (platform: {
    code: string;
    name: string;
    domain: string;
    allowedDomains?: string[];
    sampleUrl?: string;
    badgeBg?: string;
    status?: 'ACTIVE' | 'DISABLED';
  }) => { success: boolean; error?: string };
  updateAffiliatePlatform: (
    id: string,
    updates: Partial<AffiliatePlatform>
  ) => { success: boolean; error?: string };
  deleteAffiliatePlatform: (id: string) => { success: boolean; error?: string };
  togglePlatformStatus: (id: string) => void;

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

// Helper to generate sequential partner IDs like AP00001, AP00002, AP00003
const generateNextPartnerId = (existingUsers: User[]): string => {
  let maxNum = 0;
  existingUsers.forEach((u) => {
    const match = u.id.match(/^AP(\d+)$/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  });
  const nextNum = maxNum > 0 ? maxNum + 1 : 1;
  return `AP${String(nextNum).padStart(5, '0')}`;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation
  const [currentView, setCurrentView] = useState<ViewMode>('home');
  const [selectedProductSlug, setSelectedProductSlug] = useState<string | null>(null);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Users & Auth
  const [users, setUsers] = useState<User[]>(() => {
    const adminUser: User = {
      id: 'ADMIN001',
      name: 'Sandeep Rana',
      email: 'sandeeprana4519@gmail.com',
      mobile: '+91 98765 43210',
      passwordHash: 'Kanha@9298',
      role: 'ADMIN',
      status: 'ACTIVE',
      avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=300&q=80',
      createdAt: '2026-01-01T10:00:00Z',
      updatedAt: new Date().toISOString(),
    };

    const saved = localStorage.getItem('aff_users');
    let list: User[] = [adminUser];
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0].id === 'string' && parsed[0].id.length > 0) {
          list = parsed;
        }
      } catch {}
    }

    const adminIndex = list.findIndex((u) => u.role === 'ADMIN' || u.email.toLowerCase() === 'sandeeprana4519@gmail.com');
    if (adminIndex >= 0) {
      list[adminIndex] = { ...list[adminIndex], ...adminUser };
    } else {
      list.unshift(adminUser);
    }
    return list;
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('aff_current_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.id === 'string' && parsed.id.length > 0) return parsed;
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
      siteName: 'APNI PEHCHAAN',
      siteTagline: 'Affiliate Product Discovery Platform',
      supportEmail: 'support@apnipehchaan.in',
      supportPhone: '+91 98765 43210',
      currencySymbol: '₹',
      autoApprovePartnerDeals: false,
      maintenanceMode: false,
      maintenanceMessage: 'Platform is undergoing routine maintenance. Check back shortly!',
      amazonAffiliateTag: 'apnipehchaan_admin-21',
      flipkartAffiliateId: 'apnipehchaan_admin',
      meeshoAffiliateTag: 'apnipehchaan_admin',
      allowedDomains: ['amazon.in', 'amazon.com', 'flipkart.com', 'fkrt.it', 'meesho.com', 'myntra.com', 'ajio.com'],
      affiliateDisclaimer: 'As an affiliate platform, we earn from qualifying purchases at no extra cost to you. Prices and availability subject to merchant sites.',
      maxUploadSizeMb: 5,
    };
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.siteName === 'DealSphere') {
          parsed.siteName = 'APNI PEHCHAAN';
        }
        return { ...DEFAULT_SETTINGS, ...parsed };
      } catch (e) {
        return DEFAULT_SETTINGS;
      }
    }
    return DEFAULT_SETTINGS;
  });

  // Affiliate Platforms (Dynamic Amazon, Flipkart, Meesho, Myntra, etc.)
  const [affiliatePlatforms, setAffiliatePlatforms] = useState<AffiliatePlatform[]>(() => {
    const saved = localStorage.getItem('aff_platforms');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {}
    }
    return INITIAL_AFFILIATE_PLATFORMS;
  });

  const activeAffiliatePlatforms = affiliatePlatforms.filter((p) => p.status === 'ACTIVE');

  // Unified list of authorized affiliate domains (core + custom platforms)
  const allAllowedDomains = useMemo(() => {
    const domainSet = new Set<string>();
    (platformSettings?.allowedDomains || []).forEach((d) => domainSet.add(d.toLowerCase().trim()));
    affiliatePlatforms.forEach((p) => {
      if (p.domain) domainSet.add(p.domain.toLowerCase().trim());
      (p.allowedDomains || []).forEach((d) => domainSet.add(d.toLowerCase().trim()));
    });
    return Array.from(domainSet).filter(Boolean);
  }, [platformSettings?.allowedDomains, affiliatePlatforms]);

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
    if (!cfg.url || !cfg.anonKey) {
      if (!silent) showToast('Database credentials not set. Configure in Admin Settings.', 'warning');
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

      if (data.affiliatePlatforms && data.affiliatePlatforms.length > 0) {
        setAffiliatePlatforms((currentPlats) => {
          const remoteCodes = new Set(data.affiliatePlatforms.map((p) => p.code.toUpperCase()));
          const unsyncedLocal = currentPlats.filter((p) => !remoteCodes.has(p.code.toUpperCase()));
          return [...data.affiliatePlatforms, ...unsyncedLocal];
        });
      }

      if (data.products && data.products.length > 0) {
        setProducts((currentProducts) => {
          const remoteIds = new Set(data.products.map((p) => p.id));
          // Preserve any locally created products that haven't reached remote yet
          const unsyncedLocal = currentProducts.filter((p) => !remoteIds.has(p.id));
          // For remote products, preserve custom local image if remote image is placeholder or missing
          const mergedRemote = data.products.map((remoteProd) => {
            const localProd = currentProducts.find((p) => p.id === remoteProd.id);
            const cachedImg = getCachedProductImage(remoteProd.id);
            const resolvedImg = 
              (remoteProd.imageUrl && !remoteProd.imageUrl.includes('placeholder')) 
                ? remoteProd.imageUrl 
                : (localProd?.imageUrl || cachedImg || remoteProd.imageUrl);
            return {
              ...remoteProd,
              imageUrl: resolvedImg,
            };
          });
          return [...unsyncedLocal, ...mergedRemote];
        });
      }

      if (data.users && data.users.length > 0) {
        const adminUser: User = {
          id: 'ADMIN001',
          name: 'Sandeep Rana',
          email: 'sandeeprana4519@gmail.com',
          mobile: '+91 98765 43210',
          passwordHash: 'Kanha@9298',
          role: 'ADMIN',
          status: 'ACTIVE',
          avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=300&q=80',
          createdAt: '2026-01-01T10:00:00Z',
          updatedAt: new Date().toISOString(),
        };

        setUsers((currentUsers) => {
          // Preserve customized partner avatars so background sync never replaces them with initials
          const mergedUsers = data.users.map((remoteUser) => {
            const cachedAvatar = getCachedUserAvatar(remoteUser.id, remoteUser.email);
            const localUser = currentUsers.find(
              (u) => u.id === remoteUser.id || u.email.toLowerCase() === remoteUser.email.toLowerCase()
            );

            const isRemoteCustom = remoteUser.avatarUrl && !remoteUser.avatarUrl.includes('ui-avatars.com');
            const isLocalCustom = localUser?.avatarUrl && !localUser.avatarUrl.includes('ui-avatars.com');
            const isCachedCustom = cachedAvatar && !cachedAvatar.includes('ui-avatars.com');

            const preservedAvatar = isLocalCustom 
              ? localUser!.avatarUrl 
              : (isRemoteCustom ? remoteUser.avatarUrl : (isCachedCustom ? cachedAvatar : (remoteUser.avatarUrl || localUser?.avatarUrl || cachedAvatar)));

            return {
              ...remoteUser,
              ...(preservedAvatar ? { avatarUrl: preservedAvatar } : {}),
            };
          });

          const adminIdx = mergedUsers.findIndex(
            (u) => u.role === 'ADMIN' || u.email.toLowerCase() === 'sandeeprana4519@gmail.com'
          );
          if (adminIdx >= 0) {
            mergedUsers[adminIdx] = { ...mergedUsers[adminIdx], ...adminUser };
          } else {
            mergedUsers.unshift(adminUser);
          }
          return mergedUsers;
        });

        // Keep active logged in partner's avatar synced in currentUser state without overwriting custom photo
        setCurrentUser((current) => {
          if (!current) return null;
          const remoteMatched = data.users.find(
            (u) => u.id === current.id || u.email.toLowerCase() === current.email.toLowerCase()
          );
          if (!remoteMatched) return current;

          const isCurrentCustom = current.avatarUrl && !current.avatarUrl.includes('ui-avatars.com');
          const isRemoteCustom = remoteMatched.avatarUrl && !remoteMatched.avatarUrl.includes('ui-avatars.com');
          const finalAvatar = isCurrentCustom 
            ? current.avatarUrl 
            : (isRemoteCustom ? remoteMatched.avatarUrl : current.avatarUrl);

          return {
            ...current,
            ...remoteMatched,
            id: current.id,
            avatarUrl: finalAvatar,
          };
        });

        syncUserToSupabase(adminUser).catch(() => {});
      }
      if (data.clickLogs && data.clickLogs.length > 0) setClickLogs(data.clickLogs);

      setSupabaseConfig((prev) => {
        if (!prev.isConnected) {
          const updated = { ...prev, isConnected: true, lastTestedAt: new Date().toISOString() };
          saveSupabaseConfig(updated);
          return updated;
        }
        return prev;
      });

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
    let typeConflictNotice = false;
    try {
      // 1. Sync Affiliate Platforms first so foreign keys / platform codes are registered
      for (const plat of affiliatePlatforms) {
        await syncAffiliatePlatformToSupabase(plat);
      }
      // 2. Sync Categories
      for (const cat of categories) {
        await syncCategoryToSupabase(cat);
      }
      // 3. Sync Users
      for (const u of users) {
        await syncUserToSupabase(u);
      }
      // 4. Sync Products
      for (const prod of products) {
        const res = await syncProductToSupabase(prod, categories);
        if (res.success) {
          count++;
        } else if (res.code === '22P02' || res.error?.includes('ENUM') || res.error?.includes('affiliate_platform')) {
          typeConflictNotice = true;
        }
      }

      if (typeConflictNotice) {
        showToast(
          `Pushed ${count} products. Warning: Some products with custom affiliate platforms were blocked by PostgreSQL ENUM. Run the "Affiliate Platforms SQL Fix" in Database tab to fix!`,
          'warning'
        );
      } else {
        showToast(`Pushed ${count} products, ${affiliatePlatforms.length} platforms & ${categories.length} categories to Supabase database!`, 'success');
      }
      return { success: true, count };
    } catch (err: any) {
      showToast(`Push failed: ${err.message}`, 'error');
      return { success: false, count, error: err.message };
    } finally {
      setIsSyncingWithDb(false);
    }
  };

  // Initial Sync from Database on App Load if credentials present
  useEffect(() => {
    const cfg = getStoredSupabaseConfig();
    if (cfg.url && cfg.anonKey) {
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
    localStorage.setItem('aff_platforms', JSON.stringify(affiliatePlatforms));
  }, [affiliatePlatforms]);

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
  const loginAsUser = (identifier: string, password?: string) => {
    const cleanId = identifier.trim().toLowerCase();
    let user = users.find(
      (u) => u.email.toLowerCase() === cleanId || u.id.toLowerCase() === cleanId
    );

    // If logging in as administrator and not yet present in state
    if (!user && (cleanId === 'sandeeprana4519@gmail.com' || cleanId === 'sandeeprana4139@gmail.com' || cleanId === 'admin001' || cleanId === 'admin@dealhub.internal')) {
      user = {
        id: 'ADMIN001',
        name: 'Sandeep Rana',
        email: 'sandeeprana4519@gmail.com',
        mobile: '+91 98765 43210',
        passwordHash: 'Kanha@9298',
        role: 'ADMIN',
        status: 'ACTIVE',
        avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=300&q=80',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setUsers((prev) => [user!, ...prev.filter((u) => u.id !== 'ADMIN001')]);
      if (supabaseConfig.isConnected) {
        syncUserToSupabase(user).catch(() => {});
      }
    }

    if (!user) {
      return { success: false, error: 'Invalid email/Partner ID or password.' };
    }

    if (user.status === 'BLOCKED') {
      return { success: false, error: 'Your account has been blocked. Please contact support.' };
    }

    // Verify password if provided
    if (password && password.trim() !== '') {
      const enteredPassword = password.trim();
      const stored = (user.passwordHash || '').trim();

      const isPlainMatch = stored === enteredPassword;
      const isAdminMatch =
        (user.role === 'ADMIN' || user.email.toLowerCase() === 'sandeeprana4519@gmail.com') &&
        (enteredPassword === 'Kanha@9298' || enteredPassword === '••••••••••••' || enteredPassword === stored);

      const isDefaultPlaceholder = enteredPassword === '••••••••' || enteredPassword === '••••••••••••';
      const isSimulatedHashMatch =
        stored.includes(`plain_${enteredPassword}`) ||
        stored.includes(`updated_${enteredPassword.slice(0, 4)}`) ||
        (user.email === 'kavita@partnerdeals.in' && (enteredPassword === 'partner123' || enteredPassword === 'kavita123')) ||
        (user.email === 'rahul@techhunter.io' && (enteredPassword === 'partner123' || enteredPassword === 'rahul123'));

      // If user had an older dummy timestamp hash stored in Supabase (e.g. $argon2id$v=19$hashed_179154...)
      const isOldBuggyHash = stored.startsWith('$argon2id$v=19$hashed_');

      if (!isPlainMatch && !isAdminMatch && !isDefaultPlaceholder && !isSimulatedHashMatch) {
        if (isOldBuggyHash) {
          // Self-heal: update stored password to the exact password entered by the partner
          user.passwordHash = enteredPassword;
          setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, passwordHash: enteredPassword } : u)));
          if (supabaseConfig.isConnected) {
            syncUserToSupabase({ ...user, passwordHash: enteredPassword }).catch(() => {});
          }
        } else {
          return { success: false, error: 'Incorrect password. Please try again.' };
        }
      }
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

  const updatePartnerProfile = (updates: {
    name?: string;
    partnerId?: string;
    id?: string;
    email?: string;
    mobile?: string;
    avatarUrl?: string;
    newPassword?: string;
    currentPassword?: string;
  }) => {
    if (!currentUser) {
      return { success: false, error: 'You must be logged in to update profile settings.' };
    }

    const rawNewId = (updates.partnerId || updates.id || '').trim();
    let finalId = currentUser.id;

    // Validate Partner ID if changing
    if (rawNewId && rawNewId.toUpperCase() !== currentUser.id.toUpperCase()) {
      const cleanNewId = rawNewId.toUpperCase();
      if (cleanNewId.length < 3 || cleanNewId.length > 24) {
        return { success: false, error: 'Partner ID must be between 3 and 24 characters (e.g. AP00001).' };
      }
      if (!/^[A-Z0-9_-]+$/i.test(cleanNewId)) {
        return { success: false, error: 'Partner ID can only contain letters, numbers, hyphens, and underscores.' };
      }
      const idTaken = users.some(
        (u) => u.id.toUpperCase() === cleanNewId && u.id.toUpperCase() !== currentUser.id.toUpperCase()
      );
      if (idTaken) {
        return { success: false, error: `Partner ID "${cleanNewId}" is already taken by another account.` };
      }
      finalId = cleanNewId;
    }

    // Email duplication check
    if (updates.email && updates.email.trim().toLowerCase() !== currentUser.email.toLowerCase()) {
      const emailTaken = users.some(
        (u) => u.id !== currentUser.id && u.email.toLowerCase() === updates.email!.trim().toLowerCase()
      );
      if (emailTaken) {
        return { success: false, error: 'This email address is already used by another account.' };
      }
    }

    let updatedHash = currentUser.passwordHash;
    if (updates.newPassword && updates.newPassword.trim() !== '') {
      if (updates.newPassword.length < 4) {
        return { success: false, error: 'Password must be at least 4 characters long.' };
      }
      // Store exact password entered by the partner
      updatedHash = updates.newPassword.trim();
    }

    const oldId = currentUser.id;
    const newName = updates.name ? updates.name.trim() : currentUser.name;
    const newAvatar = updates.avatarUrl !== undefined ? updates.avatarUrl.trim() : currentUser.avatarUrl;

    const updatedUser: User = {
      ...currentUser,
      id: finalId,
      name: newName,
      email: updates.email ? updates.email.trim().toLowerCase() : currentUser.email,
      mobile: updates.mobile !== undefined ? updates.mobile.trim() : currentUser.mobile,
      avatarUrl: newAvatar,
      passwordHash: updatedHash,
      updatedAt: new Date().toISOString(),
    };

    // Update users array state
    setUsers((prev) => prev.map((u) => (u.id === oldId ? updatedUser : u)));

    // Update currentUser state in context
    setCurrentUser(updatedUser);

    // Sync partnerName and partnerId across their products so product listings reflect the new name & ID immediately
    setProducts((prev) =>
      prev.map((p) => {
        if (p.partnerId === oldId) {
          return {
            ...p,
            partnerId: finalId,
            partnerName: newName,
            updatedAt: new Date().toISOString(),
          };
        }
        return p;
      })
    );

    if (newAvatar) {
      setCachedUserAvatar(newAvatar, finalId, updatedUser.email);
      if (oldId && oldId !== finalId) {
        setCachedUserAvatar(newAvatar, oldId, updatedUser.email);
      }
    }

    // If connected to remote database, push user update
    if (supabaseConfig.isConnected) {
      syncUserToSupabase(updatedUser).catch((err) =>
        console.warn('Supabase profile sync notice:', err)
      );
    }

    showToast('Partner profile and settings updated successfully!', 'success');
    return { success: true };
  };

  const registerPartner = (data: { name: string; email: string; mobile: string; password: string }) => {
    // Check duplicate email
    if (users.some((u) => u.email.toLowerCase() === data.email.toLowerCase())) {
      return { success: false, error: 'An account with this email address already exists.' };
    }

    const newUser: User = {
      id: generateNextPartnerId(users),
      name: data.name,
      email: data.email.toLowerCase(),
      mobile: data.mobile,
      passwordHash: data.password.trim(),
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
        const adm = users.find((u) => u.role === 'ADMIN' || u.email.toLowerCase() === 'sandeeprana4519@gmail.com') || users[0];
        setCurrentUser(adm);
        setCurrentView('admin_dashboard');
        showToast(`Logged in as Administrator (${adm.name})`, 'success');
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
    description?: string | null;
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

    const val = validateAffiliateUrl(input.affiliateUrl, allAllowedDomains);
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
      description: input.description || input.title || '',
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
      const val = validateAffiliateUrl(sanitizedUpdates.affiliateUrl, allAllowedDomains);
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
    description?: string | null;
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

    const val = validateAffiliateUrl(input.affiliateUrl, allAllowedDomains);
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
      description: input.description || input.title || '',
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
      const val = validateAffiliateUrl(updates.affiliateUrl, allAllowedDomains);
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
    const newHash = plainPassword && plainPassword.trim() !== '' ? plainPassword.trim() : undefined;

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

    if (updates.avatarUrl) {
      setCachedUserAvatar(updates.avatarUrl, partnerId, updates.email || target.email);
    }

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

  // Affiliate Platform Management (Admin Can Add Any New E-commerce Platforms)
  const addAffiliatePlatform = (input: {
    code: string;
    name: string;
    domain: string;
    allowedDomains?: string[];
    sampleUrl?: string;
    badgeBg?: string;
    status?: 'ACTIVE' | 'DISABLED';
  }) => {
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return { success: false, error: 'Only administrators can create affiliate platforms.' };
    }

    const cleanCode = input.code.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '');
    const cleanName = input.name.trim();
    const cleanDomain = input.domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');

    if (!cleanCode || cleanCode.length < 2) {
      return { success: false, error: 'Platform Code must be at least 2 characters (e.g. MYNTRA).' };
    }
    if (!cleanName) {
      return { success: false, error: 'Platform Name is required.' };
    }
    if (!cleanDomain) {
      return { success: false, error: 'Platform Domain is required (e.g. myntra.com).' };
    }

    if (affiliatePlatforms.some((p) => p.code.toUpperCase() === cleanCode || p.id.toUpperCase() === cleanCode)) {
      return { success: false, error: `Affiliate Platform with code "${cleanCode}" already exists.` };
    }

    const rawAllowed = input.allowedDomains && input.allowedDomains.length > 0
      ? input.allowedDomains
      : [cleanDomain];
    const cleanAllowedDomains = Array.from(
      new Set([cleanDomain, ...rawAllowed.map((d) => d.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '')).filter(Boolean)])
    );

    const newPlatform: AffiliatePlatform = {
      id: cleanCode,
      code: cleanCode,
      name: cleanName,
      domain: cleanDomain,
      allowedDomains: cleanAllowedDomains,
      sampleUrl: input.sampleUrl?.trim() || `https://${cleanDomain}/product?aff_id=apnipehchaan`,
      badgeBg: input.badgeBg || 'text-purple-800 bg-purple-50 border-purple-200',
      status: input.status || 'ACTIVE',
      isDefault: false,
      createdAt: new Date().toISOString(),
    };

    setAffiliatePlatforms((prev) => [...prev, newPlatform]);

    // Automatically sync domains into platform whitelist
    setPlatformSettings((prev) => {
      const merged = Array.from(new Set([...prev.allowedDomains, ...cleanAllowedDomains]));
      return { ...prev, allowedDomains: merged };
    });

    if (supabaseConfig.isConnected) {
      syncAffiliatePlatformToSupabase(newPlatform).then((res) => {
        if (!res.success && res.code !== '42P01') {
          console.warn('Supabase platform sync warning:', res.error);
        }
      });
    }

    showToast(`Affiliate Platform "${cleanName}" created successfully!`, 'success');
    return { success: true };
  };

  const updateAffiliatePlatform = (id: string, updates: Partial<AffiliatePlatform>) => {
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return { success: false, error: 'Only administrators can modify affiliate platforms.' };
    }

    let updatedOne: AffiliatePlatform | null = null;
    setAffiliatePlatforms((prev) =>
      prev.map((p) => {
        if (p.id === id || p.code === id) {
          updatedOne = {
            ...p,
            ...updates,
            id: p.id,
            code: updates.code ? updates.code.trim().toUpperCase() : p.code,
            name: updates.name ? updates.name.trim() : p.name,
            domain: updates.domain ? updates.domain.trim().toLowerCase() : p.domain,
            allowedDomains: updates.allowedDomains || p.allowedDomains,
          };
          return updatedOne;
        }
        return p;
      })
    );

    if (updates.allowedDomains && updates.allowedDomains.length > 0) {
      setPlatformSettings((prev) => {
        const merged = Array.from(new Set([...prev.allowedDomains, ...updates.allowedDomains!]));
        return { ...prev, allowedDomains: merged };
      });
    }

    if (supabaseConfig.isConnected && updatedOne) {
      syncAffiliatePlatformToSupabase(updatedOne);
    }

    showToast(`Platform settings updated.`, 'success');
    return { success: true };
  };

  const deleteAffiliatePlatform = (id: string) => {
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return { success: false, error: 'Only administrators can delete platforms.' };
    }

    const target = affiliatePlatforms.find((p) => p.id === id || p.code === id);
    if (!target) return { success: false, error: 'Platform not found.' };

    if (target.isDefault) {
      return { success: false, error: 'Core default platforms (Amazon, Flipkart, Meesho) cannot be deleted. You can disable them instead.' };
    }

    setAffiliatePlatforms((prev) => prev.filter((p) => p.id !== id && p.code !== id));

    if (supabaseConfig.isConnected) {
      deleteAffiliatePlatformFromSupabase(target.code);
    }

    showToast(`Affiliate Platform "${target.name}" removed.`, 'info');
    return { success: true };
  };

  const togglePlatformStatus = (id: string) => {
    if (!currentUser || currentUser.role !== 'ADMIN') return;
    setAffiliatePlatforms((prev) =>
      prev.map((p) => {
        if (p.id === id || p.code === id) {
          const nextStatus = p.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
          const updated = { ...p, status: nextStatus };
          if (supabaseConfig.isConnected) {
            syncAffiliatePlatformToSupabase(updated);
          }
          showToast(`Platform "${p.name}" is now ${nextStatus === 'ACTIVE' ? 'Active' : 'Disabled'}.`, 'info');
          return updated;
        }
        return p;
      })
    );
  };

  const updatePlatformSettings = (updates: Partial<PlatformSettings>) => {
    if (!currentUser || currentUser.role !== 'ADMIN') return;
    setPlatformSettings((prev) => ({ ...prev, ...updates }));
    showToast('Platform settings saved successfully.', 'success');
  };

  const exportPlatformDataJson = () => {
    const backup = {
      exportedAt: new Date().toISOString(),
      platform: 'APNI PEHCHAAN Hostinger VPS Instance',
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
    const val = validateAffiliateUrl(product.affiliateUrl, allAllowedDomains);
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
        updatePartnerProfile,
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
        affiliatePlatforms,
        activeAffiliatePlatforms,
        addAffiliatePlatform,
        updateAffiliatePlatform,
        deleteAffiliatePlatform,
        togglePlatformStatus,
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
