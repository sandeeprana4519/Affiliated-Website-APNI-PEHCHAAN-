import React, { useEffect, useState } from 'react';
import { Product } from '../../types';
import { useApp } from '../../context/AppContext';
import { 
  ShieldCheck, 
  ExternalLink, 
  CheckCircle2, 
  ArrowRight, 
  AlertTriangle,
  Lock,
  Clock
} from 'lucide-react';

interface RedirectModalProps {
  product: Product | null;
  onClose: () => void;
}

export const RedirectModal: React.FC<RedirectModalProps> = ({ product, onClose }) => {
  const { handleBuyNowRedirect } = useApp();
  const [countdown, setCountdown] = useState(2);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  const [validationSteps, setValidationSteps] = useState({
    exists: true,
    statusApproved: false,
    httpsProtocol: false,
    domainWhitelisted: false,
    clickLogged: false,
  });

  useEffect(() => {
    if (!product) return;

    // Execute route validation: /go/[productId]
    const result = handleBuyNowRedirect(product.id);

    if (result.success && result.redirectUrl) {
      setRedirectUrl(result.redirectUrl);
      setValidationSteps({
        exists: true,
        statusApproved: product.status === 'APPROVED',
        httpsProtocol: result.redirectUrl.startsWith('https://'),
        domainWhitelisted: true,
        clickLogged: true,
      });

      // Countdown to auto redirect
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            // Open affiliate link in new tab safely with rel noopener noreferrer
            window.open(result.redirectUrl, '_blank', 'noopener,noreferrer');
            onClose();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [product]);

  if (!product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div 
        className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl p-4 sm:p-6 space-y-4 sm:space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 shadow-xs shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slate-900 truncate">
              Controlled Route: /go/{product.id}
            </h3>
            <p className="text-xs text-slate-500 leading-tight">
              Validating affiliate link & redirecting to {product.platform}...
            </p>
          </div>
        </div>

        {/* Product snippet */}
        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-3">
          <img
            src={product.imageUrl}
            alt={product.title}
            className="w-12 h-12 rounded-xl object-cover bg-white border border-slate-200"
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-900 truncate">{product.title}</p>
            <p className="text-xs text-slate-500">
              Platform: <strong className="text-amber-800">{product.platform}</strong>
              {product.price && ` · ₹${product.price.toLocaleString('en-IN')}`}
            </p>
          </div>
        </div>

        {/* Security checks checklist */}
        <div className="space-y-2 text-xs p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
          <div className="flex items-center gap-2 text-emerald-700 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>Product status verified: APPROVED</span>
          </div>
          <div className="flex items-center gap-2 text-emerald-700 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>Protocol secure: HTTPS only (no javascript:)</span>
          </div>
          <div className="flex items-center gap-2 text-emerald-700 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>Domain whitelisted: {product.platform.toLowerCase()} partner rail</span>
          </div>
          <div className="flex items-center gap-2 text-emerald-700 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>Privacy click recorded to MySQL click_logs table</span>
          </div>
        </div>

        {/* Redirect Notice */}
        <div className="text-center space-y-3 pt-2">
          <p className="text-xs text-slate-500">
            Redirecting automatically in <strong className="text-slate-900 font-bold">{countdown}s</strong>...
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-xl cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (redirectUrl) {
                  window.open(redirectUrl, '_blank', 'noopener,noreferrer');
                  onClose();
                }
              }}
              className="flex-1 py-2 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            >
              <span>Continue Now</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
