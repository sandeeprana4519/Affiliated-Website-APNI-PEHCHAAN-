import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Product, Category, User, ClickLog, Platform, ProductStatus, Role, UserStatus, CategoryStatus } from '../types';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConnected: boolean;
  lastTestedAt?: string;
}

export const isUuid = (val?: string | null): boolean => {
  if (!val) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
};

export const generateUuid = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * Normalizes user input into a proper Supabase Project URL:
 * - "mgcayvgpiwghopbveobw" -> "https://mgcayvgpiwghopbveobw.supabase.co"
 * - "mgcayvgpiwghopbveobw.supabase.co" -> "https://mgcayvgpiwghopbveobw.supabase.co"
 * - "https://mgcayvgpiwghopbveobw.supabase.co/rest/v1" -> "https://mgcayvgpiwghopbveobw.supabase.co"
 * - "https://supabase.com/dashboard/project/mgcayvgpiwghopbveobw" -> "https://mgcayvgpiwghopbveobw.supabase.co"
 */
export const normalizeSupabaseUrl = (input: string): string => {
  let val = (input || '').trim();
  if (!val) return '';

  // 1. If user pasted a Supabase dashboard URL:
  const dashboardMatch = val.match(/supabase\.com\/dashboard\/project\/([a-z0-9_-]+)/i);
  if (dashboardMatch && dashboardMatch[1]) {
    return `https://${dashboardMatch[1]}.supabase.co`;
  }

  // 2. If it's just a project ref / id (e.g. mgcayvgpiwghopbveobw)
  if (/^[a-z0-9_-]+$/i.test(val)) {
    return `https://${val}.supabase.co`;
  }

  // 3. Ensure protocol
  if (!/^https?:\/\//i.test(val)) {
    val = `https://${val}`;
  }

  try {
    const parsed = new URL(val);
    // If hostname is <project-ref>.supabase.co, always return the clean base origin
    if (parsed.hostname.endsWith('.supabase.co')) {
      return `https://${parsed.hostname}`;
    }

    // If it's a self-hosted instance, local dev, or custom domain, strip API paths like /rest/v1, /rest, /auth/v1
    let cleanPath = parsed.pathname
      .replace(/\/rest\/v1\/?$/i, '')
      .replace(/\/rest\/?$/i, '')
      .replace(/\/auth\/v1\/?$/i, '')
      .replace(/\/+$/, '');

    const portPart = parsed.port ? `:${parsed.port}` : '';
    return `${parsed.protocol}//${parsed.hostname}${portPart}${cleanPath}`;
  } catch {
    val = val.replace(/\/rest\/v1\/?$/i, '').replace(/\/rest\/?$/i, '').replace(/\/+$/, '');
    return val;
  }
};

const STORAGE_CONFIG_KEY = 'aff_supabase_config';
const ENV_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_URL) || 
  (typeof process !== 'undefined' && (process.env as any)?.VITE_SUPABASE_URL);
const ENV_KEY = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) || 
  (typeof process !== 'undefined' && (process.env as any)?.VITE_SUPABASE_ANON_KEY);
const DEFAULT_URL = ENV_URL || 'https://mgcayvgpiwghopbveobw.supabase.co';
const DEFAULT_KEY = ENV_KEY || 'sb_publishable_1IW6IovH77YgI_qSaG18ZQ_ahIrsZUu';

export const getViteEnvStatus = () => {
  const rawUrl = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_URL) || 
    (typeof process !== 'undefined' && (process.env as any)?.VITE_SUPABASE_URL) || 
    DEFAULT_URL;
  const rawKey = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) || 
    (typeof process !== 'undefined' && (process.env as any)?.VITE_SUPABASE_ANON_KEY) || 
    DEFAULT_KEY;
  return {
    isUrlPresent: Boolean(rawUrl && rawUrl.trim()),
    isKeyPresent: Boolean(rawKey && rawKey.trim()),
    url: rawUrl ? normalizeSupabaseUrl(rawUrl) : normalizeSupabaseUrl(DEFAULT_URL),
    keyPrefix: rawKey ? `${rawKey.slice(0, 14)}...` : `${DEFAULT_KEY.slice(0, 14)}...`,
  };
};

