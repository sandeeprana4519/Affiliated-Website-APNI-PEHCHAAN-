import React from 'react';
import { useApp } from '../../context/AppContext';
import { Product } from '../../types';
import { 
  ArrowLeft, 
  ExternalLink, 
  Share2, 
  ShieldCheck, 
  Tag, 
  Percent, 
  Clock, 
  Lock,
  Compass,
  AlertCircle
} from 'lucide-react';

interface ProductDetailPageProps {
  onShare: (product: Product) => void;
  onBuyNow: (product: Product) => void;
}

export const ProductDetailPage: React.FC<ProductDetailPageProps> = ({ onShare, onBuyNow }) => {
  const { 
    selectedProductSlug, 
    getProductBySlug, 
    setCurrentView, 
    openCategoryPage,
    affiliatePlatforms
  } = useApp();

  const product = selectedProductSlug ? getProductBySlug(selectedProductSlug) : null;

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Sorry, this product is no longer available.</h2>
        <p className="text-xs text-slate-500">
          The requested affiliate item may have expired or been removed by the partner.
        </p>
        <button
          onClick={() => setCurrentView('home')}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg cursor-pointer"
        >
          Return to Homepage
        </button>
      </div>
    );
  }

  const foundPlatform = affiliatePlatforms?.find(
    (p) => p.code.toUpperCase() === product.platform.toUpperCase() || p.id.toUpperCase() === product.platform.toUpperCase()
  );

  const platformBadge = foundPlatform
    ? {
        label: `${foundPlatform.name} Verified`,
        color: foundPlatform.badgeBg || 'text-purple-800 bg-purple-50 border-purple-200',
      }
    : {
        AMAZON: { label: 'Amazon Verified', color: 'text-amber-800 bg-amber-50 border-amber-200' },
        FLIPKART: { label: 'Flipkart Assured', color: 'text-sky-800 bg-sky-50 border-sky-200' },
        MEESHO: { label: 'Meesho Trusted', color: 'text-rose-800 bg-rose-50 border-rose-200' },
      }[product.platform] || {
        label: `${product.platform} Verified`,
        color: 'text-purple-800 bg-purple-50 border-purple-200',
      };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Top Bar with Back Button & Breadcrumbs */}
      <div className="flex items-center justify-between text-xs gap-2 flex-wrap">
        <button
          onClick={() => setCurrentView('home')}
          className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Deals</span>
        </button>

        <div className="flex items-center gap-1.5 text-slate-400 text-xs">
          <span 
            onClick={() => product.categorySlug && openCategoryPage(product.categorySlug)}
            className="text-slate-600 hover:text-amber-600 cursor-pointer underline underline-offset-2 font-medium"
          >
            {product.categoryName}
          </span>
          <span>/</span>
          <span className="text-slate-500 truncate max-w-[140px] sm:max-w-xs">{product.title}</span>
        </div>
      </div>

      {/* Main Product Showcase */}
      <div className="grid md:grid-cols-12 gap-6 md:gap-8 p-4 sm:p-6 md:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-sm w-full">
        {/* Left Column: Image */}
        <div className="md:col-span-5 space-y-4">
          <div className="aspect-square w-full rounded-2xl overflow-hidden bg-slate-50 border border-slate-200 relative group">
            <img
              src={product.imageUrl}
              alt={product.title}
              className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
            />
            {product.dealOffer && (
              <div className="absolute top-3 left-3 px-3 py-1 bg-amber-500 text-slate-950 text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm">
                {product.dealOffer}
              </div>
            )}
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 space-y-1">
            <div className="flex items-center gap-1.5 text-slate-800 font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>External Retailer Guarantee</span>
            </div>
            <p className="leading-relaxed break-words">
              When you click "Buy Now", you are securely transferred to {product.platform}. You will complete your transaction directly on their official platform.
            </p>
          </div>
        </div>

        {/* Right Column: Information & Actions */}
        <div className="md:col-span-7 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            {/* Platform Tag */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-md border ${platformBadge.color}`}>
                {platformBadge.label}
              </span>
              {product.isAdminProduct && (
                <span className="text-xs uppercase px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold">
                  Featured Staff Pick
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 tracking-tight leading-snug break-words">
              {product.title}
            </h1>

            {/* Price section */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-xs text-slate-500 font-medium">Approximate Price:</span>
                <span className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  {product.price ? `₹${product.price.toLocaleString('en-IN')}` : 'Check on Store'}
                </span>
              </div>

              {product.dealDetails && (
                <div className="flex items-center gap-2 text-xs text-amber-800 font-medium pt-1 border-t border-slate-200">
                  <Tag className="w-3.5 h-3.5 shrink-0" />
                  <span className="break-words">{product.dealDetails}</span>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <h3 className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Product Details & Deal Highlights
              </h3>
              <p className="text-xs md:text-sm text-slate-600 leading-relaxed whitespace-pre-line break-words">
                {product.description}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
              <button
                onClick={() => onBuyNow(product)}
                className="flex-1 py-3 px-6 bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer whitespace-nowrap min-h-[44px]"
              >
                <span>Buy Now on {product.platform}</span>
                <ExternalLink className="w-4 h-4 shrink-0" />
              </button>

              <button
                onClick={() => onShare(product)}
                className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer border border-slate-200/80 min-h-[44px]"
              >
                <Share2 className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Share Deal</span>
              </button>
            </div>

            {/* Clear E-Commerce Non-Involvement Note */}
            <p className="text-xs text-slate-500 text-center font-normal leading-normal">
              No cart · No checkout on this website · Direct redirection to {product.platform}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
