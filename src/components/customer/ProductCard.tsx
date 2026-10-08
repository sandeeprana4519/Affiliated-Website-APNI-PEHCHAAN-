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
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onShare, onBuyNow }) => {
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
    <div className="group flex flex-col rounded-2xl bg-white border border-slate-200/80 hover:border-slate-300 hover:shadow-lg transition-all duration-300 overflow-hidden shadow-xs w-full">
      {/* Product Image */}
      <div 
        onClick={() => openProductPage(product.slug)}
        className="aspect-[4/3] w-full bg-slate-50 overflow-hidden cursor-pointer relative border-b border-slate-100"
      >
        <img
          src={product.imageUrl}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-300"
          loading="lazy"
        />

        {/* Priority Admin Tag or Deal Badge */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 items-start">
          {product.isAdminProduct && (
            <span className="px-2 py-0.5 rounded-md bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider shadow-sm">
              Editor Pick
            </span>
          )}
          {product.dealOffer && (
            <span className="px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 text-[10px] font-bold uppercase tracking-wider shadow-sm">
              {product.dealOffer}
            </span>
          )}
        </div>
      </div>

      {/* Card Content */}
      <div className="flex-1 p-3.5 sm:p-4 flex flex-col justify-between space-y-3">
        <div className="space-y-1.5 min-w-0">
          {/* Platform name & category */}
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${platformBadge.color}`}>
              {platformBadge.label}
            </span>
            <span className="text-xs text-slate-500 font-medium truncate">
              {product.categoryName}
            </span>
          </div>

          {/* Product Title */}
          <h3 
            onClick={() => openProductPage(product.slug)}
            className="font-bold text-sm text-slate-900 hover:text-amber-600 transition-colors cursor-pointer leading-snug line-clamp-2 break-words"
          >
            {product.title}
          </h3>

          {/* Short Description */}
          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed break-words">
            {product.description}
          </p>
        </div>

        {/* Price & Actions */}
        <div className="pt-2.5 border-t border-slate-100 space-y-2.5">
          <div className="flex items-baseline justify-between gap-2">
            <div>
              {product.price ? (
                <div className="flex items-baseline gap-1">
                  <span className="text-xs text-slate-400">From</span>
                  <span className="text-base font-extrabold text-slate-900 tracking-tight">
                    ₹{product.price.toLocaleString('en-IN')}
                  </span>
                </div>
              ) : (
                <span className="text-xs text-slate-500 font-medium">
                  Check Current Price
                </span>
              )}
            </div>
            {product.clickCount > 0 && (
              <span className="text-xs text-slate-400 whitespace-nowrap">
                {product.clickCount} views
              </span>
            )}
          </div>

          {/* Action Buttons: [BUY NOW] and [SHARE] */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onBuyNow(product)}
              className="flex-1 min-h-[38px] py-2 px-3 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs whitespace-nowrap"
            >
              <span>Buy Now</span>
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
            </button>

            <button
              onClick={() => onShare(product)}
              className="min-h-[38px] min-w-[38px] p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer border border-slate-200/80 flex items-center justify-center shrink-0"
              title="Share Deal"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
