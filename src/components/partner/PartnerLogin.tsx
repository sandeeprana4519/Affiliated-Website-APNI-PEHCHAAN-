import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Lock, Mail, ArrowRight, UserCheck, AlertCircle } from 'lucide-react';

export const PartnerLogin: React.FC = () => {
  const { loginAsUser, setCurrentView } = useApp();
  const [email, setEmail] = useState('kavita@partnerdeals.in');
  const [password, setPassword] = useState('••••••••');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const res = loginAsUser(email, password);
    if (!res.success) {
      setErrorMessage(res.error || 'Login failed.');
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 mx-auto shadow-xs">
          <UserCheck className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Partner Portal Login</h1>
        <p className="text-xs text-slate-500">
          Sign in to manage and submit affiliate deals for editorial approval.
        </p>
      </div>

      <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-4">
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-600 mb-1 font-medium">Partner Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="partner@yourdealbrand.com"
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white text-xs"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <label className="text-slate-600 font-medium">Password</label>
              <button
                type="button"
                onClick={() => setCurrentView('partner_forgot_password')}
                className="text-amber-700 hover:underline cursor-pointer font-medium"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white text-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs"
          >
            <span>Login to Partner Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-3 border-t border-slate-100 text-center text-xs text-slate-500">
          <span>Don't have a partner account yet? </span>
          <button
            onClick={() => setCurrentView('partner_register')}
            className="text-amber-700 hover:underline font-semibold cursor-pointer"
          >
            Register Here
          </button>
        </div>
      </div>

      {/* Preset quick test login buttons */}
      <div className="p-3.5 bg-slate-100/70 rounded-2xl border border-slate-200/80 text-xs text-slate-600 space-y-2">
        <span className="text-xs text-slate-500 block uppercase font-semibold tracking-wide">Quick Testing Logins:</span>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setEmail('kavita@partnerdeals.in')}
            className="p-2 rounded-xl bg-white border border-slate-200 hover:border-amber-500/50 hover:bg-slate-50 text-left cursor-pointer transition-colors shadow-xs"
          >
            <p className="text-amber-800 text-xs font-bold">Partner 25</p>
            <p className="text-[11px] text-slate-500 truncate">kavita@partnerdeals.in</p>
          </button>
          <button
            onClick={() => setEmail('rahul@techhunter.io')}
            className="p-2 rounded-xl bg-white border border-slate-200 hover:border-amber-500/50 hover:bg-slate-50 text-left cursor-pointer transition-colors shadow-xs"
          >
            <p className="text-amber-800 text-xs font-bold">Partner 40</p>
            <p className="text-[11px] text-slate-500 truncate">rahul@techhunter.io</p>
          </button>
        </div>
      </div>
    </div>
  );
};
