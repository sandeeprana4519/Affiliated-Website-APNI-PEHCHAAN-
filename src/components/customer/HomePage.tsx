import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Product, Platform } from '../../types';
import { ProductCard } from './ProductCard';
import { 
  Sparkles, 
  Flame, 
  Filter, 
  SlidersHorizontal, 
  Layers, 
  Tag, 
  ArrowRight,
  TrendingUp,
  Compass
} from 'lucide-react';

interface HomePageProps {
  onShare: (product: Product) => void;
  onBuyNow: (product: Product) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onShare, onBuyNow }) => {
  const { 
    categories, 
    approvedProducts, 
    openCategoryPage,
    setCurrentView 
  } = useApp();

  const [selectedPlatform, setSelectedPlatform] = useState<Platform | 'ALL'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [sortOption, setSortOption] = useState<'latest' | 'featured' | 'price_asc' | 'price_desc'>('latest');

  // Filter products
  const filteredProducts = approvedProducts.filter((product) => {
    const matchesPlatform = selectedPlatform === 'ALL' || product.platform === selectedPlatform;
    const matchesCategory = selectedCategory === 'ALL' || product.categoryId === selectedCategory;
    return matchesPlatform && matchesCategory;
  });

  // Apply sorting
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    // Admin priority always takes precedence at the very top
    if (a.isAdminProduct && !b.isAdminProduct) return -1;
    if (!a.isAdminProduct && b.isAdminProduct) return 1;

    if (sortOption === 'featured') {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
    } else if (sortOption === 'price_asc') {
      return (a.price || 0) - (b.price || 0);
    } else if (sortOption === 'price_desc') {
      return (b.price || 0) - (a.price || 0);
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Split into Featured Products and Latest Products
  const featuredProducts = sortedProducts.filter((p) => p.featured || p.isAdminProduct);
  const latestProducts = sortedProducts;

  return (
    <div className="max-w-7xl mx-auto px-3.5 sm:px-4 py-4 sm:py-6 space-y-8 sm:space-y-10 w-full overflow-hidden">
      {/* Hero Discovery Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-white via-amber-50/30 to-emerald-50/20 border border-slate-200/90 p-4 sm:p-6 md:p-10 shadow-sm relative overflow-hidden">
        <div className="max-w-2xl space-y-3 relative z-10">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold uppercase tracking-wide text-amber-800 bg-amber-100/80 border border-amber-200 px-2.5 sm:px-3 py-1 rounded-full whitespace-nowrap">
              Curated Daily Deals
            </span>
            <span className="text-slate-300 hidden sm:inline">·</span>
            <span className="text-xs text-slate-600 font-medium">
              Direct Store Redirection
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight break-words">
            Discover Verified Deals on Amazon, Flipkart & Meesho
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Browse handpicked discounts and viral deals across leading platforms. Click Buy Now to purchase directly on the merchant's store.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row flex-wrap sm:items-center gap-2 sm:gap-3 text-xs text-slate-600 font-medium">
            <span className="text-slate-700 flex items-center gap-1">✓ No Registration Required</span>
            <span className="text-slate-300 hidden sm:inline">·</span>
            <span className="text-slate-700 flex items-center gap-1">✓ Instant External Store Redirection</span>
            <span className="text-slate-300 hidden sm:inline">·</span>
            <span className="text-slate-700 flex items-center gap-1">✓ 100% Free to Browse</span>
          </div>
        </div>

        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-amber-400/10 to-transparent pointer-events-none" />
      </div>

      {/* Categories Horizontal Carousel / Grid (Requirement 4 & 18) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Popular Categories</span>
          </h2>
          <button
            onClick={() => setCurrentView('categories')}
            className="text-xs text-amber-700 hover:text-amber-800 font-semibold flex items-center gap-1 cursor-pointer"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2.5 sm:gap-3.5">
          {categories.filter((c) => c.status === 'ACTIVE').map((cat) => (
            <button
              key={cat.id}
              onClick={() => openCategoryPage(cat.slug)}
              className="flex flex-col items-center gap-2 p-2.5 sm:p-3.5 rounded-2xl bg-white border border-slate-200/80 hover:border-amber-500/50 hover:shadow-md transition-all text-center cursor-pointer group shadow-xs min-w-0"
            >
              <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-full overflow-hidden bg-slate-100 border border-slate-200 group-hover:scale-105 transition-transform flex items-center justify-center shrink-0">
                {cat.imageUrl ? (
                  <img
                    src={cat.imageUrl}
                    alt={cat.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <Tag className="w-5 h-5" />
                  </div>
                )}
              </div>
              <span className="text-xs font-semibold text-slate-800 group-hover:text-amber-700 line-clamp-1 transition-colors break-words w-full">
                {cat.name}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Interactive Platform Filter & Sort Bar (Requirement 8) */}
      <section className="p-3 sm:p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4">
        {/* Platform segmented buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none max-w-full">
          <span className="text-xs text-slate-500 font-medium mr-1 hidden sm:inline shrink-0">Platform:</span>
          {(['ALL', 'AMAZON', 'FLIPKART', 'MEESHO'] as const).map((plat) => {
            const isSelected = selectedPlatform === plat;
            const activeColor = 
              plat === 'AMAZON' 
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : plat === 'FLIPKART'
                ? 'bg-sky-500 text-white font-bold shadow-sm'
                : plat === 'MEESHO'
                ? 'bg-rose-500 text-white font-bold shadow-sm'
                : 'bg-slate-900 text-white font-bold shadow-sm';

            return (
              <button
                key={plat}
                onClick={() => setSelectedPlatform(plat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? activeColor
                    : 'bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                }`}
              >
                {plat === 'ALL' ? 'All Platforms' : plat === 'AMAZON' ? 'Amazon' : plat === 'FLIPKART' ? 'Flipkart' : 'Meesho'}
              </button>
            );
          })}
        </div>

        {/* Sort & Category selector */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="flex-1 sm:flex-initial px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-amber-500 focus:bg-white"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as any)}
            className="flex-1 sm:flex-initial px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-amber-500 focus:bg-white"
          >
            <option value="latest">Sort: Latest Added</option>
            <option value="featured">Sort: Featured First</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>
      </section>

      {/* Section 1: Featured Products */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2.5 gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            <h2 className="text-sm sm:text-base font-bold text-slate-900">Featured Deals</h2>
            <span className="text-xs text-slate-500 font-normal whitespace-nowrap">
              ({featuredProducts.length} verified deals)
            </span>
          </div>
          <span className="text-xs text-amber-700 font-semibold hidden sm:inline">
            Handpicked Top Offers
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {featuredProducts.slice(0, 4).map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onShare={onShare}
              onBuyNow={onBuyNow}
            />
          ))}
        </div>
      </section>

      {/* Section 2: Latest Products */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2.5 gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <Compass className="w-4 h-4 text-indigo-600 shrink-0" />
            <h2 className="text-sm sm:text-base font-bold text-slate-900">Latest Deals</h2>
            <span className="text-xs text-slate-500 font-normal whitespace-nowrap">
              ({sortedProducts.length} available)
            </span>
          </div>
        </div>

        {sortedProducts.length === 0 ? (
          <div className="p-8 sm:p-12 text-center rounded-2xl bg-white border border-slate-200 text-slate-500 shadow-sm">
            <p className="text-sm font-semibold text-slate-800">No deals match your current filters.</p>
            <p className="text-xs text-slate-500 mt-1">
              Try switching platforms or selecting all categories.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {sortedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onShare={onShare}
                onBuyNow={onBuyNow}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
