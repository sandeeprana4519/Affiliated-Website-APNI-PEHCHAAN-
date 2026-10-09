import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Product } from '../../types';
import { ProductCard } from './ProductCard';
import { Search, SlidersHorizontal, ArrowLeft, AlertCircle } from 'lucide-react';

interface SearchPageProps {
  onShare: (product: Product) => void;
  onBuyNow: (product: Product) => void;
}

export const SearchPage: React.FC<SearchPageProps> = ({ onShare, onBuyNow }) => {
  const { 
    searchQuery, 
    setSearchQuery, 
    approvedProducts, 
    setCurrentView 
  } = useApp();

  const [inputVal, setInputVal] = useState(searchQuery);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(inputVal.trim());
  };

  // Requirement 7: Search fields: Product title, Description, Category, Platform. Only approved products!
  const queryLower = searchQuery.toLowerCase().trim();
  const searchResults = approvedProducts.filter((product) => {
    if (!queryLower) return true;
    const matchesTitle = product.title.toLowerCase().includes(queryLower);
    const matchesDesc = product.description.toLowerCase().includes(queryLower);
    const matchesCat = product.categoryName?.toLowerCase().includes(queryLower);
    const matchesPlatform = product.platform.toLowerCase().includes(queryLower);
    return matchesTitle || matchesDesc || matchesCat || matchesPlatform;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Top Search Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentView('home')}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 transition-colors cursor-pointer font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>
      </div>

      <div className="p-4 sm:p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-4 w-full">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight break-words">
            Search Affiliate Deals Catalog
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Query products across Title, Description, Category, and Platform.
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 max-w-xl">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="e.g. sofa, sony, kurtas, headphones..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-amber-500 focus:bg-white font-sans min-h-[40px]"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl cursor-pointer transition-colors shadow-xs min-h-[40px] flex items-center justify-center"
          >
            Search
          </button>
        </form>
      </div>

      {/* Results Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 border-b border-slate-200 pb-2.5 gap-1.5">
        <span className="break-words">
          Found <strong className="text-slate-900 font-bold">{searchResults.length}</strong> approved deals for query{' '}
          <span className="text-amber-700 font-semibold">"{searchQuery || 'all'}"</span>
        </span>
        <span className="text-slate-400 break-all sm:break-normal">Route: /search?q={encodeURIComponent(searchQuery)}</span>
      </div>

      {/* Results Grid */}
      {searchResults.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white border border-slate-200 text-slate-500 space-y-2 shadow-sm">
          <AlertCircle className="w-8 h-8 mx-auto text-slate-400" />
          <p className="text-sm font-semibold text-slate-800">No matching products found</p>
          <p className="text-xs text-slate-500">
            Try checking spelling or searching for generic terms like "sofa", "cotton", or "electronics".
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3.5">
          {searchResults.map((product) => (
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
