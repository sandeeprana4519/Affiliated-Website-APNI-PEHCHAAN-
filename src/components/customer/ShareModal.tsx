import React, { useState } from 'react';
import { Product } from '../../types';
import { useApp } from '../../context/AppContext';
import { X, Copy, Check, Share2, MessageCircle } from 'lucide-react';

interface ShareModalProps {
  product: Product | null;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ product, onClose }) => {
  const { showToast } = useApp();
  const [copied, setCopied] = useState(false);

  if (!product) return null;

  const productUrl = `${window.location.origin}/product/${product.slug}`;
  const shareText = `Check out this deal: ${product.title} on DealSphere!`;

  const handleCopy = () => {
    navigator.clipboard.writeText(productUrl);
    setCopied(true);
    showToast('Product URL copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWhatsApp = () => {
    const message = `${product.title}\n\nCheck out the deal: ${productUrl}`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    showToast('Opening WhatsApp...', 'info');
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.title,
          text: product.description,
          url: productUrl,
        });
        showToast('Shared successfully!', 'success');
      } catch (err) {
        // User cancelled or not supported
      }
    } else {
      handleCopy();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div 
        className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl shadow-2xl p-4 sm:p-5 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-bold text-slate-900">Share Product Deal</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Product snippet preview */}
        <div className="flex items-center gap-3 p-2.5 rounded-2xl bg-slate-50 border border-slate-200">
          <img
            src={product.imageUrl}
            alt={product.title}
            className="w-12 h-12 rounded-xl object-cover bg-white border border-slate-200"
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-900 truncate">{product.title}</p>
            <p className="text-xs text-amber-800 font-extrabold">
              {product.price ? `₹${product.price.toLocaleString('en-IN')}` : 'View Deal'}
            </p>
          </div>
        </div>

        {/* Share Rails */}
        <div className="space-y-2">
          {/* WhatsApp button */}
          <button
            onClick={handleWhatsApp}
            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
          >
            <MessageCircle className="w-4 h-4 fill-current" />
            <span>Share on WhatsApp</span>
          </button>

          {/* Native Web Share API if supported */}
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              onClick={handleNativeShare}
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer border border-slate-200/80"
            >
              <Share2 className="w-4 h-4 text-slate-600" />
              <span>Share via Device Menu</span>
            </button>
          )}

          {/* Copy Link button */}
          <div className="pt-2">
            <label className="text-xs text-slate-500 font-medium block mb-1">Direct Link</label>
            <div className="flex items-center gap-1.5 p-1.5 bg-slate-50 rounded-xl border border-slate-200">
              <input
                type="text"
                readOnly
                value={productUrl}
                className="flex-1 bg-transparent text-xs text-slate-700 px-1 focus:outline-none truncate"
              />
              <button
                onClick={handleCopy}
                className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white text-[11px] rounded-lg font-medium flex items-center gap-1 cursor-pointer transition-colors"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
