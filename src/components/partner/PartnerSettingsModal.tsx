import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Settings, 
  Lock, 
  Mail, 
  Phone, 
  Camera, 
  Copy, 
  Check, 
  Sparkles, 
  Eye, 
  EyeOff, 
  X,
  RefreshCw,
  Hash
} from 'lucide-react';

interface PartnerSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PartnerSettingsModal: React.FC<PartnerSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { currentUser, updatePartnerProfile, showToast } = useApp();

  // Always declare all hooks at the top level in invariant order
  const [name, setName] = useState<string>(currentUser?.name || '');
  const [partnerId, setPartnerId] = useState<string>(currentUser?.id || '');
  const [email, setEmail] = useState<string>(currentUser?.email || '');
  const [mobile, setMobile] = useState<string>(currentUser?.mobile || '');
  const [avatarUrl, setAvatarUrl] = useState<string>(currentUser?.avatarUrl || '');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Synchronize local form state with currentUser whenever modal opens or user updates
  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setPartnerId(currentUser.id || '');
      setEmail(currentUser.email || '');
      setMobile(currentUser.mobile || '');
      setAvatarUrl(currentUser.avatarUrl || '');
      setNewPassword('');
      setConfirmPassword('');
      setShowPassword(false);
      setCopiedId(false);
    }
  }, [currentUser, isOpen]);

  // If user is not logged in or modal is closed, return null
  if (!isOpen || !currentUser) {
    return null;
  }

  // Suggested preset avatars for quick pick
  const avatarPresets = [
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
    'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80',
  ];

  const handleCopyId = () => {
    navigator.clipboard.writeText(partnerId || currentUser.id);
    setCopiedId(true);
    showToast('Partner ID copied to clipboard!', 'success');
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleSuggestShortId = () => {
    // Suggest next clean ID like AP00001
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const shortId = `AP0${randomSuffix}`;
    setPartnerId(shortId);
    showToast(`Suggested short Partner ID: ${shortId}`, 'info');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (JPEG, PNG, WEBP).', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image size exceeds 5MB limit.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setAvatarUrl(base64);
      showToast('Profile photo loaded into preview!', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateInitialsAvatar = () => {
    const generated = `https://ui-avatars.com/api/?name=${encodeURIComponent(
      name.trim() || 'Partner'
    )}&background=fef3c7&color=b45309&bold=true&size=256`;
    setAvatarUrl(generated);
    showToast('Generated personalized initials avatar!', 'info');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      showToast('Please enter your partner / brand name.', 'error');
      return;
    }

    const cleanPartnerId = partnerId.trim().toUpperCase();
    if (!cleanPartnerId) {
      showToast('Please enter a Partner ID (e.g. AP00001).', 'error');
      return;
    }

    if (cleanPartnerId.length < 3 || cleanPartnerId.length > 24) {
      showToast('Partner ID must be between 3 and 24 characters (e.g. AP00001).', 'error');
      return;
    }

    if (!/^[A-Z0-9_-]+$/i.test(cleanPartnerId)) {
      showToast('Partner ID can only contain letters, numbers, hyphens, and underscores.', 'error');
      return;
    }

    if (!email.trim()) {
      showToast('Please enter a valid login email address.', 'error');
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      showToast('New password and confirm password do not match.', 'error');
      return;
    }

    if (newPassword && newPassword.length < 4) {
      showToast('New password must be at least 4 characters.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = updatePartnerProfile({
        name: name.trim(),
        partnerId: cleanPartnerId,
        email: email.trim().toLowerCase(),
        mobile: mobile.trim(),
        avatarUrl: avatarUrl.trim(),
        newPassword: newPassword.trim() || undefined,
      });

      if (res.success) {
        onClose();
      } else {
        showToast(res.error || 'Failed to update settings.', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentPreviewAvatar =
    avatarUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      name || currentUser.name
    )}&background=fef3c7&color=b45309&bold=true&size=128`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div 
        className="w-full max-w-xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden my-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-amber-500/10 via-white to-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-800 flex items-center justify-center font-bold">
              <Settings className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">Partner Settings</h2>
              <p className="text-[11px] text-slate-500">
                Update your name, profile photo, Partner ID, and login password
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informational Banner */}
        <div className="px-5 py-2.5 bg-amber-50/80 border-b border-amber-200/70 text-amber-900 text-[11px] flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            Changes to your name, photo, and Partner ID apply immediately everywhere on the website, including the <strong>Home Page Select Partner shelf</strong> and deal listings!
          </span>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 text-xs max-h-[75vh] overflow-y-auto">
          {/* 1. Partner ID Edit & Display */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-amber-600" />
                <span>Partner ID (Short ID like AP00001)</span>
                <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSuggestShortId}
                  className="text-[11px] font-semibold text-amber-700 hover:text-amber-800 cursor-pointer underline flex items-center gap-1"
                  title="Generate a short AP0000X format ID"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Suggest Short ID</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  {copiedId ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="relative">
              <input
                type="text"
                required
                value={partnerId}
                onChange={(e) => setPartnerId(e.target.value.toUpperCase())}
                placeholder="e.g. AP00001"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono font-bold text-xs uppercase focus:outline-none focus:border-amber-500 shadow-2xs tracking-wider"
              />
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-500 flex-wrap gap-1">
              <span>Clean short ID format: <strong>AP00001</strong>.</span>
              <span className="text-amber-700 font-medium">Use with password to sign in</span>
            </div>
          </div>

          {/* 2. Photo / Avatar Section */}
          <div className="space-y-3">
            <label className="block text-slate-700 font-bold text-xs">
              Partner Profile Image / Avatar
            </label>
            <div className="flex items-center gap-4">
              <div className="relative group shrink-0">
                <img
                  src={currentPreviewAvatar}
                  alt={name}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-amber-400 shadow-sm bg-amber-50"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      name || 'Partner'
                    )}&background=fef3c7&color=b45309&bold=true&size=128`;
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-1.5 rounded-full bg-amber-500 text-slate-950 shadow-md hover:bg-amber-400 cursor-pointer border border-white"
                  title="Upload from Device"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-2 flex-1">
                <input
                  type="url"
                  placeholder="Paste Image URL (https://...)"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white text-xs"
                />

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg text-[11px] border border-slate-200 cursor-pointer transition-colors"
                  >
                    Upload Image
                  </button>
                  <button
                    type="button"
                    onClick={handleGenerateInitialsAvatar}
                    className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 font-medium rounded-lg text-[11px] border border-amber-300 cursor-pointer transition-colors"
                  >
                    Generate Initials
                  </button>
                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={() => setAvatarUrl('')}
                      className="px-2.5 py-1.5 text-slate-400 hover:text-rose-600 text-[11px] cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  className="hidden"
                />
              </div>
            </div>

            {/* Quick Preset Pickers */}
            <div className="pt-1">
              <span className="text-[10px] text-slate-500 font-medium block mb-1.5">
                Or pick from sample avatars:
              </span>
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {avatarPresets.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAvatarUrl(preset)}
                    className={`w-9 h-9 rounded-full overflow-hidden border-2 shrink-0 transition-transform hover:scale-110 cursor-pointer ${
                      avatarUrl === preset
                        ? 'border-amber-500 ring-2 ring-amber-400/50'
                        : 'border-slate-200'
                    }`}
                  >
                    <img src={preset} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 3. Name & Identity */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-slate-700 mb-1 font-bold text-xs">
                Partner / Brand Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Kavita Sharma, Tech Deals Hub"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white text-xs font-medium"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                This name is displayed to all visitors on the homepage "Select Partner" list and deal cards.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 mb-1 font-bold text-xs">
                  Login Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="partner@domain.com"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 mb-1 font-bold text-xs">
                  Mobile / WhatsApp Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 4. Password Change Section */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-slate-700 font-bold text-xs flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-amber-600" />
                <span>Change Password (Optional)</span>
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
              >
                {showPassword ? (
                  <>
                    <EyeOff className="w-3 h-3" />
                    <span>Hide</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3 h-3" />
                    <span>Show</span>
                  </>
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 mb-1 text-[11px] font-medium">New Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Leave blank to keep current"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 text-[11px] font-medium">Confirm New Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white text-xs"
                />
              </div>
            </div>
            {newPassword && (
              <p className="text-[10px] text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
                You will be able to log in with this new password immediately using your email or Partner ID (<strong>{partnerId || currentUser.id}</strong>).
              </p>
            )}
          </div>

          {/* Modal Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:text-slate-900 font-medium rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl transition-colors cursor-pointer shadow-xs flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Save Settings & Apply</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
