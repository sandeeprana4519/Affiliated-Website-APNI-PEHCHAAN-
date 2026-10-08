import React from 'react';
import { useApp } from '../../context/AppContext';
import { Product } from '../../types';
import { ProductCard } from './ProductCard';
import { ArrowLeft, Tag } from 'lucide-react';

interface CategoryDetailPageProps {
  onShare: (product: Product) => void;
  onBuyNow: (product: Product) => void;
}

export const CategoryDetailPage: React.FC<CategoryDetailPageProps> = ({ onShare, onBuyNow }) => {
  const { 
    selectedCategorySlug, 
    categories, 
    approvedProducts, 
    setCurrentView 
  } = useApp();

  const category = categories.find((c) => c.slug === selectedCategorySlug);
  const categoryProducts = approvedProducts.filter((p) => p.categorySlug === selectedCategorySlug || p.categoryId === category?.id);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentView('home')}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 transition-colors cursor-pointer font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Categories</span>
        </button>
      </div>

      {/* Category Banner */}
      <div className="p-4 sm:p-6 md:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 w-full">
        <div className="space-y-2 min-w-0">
          <div className="flex items-center gap-2 text-xs text-amber-800 font-semibold uppercase tracking-wide flex-wrap">
            <Tag className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="break-all sm:break-normal">Category Discovery · /category/{selectedCategorySlug}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight break-words">
            {category?.name || 'Category Deals'}
          </h1>
          <p className="text-xs text-slate-500 leading-relaxed break-words">
            Discover curated discounts in {category?.name}. Redirects directly to authorized external retailers.
          </p>
        </div>

        {category?.imageUrl && (
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 hidden sm:block">
            <img src={category.imageUrl} alt={category.name} className="w-full h-full object-cover" />
          </div>
        )}
      </div>

      {/* Grid */}
      {categoryProducts.length === 0 ? (
        <div className="p-8 sm:p-12 text-center rounded-2xl bg-white border border-slate-200 text-slate-500 shadow-sm">
          <p className="text-sm font-semibold text-slate-800">No active products in this category yet.</p>
          <p className="text-xs text-slate-500 mt-1">
            Check back soon or explore other popular categories.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {categoryProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onShare={onShare}
              onBuyNow={onBuyNow}
            />
          ))}
        </div>
      )}
    </div>
  );
};
