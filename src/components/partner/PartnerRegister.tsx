import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PartnerRegisterSchema } from '../../lib/validation/schemas';
import { Lock, Mail, User, Phone, ArrowRight, AlertCircle, ShieldCheck, Eye, EyeOff, Sparkles, Check } from 'lucide-react';

export const PartnerRegister: React.FC = () => {
  const { registerPartner, setCurrentView } = useApp();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [generatedNotice, setGeneratedNotice] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Optional helper to generate a strong password for the partner
  const generateSuggestedPassword = () => {
    const chars = 'abcdefghijkmnopqrstuvwxyz';
    const caps = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const numbers = '23456789';
    const special = '!@#$%&*';

    let pass = '';
    pass += caps[Math.floor(Math.random() * caps.length)];
    pass += caps[Math.floor(Math.random() * caps.length)];
    pass += numbers[Math.floor(Math.random() * numbers.length)];
    pass += numbers[Math.floor(Math.random() * numbers.length)];
    pass += special[Math.floor(Math.random() * special.length)];
    for (let i = 0; i < 5; i++) {
      pass += chars[Math.floor(Math.random() * chars.length)];
    }
    // Shuffle
    pass = pass.split('').sort(() => 0.5 - Math.random()).join('');

    setFormData((prev) => ({
      ...prev,
      password: pass,
      confirmPassword: pass,
    }));
    setShowPassword(true);
    setShowConfirmPassword(true);
    setGeneratedNotice(`Generated strong password: ${pass}. You can keep this or enter your own custom password.`);
    // clear password errors if any
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy.password;
      delete copy.confirmPassword;
      return copy;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGeneralError(null);

    // Zod client-side / server-side parity schema validation
    const result = PartnerRegisterSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        const fieldName = String(issue.path[0]);
        fieldErrors[fieldName] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const reg = registerPartner({
        name: formData.name.trim(),
        email: formData.email.trim(),
        mobile: formData.mobile.trim(),
        password: formData.password.trim(),
      });

      if (!reg.success) {
        setGeneralError(reg.error || 'Registration failed.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-8 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Register as an Affiliate Partner</h1>
        <p className="text-xs text-slate-500">
          Create your account, set your secure password, and start submitting deals.
        </p>
      </div>

      <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-4">
        {generalError && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{generalError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-slate-600 mb-1 font-medium">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Rajesh Kumar"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white"
              />
            </div>
            {errors.name && <p className="text-[11px] text-rose-600 mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-slate-600 mb-1 font-medium">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="partner@example.com"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white text-xs"
              />
            </div>
            {errors.email && <p className="text-[11px] text-rose-600 mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-slate-600 mb-1 font-medium">Mobile Phone Number</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                required
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white text-xs"
              />
            </div>
            {errors.mobile && <p className="text-[11px] text-rose-600 mt-1">{errors.mobile}</p>}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-600 font-medium">Password (Added by Partner)</label>
              <button
                type="button"
                onClick={generateSuggestedPassword}
                className="text-amber-700 hover:text-amber-800 text-[11px] flex items-center gap-1 font-semibold cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                <span>Suggest Strong Password</span>
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.password}
                onChange={(e) => {
                  setFormData({ ...formData, password: e.target.value });
                  setGeneratedNotice(null);
                }}
                placeholder="Min 8 chars, 1 uppercase, 1 number"
                className="w-full pl-9 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white text-xs"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-[11px] text-rose-600 mt-1">{errors.password}</p>}
          </div>

          <div>
            <label className="block text-slate-600 mb-1 font-medium">Confirm Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="Re-enter password"
                className="w-full pl-9 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white text-xs"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                title={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-[11px] text-rose-600 mt-1">{errors.confirmPassword}</p>
            )}
          </div>

          {generatedNotice && (
            <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-800 flex items-start gap-2">
              <Check className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
              <span>{generatedNotice}</span>
            </div>
          )}

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Role: <strong className="text-slate-800">PARTNER</strong> · Your personal password is saved securely.</span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
          >
            <span>{isSubmitting ? 'Creating Account...' : 'Complete Partner Registration'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-3 border-t border-slate-100 text-center text-xs text-slate-500">
          <span>Already registered? </span>
          <button
            onClick={() => setCurrentView('partner_login')}
            className="text-amber-700 hover:underline font-semibold cursor-pointer"
          >
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
};
