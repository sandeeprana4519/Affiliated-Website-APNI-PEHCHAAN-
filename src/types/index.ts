export type Role = 'CUSTOMER' | 'PARTNER' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'BLOCKED';
export type ProductStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type Platform = 'AMAZON' | 'FLIPKART' | 'MEESHO';
export type CategoryStatus = 'ACTIVE' | 'DISABLED';

export interface User {
  id: string;
  name: string;
  email: string;
  mobile: string;
  passwordHash: string;
  role: Role;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string;
  status: CategoryStatus;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  partnerId?: string | null;
  partnerName?: string;
  categoryId: string;
  categoryName?: string;
  categorySlug?: string;
  platform: Platform;
  title: string;
  slug: string;
  description: string;
  imageUrl: string;
  price?: number | null;
  dealOffer?: string | null;
  dealDetails?: string | null;
  affiliateUrl: string;
  status: ProductStatus;
  isAdminProduct: boolean;
  featured: boolean;
  clickCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ClickLog {
  id: string;
  productId: string;
  productTitle: string;
  platform: Platform;
  timestamp: string;
  ipHash: string;
  userAgent: string;
}

export interface PasswordResetToken {
  id: string;
  userId: string;
  email: string;
  token: string;
  expiresAt: string;
  usedAt?: string | null;
}

export interface PlatformSettings {
  siteName: string;
  siteTagline: string;
  supportEmail: string;
  supportPhone: string;
  currencySymbol: string;
  autoApprovePartnerDeals: boolean;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  amazonAffiliateTag: string;
  flipkartAffiliateId: string;
  meeshoAffiliateTag: string;
  allowedDomains: string[];
  affiliateDisclaimer: string;
  maxUploadSizeMb: number;
}

export type ViewMode =
  | 'home'
  | 'categories'
  | 'category_detail'
  | 'product_detail'
  | 'search'
  | 'help'
  | 'privacy'
  | 'terms'
  | 'disclosure'
  | 'partner_login'
  | 'partner_register'
  | 'partner_forgot_password'
  | 'partner_dashboard'
  | 'partner_add_product'
  | 'partner_edit_product'
  | 'admin_login'
  | 'admin_dashboard'
  | 'admin_partners'
  | 'admin_products'
  | 'admin_categories'
  | 'admin_add_product'
  | 'admin_settings'
  | 'system_architecture';