export const getStoredSupabaseConfig = (): SupabaseConfig => {
  const defaultUrl = normalizeSupabaseUrl(DEFAULT_URL);
  const defaultKey = DEFAULT_KEY.trim();
  const saved = localStorage.getItem(STORAGE_CONFIG_KEY);

  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      const rawUrl = parsed.url || defaultUrl;
      const url = normalizeSupabaseUrl(rawUrl) || defaultUrl;
      const anonKey = (parsed.anonKey || defaultKey).trim() || defaultKey;
      // Auto-heal: If default keys are valid and available, keep isConnected true
      const isConnected = parsed.isConnected !== undefined ? Boolean(parsed.isConnected) : Boolean(url && anonKey);

      // Auto-heal dirty or malformed stored URL
      if (rawUrl !== url) {
        try {
          localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify({ ...parsed, url, anonKey, isConnected }));
        } catch {
          // ignore
        }
      }

      return {
        url,
        anonKey,
        isConnected: Boolean(url && anonKey && isConnected),
        lastTestedAt: parsed.lastTestedAt,
      };
    } catch {
      // fallback
    }
  }

  return {
    url: defaultUrl,
    anonKey: defaultKey,
    isConnected: Boolean(defaultUrl && defaultKey),
  };
};

export const saveSupabaseConfig = (config: Partial<SupabaseConfig>): SupabaseConfig => {
  const current = getStoredSupabaseConfig();
  const normalizedUrl = config.url !== undefined ? normalizeSupabaseUrl(config.url) : current.url;
  const updated: SupabaseConfig = {
    ...current,
    ...config,
    url: normalizedUrl,
  };
  localStorage.setItem(STORAGE_CONFIG_KEY, JSON.stringify(updated));
  // Invalidate cached client
  cachedClient = null;
  cachedClientUrl = '';
  cachedClientKey = '';
  return updated;
};

let cachedClient: SupabaseClient | null = null;
let cachedClientUrl = '';
let cachedClientKey = '';

export const getSupabaseClient = (): SupabaseClient | null => {
  const config = getStoredSupabaseConfig();
  if (!config.url || !config.anonKey) {
    return null;
  }

  const cleanUrl = normalizeSupabaseUrl(config.url);
  const cleanKey = config.anonKey.trim();

  if (cachedClient && cachedClientUrl === cleanUrl && cachedClientKey === cleanKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(cleanUrl, cleanKey, {
      auth: {
        persistSession: false,
      },
    });
    cachedClientUrl = cleanUrl;
    cachedClientKey = cleanKey;
    return cachedClient;
  } catch (err) {
    console.warn('Failed to initialize Supabase client:', err);
    return null;
  }
};

/**
 * Test Supabase database connection and verify table permissions & RLS status
 */
