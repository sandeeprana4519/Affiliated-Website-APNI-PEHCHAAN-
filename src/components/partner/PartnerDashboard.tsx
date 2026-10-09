import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Product } from '../../types';
import { PartnerSettingsModal } from './PartnerSettingsModal';
import { 
  Plus, 
  Trash2, 
  Edit3,
  Settings
} from 'lucide-react';

export const PartnerDashboard: React.FC = () => {
  const { 
    currentUser, 
    products, 
    deletePartnerProduct, 
    updatePartnerProduct,
    setCurrentView,
    logout
  } = useApp();

  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editPrice, setEditPrice] = useState<string>('');
  const [editTitle, setEditTitle] = useState<string>('');
  const [editAffiliateUrl, setEditAffiliateUrl] = useState<string>('');

  // Partner can see ONLY their own products
  const myProducts = products.filter((p) => p.partnerId === currentUser?.id);

  const handleDelete = (product: Product) => {
    if (window.confirm(`Are you sure you want to delete "${product.title}"?`)) {
      deletePartnerProduct(product.id);
    }
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setEditTitle(product.title);
    setEditPrice(product.price ? String(product.price) : '');
    setEditAffiliateUrl(product.affiliateUrl);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    const res = updatePartnerProduct(editingProduct.id, {
      title: editTitle,
      price: editPrice ? parseFloat(editPrice) : null,
      affiliateUrl: editAffiliateUrl,
    });

    if (res.success) {
      setEditingProduct(null);
    }
  };

  if (!currentUser) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <p className="text-slate-500 text-xs">Please log in to access the partner portal.</p>
        <button
          onClick={() => setCurrentView('partner_login')}
          className="px-4 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl text-xs shadow-xs"
        >
          Go to Partner Login
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3.5 sm:px-4 py-6 sm:py-8 space-y-6 w-full">
      {/* Header (Requirement 9 & 11) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm w-full">
        <div className="flex items-center gap-3.5 min-w-0">
          {currentUser.avatarUrl ? (
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.name}
              className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-300 shadow-xs shrink-0"
            />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 font-extrabold text-xl shadow-xs shrink-0">
              {currentUser.name.charAt(0)}
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">{currentUser.name}</h1>
              <span className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-md border font-semibold ${
                currentUser.status === 'ACTIVE'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-rose-50 border-rose-200 text-rose-700'
              }`}>
                {currentUser.status}
              </span>
              <span className="text-[10px] bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md font-semibold">
                Partner Portal
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Login ID / Email: <strong className="text-slate-800">{currentUser.email}</strong>
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
              <span>Partner ID:</span>
              <span className="font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-[10px] break-all select-all">{currentUser.id}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200 shadow-2xs"
            title="Edit Partner Settings (Name, Photo, ID, Password)"
          >
            <Settings className="w-4 h-4 text-amber-600" />
            <span>Settings</span>
          </button>
          <button
            onClick={() => setCurrentView('partner_add_product')}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Product</span>
          </button>
          <button
            onClick={logout}
            className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-xl transition-colors cursor-pointer border border-slate-200"
          >
            Logout
          </button>
        </div>
      </div>

      {/* My Products Table */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            My Products ({myProducts.length})
          </h2>
          <span className="text-xs text-slate-500 font-medium">
            Statuses: PENDING · APPROVED · REJECTED
          </span>
        </div>

        {myProducts.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <p className="text-sm font-semibold text-slate-800">You haven't submitted any affiliate products yet.</p>
            <p className="text-xs text-slate-500">
              Click "+ Add Product" to publish your first deal from Amazon, Flipkart, or Meesho.
            </p>
            <button
              onClick={() => setCurrentView('partner_add_product')}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl cursor-pointer shadow-xs"
            >
              Add Your First Product
            </button>
          </div>
        ) : (
          <div>
            {/* Mobile Cards View (Visible on screens < 640px) */}
            <div className="sm:hidden divide-y divide-slate-100">
              {myProducts.map((prod) => (
                <div key={prod.id} className="p-4 space-y-3 bg-white">
                  <div className="flex items-start gap-3">
                    <img
                      src={prod.imageUrl}
                      alt={prod.title}
                      className="w-16 h-16 rounded-xl object-cover bg-slate-50 border border-slate-200 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md border border-slate-200 bg-slate-50 text-slate-700 text-[10px] font-bold">
                          {prod.platform}
                        </span>
                        <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md border ${
                          prod.status === 'APPROVED'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            : prod.status === 'PENDING'
                            ? 'bg-amber-50 border-amber-200 text-amber-700'
                            : 'bg-rose-50 border-rose-200 text-rose-700'
                        }`}>
                          {prod.status}
                        </span>
                      </div>
                      <h4 className="font-semibold text-xs text-slate-900 mt-1 line-clamp-2 leading-snug">
                        {prod.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Category: <strong className="text-slate-700">{prod.categoryName}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <div>
                      <span className="text-[11px] text-slate-400">Price: </span>
                      <span className="font-bold text-slate-900 text-sm">
                        {prod.price ? `₹${prod.price.toLocaleString('en-IN')}` : '—'}
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Submitted: {new Date(prod.createdAt).toLocaleDateString()} · {prod.clickCount} clicks
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEdit(prod)}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 border border-slate-200 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(prod)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 border border-slate-200 cursor-pointer"
                        title="Delete Product"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View (Visible on screens >= 640px) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-xs text-left min-w-[700px]">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 whitespace-nowrap">
                  <tr>
                    <th className="p-3">Product</th>
                    <th className="p-3 whitespace-nowrap">Platform</th>
                    <th className="p-3 whitespace-nowrap">Category</th>
                    <th className="p-3 whitespace-nowrap">Price</th>
                    <th className="p-3 whitespace-nowrap">Status</th>
                    <th className="p-3 whitespace-nowrap">Submitted</th>
                    <th className="p-3 whitespace-nowrap text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {myProducts.map((prod) => (
                    <tr key={prod.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3 font-medium text-slate-900 flex items-center gap-3">
                        <img
                          src={prod.imageUrl}
                          alt={prod.title}
                          className="w-10 h-10 rounded-lg object-cover bg-slate-50 border border-slate-200 shrink-0"
                        />
                        <div className="min-w-0 max-w-xs">
                          <span className="font-semibold block truncate text-slate-800">{prod.title}</span>
                          <span className="text-xs text-slate-400 truncate block">
                            ID: {prod.id} · Clicks: {prod.clickCount}
                          </span>
                        </div>
                      </td>

                      <td className="p-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md border border-slate-200 bg-slate-50 text-slate-700 text-xs font-semibold">
                          {prod.platform}
                        </span>
                      </td>

                      <td className="p-3 text-slate-600 font-medium whitespace-nowrap">{prod.categoryName}</td>

                      <td className="p-3 font-bold text-slate-900 whitespace-nowrap">
                        {prod.price ? `₹${prod.price.toLocaleString('en-IN')}` : '—'}
                      </td>

                      <td className="p-3 whitespace-nowrap">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md border ${
                            prod.status === 'APPROVED'
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                              : prod.status === 'PENDING'
                              ? 'bg-amber-50 border-amber-200 text-amber-700'
                              : 'bg-rose-50 border-rose-200 text-rose-700'
                          }`}
                        >
                          {prod.status}
                        </span>
                      </td>

                      <td className="p-3 text-slate-500 text-xs whitespace-nowrap">
                        {new Date(prod.createdAt).toLocaleDateString()}
                      </td>

                      <td className="p-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(prod)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer border border-slate-200/60"
                            title="Edit Product"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(prod)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition-colors cursor-pointer border border-slate-200/60"
                            title="Delete Product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div 
            className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-600" />
                <span>Edit Product (ID: {editingProduct.id})</span>
              </h3>
              <button
                onClick={() => setEditingProduct(null)}
                className="text-slate-400 hover:text-slate-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px]">
              <strong>Notice:</strong> Editing an approved product will automatically reset its status to <strong>PENDING</strong> for administrator verification.
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-600 mb-1 font-medium">Product Title</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">Price (₹)</label>
                <input
                  type="number"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">Affiliate URL</label>
                <input
                  type="url"
                  required
                  value={editAffiliateUrl}
                  onChange={(e) => setEditAffiliateUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-amber-500 focus:bg-white text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl cursor-pointer shadow-xs"
                >
                  Save & Submit for Re-Approval
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Partner Settings Modal */}
      {isSettingsOpen && (
        <PartnerSettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
    </div>
  );
};
