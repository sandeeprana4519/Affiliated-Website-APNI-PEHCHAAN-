import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Search, 
  Menu, 
  X, 
  ExternalLink, 
  Compass, 
  Grid, 
  HelpCircle, 
  User, 
  Shield, 
  LogOut, 
  Sparkles
} from 'lucide-react';

export const Header: React.FC = () => {
  const { 
    currentView, 
    setCurrentView, 
    searchQuery, 
    setSearchQuery, 
    executeSearch, 
    currentUser, 
    logout 
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(searchQuery);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      executeSearch(searchInput.trim());
      setMobileMenuOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 border-b border-slate-200/80 backdrop-blur-md transition-colors w-full">
      {/* Main Header Navigation */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Logo */}
        <div 
          onClick={() => setCurrentView('home')}
          className="flex items-center gap-2 sm:gap-2.5 cursor-pointer group min-w-0 flex-1 sm:flex-initial"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 flex items-center justify-center shadow-md shadow-amber-500/10 group-hover:scale-105 transition-transform shrink-0">
            <Compass className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap leading-tight">
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900">DealSphere</span>
              <span className="text-[9px] sm:text-[10px] font-semibold tracking-wide uppercase px-1.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-800 leading-none whitespace-nowrap">
                Affiliate Discovery
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-500 font-normal leading-tight truncate mt-0.5">
              Amazon · Flipkart · Meesho Deals
            </p>
          </div>
        </div>

        {/* Global Search Bar (Desktop) */}
        <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search products, sofa, headphones, brands..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-100 border border-slate-200 rounded-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20 font-sans transition-all"
            />
          </div>
        </form>

        {/* Desktop Nav Links */}
        <nav className="hidden lg:flex items-center gap-6 text-xs font-medium text-slate-600">
          <button
            onClick={() => setCurrentView('home')}
            className={`hover:text-slate-900 transition-colors cursor-pointer ${
              currentView === 'home' ? 'text-slate-900 font-semibold' : ''
            }`}
          >
            Home
          </button>

          <button
            onClick={() => setCurrentView('categories')}
            className={`hover:text-slate-900 transition-colors cursor-pointer ${
              currentView === 'categories' ? 'text-slate-900 font-semibold' : ''
            }`}
          >
            Categories
          </button>

          <button
            onClick={() => setCurrentView('search')}
            className={`hover:text-slate-900 transition-colors cursor-pointer ${
              currentView === 'search' ? 'text-slate-900 font-semibold' : ''
            }`}
          >
            Search
          </button>

          <button
            onClick={() => setCurrentView('help')}
            className={`hover:text-slate-900 transition-colors cursor-pointer ${
              currentView === 'help' ? 'text-slate-900 font-semibold' : ''
            }`}
          >
            Help
          </button>
        </nav>

        {/* Action Button: Partner Portal or Admin Portal */}
        <div className="hidden sm:flex items-center gap-2">
          {currentUser ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (currentUser.role === 'ADMIN') {
                    setCurrentView('admin_dashboard');
                  } else {
                    setCurrentView('partner_dashboard');
                  }
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-semibold text-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {currentUser.role === 'ADMIN' ? (
                  <Shield className="w-3.5 h-3.5 text-purple-600" />
                ) : (
                  <User className="w-3.5 h-3.5 text-amber-600" />
                )}
                <span>Dashboard</span>
              </button>

              <button
                onClick={logout}
                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-colors cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentView('partner_login')}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 hover:text-slate-900 shadow-sm transition-colors cursor-pointer"
              >
                Partner Login
              </button>
              <button
                onClick={() => setCurrentView('admin_login')}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer font-medium"
              >
                Admin
              </button>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="flex items-center gap-2 lg:hidden">
          <button
            onClick={() => setCurrentView('search')}
            className="p-2 text-slate-500 hover:text-slate-900 md:hidden cursor-pointer"
            title="Search"
          >
            <Search className="w-5 h-5" />
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white p-4 space-y-4 shadow-lg">
          <form onSubmit={handleSearchSubmit}>
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search deals on Amazon, Flipkart, Meesho..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </form>

          <div className="flex flex-col space-y-2 text-sm font-medium">
            <button
              onClick={() => {
                setCurrentView('home');
                setMobileMenuOpen(false);
              }}
              className="text-left py-2 px-3 rounded hover:bg-slate-100 text-slate-800 cursor-pointer"
            >
              Home
            </button>
            <button
              onClick={() => {
                setCurrentView('categories');
                setMobileMenuOpen(false);
              }}
              className="text-left py-2 px-3 rounded hover:bg-slate-100 text-slate-800 cursor-pointer"
            >
              Categories
            </button>
            <button
              onClick={() => {
                setCurrentView('search');
                setMobileMenuOpen(false);
              }}
              className="text-left py-2 px-3 rounded hover:bg-slate-100 text-slate-800 cursor-pointer"
            >
              Search Deals
            </button>
            <button
              onClick={() => {
                setCurrentView('help');
                setMobileMenuOpen(false);
              }}
              className="text-left py-2 px-3 rounded hover:bg-slate-100 text-slate-800 cursor-pointer"
            >
              Help & FAQ
            </button>
            <button
              onClick={() => {
                setCurrentView('disclosure');
                setMobileMenuOpen(false);
              }}
              className="text-left py-2 px-3 rounded hover:bg-slate-100 text-slate-500 text-xs cursor-pointer"
            >
              Affiliate Disclosure
            </button>
          </div>

          <div className="pt-2 border-t border-slate-200 flex flex-col gap-2">
            {currentUser ? (
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setCurrentView(currentUser.role === 'ADMIN' ? 'admin_dashboard' : 'partner_dashboard');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-200 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Go to {currentUser.role} Dashboard
                </button>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2 text-rose-600 text-xs font-medium cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setCurrentView('partner_login');
                    setMobileMenuOpen(false);
                  }}
                  className="py-2 bg-white border border-slate-200 text-slate-800 rounded-lg text-xs font-medium cursor-pointer"
                >
                  Partner Login
                </button>
                <button
                  onClick={() => {
                    setCurrentView('admin_login');
                    setMobileMenuOpen(false);
                  }}
                  className="py-2 bg-slate-900 text-white rounded-lg text-xs font-medium cursor-pointer"
                >
                  Admin Login
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
