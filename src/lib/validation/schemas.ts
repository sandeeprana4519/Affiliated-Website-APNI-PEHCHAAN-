import { z } from 'zod';

// Allowed affiliate domains list for validation
export const ALLOWED_AFFILIATE_DOMAINS = [
  'amazon.in',
  'amazon.com',
  'flipkart.com',
  'meesho.com',
  'amzn.to',
  'fkrt.it',
];

// Helper to validate and disinfect affiliate URL
export function validateAffiliateUrl(url: string): { isValid: boolean; error?: string } {
  try {
    const trimmed = url.trim();
    
    // Explicit rejection of dangerous protocol injection
    const dangerousSchemes = ['javascript:', 'data:', 'vbscript:', 'file:', 'ftp:'];
    for (const scheme of dangerousSchemes) {
      if (trimmed.toLowerCase().startsWith(scheme)) {
        return { isValid: false, error: 'Dangerous protocol injection detected.' };
      }
    }

    // Must be valid HTTPS URL
    if (!trimmed.startsWith('https://')) {
      return { isValid: false, error: 'Only secure HTTPS affiliate URLs are permitted.' };
    }

    const parsed = new URL(trimmed);

    // Domain validation against allowed partner platforms
    const hostname = parsed.hostname.toLowerCase();
    const isDomainAllowed = ALLOWED_AFFILIATE_DOMAINS.some(
      (domain) => hostname === domain || hostname.endsWith('.' + domain)
    );

    if (!isDomainAllowed) {
      return {
        isValid: false,
        error: `Affiliate domain "${hostname}" is not authorized. Allowed platforms: Amazon, Flipkart, Meesho.`,
      };
    }

    return { isValid: true };
  } catch (err) {
    return { isValid: false, error: 'Invalid URL format.' };
  }
}

// Partner Registration Schema
export const PartnerRegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Please enter a valid email address').max(191),
  mobile: z.string().regex(/^[0-9+ -]{10,15}$/, 'Please enter a valid 10-digit mobile number'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must include at least one uppercase letter')
    .regex(/[0-9]/, 'Password must include at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type PartnerRegisterInput = z.infer<typeof PartnerRegisterSchema>;

// User Login Schema
export const LoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof LoginSchema>;

// Product Submission Schema
export const ProductSubmitSchema = z.object({
  platform: z.enum(['AMAZON', 'FLIPKART', 'MEESHO']),
  categoryId: z.string().min(1, 'Please select a valid category'),
  title: z.string().min(5, 'Title must be at least 5 characters').max(255),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  imageUrl: z.string().min(1, 'Product image is required'),
  price: z.number().positive('Price must be greater than 0').optional().nullable(),
  dealOffer: z.string().max(128).optional().nullable(),
  dealDetails: z.string().max(255).optional().nullable(),
  affiliateUrl: z.string().refine((url) => validateAffiliateUrl(url).isValid, {
    message: 'Affiliate URL must be a valid HTTPS link to Amazon, Flipkart, or Meesho',
  }),
});

export type ProductSubmitInput = z.infer<typeof ProductSubmitSchema>;

// Category Schema
export const CategorySchema = z.object({
  name: z.string().min(2, 'Category name is required').max(96),
  slug: z.string().min(2, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must be lower-case alphanumeric and dashes'),
  imageUrl: z.string().optional().nullable(),
  status: z.enum(['ACTIVE', 'DISABLED']).default('ACTIVE'),
});

export type CategoryInput = z.infer<typeof CategorySchema>;

// File Upload Validator
export function validateImageUpload(file: File): { valid: boolean; error?: string } {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const maxBytes = 5 * 1024 * 1024; // 5 MB

  if (!allowedMimeTypes.includes(file.type)) {
    return { valid: false, error: 'Only JPEG, PNG, or WebP images are allowed.' };
  }

  if (file.size > maxBytes) {
    return { valid: false, error: 'File size exceeds maximum 5MB limit.' };
  }

  return { valid: true };
}
