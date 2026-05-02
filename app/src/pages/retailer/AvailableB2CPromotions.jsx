/**
 * AvailableB2CPromotions.jsx
 * 
 * Retailers see B2C promotions created by Nestlé.
 * They can activate these in their own digital shelf/store.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, CheckCircle, Zap, Info, Loader2, AlertCircle, 
  ArrowRight, Store, ShoppingBag, Percent
} from 'lucide-react';
import RetailerLayout from '../../components/layout/RetailerLayout';
import API_URL from '../../config/api';

export default function AvailableB2CPromotions() {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activatingId, setActivatingId] = useState(null);

  const token = localStorage.getItem('token');
  const headers = { 
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}` 
  };

  const fetchPromotions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/promotions/b2c`, { headers });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to fetch promotions');
      setPromotions(json.promotions || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPromotions();
  }, [fetchPromotions]);

  const toggleActivation = async (promoId, currentStatus) => {
    setActivatingId(promoId);
    try {
      const res = await fetch(`${API_URL}/api/promotions/${promoId}/activate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ activate: !currentStatus })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to update activation');
      
      // Update local state
      setPromotions(prev => prev.map(p => 
        p._id === promoId ? { ...p, isActiveInMyStore: json.isActiveInMyStore } : p
      ));
    } catch (err) {
      alert(err.message);
    } finally {
      setActivatingId(null);
    }
  };

  return (
    <RetailerLayout>
      <div className="space-y-8 pb-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-[28px] font-black text-[#2C1810] flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-xl">
                <Users className="text-purple-600" size={24} />
              </div>
              <span>Customer Offers (B2C)</span>
            </h1>
            <p className="text-[14px] text-gray-500 mt-1 font-medium max-w-xl">
              Activate official Nestlé promotions in your store to drive customer engagement and increase your sales volume.
            </p>
          </div>
          <div className="flex bg-white p-1 rounded-xl border border-[#E0DBD5] shadow-sm">
             <div className="px-4 py-2 text-center border-r border-[#E0DBD5]">
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Available</p>
               <p className="text-[18px] font-black text-[#2C1810]">{promotions.length}</p>
             </div>
             <div className="px-4 py-2 text-center">
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active</p>
               <p className="text-[18px] font-black text-green-600">
                 {promotions.filter(p => p.isActiveInMyStore).length}
               </p>
             </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <Loader2 className="animate-spin text-[#3D2B1F]" size={40} />
            <p className="text-[15px] font-bold text-gray-500">Loading special offers...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-8 text-center space-y-3">
            <AlertCircle className="mx-auto text-red-500" size={32} />
            <p className="text-red-700 font-bold">{error}</p>
            <button 
              onClick={fetchPromotions}
              className="px-6 py-2 bg-red-100 text-red-700 rounded-lg font-bold text-sm hover:bg-red-200 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : promotions.length === 0 ? (
          <div className="bg-white border border-[#E0DBD5] rounded-[32px] p-20 text-center space-y-6 shadow-sm">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
              <ShoppingBag className="text-gray-300" size={40} />
            </div>
            <div>
              <h3 className="text-[20px] font-black text-[#2C1810]">No Active Offers</h3>
              <p className="text-[14px] text-gray-500 mt-2 max-w-sm mx-auto font-medium">
                There are currently no customer-facing promotions available. Check back soon for new bundles and deals!
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {promotions.map((promo) => (
              <div 
                key={promo._id}
                className={`relative group bg-white border rounded-[28px] overflow-hidden transition-all duration-300 hover:shadow-xl hover:translate-y-[-4px] ${
                  promo.isActiveInMyStore 
                    ? 'border-[#166534] ring-1 ring-[#166534]/10 shadow-md' 
                    : 'border-[#E0DBD5]'
                }`}
              >
                {/* Status Badge */}
                <div className="absolute top-5 right-5 z-10">
                  {promo.isActiveInMyStore ? (
                    <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#166534] text-white rounded-full text-[11px] font-black shadow-lg animate-fade-in">
                      <CheckCircle size={12} />
                      <span>ACTIVE IN STORE</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1.5 px-3 py-1.5 bg-gray-100 text-gray-500 rounded-full text-[11px] font-black border border-gray-200">
                      <span>AVAILABLE</span>
                    </div>
                  )}
                </div>

                <div className="p-8">
                  <div className="flex items-start justify-between mb-4">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 bg-purple-50 text-purple-700 text-[10px] font-black rounded uppercase tracking-widest border border-purple-100">
                          B2C Offer
                        </span>
                        <span className="text-gray-300">•</span>
                        <span className="text-[12px] font-bold text-gray-400">
                          Expires {new Date(promo.endDate).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="text-[22px] font-black text-[#2C1810] leading-tight group-hover:text-[#3D2B1F] transition-colors">
                        {promo.b2cConfig?.displayName || promo.title}
                      </h3>
                    </div>
                  </div>

                  <div className="bg-[#F8F7F5] rounded-2xl p-5 mb-6 border border-[#F0EDE8]">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Promotion Rule</p>
                        <p className="text-[18px] font-black text-[#2C1810]">
                          {promo.b2cConfig?.bundleRules || 'Special Offer'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Customer Price</p>
                        <p className="text-[20px] font-black text-purple-700">
                          {promo.b2cConfig?.customerFacingPrice 
                            ? `₨${promo.b2cConfig.customerFacingPrice.toLocaleString()}`
                            : 'See Details'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="flex items-center space-x-3 p-3 bg-white border border-[#F0EDE8] rounded-xl">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <Percent size={16} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase">Benefit</p>
                        <p className="text-[13px] font-bold text-[#2C1810]">Flash Discount</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 p-3 bg-white border border-[#F0EDE8] rounded-xl">
                      <div className="p-2 bg-amber-50 rounded-lg">
                        <Zap size={16} className="text-amber-600" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase">Growth</p>
                        <p className="text-[13px] font-bold text-[#2C1810]">High Impact</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t border-[#F0EDE8]">
                    <button className="flex items-center space-x-2 text-[13px] font-black text-gray-400 hover:text-[#3D2B1F] transition-colors">
                      <Info size={16} />
                      <span>OFFER DETAILS</span>
                    </button>

                    {promo.b2cConfig?.requiresRetailerApproval === false ? (
                      <div className="flex items-center space-x-2 px-5 py-3 bg-[#166534]/5 text-[#166534] rounded-2xl text-[14px] font-black border border-[#166534]/20">
                        <Store size={18} />
                        <span>AUTO-ACTIVE</span>
                      </div>
                    ) : (
                      <button 
                        onClick={() => toggleActivation(promo._id, promo.isActiveInMyStore)}
                        disabled={activatingId === promo._id}
                        className={`flex items-center space-x-3 px-8 py-3 rounded-2xl text-[14px] font-black transition-all duration-300 transform active:scale-95 shadow-lg hover:shadow-xl ${
                          promo.isActiveInMyStore
                            ? 'bg-white border-2 border-[#166534] text-[#166534] hover:bg-[#F0FDF4]'
                            : 'bg-[#3D2B1F] text-white hover:bg-[#2C1810]'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {activatingId === promo._id ? (
                          <>
                            <Loader2 size={18} className="animate-spin" />
                            <span>PROCESSING...</span>
                          </>
                        ) : promo.isActiveInMyStore ? (
                          <>
                            <CheckCircle size={18} />
                            <span>ACTIVE IN STORE</span>
                          </>
                        ) : (
                          <>
                            <Zap size={18} className="text-amber-400" />
                            <span>ACTIVATE OFFER</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </RetailerLayout>
  );
}
