import React, { useState, useRef } from 'react';
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
  Compass,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Users,
  ShieldCheck
} from 'lucide-react';

interface HomePageProps {
  onShare: (product: Product) => void;
  onBuyNow: (product: Product) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onShare, onBuyNow }) => {
  const { 
    categories, 
    approvedProducts, 
    partners,
    openCategoryPage,
    setCurrentView 
  } = useApp();

  const [selectedPlatform, setSelectedPlatform] = useState<Platform | 'ALL'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedPartner, setSelectedPartner] = useState<string>('ALL');
  const [sortOption, setSortOption] = useState<'latest' | 'featured' | 'price_asc' | 'price_desc'>('latest');
  const [viewMode, setViewMode] = useState<'scroll' | 'grid'>('scroll');

  const categoriesScrollRef = useRef<HTMLDivElement>(null);
  const partnerScrollRef = useRef<HTMLDivElement>(null);
  const featuredScrollRef = useRef<HTMLDivElement>(null);
  const productsScrollRef = useRef<HTMLDivElement>(null);

  const scrollContainer = (ref: React.RefObject<HTMLDivElement | null>, direction: 'left' | 'right') => {
    if (ref.current) {
      const scrollAmount = direction === 'left' ? -280 : 280;
      ref.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const defaultPartnerAvatars: Record<string, string> = {
    'AP00001': 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80', // Kavita Sharma
    'AP00002': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80', // Rahul Verma
    'a1000000-0000-0000-0000-000000000025': 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
    'a1000000-0000-0000-0000-000000000040': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
  };

  const getPartnerAvatar = (id: string, name: string, customAvatar?: string) => {
    if (customAvatar) return customAvatar;
    if (defaultPartnerAvatars[id]) return defaultPartnerAvatars[id];
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=fef3c7&color=b45309&bold=true&size=128`;
  };

  // Build complete list of active partners + partners with deals
  const activePartners = partners.filter((p) => p.status === 'ACTIVE');
  const partnerList: { id: string; name: string; avatarUrl?: string; dealCount: number }[] = activePartners.map((partner) => ({
    id: partner.id,
    name: partner.name,
    avatarUrl: partner.avatarUrl || defaultPartnerAvatars[partner.id],
    dealCount: approvedProducts.filter((p) => p.partnerId === partner.id).length,
  }));

  // Also include any partners with approved deals that might not be in the initial activePartners list
  approvedProducts.forEach((p) => {
    if (p.partnerId && !p.isAdminProduct && !partnerList.some((pl) => pl.id === p.partnerId)) {
      partnerList.push({
        id: p.partnerId,
        name: p.partnerName || 'Partner Curator',
        avatarUrl: defaultPartnerAvatars[p.partnerId],
        dealCount: approvedProducts.filter((pr) => pr.partnerId === p.partnerId).length,
      });
    }
  });

  const adminDealCount = approvedProducts.filter((p) => p.isAdminProduct || !p.partnerId).length;

  // Filter products
  const filteredProducts = approvedProducts.filter((product) => {
    const matchesPlatform = selectedPlatform === 'ALL' || product.platform === selectedPlatform;
    const matchesCategory = selectedCategory === 'ALL' || product.categoryId === selectedCategory;
    const matchesPartner =
      selectedPartner === 'ALL'
        ? true
        : selectedPartner === 'ADMIN'
        ? product.isAdminProduct || !product.partnerId
        : product.partnerId === selectedPartner;
    return matchesPlatform && matchesCategory && matchesPartner;
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

  const activeCategories = categories.filter((c) => c.status === 'ACTIVE');
  const currentCategoryObj = categories.find((c) => c.id === selectedCategory);
  const currentPartnerObj = partnerList.find((p) => p.id === selectedPartner);

  return (
    <div className="max-w-7xl mx-auto px-3.5 sm:px-4 py-4 sm:py-6 space-y-7 sm:space-y-9 w-full overflow-hidden">
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

      {/* 1. Select Category (Horizontal Scrolling Shelf with Images like Popular Category) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Flame className="w-4 h-4 text-amber-500 shrink-0" />
            <h2 className="text-sm sm:text-base font-bold text-slate-900">Select Category</h2>
            <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              Popular Categories
            </span>
            {selectedCategory !== 'ALL' && (
              <button
                onClick={() => setSelectedCategory('ALL')}
                className="text-[11px] text-amber-700 hover:text-amber-800 underline font-semibold ml-1 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentView('categories')}
              className="text-xs text-amber-700 hover:text-amber-800 font-semibold flex items-center gap-1 cursor-pointer mr-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <div className="flex items-center gap-1">
              <button
                onClick={() => scrollContainer(categoriesScrollRef, 'left')}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-xs cursor-pointer transition-colors"
                title="Scroll Left"
                aria-label="Scroll Categories Left"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => scrollContainer(categoriesScrollRef, 'right')}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-xs cursor-pointer transition-colors"
                title="Scroll Right"
                aria-label="Scroll Categories Right"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Categories Scrolling Shelf with Image Cards */}
        <div 
          ref={categoriesScrollRef}
          className="flex gap-2.5 sm:gap-3.5 overflow-x-auto pb-2.5 pt-0.5 px-0.5 scroll-smooth snap-x snap-mandatory scrollbar-none"
        >
          {/* All Categories Card */}
          <button
            onClick={() => {
              setSelectedCategory('ALL');
              const el = document.getElementById('products-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className={`shrink-0 w-[96px] sm:w-[112px] md:w-[124px] snap-start flex flex-col items-center gap-2 p-2.5 sm:p-3 rounded-2xl bg-white border transition-all text-center cursor-pointer group shadow-xs ${
              selectedCategory === 'ALL'
                ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/40 shadow-sm'
                : 'border-slate-200/80 hover:border-amber-500/50 hover:shadow-md'
            }`}
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden bg-gradient-to-br from-amber-400 to-amber-600 border border-amber-300 group-hover:scale-105 transition-transform flex items-center justify-center shrink-0 shadow-xs text-slate-950 font-bold">
              <Layers className="w-5 h-5 sm:w-6 sm:h-6 text-slate-950" />
            </div>
            <span className="text-[11px] sm:text-xs font-semibold text-slate-800 group-hover:text-amber-700 line-clamp-1 transition-colors break-words w-full">
              All Categories
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              {approvedProducts.length} deals
            </span>
          </button>

          {/* Active Category Cards */}
          {activeCategories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const dealCount = approvedProducts.filter((p) => p.categoryId === cat.id).length;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(isSelected ? 'ALL' : cat.id);
                  const el = document.getElementById('products-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`shrink-0 w-[96px] sm:w-[112px] md:w-[124px] snap-start flex flex-col items-center gap-2 p-2.5 sm:p-3 rounded-2xl bg-white border transition-all text-center cursor-pointer group shadow-xs ${
                  isSelected 
                    ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/40 shadow-sm' 
                    : 'border-slate-200/80 hover:border-amber-500/50 hover:shadow-md'
                }`}
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden bg-slate-100 border border-slate-200 group-hover:scale-105 transition-transform flex items-center justify-center shrink-0 shadow-xs">
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
                <span className="text-[11px] sm:text-xs font-semibold text-slate-800 group-hover:text-amber-700 line-clamp-1 transition-colors break-words w-full">
                  {cat.name}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  {dealCount} deals
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 2. Select Partner (Horizontal Scrolling Shelf with Images directly under Select Category) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Users className="w-4 h-4 text-amber-500 shrink-0" />
            <h2 className="text-sm sm:text-base font-bold text-slate-900">Select Partner</h2>
            <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
              Verified Curators
            </span>
            {selectedPartner !== 'ALL' && (
              <button
                onClick={() => setSelectedPartner('ALL')}
                className="text-[11px] text-amber-700 hover:text-amber-800 underline font-semibold ml-1 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium hidden sm:inline">
              {selectedPartner === 'ALL'
                ? `All Curators (${approvedProducts.length} deals)`
                : selectedPartner === 'ADMIN'
                ? `Official / Editorial (${adminDealCount} deals)`
                : `${currentPartnerObj?.name || 'Partner'} (${
                    approvedProducts.filter((p) => p.partnerId === selectedPartner).length
                  } deals)`}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => scrollContainer(partnerScrollRef, 'left')}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-xs cursor-pointer transition-colors"
                title="Scroll Left"
                aria-label="Scroll Partners Left"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => scrollContainer(partnerScrollRef, 'right')}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-xs cursor-pointer transition-colors"
                title="Scroll Right"
                aria-label="Scroll Partners Right"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Partners Scrolling Shelf with Image Cards (Like Popular Category) */}
        <div 
          ref={partnerScrollRef}
          className="flex gap-2.5 sm:gap-3.5 overflow-x-auto pb-2.5 pt-0.5 px-0.5 scroll-smooth snap-x snap-mandatory scrollbar-none"
        >
          {/* All Partners Card */}
          <button
            onClick={() => {
              setSelectedPartner('ALL');
              const el = document.getElementById('products-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className={`shrink-0 w-[96px] sm:w-[112px] md:w-[124px] snap-start flex flex-col items-center gap-2 p-2.5 sm:p-3 rounded-2xl bg-white border transition-all text-center cursor-pointer group shadow-xs ${
              selectedPartner === 'ALL'
                ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/40 shadow-sm'
                : 'border-slate-200/80 hover:border-amber-500/50 hover:shadow-md'
            }`}
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden bg-gradient-to-br from-slate-800 to-slate-950 border border-slate-700 group-hover:scale-105 transition-transform flex items-center justify-center shrink-0 shadow-xs text-white">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400" />
            </div>
            <span className="text-[11px] sm:text-xs font-semibold text-slate-800 group-hover:text-amber-700 line-clamp-1 transition-colors break-words w-full">
              All Partners
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              {approvedProducts.length} deals
            </span>
          </button>

          {/* Official / Editorial Deals Card */}
          <button
            onClick={() => {
              setSelectedPartner(selectedPartner === 'ADMIN' ? 'ALL' : 'ADMIN');
              const el = document.getElementById('products-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className={`shrink-0 w-[96px] sm:w-[112px] md:w-[124px] snap-start flex flex-col items-center gap-2 p-2.5 sm:p-3 rounded-2xl bg-white border transition-all text-center cursor-pointer group shadow-xs ${
              selectedPartner === 'ADMIN'
                ? 'border-indigo-600 ring-2 ring-indigo-600/20 bg-indigo-50/50 shadow-sm'
                : 'border-slate-200/80 hover:border-indigo-500/50 hover:shadow-md'
            }`}
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden bg-slate-900 border border-indigo-700 group-hover:scale-105 transition-transform flex items-center justify-center shrink-0 shadow-xs relative">
              <img
                src="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=300&q=80"
                alt="Official Deals"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-slate-950/30 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-indigo-300 drop-shadow" />
              </div>
            </div>
            <span className="text-[11px] sm:text-xs font-semibold text-slate-800 group-hover:text-indigo-700 line-clamp-1 transition-colors break-words w-full">
              Official Deals
            </span>
            <span className="text-[10px] text-indigo-600 font-semibold">
              {adminDealCount} deals
            </span>
          </button>

          {/* Individual Partner Cards */}
          {partnerList.map((partner) => {
            const isSelected = selectedPartner === partner.id;
            const partnerAvatar = getPartnerAvatar(partner.id, partner.name, partner.avatarUrl);
            return (
              <button
                key={partner.id}
                onClick={() => {
                  setSelectedPartner(isSelected ? 'ALL' : partner.id);
                  const el = document.getElementById('products-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`shrink-0 w-[96px] sm:w-[112px] md:w-[124px] snap-start flex flex-col items-center gap-2 p-2.5 sm:p-3 rounded-2xl bg-white border transition-all text-center cursor-pointer group shadow-xs ${
                  isSelected
                    ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/40 shadow-sm'
                    : 'border-slate-200/80 hover:border-amber-500/50 hover:shadow-md'
                }`}
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full overflow-hidden bg-slate-100 border border-slate-200 group-hover:scale-105 transition-transform flex items-center justify-center shrink-0 shadow-xs">
                  <img
                    src={partnerAvatar}
                    alt={partner.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(partner.name)}&background=fef3c7&color=b45309&bold=true&size=128`;
                    }}
                  />
                </div>
                <span className="text-[11px] sm:text-xs font-semibold text-slate-800 group-hover:text-amber-700 line-clamp-1 transition-colors break-words w-full">
                  {partner.name}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  {partner.dealCount} deals
                </span>
              </button>
            );
          })}
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

      {/* Section 1: Featured Deals (Horizontal Scrolling Shelf) */}
      {featuredProducts.length > 0 && (
        <section className="space-y-3.5">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2.5 gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
              <h2 className="text-sm sm:text-base font-bold text-slate-900">Featured Deals</h2>
              <span className="text-xs text-slate-500 font-normal whitespace-nowrap">
                ({featuredProducts.length} verified deals)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-amber-700 font-semibold hidden md:inline">
                Scroll to explore top picks
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => scrollContainer(featuredScrollRef, 'left')}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-xs cursor-pointer transition-colors"
                  title="Scroll Left"
                  aria-label="Scroll Left"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => scrollContainer(featuredScrollRef, 'right')}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-xs cursor-pointer transition-colors"
                  title="Scroll Right"
                  aria-label="Scroll Right"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Horizontally scrolling product row */}
          <div
            ref={featuredScrollRef}
            className="flex gap-2.5 sm:gap-3.5 overflow-x-auto pb-2 pt-0.5 px-0.5 scroll-smooth snap-x snap-mandatory scrollbar-none"
          >
            {featuredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onShare={onShare}
                onBuyNow={onBuyNow}
                className="shrink-0 w-[160px] sm:w-[190px] md:w-[215px] snap-start"
              />
            ))}
          </div>
        </section>
      )}

      {/* Section 2: All Products with Category Option and Scrolling View (Requirement 6) */}
      <section id="products-section" className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2.5 gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <Compass className="w-4 h-4 text-indigo-600 shrink-0" />
            <div className="flex items-center gap-1.5 flex-wrap">
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                {selectedCategory === 'ALL' ? 'All Deals' : `${currentCategoryObj?.name || 'Category'} Deals`}
              </h2>
              {selectedPartner !== 'ALL' && (
                <span className="text-xs font-semibold text-amber-900 bg-amber-100/90 border border-amber-300 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                  <span>by {selectedPartner === 'ADMIN' ? 'Official Editorial' : (currentPartnerObj?.name || 'Partner')}</span>
                  <button 
                    onClick={() => setSelectedPartner('ALL')}
                    className="hover:text-amber-950 font-bold ml-0.5 cursor-pointer text-sm leading-none"
                    title="Remove partner filter"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
            <span className="text-xs text-slate-500 font-normal whitespace-nowrap">
              ({sortedProducts.length} available)
            </span>
          </div>

          {/* Controls: View mode & Scroll navigation */}
          <div className="flex items-center gap-2">
            {/* View Mode Switcher */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/80">
              <button
                onClick={() => setViewMode('scroll')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                  viewMode === 'scroll'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Horizontal Scroll View"
              >
                <span>↔ Scroll</span>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                  viewMode === 'grid'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-3 h-3" />
                <span>Grid</span>
              </button>
            </div>

            {/* Scroll navigation buttons (when in scroll mode) */}
            {viewMode === 'scroll' && sortedProducts.length > 0 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => scrollContainer(productsScrollRef, 'left')}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-xs cursor-pointer transition-colors"
                  title="Scroll Left"
                  aria-label="Scroll Left"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => scrollContainer(productsScrollRef, 'right')}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-xs cursor-pointer transition-colors"
                  title="Scroll Right"
                  aria-label="Scroll Right"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {sortedProducts.length === 0 ? (
          <div className="p-8 sm:p-12 text-center rounded-2xl bg-white border border-slate-200 text-slate-500 shadow-sm space-y-3">
            <p className="text-sm font-semibold text-slate-800">No deals match your current filters.</p>
            <p className="text-xs text-slate-500">
              Try switching platforms, clearing category, or selecting all partners.
            </p>
            {(selectedCategory !== 'ALL' || selectedPartner !== 'ALL' || selectedPlatform !== 'ALL') && (
              <div className="pt-1">
                <button
                  onClick={() => {
                    setSelectedCategory('ALL');
                    setSelectedPartner('ALL');
                    setSelectedPlatform('ALL');
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-xs cursor-pointer inline-flex items-center gap-1.5 transition-colors"
                >
                  Reset All Filters
                </button>
              </div>
            )}
          </div>
        ) : viewMode === 'scroll' ? (
          /* Products appear scrolling horizontally */
          <div className="space-y-4">
            <div
              ref={productsScrollRef}
              className="flex gap-2.5 sm:gap-3.5 overflow-x-auto pb-3 pt-0.5 px-0.5 scroll-smooth snap-x snap-mandatory scrollbar-none"
            >
              {sortedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onShare={onShare}
                  onBuyNow={onBuyNow}
                  className="shrink-0 w-[160px] sm:w-[190px] md:w-[215px] snap-start"
                />
              ))}
            </div>

            {/* Also show compact grid below if more than 4 products so user has both quick scrolling and full overview */}
            <div className="pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-600">All Deals Overview</span>
                <span className="text-[11px] text-slate-400">Compact layout</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3.5">
                {sortedProducts.map((product) => (
                  <ProductCard
                    key={`grid-${product.id}`}
                    product={product}
                    onShare={onShare}
                    onBuyNow={onBuyNow}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Grid View: Compact responsive 2-to-5 columns */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3.5">
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