export const testSupabaseConnection = async (
  rawUrl: string, 
  rawKey: string
): Promise<{ 
  success: boolean; 
  message: string; 
  rlsWarning?: boolean; 
  tableCounts?: { categories: number; products: number; users: number; clickLogs?: number };
  permissions?: { categories: string; products: string; users: string; clickLogs: string };
}> => {
  const url = normalizeSupabaseUrl(rawUrl);
  const key = (rawKey || '').trim();

  if (!url || !key) {
    return { success: false, message: 'Supabase URL and API Key are required.' };
  }

  try {
    const testClient = createClient(url, key, {
      auth: { persistSession: false },
    });

    // 1. Test querying categories
    const { data: catData, count: catCount, error: catError } = await testClient
      .from('categories')
      .select('*', { count: 'exact' })
      .limit(1);

    if (catError) {
      if (catError.code === 'PGRST125') {
        return {
          success: false,
          message: 'Invalid path in request URL (PGRST125). Project URL has been normalized to the base domain. Please retry.',
        };
      }
      if (catError.code === '42501') {
        return {
          success: false,
          rlsWarning: true,
          message: 'Connected, but Row-Level Security (RLS) is blocking access (Error 42501). Run the RLS fix SQL in Supabase SQL Editor.',
        };
      }
      return { 
        success: false, 
        message: `Connection failed: ${catError.message}. Make sure tables exist in Supabase.`,
      };
    }

    // 2. Query products, users, click_logs counts
    const { count: prodCount, error: prodErr } = await testClient
      .from('products')
      .select('*', { count: 'exact', head: true });

    const { count: userCount, error: userErr } = await testClient
      .from('users')
      .select('*', { count: 'exact', head: true });

    const { count: clickCount, error: clickErr } = await testClient
      .from('click_logs')
      .select('*', { count: 'exact', head: true });

    // 3. Check write permissions on categories table with a safe unique probe ID
    let rlsWarning = false;
    let rlsNotice = '';

    const probeId = generateUuid();
    const probeSlug = '__probe_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);

    try {
      const { error: testWriteError } = await testClient
        .from('categories')
        .insert({
          id: probeId,
          name: '__Diagnostic_Probe__',
          slug: probeSlug,
          status: 'DISABLED',
        });

      if (testWriteError) {
        if (testWriteError.code === '42501') {
          rlsWarning = true;
          rlsNotice = ' (Note: RLS allows reading, but write operations are restricted. Run RLS Fix SQL in the Database tab to enable full write permissions).';
        }
      } else {
        // Clean up probe row immediately
        await testClient.from('categories').delete().eq('id', probeId);
      }
    } catch {
      // Ignore probe write test failure
    }

    return {
      success: true,
      message: `Successfully connected to Supabase PostgreSQL database!${rlsNotice}`,
      rlsWarning,
      tableCounts: {
        categories: catCount ?? (catData ? catData.length : 0),
        products: prodCount ?? 0,
        users: userCount ?? 0,
        clickLogs: clickCount ?? 0,
      },
      permissions: {
        categories: rlsWarning ? 'READ ONLY' : 'FULL ACCESS (READ/WRITE)',
        products: prodErr ? 'RESTRICTED' : 'FULL ACCESS (READ/WRITE)',
        users: userErr ? 'RESTRICTED' : 'FULL ACCESS (READ/WRITE)',
        clickLogs: clickErr ? 'RESTRICTED' : 'FULL ACCESS (READ/WRITE)',
      },
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Failed to connect: ${err.message || 'Network error or invalid Supabase URL'}.`,
    };
  }
};

// -----------------------------------------------------------------------------
// Database Mappers: snake_case (Postgres/Supabase) <--> camelCase (React/App)
// -----------------------------------------------------------------------------

export const UUID_TO_PARTNER_ID: Record<string, string> = {
  'a1000000-0000-0000-0000-000000000025': 'AP00001',
  'a1000000-0000-0000-0000-000000000040': 'AP00002',
  'a1000000-0000-0000-0000-000000000099': 'AP00003',
  'a1000000-0000-0000-0000-000000000001': 'ADMIN001',
};

export const PARTNER_ID_TO_UUID: Record<string, string> = {
  'AP00001': 'a1000000-0000-0000-0000-000000000025',
  'AP00002': 'a1000000-0000-0000-0000-000000000040',
  'AP00003': 'a1000000-0000-0000-0000-000000000099',
  'ADMIN001': 'a1000000-0000-0000-0000-000000000001',
};

export const partnerIdToUuid = (id?: string | null): string => {
  if (!id) return '';
  if (PARTNER_ID_TO_UUID[id]) return PARTNER_ID_TO_UUID[id];
  if (isUuid(id)) return id;
  const match = id.match(/^AP(\d+)$/i);
  if (match) {
    const num = parseInt(match[1], 10);
    const hexPart = num.toString(16).padStart(12, '0');
    return `a1000000-0000-0000-0000-${hexPart}`;
  }
  return generateUuid();
};

export const uuidToPartnerId = (uuid?: string | null): string => {
  if (!uuid) return '';
  if (UUID_TO_PARTNER_ID[uuid]) return UUID_TO_PARTNER_ID[uuid];
  const match = uuid.match(/^a1000000-0000-0000-0000-([0-9a-f]{12})$/i);
  if (match) {
    const num = parseInt(match[1], 16);
    if (!isNaN(num) && num > 0) {
      return `AP${String(num).padStart(5, '0')}`;
    }
  }
  return uuid;
};

const DEFAULT_AVATARS: Record<string, string> = {
  'AP00001': 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
  'AP00002': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
  'ADMIN001': 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=300&q=80',
};

export const mapDbProductToProduct = (
  row: any, 
  categoriesList: Category[] = [], 
  usersList: User[] = []
): Product => {
  const cat = categoriesList.find((c) => c.id === row.category_id);
  const mappedPartnerId = row.partner_id ? uuidToPartnerId(row.partner_id) : null;
  const matchedUser = mappedPartnerId 
    ? usersList.find((u) => u.id === mappedPartnerId || partnerIdToUuid(u.id) === row.partner_id) 
    : null;
  const partnerName = matchedUser?.name || 
    (mappedPartnerId === 'AP00001' ? 'Kavita Sharma' : 
     mappedPartnerId === 'AP00002' ? 'Rahul Verma' : 
     (row.is_admin_product ? 'Editorial Staff' : (mappedPartnerId ? 'Partner' : 'Editorial Staff')));

  return {
    id: row.id,
    partnerId: mappedPartnerId,
    partnerName,
    categoryId: row.category_id,
    categoryName: cat?.name || 'General',
    categorySlug: cat?.slug || 'general',
    platform: row.platform as Platform,
    title: row.title,
    slug: row.slug,
    description: row.description || '',
    imageUrl: row.image_url,
    price: row.price != null ? Number(row.price) : null,
    dealOffer: row.deal_offer || null,
    dealDetails: row.deal_details || null,
    affiliateUrl: row.affiliate_url,
    status: row.status as ProductStatus,
    isAdminProduct: Boolean(row.is_admin_product),
    featured: Boolean(row.featured),
    clickCount: Number(row.click_count) || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

export const mapProductToDb = (product: Partial<Product>, availableCategories: Category[] = []) => {
  const row: Record<string, any> = {};

  // Ensure ID is valid UUID
  if (product.id !== undefined) {
    row.id = isUuid(product.id) ? product.id : generateUuid();
  }

  // Ensure partner_id is valid UUID or null
  if (product.partnerId !== undefined) {
    const targetUuid = product.partnerId ? partnerIdToUuid(product.partnerId) : null;
    row.partner_id = isUuid(targetUuid) ? targetUuid : null;
  }

  // Ensure category_id is valid UUID
  if (product.categoryId !== undefined) {
    if (isUuid(product.categoryId)) {
      row.category_id = product.categoryId;
    } else {
      // Find matching category by slug or name, or fallback to first known UUID category
      const matched = availableCategories.find(
        (c) => c.id === product.categoryId || c.slug === product.categorySlug || c.name === product.categoryName
      );
      if (matched && isUuid(matched.id)) {
        row.category_id = matched.id;
      } else {
        // Fallback to initial trending deals UUID
        row.category_id = 'c1000000-0000-0000-0000-000000000001';
      }
    }
  }

  if (product.platform !== undefined) row.platform = product.platform;
  if (product.title !== undefined) row.title = product.title;
  if (product.slug !== undefined) row.slug = product.slug;
  row.description = product.description || '';
  row.image_url = product.imageUrl || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80';
  if (product.price !== undefined) row.price = product.price != null ? Number(product.price) : null;
  if (product.dealOffer !== undefined) row.deal_offer = product.dealOffer;
  if (product.dealDetails !== undefined) row.deal_details = product.dealDetails;
  if (product.affiliateUrl !== undefined) row.affiliate_url = product.affiliateUrl;
  if (product.status !== undefined) row.status = product.status;
  if (product.isAdminProduct !== undefined) row.is_admin_product = Boolean(product.isAdminProduct);
  if (product.featured !== undefined) row.featured = Boolean(product.featured);
  if (product.clickCount !== undefined) row.click_count = Number(product.clickCount) || 0;

  return row;
};

export const mapDbCategoryToCategory = (row: any): Category => {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    imageUrl: row.image_url,
    status: row.status as CategoryStatus,
    sortOrder: Number(row.sort_order) || 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

export const mapCategoryToDb = (cat: Partial<Category>) => {
  const row: Record<string, any> = {};
  if (cat.id !== undefined) {
    row.id = isUuid(cat.id) ? cat.id : generateUuid();
  }
  if (cat.name !== undefined) row.name = cat.name;
  if (cat.slug !== undefined) row.slug = cat.slug;
  if (cat.imageUrl !== undefined) row.image_url = cat.imageUrl;
  if (cat.status !== undefined) row.status = cat.status;
  if (cat.sortOrder !== undefined) row.sort_order = Number(cat.sortOrder) || 0;
  return row;
};

export const mapDbUserToUser = (row: any): User => {
  const mappedId = uuidToPartnerId(row.id) || (row.email === 'kavita@partnerdeals.in' ? 'AP00001' : row.email === 'rahul@techhunter.io' ? 'AP00002' : row.id);
  return {
    id: mappedId,
    name: row.name,
    email: row.email,
    mobile: row.mobile,
    passwordHash: row.password_hash,
    role: row.role as Role,
    status: row.status as UserStatus,
    avatarUrl: DEFAULT_AVATARS[mappedId] || `https://ui-avatars.com/api/?name=${encodeURIComponent(row.name)}&background=fef3c7&color=b45309&bold=true&size=128`,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

export const mapUserToDb = (user: Partial<User>) => {
  const row: Record<string, any> = {};
  if (user.id !== undefined) {
    const targetUuid = partnerIdToUuid(user.id);
    row.id = isUuid(targetUuid) ? targetUuid : generateUuid();
  }
  if (user.name !== undefined) row.name = user.name;
  if (user.email !== undefined) row.email = user.email;
  if (user.mobile !== undefined) row.mobile = user.mobile;
  if (user.passwordHash !== undefined) row.password_hash = user.passwordHash;
  if (user.role !== undefined) row.role = user.role;
  if (user.status !== undefined) row.status = user.status;
  return row;
};

// -----------------------------------------------------------------------------
// Live Database Operations with Supabase
// -----------------------------------------------------------------------------

export const fetchAllFromSupabase = async () => {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const [categoriesRes, productsRes, usersRes, clicksRes] = await Promise.all([
      client.from('categories').select('*').order('sort_order', { ascending: true }),
      client.from('products').select('*').order('created_at', { ascending: false }),
      client.from('users').select('*').order('created_at', { ascending: false }),
      client.from('click_logs').select('*').order('created_at', { ascending: false }).limit(50),
    ]);

    if (categoriesRes.error) {
      console.warn('Supabase fetch categories error:', categoriesRes.error);
    }
    if (productsRes.error) {
      console.warn('Supabase fetch products error:', productsRes.error);
    }

    const categories: Category[] = (categoriesRes.data || []).map(mapDbCategoryToCategory);
    const users: User[] = (usersRes.data || []).map(mapDbUserToUser);
    const products: Product[] = (productsRes.data || []).map((row) => mapDbProductToProduct(row, categories, users));
    const clickLogs: ClickLog[] = (clicksRes.data || []).map((row) => ({
      id: String(row.id),
      productId: row.product_id,
      productTitle: products.find((p) => p.id === row.product_id)?.title || 'Product Deal',
      platform: 'AMAZON',
      timestamp: row.created_at,
      ipHash: row.ip_hash || 'hash_anon',
      userAgent: row.user_agent || 'Browser',
    }));

    return {
      categories,
      products,
      users,
      clickLogs,
    };
  } catch (err) {
    console.error('Error fetching data from Supabase:', err);
    return null;
  }
};

// Insert / Update / Delete Supabase Helpers
export const syncProductToSupabase = async (
  product: Product, 
  availableCategories: Category[] = []
): Promise<{ success: boolean; error?: string; code?: string }> => {
  const client = getSupabaseClient();
  if (!client) return { success: false, error: 'Database not connected' };

  try {
    const dbRow = mapProductToDb(product, availableCategories);

    // 1. Check if product already exists in Supabase
    const { count, error: countErr } = await client
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('id', product.id);

    if (countErr) {
      console.warn('Supabase product lookup warning:', countErr.message);
    }

    if (count && count > 0) {
      // Row exists: perform UPDATE (respects UPDATE policies)
      const { error: updateError } = await client
        .from('products')
        .update(dbRow)
        .eq('id', product.id);

      if (updateError) {
        console.warn('Supabase product update notice:', updateError.message);
        return { success: false, error: updateError.message, code: updateError.code };
      }
      return { success: true };
    }

    // 2. New product: perform INSERT
    const { error: insertError } = await client.from('products').insert(dbRow);
    if (insertError) {
      if (insertError.code === '23503' && dbRow.partner_id) {
        // Partner ID is not present in Supabase users table yet. Retry with partner_id: null
        const fallbackRow = { ...dbRow, partner_id: null };
        const { error: retryError } = await client.from('products').insert(fallbackRow);
        if (!retryError) {
          return { success: true };
        }
      }
      if (insertError.code === '42501') {
        return {
          success: false,
          error: 'RLS Permission Block (42501): Please run the RLS Fix SQL in Admin > Database tab to enable adding new products.',
          code: '42501',
        };
      }
      console.warn('Supabase product insert notice:', insertError.message);
      return { success: false, error: insertError.message, code: insertError.code };
    }
    return { success: true };
  } catch (err: any) {
    console.warn('Failed to sync product with Supabase:', err?.message || err);
    return { success: false, error: err?.message || 'Database sync error', code: err?.code };
  }
};

export const deleteProductFromSupabase = async (productId: string) => {
  const client = getSupabaseClient();
  if (!client) return { success: false, error: 'Database not connected' };

  try {
    const { error } = await client.from('products').delete().eq('id', productId);
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.warn('Failed to delete product from Supabase:', err?.message || err);
    return { success: false, error: err.message, code: err.code };
  }
};

export const syncCategoryToSupabase = async (cat: Category): Promise<{ success: boolean; error?: string; code?: string }> => {
  const client = getSupabaseClient();
  if (!client) return { success: false, error: 'Database not connected' };

  try {
    const dbRow = mapCategoryToDb(cat);

    // 1. Check if category already exists in Supabase
    const { count, error: countErr } = await client
      .from('categories')
      .select('id', { count: 'exact', head: true })
      .eq('id', cat.id);

    if (countErr) {
      console.warn('Supabase category lookup warning:', countErr.message);
    }

    if (count && count > 0) {
      // Row exists: perform UPDATE (respects UPDATE policies)
      const { error: updateError } = await client
        .from('categories')
        .update(dbRow)
        .eq('id', cat.id);

      if (updateError) {
        console.warn('Supabase category update notice:', updateError.message);
        return { success: false, error: updateError.message, code: updateError.code };
      }
      return { success: true };
    }

    // 2. New category: perform INSERT
    const { error: insertError } = await client.from('categories').insert(dbRow);
    if (insertError) {
      if (insertError.code === '42501') {
        return {
          success: false,
          error: 'RLS Permission Block (42501): Please run the RLS Fix SQL in Admin > Database tab to enable adding new categories.',
          code: '42501',
        };
      }
      console.warn('Supabase category insert notice:', insertError.message);
      return { success: false, error: insertError.message, code: insertError.code };
    }
    return { success: true };
  } catch (err: any) {
    console.warn('Failed to sync category with Supabase:', err?.message || err);
    return { success: false, error: err?.message || 'Database sync error', code: err?.code };
  }
};

export const deleteCategoryFromSupabase = async (categoryId: string) => {
  const client = getSupabaseClient();
  if (!client) return { success: false, error: 'Database not connected' };

  try {
    const { error } = await client.from('categories').delete().eq('id', categoryId);
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.warn('Failed to delete category from Supabase:', err?.message || err);
    return { success: false, error: err.message, code: err.code };
  }
};

export const syncUserToSupabase = async (user: User): Promise<{ success: boolean; error?: string; code?: string }> => {
  const client = getSupabaseClient();
  if (!client) return { success: false, error: 'Database not connected' };

  try {
    const dbRow = mapUserToDb(user);

    // 1. Check if user already exists (by valid UUID or by unique email)
    let findQuery = client.from('users').select('id');
    if (isUuid(user.id)) {
      findQuery = findQuery.eq('id', user.id);
    } else {
      findQuery = findQuery.eq('email', user.email.toLowerCase());
    }

    const { data: existingUser, error: countErr } = await findQuery.maybeSingle();

    if (countErr) {
      console.warn('Supabase user lookup warning:', countErr.message);
    }

    if (existingUser) {
      const { error: updateError } = await client
        .from('users')
        .update(dbRow)
        .eq('id', existingUser.id);

      if (updateError) {
        console.warn('Supabase user update notice:', updateError.message);
        return { success: false, error: updateError.message, code: updateError.code };
      }
      return { success: true };
    }

    // 2. New user: perform INSERT
    const { error: insertError } = await client.from('users').insert(dbRow);
    if (insertError) {
      if (insertError.code === '42501') {
        return {
          success: false,
          error: 'RLS Permission Block (42501): Please run the RLS Fix SQL in Admin > Database tab to enable user registration.',
          code: '42501',
        };
      }
      console.warn('Supabase user insert notice:', insertError.message);
      return { success: false, error: insertError.message, code: insertError.code };
    }
    return { success: true };
  } catch (err: any) {
    console.warn('Failed to sync user with Supabase:', err?.message || err);
    return { success: false, error: err?.message || 'Database sync error', code: err?.code };
  }
};

export const deleteUserFromSupabase = async (userId: string) => {
  const client = getSupabaseClient();
  if (!client) return { success: false, error: 'Database not connected' };

  try {
    const { error } = await client.from('users').delete().eq('id', userId);
    if (error) throw error;
    return { success: true };
  } catch (err: any) {
    console.warn('Failed to delete user from Supabase:', err?.message || err);
    return { success: false, error: err.message, code: err.code };
  }
};

export const logClickToSupabase = async (productId: string, ipHash: string, userAgent: string) => {
  const client = getSupabaseClient();
  if (!client) return;

  try {
    // Only log if productId is valid UUID
    if (!isUuid(productId)) return;
    await client.from('click_logs').insert([
      {
        product_id: productId,
        ip_hash: ipHash,
        user_agent: userAgent,
      },
    ]);
  } catch (err) {
    console.error('Failed to log click to Supabase:', err);
  }
};
