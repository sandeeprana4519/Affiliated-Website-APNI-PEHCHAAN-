import React from 'react';
import { useApp } from '../../context/AppContext';
import { BrandLogo } from './BrandLogo';
import { ShieldCheck, ExternalLink, Heart, Server } from 'lucide-react';

export const Footer: React.FC = () => {
  const { setCurrentView } = useApp();

  return (
    <footer className="border-t border-slate-200 bg-white text-slate-600 text-xs w-full">
      {/* Important Affiliate Disclosure Section (Requirement 35) */}
      <div className="bg-slate-50/70 border-b border-slate-200/80 py-5 sm:py-6 px-3.5 sm:px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center gap-3 sm:gap-4">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-700 shrink-0 shadow-xs">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="space-y-1 sm:space-y-1.5 flex-1 min-w-0">
            <h4 className="font-bold text-slate-900 text-xs sm:text-sm tracking-tight leading-snug">
              Affiliate Transparency Disclosure
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed max-w-5xl break-words">
              APNI PEHCHAAN is an independent product discovery platform and not an e-commerce store. We do not sell items directly, process payments, or handle order fulfillment. When you click "Buy Now", you are safely redirected to verified external retailers including Amazon, Flipkart, or Meesho. We may earn an affiliate commission on qualifying purchases at zero additional cost to you.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:py-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
        {/* Brand Col */}
        <div className="col-span-1 sm:col-span-2 md:col-span-1 space-y-3">
          <div className="flex items-center gap-2.5">
            <BrandLogo size={32} className="w-8 h-8" />
            <span className="font-extrabold text-slate-900 text-sm tracking-wide uppercase">
              <span className="text-amber-600">APNI</span> PEHCHAAN
            </span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed break-words">
            Curated daily deals across leading Indian and global shopping platforms including Amazon, Flipkart, and Meesho.
          </p>
        </div>

        {/* Discovery Links */}
        <div className="space-y-2.5">
          <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
            Explore Deals
          </h5>
          <ul className="space-y-1.5 text-xs">
            <li>
              <button onClick={() => setCurrentView('home')} className="hover:text-slate-900 transition-colors cursor-pointer text-slate-600">
                Trending Deals
              </button>
            </li>
            <li>
              <button onClick={() => setCurrentView('categories')} className="hover:text-slate-900 transition-colors cursor-pointer text-slate-600">
                All Categories
              </button>
            </li>
            <li>
              <button onClick={() => setCurrentView('search')} className="hover:text-slate-900 transition-colors cursor-pointer text-slate-600">
                Search Deals
              </button>
            </li>
            <li>
              <button onClick={() => setCurrentView('help')} className="hover:text-slate-900 transition-colors cursor-pointer text-slate-600">
                FAQ & Shopping Help
              </button>
            </li>
          </ul>
        </div>

        {/* Legal & Trust */}
        <div className="space-y-2.5">
          <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
            Legal & Policy
          </h5>
          <ul className="space-y-1.5 text-xs">
            <li>
              <button onClick={() => setCurrentView('disclosure')} className="hover:text-amber-700 transition-colors cursor-pointer text-amber-700 font-medium">
                Affiliate Disclosure
              </button>
            </li>
            <li>
              <button onClick={() => setCurrentView('privacy')} className="hover:text-slate-900 transition-colors cursor-pointer text-slate-600">
                Privacy Policy
              </button>
            </li>
            <li>
              <button onClick={() => setCurrentView('terms')} className="hover:text-slate-900 transition-colors cursor-pointer text-slate-600">
                Terms & Conditions
              </button>
            </li>
            <li>
              <button onClick={() => setCurrentView('help')} className="hover:text-slate-900 transition-colors cursor-pointer text-slate-600">
                Contact & Support
              </button>
            </li>
          </ul>
        </div>

        {/* Portals */}
        <div className="space-y-2.5">
          <h5 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
            Partner & Admin
          </h5>
          <ul className="space-y-1.5 text-xs">
            <li>
              <button onClick={() => setCurrentView('partner_login')} className="hover:text-slate-900 transition-colors cursor-pointer text-slate-600">
                Partner Portal Login
              </button>
            </li>
            <li>
              <button onClick={() => setCurrentView('partner_register')} className="hover:text-slate-900 transition-colors cursor-pointer text-slate-600">
                Become a Partner
              </button>
            </li>
            <li>
              <button onClick={() => setCurrentView('admin_login')} className="hover:text-slate-900 transition-colors cursor-pointer text-slate-600">
                Admin Control Room
              </button>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-100 py-4 px-4 text-center text-xs text-slate-400">
        © 2026 APNI PEHCHAAN. All rights reserved.
      </div>
    </footer>
  );
};
