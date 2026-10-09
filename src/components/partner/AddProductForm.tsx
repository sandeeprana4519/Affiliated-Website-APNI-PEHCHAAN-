import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Platform } from '../../types';
import { ProductSubmitSchema } from '../../lib/validation/schemas';
import { compressImage } from '../../lib/imageUtils';
import { 
  Plus, 
  ArrowLeft, 
  Upload, 
  Image as ImageIcon, 
  ExternalLink, 
  AlertCircle, 
  CheckCircle2,
  Tag
} from 'lucide-react';

export const AddProductForm: React.FC = () => {
  const { 
    categories, 
    createPartnerProduct, 
    setCurrentView,
    activeAffiliatePlatforms
  } = useApp();

  const [platform, setPlatform] = useState<Platform>('AMAZON');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=800&q=80');
  const [price, setPrice] = useState<string>('');
  const [affiliateUrl, setAffiliateUrl] = useState('https://www.amazon.in/dp/B0BDK62PDX?tag=mypartnerid-21');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGeneralError(null);

    const parsedPrice = price.trim() ? parseFloat(price) : null;

    const validation = ProductSubmitSchema.safeParse({
      platform,
      categoryId,
      title: title.trim(),
      description: title.trim(),
      imageUrl,
      price: parsedPrice,
      dealOffer: null,
      dealDetails: null,
      affiliateUrl,
    });

    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        const fieldName = String(issue.path[0]);
        fieldErrors[fieldName] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    const res = createPartnerProduct({
      platform,
      categoryId,
      title: title.trim(),
      description: title.trim(),
      imageUrl,
      price: parsedPrice,
      dealOffer: null,
      dealDetails: null,
      affiliateUrl,
    });

    if (!res.success) {
      setGeneralError(res.error || 'Failed to submit product.');
    } else {
      setCurrentView('partner_dashboard');
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentView('partner_dashboard')}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 transition-colors cursor-pointer font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to My Products</span>
        </button>
      </div>

      <div className="p-6 md:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Plus className="w-5 h-5 text-amber-600" />
            <span>Submit New Affiliate Deal</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Product will be assigned status = <strong>PENDING</strong> and submitted for admin review before appearing on the public customer website.
          </p>
        </div>

        {generalError && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{generalError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Platform & Category */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-600 mb-1 font-semibold">Affiliate Platform *</label>
              <select
                value={platform}
                onChange={(e) => {
                  const p = e.target.value as Platform;
                  setPlatform(p);
                  // Update default affiliate URL placeholder based on platform
                  const platObj = activeAffiliatePlatforms?.find((ap) => ap.code === p || ap.id === p);
                  if (platObj?.sampleUrl) {
                    setAffiliateUrl(platObj.sampleUrl);
                  } else if (p === 'AMAZON') {
                    setAffiliateUrl('https://www.amazon.in/dp/B0BDK62PDX?tag=mypartner-21');
                  } else if (p === 'FLIPKART') {
                    setAffiliateUrl('https://www.flipkart.com/item/p/itm123?affid=mypartner');
                  } else {
                    setAffiliateUrl('https://www.meesho.com/s/p/12345?aff=mypartner');
                  }
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white text-xs"
              >
                {activeAffiliatePlatforms && activeAffiliatePlatforms.length > 0 ? (
                  activeAffiliatePlatforms.map((ap) => (
                    <option key={ap.id || ap.code} value={ap.code}>
                      {ap.name} ({ap.domain})
                    </option>
                  ))
                ) : (
                  <>
                    <option value="AMAZON">Amazon India / Global</option>
                    <option value="FLIPKART">Flipkart</option>
                    <option value="MEESHO">Meesho</option>
                  </>
                )}
              </select>
              {errors.platform && <p className="text-[11px] text-rose-600 mt-1">{errors.platform}</p>}
            </div>

            <div>
              <label className="block text-slate-600 mb-1 font-semibold">Category *</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white text-xs"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {errors.categoryId && <p className="text-[11px] text-rose-600 mt-1">{errors.categoryId}</p>}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-slate-600 mb-1 font-semibold">Product Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Noise ColorFit Pro 4 Smartwatch with 1.72'' Display"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white text-xs"
            />
            {errors.title && <p className="text-[11px] text-rose-600 mt-1">{errors.title}</p>}
          </div>

          {/* Image URL & File Upload */}
          <div className="space-y-2 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
            <label className="block text-slate-700 font-semibold flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-amber-600" />
                Product Image *
              </span>
              <span className="text-xs text-slate-400">Upload from device or enter URL</span>
            </label>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                {imageUrl ? (
                  <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-slate-400 text-[10px]">No image</span>
                )}
              </div>

              <div className="flex-1 w-full space-y-2">
                <input
                  type="text"
                  required
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-900 text-xs focus:outline-none focus:border-amber-500"
                />

                <div className="flex items-center gap-2">
                  <label className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer transition-colors">
                    <Upload className="w-3 h-3 text-amber-700" />
                    <span>Upload Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        compressImage(file, 900, 900, 0.85)
                          .then((optimized) => {
                            setImageUrl(optimized);
                          })
                          .catch(() => {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              if (event.target?.result) {
                                setImageUrl(event.target.result as string);
                              }
                            };
                            reader.readAsDataURL(file);
                          });
                      }}
                      className="hidden"
                    />
                  </label>
                  <span className="text-xs text-slate-400">Presets:</span>
                  <button
                    type="button"
                    onClick={() => setImageUrl('https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80')}
                    className="px-2 py-0.5 bg-white hover:bg-slate-100 text-xs text-slate-600 rounded-md border border-slate-200 cursor-pointer"
                  >
                    Headphones
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageUrl('https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80')}
                    className="px-2 py-0.5 bg-white hover:bg-slate-100 text-xs text-slate-600 rounded-md border border-slate-200 cursor-pointer"
                  >
                    Shoes
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageUrl('https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80')}
                    className="px-2 py-0.5 bg-white hover:bg-slate-100 text-xs text-slate-600 rounded-md border border-slate-200 cursor-pointer"
                  >
                    Fashion
                  </button>
                </div>
              </div>
            </div>
            {errors.imageUrl && <p className="text-[11px] text-rose-600">{errors.imageUrl}</p>}
          </div>

          {/* Price (Optional) */}
          <div>
            <label className="block text-slate-600 mb-1 font-semibold">Price in ₹ (Optional)</label>
            <input
              type="number"
              step="1"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="e.g. 2499"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white text-xs"
            />
            {errors.price && <p className="text-[11px] text-rose-600 mt-1">{errors.price}</p>}
          </div>

          {/* Affiliate URL (CRITICAL VALIDATION) */}
          <div className="space-y-1 pt-1">
            <label className="block text-slate-600 font-semibold">
              External Affiliate Link * (Amazon, Flipkart, or Meesho only)
            </label>
            <input
              type="url"
              required
              value={affiliateUrl}
              onChange={(e) => setAffiliateUrl(e.target.value)}
              placeholder="https://www.amazon.in/dp/...?tag=yourtag-21"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white text-xs"
            />
            {errors.affiliateUrl && (
              <p className="text-[11px] text-rose-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                <span>{errors.affiliateUrl}</span>
              </p>
            )}
            <p className="text-xs text-slate-400">
              Only HTTPS links to authorized domains (amazon.*, flipkart.*, meesho.*) are accepted.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setCurrentView('partner_dashboard')}
              className="px-4 py-2 rounded-xl text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
            >
              Publish Product
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
