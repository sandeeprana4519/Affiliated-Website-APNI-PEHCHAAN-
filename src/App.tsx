/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { ToastContainer } from './components/common/ToastContainer';
import { HomePage } from './components/customer/HomePage';
import { ProductDetailPage } from './components/customer/ProductDetailPage';
import { CategoryDetailPage } from './components/customer/CategoryDetailPage';
import { SearchPage } from './components/customer/SearchPage';
import { LegalPages } from './components/customer/LegalPages';
import { ShareModal } from './components/customer/ShareModal';
import { RedirectModal } from './components/customer/RedirectModal';
import { PartnerLogin } from './components/partner/PartnerLogin';
import { PartnerRegister } from './components/partner/PartnerRegister';
import { PartnerDashboard } from './components/partner/PartnerDashboard';
import { AddProductForm } from './components/partner/AddProductForm';
import { AdminLogin } from './components/admin/AdminLogin';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { ArchitectureDocs } from './components/system/ArchitectureDocs';
import { Product } from './types';

const AppContent: React.FC = () => {
  const { currentView, openCategoryPage, categories } = useApp();

  const [shareProduct, setShareProduct] = useState<Product | null>(null);
  const [redirectProduct, setRedirectProduct] = useState<Product | null>(null);

  const handleShare = (product: Product) => {
    setShareProduct(product);
  };

  const handleBuyNow = (product: Product) => {
    setRedirectProduct(product);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-amber-500/20 selection:text-amber-900 w-full overflow-x-hidden">
      <Header />

      <main className="flex-1 w-full overflow-x-hidden">
        {currentView === 'home' && (
          <HomePage onShare={handleShare} onBuyNow={handleBuyNow} />
        )}

        {currentView === 'categories' && (
          <div className="max-w-7xl mx-auto px-3.5 sm:px-4 py-6 sm:py-8 space-y-6 w-full">
            <div className="space-y-1">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">All Deal Categories</h1>
              <p className="text-xs text-slate-500">
                Explore handpicked deals categorized for easy discovery.
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
              {categories.filter((c) => c.status === 'ACTIVE').map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => openCategoryPage(cat.slug)}
                  className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md hover:border-amber-500/40 transition-all flex flex-col items-center text-center gap-2.5 sm:gap-3 cursor-pointer group min-w-0"
                >
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden bg-slate-100 border border-slate-200 group-hover:scale-105 transition-transform flex items-center justify-center shrink-0">
                    {cat.imageUrl && (
                      <img src={cat.imageUrl} alt={cat.name} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 w-full">
                    <h3 className="font-bold text-sm text-slate-800 group-hover:text-amber-600 transition-colors line-clamp-1 break-words">{cat.name}</h3>
                    <span className="text-xs text-slate-400 break-all">/category/{cat.slug}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {currentView === 'category_detail' && (
          <CategoryDetailPage onShare={handleShare} onBuyNow={handleBuyNow} />
        )}

        {currentView === 'product_detail' && (
          <ProductDetailPage onShare={handleShare} onBuyNow={handleBuyNow} />
        )}

        {currentView === 'search' && (
          <SearchPage onShare={handleShare} onBuyNow={handleBuyNow} />
        )}

        {(currentView === 'disclosure' ||
          currentView === 'privacy' ||
          currentView === 'terms' ||
          currentView === 'help') && (
          <LegalPages page={currentView} />
        )}

        {currentView === 'partner_login' && <PartnerLogin />}
        {currentView === 'partner_register' && <PartnerRegister />}
        {currentView === 'partner_forgot_password' && (
          <div className="max-w-md mx-auto px-4 py-12 text-center space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Reset Partner Password</h2>
            <p className="text-xs text-slate-500">
              A secure one-time password reset link has been dispatched to your verified email address.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg cursor-pointer shadow-sm transition-colors"
            >
              Return to Login
            </button>
          </div>
        )}
        {currentView === 'partner_dashboard' && <PartnerDashboard />}
        {currentView === 'partner_add_product' && <AddProductForm />}

        {currentView === 'admin_login' && <AdminLogin />}
        {currentView === 'admin_dashboard' && <AdminDashboard />}

        {currentView === 'system_architecture' && <ArchitectureDocs />}
      </main>

      <Footer />

      {/* Modals */}
      <ShareModal
        product={shareProduct}
        onClose={() => setShareProduct(null)}
      />

      <RedirectModal
        product={redirectProduct}
        onClose={() => setRedirectProduct(null)}
      />

      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
