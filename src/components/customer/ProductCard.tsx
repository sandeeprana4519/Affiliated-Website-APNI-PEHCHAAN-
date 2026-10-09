import React, { useState } from 'react';
import { Product } from '../../types';
import { useApp } from '../../context/AppContext';
import { 
  ExternalLink, 
  Share2, 
  Check, 
  Sparkles,
  Tag
} from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onShare: (product: Product) => void;
  onBuyNow: (product: Product) => void;
  compact?: boolean;
  className?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  onShare, 
  onBuyNow,
  compact = false,
  className = ''
}) => {
  const { openProductPage } = useApp();

  const platformBadge = {
    AMAZON: {
      label: 'Amazon',
      color: 'text-amber-800 bg-amber-50 border-amber-200',
    },
    FLIPKART: {
      label: 'Flipkart',
      color: 'text-sky-800 bg-sky-50 border-sky-200',
    },
    MEESHO: {
      label: 'Meesho',
      color: 'text-rose-800 bg-rose-50 border-rose-200',
    },
  }[product.platform];

  return (
    <div className={`group flex flex-col rounded-xl sm:rounded-2xl bg-white border border-slate-200/90 hover:border-slate-300 hover:shadow-md transition-all duration-200 overflow-hidden shadow-xs ${className || 'w-full'}`}>
      {/* Product Image */}
      <div 
        onClick={() => openProductPage(product.slug)}
        className="aspect-square w-full bg-slate-50 overflow-hidden cursor-pointer relative border-b border-slate-100 flex items-center justify-center"
      >
        <img
          src={product.imageUrl}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* Priority Admin Tag or Deal Badge */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
          {product.isAdminProduct && (
            <span className="px-1.5 py-0.5 rounded bg-indigo-600 text-white text-[9px] font-bold uppercase tracking-wider shadow-xs">
              Editor Pick
            </span>
          )}
          {product.dealOffer && (
            <span className="px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 text-[9px] font-bold uppercase tracking-wider shadow-xs">
              {product.dealOffer}
            </span>
          )}
        </div>
      </div>

      {/* Card Content */}
      <div className="flex-1 p-2.5 sm:p-3 flex flex-col justify-between space-y-2 sm:space-y-2.5">
        <div className="space-y-1 sm:space-y-1.5 min-w-0">
          {/* Platform name & category */}
          <div className="flex items-center justify-between gap-1.5 text-xs">
            <span className={`text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${platformBadge.color}`}>
              {platformBadge.label}
            </span>
            <span className="text-[11px] sm:text-xs text-slate-500 font-medium truncate">
              {product.categoryName}
            </span>
          </div>

          {/* Partner / Curator Attribution */}
          {product.partnerName && !product.isAdminProduct && (
            <div className="text-[10px] text-slate-400 font-medium truncate flex items-center gap-1">
              <span>by</span>
              <span className="text-slate-600 font-semibold truncate">{product.partnerName}</span>
            </div>
          )}

          {/* Product Title */}
          <h3 
            onClick={() => openProductPage(product.slug)}
            className="font-bold text-xs sm:text-sm text-slate-900 hover:text-amber-600 transition-colors cursor-pointer leading-snug line-clamp-2 break-words"
          >
            {product.title}
          </h3>

          {/* Short Description */}
          <p className="text-[11px] sm:text-xs text-slate-500 line-clamp-1 sm:line-clamp-2 leading-relaxed break-words">
            {product.description}
          </p>
        </div>

        {/* Price & Actions */}
        <div className="pt-2 border-t border-slate-100 space-y-2">
          <div className="flex items-baseline justify-between gap-1.5">
            <div>
              {product.price ? (
                <div className="flex items-baseline gap-1">
                  <span className="text-[10px] sm:text-xs text-slate-400">From</span>
                  <span className="text-xs sm:text-sm md:text-base font-extrabold text-slate-900 tracking-tight">
                    ₹{product.price.toLocaleString('en-IN')}
                  </span>
                </div>
              ) : (
                <span className="text-[10px] sm:text-xs text-slate-500 font-medium">
                  Check Current Price
                </span>
              )}
            </div>
            {product.clickCount > 0 && (
              <span className="text-[10px] sm:text-xs text-slate-400 whitespace-nowrap">
                {product.clickCount} views
              </span>
            )}
          </div>

          {/* Action Buttons: [BUY NOW] and [SHARE] */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onBuyNow(product)}
              className="flex-1 min-h-[32px] sm:min-h-[34px] py-1.5 px-2 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 text-[11px] sm:text-xs font-bold rounded-lg flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-xs whitespace-nowrap"
            >
              <span>Buy Now</span>
              <ExternalLink className="w-3 h-3 shrink-0" />
            </button>

            <button
              onClick={() => onShare(product)}
              className="min-h-[32px] sm:min-h-[34px] min-w-[32px] sm:min-w-[34px] p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer border border-slate-200/80 flex items-center justify-center shrink-0"
              title="Share Deal"
            >
              <Share2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
