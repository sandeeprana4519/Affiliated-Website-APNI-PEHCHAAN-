import React from 'react';
import { useApp } from '../../context/AppContext';
import { ShieldCheck, FileText, HelpCircle, ArrowLeft, Mail, AlertCircle } from 'lucide-react';

interface LegalPagesProps {
  page: 'disclosure' | 'privacy' | 'terms' | 'help';
}

export const LegalPages: React.FC<LegalPagesProps> = ({ page }) => {
  const { setCurrentView } = useApp();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <button
        onClick={() => setCurrentView('home')}
        className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 transition-colors cursor-pointer font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Home</span>
      </button>

      <div className="p-4 sm:p-6 md:p-8 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-6 text-xs text-slate-600 leading-relaxed w-full">
        {page === 'disclosure' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-200 pb-4 flex-wrap sm:flex-nowrap">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 break-words">Affiliate Transparency Disclosure</h1>
                <p className="text-xs text-slate-500">Last updated: October 2026</p>
              </div>
            </div>

            <div className="space-y-3">
              <p>
                <strong className="text-slate-800">DealSphere</strong> is a standalone product discovery platform designed to help users identify value deals, seasonal promotions, and curated products across external verified online merchants, including Amazon, Flipkart, and Meesho.
              </p>

              <h3 className="text-sm font-bold text-slate-900 pt-2">How Our Affiliate Relationships Work</h3>
              <p>
                When you click on the "Buy Now" button on any product card or detail page on DealSphere, you are redirected to the corresponding merchant's official website via an affiliate tracking link. If you decide to make a qualifying purchase on that external platform, we may receive a small referral commission from the retailer at <strong className="text-slate-800">no additional cost to you</strong>.
              </p>

              <h3 className="text-sm font-bold text-slate-900 pt-2">Zero Payment & Non-Merchant Notice</h3>
              <p>
                DealSphere is not an e-commerce store. We do not sell items directly, process credit cards or UPI payments, store buyer payment details, manage inventories, or ship packages. All purchases, returns, warranty claims, and customer service inquiries must be directed to the respective merchant (Amazon, Flipkart, or Meesho) where the order was placed.
              </p>

              <h3 className="text-sm font-bold text-slate-900 pt-2">Pricing & Availability Disclaimer</h3>
              <p>
                Prices and promotional offers displayed on DealSphere are accurate at the time of publication but are subject to frequent change by external retailers without prior notice. Please verify final prices and availability directly on the seller's website before completing your transaction.
              </p>
            </div>
          </div>
        )}

        {page === 'privacy' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-200 pb-4 flex-wrap sm:flex-nowrap">
              <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-700 shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 break-words">Privacy Policy</h1>
                <p className="text-xs text-slate-500">Compliance with Data Protection Regulations</p>
              </div>
            </div>

            <div className="space-y-3">
              <p>
                We value your privacy. As a product discovery platform, DealSphere is built with privacy-first principles. We do not require customer registration to browse, search, or click through to deals.
              </p>

              <h3 className="text-sm font-bold text-slate-900 pt-2">Information We Do Not Collect</h3>
              <p>
                We do not collect customer credit card numbers, billing addresses, phone numbers, or passwords. Customers browse freely as anonymous visitors.
              </p>

              <h3 className="text-sm font-bold text-slate-900 pt-2">Click Logs & Technical Analytics</h3>
              <p>
                When you click "Buy Now", our server records an anonymous click event (product ID, timestamp, and a one-way hashed IP representation) solely to track deal popularity and prevent bot abuse. We never sell personal analytics to third parties.
              </p>
            </div>
          </div>
        )}

        {page === 'terms' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-200 pb-4 flex-wrap sm:flex-nowrap">
              <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700 shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 break-words">Terms & Conditions of Service</h1>
                <p className="text-xs text-slate-500">Terms governing usage of DealSphere</p>
              </div>
            </div>

            <div className="space-y-3">
              <p>
                By accessing DealSphere, you agree to these Terms. If you do not agree, please discontinue using this website.
              </p>
              <h3 className="text-sm font-bold text-slate-900 pt-2">Platform Use</h3>
              <p>
                All content, images, and links are provided for informational discovery purposes. Partners who register and submit deals must hold legitimate affiliate rights and are strictly prohibited from submitting deceptive links, malicious URLs, or infringing trademarks.
              </p>
            </div>
          </div>
        )}

        {page === 'help' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-200 pb-4 flex-wrap sm:flex-nowrap">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700 shrink-0">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 break-words">Help, FAQ & Contact</h1>
                <p className="text-xs text-slate-500">Frequently Asked Questions & Support</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <h4 className="font-semibold text-slate-900 text-xs">Why can't I add items to a cart or checkout here?</h4>
                <p className="text-slate-600 text-xs">
                  DealSphere is an affiliate discovery portal, not a seller. You complete all transactions directly on Amazon, Flipkart, or Meesho, giving you their official security, order tracking, and customer support.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <h4 className="font-semibold text-slate-900 text-xs">How do I submit deals as a partner?</h4>
                <p className="text-slate-600 text-xs">
                  Create a partner account via the Partner Portal. You can submit your curated products with your affiliate link. Once verified by our editorial admin team, they will appear on the live website.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                <Mail className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <h4 className="font-semibold text-slate-900 text-xs">Contact Editorial Support</h4>
                  <p className="text-slate-500 text-xs">support@dealsphere.internal · Hostinger VPS Team</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
