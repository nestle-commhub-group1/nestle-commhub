import React, { useState, useEffect, useCallback } from 'react';
import { 
  Tag, Calendar, Percent, CheckCircle, Search, FileText, Star, 
  Download, Package, DollarSign, Sparkles, Users, Loader2, 
  AlertCircle, Zap, RefreshCw, Bell, Info, Store, ShoppingBag
} from 'lucide-react';
import axios from 'axios';
import API_URL from '../../config/api';
import RetailerLayout from '../../components/layout/RetailerLayout';
import PromotionChat from '../../components/PromotionChat';
import RetailerPromotionCard from '../../components/RetailerPromotionCard';

const Promotions = () => {
  const [activeTab, setActiveTab] = useState('wall'); // 'wall', 'smart', 'customer'
  
  // Shared Auth
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  // 1. Promotions Wall (B2B) State
  const [wallPromos, setWallPromos] = useState([]);
  const [wallLoading, setWallLoading] = useState(true);
  const [wallSearch, setWallSearch] = useState('');
  const [chatPromotionId, setChatPromotionId] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [ratingData, setRatingData] = useState({ id: null, score: 0, feedback: '', unitsSold: '' });
  const [userCredits, setUserCredits] = useState(0);

  // 2. Smart Promotions State
  const [favorites, setFavorites] = useState([]);
  const [similar, setSimilar] = useState([]);
  const [favLoading, setFavLoading] = useState(true);
  const [simLoading, setSimLoading] = useState(true);
  const [toggleBusy, setToggleBusy] = useState({});
  const [toast, setToast] = useState('');

  // 3. Customer Offers (B2C) State
  const [b2cPromos, setB2CPromos] = useState([]);
  const [b2cLoading, setB2CLoading] = useState(true);
  const [activatingId, setActivatingId] = useState(null);

  /* ─── Data Fetching ─────────────────────────────────────────────────────── */

  const fetchWallData = async () => {
    setWallLoading(true);
    try {
      const [promoRes, profileRes] = await Promise.all([
        axios.get(`${API_URL}/api/promotions`, { headers }),
        axios.get(`${API_URL}/api/users/profile`, { headers })
      ]);
      setWallPromos(promoRes.data.promotions || []);
      setUserCredits(profileRes.data.user?.credits || 0);
    } catch (err) {
      console.error('Wall fetch failed', err);
    } finally {
      setWallLoading(false);
    }
  };

  const fetchSmartData = useCallback(async () => {
    setFavLoading(true);
    setSimLoading(true);
    try {
      const [favRes, simRes] = await Promise.all([
        axios.get(`${API_URL}/api/retailer-promo-intel/favorites`, { headers }),
        axios.get(`${API_URL}/api/retailer-promo-intel/similar`, { headers })
      ]);
      setFavorites(favRes.data.data || []);
      setSimilar(simRes.data.data || []);
    } catch (err) {
      console.error('Smart fetch failed', err);
    } finally {
      setFavLoading(false);
      setSimLoading(false);
    }
  }, []);

  const fetchB2CData = useCallback(async () => {
    setB2CLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/promotions/b2c`, { headers });
      setB2CPromos(res.data.promotions || []);
    } catch (err) {
      console.error('B2C fetch failed', err);
    } finally {
      setB2CLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'wall') fetchWallData();
    if (activeTab === 'smart') fetchSmartData();
    if (activeTab === 'customer') fetchB2CData();
  }, [activeTab, fetchSmartData, fetchB2CData]);

  /* ─── Action Handlers ─────────────────────────────────────────────────────── */

  const handleOptIn = async (promoId) => {
    try {
      await axios.post(`${API_URL}/api/promotions/${promoId}/opt-in`, {}, { headers });
      setToast('✅ Successfully opted in!');
      fetchWallData();
    } catch (err) {
      setToast('❌ ' + (err.response?.data?.error || 'Failed to opt in'));
    }
  };

  const handleRateSubmit = async (e) => {
    e.preventDefault();
    if (!ratingData.id || ratingData.score === 0) return;
    try {
      await axios.post(`${API_URL}/api/promotions/${ratingData.id}/rate`, {
        rating: ratingData.score,
        feedback: ratingData.feedback
      }, { headers });

      if (ratingData.unitsSold) {
        await axios.post(`${API_URL}/api/promotions/${ratingData.id}/sales-report`, {
          unitsSold: parseInt(ratingData.unitsSold)
        }, { headers });
      }

      setToast('✅ Review submitted successfully!');
      setRatingData({ id: null, score: 0, feedback: '', unitsSold: '' });
      fetchWallData();
    } catch (err) {
      setToast('❌ Error submitting feedback');
    }
  };

  const toggleB2CActivation = async (promoId, currentStatus) => {
    setActivatingId(promoId);
    try {
      const res = await axios.post(`${API_URL}/api/promotions/${promoId}/activate`, 
        { activate: !currentStatus }, 
        { headers }
      );
      setB2CPromos(prev => prev.map(p => 
        p._id === promoId ? { ...p, isActiveInMyStore: res.data.isActiveInMyStore } : p
      ));
      setToast(res.data.isActiveInMyStore ? '✅ Offer Activated!' : '🔕 Offer Deactivated');
    } catch (err) {
      setToast('❌ Failed to update activation');
    } finally {
      setActivatingId(null);
    }
  };

  const handleToggleNotify = async (promotionId, enabled) => {
    setToggleBusy(prev => ({ ...prev, [promotionId]: true }));
    try {
      const res = await axios.post(
        `${API_URL}/api/retailer-promo-intel/${promotionId}/notify-toggle`,
        { enabled },
        { headers }
      );
      if (res.data.success) {
        setFavorites(prev => prev.map(p => 
          p.promotionId?.toString() === promotionId?.toString() ? { ...p, notifyOnRerun: enabled } : p
        ));
        setToast(enabled ? '🔔 Notifications enabled' : '🔕 Notifications disabled');
      }
    } catch {
      setToast('❌ Error updating preference');
    } finally {
      setToggleBusy(prev => ({ ...prev, [promotionId]: false }));
    }
  };

  /* ────────────────────────────────────────────────────────────────────────── */

  const filteredWall = wallPromos.filter(p => p.title.toLowerCase().includes(wallSearch.toLowerCase()));

  return (
    <RetailerLayout>
      {/* Unified Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#2C1810] text-white px-5 py-3 rounded-[14px] shadow-xl text-[13px] font-bold animate-fade-in whitespace-nowrap border border-white/10">
          {toast}
        </div>
      )}

      <div className="space-y-6 pb-12">
        
        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center pt-2">
          <div>
            <h1 className="text-[28px] font-black text-[#2C1810] tracking-tight">Promotions Hub</h1>
            <p className="text-[13px] text-gray-500 font-medium mt-1">
              {activeTab === 'wall' && "Direct bulk offers from Nestlé to grow your inventory"}
              {activeTab === 'smart' && "Personalised recommendations based on your store's success"}
              {activeTab === 'customer' && "Official activations for your digital storefront"}
            </p>
          </div>

          <div className="mt-4 md:mt-0 flex items-center space-x-3">
             {/* Wallet Small Widget */}
             {activeTab === 'wall' && (
               <div className="bg-white px-4 py-2 rounded-2xl border border-[#E0DBD5] flex items-center space-x-3 shadow-sm">
                 <div className="p-1.5 bg-amber-50 rounded-lg">
                   <DollarSign size={16} className="text-amber-600" />
                 </div>
                 <div>
                   <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Points</p>
                   <p className="text-[15px] font-black text-[#2C1810]">{userCredits.toLocaleString()}</p>
                 </div>
               </div>
             )}
             <button 
              onClick={() => {
                if (activeTab === 'wall') fetchWallData();
                if (activeTab === 'smart') fetchSmartData();
                if (activeTab === 'customer') fetchB2CData();
              }}
              className="p-2.5 bg-white border border-[#E0DBD5] rounded-xl hover:bg-gray-50 transition-colors text-gray-500"
             >
               <RefreshCw size={18} className={(wallLoading || favLoading || b2cLoading) ? 'animate-spin' : ''} />
             </button>
          </div>
        </div>

        {/* Custom Tab Navigation */}
        <div className="flex p-1 bg-white border border-[#E0DBD5] rounded-[20px] shadow-sm overflow-x-auto no-scrollbar">
          {[
            { id: 'wall', label: 'Bulk Offers', icon: <Tag size={16} />, color: 'blue' },
            { id: 'smart', label: 'Smart Picks', icon: <Sparkles size={16} />, color: 'amber' },
            { id: 'customer', label: 'Customer Deals', icon: <Users size={16} />, color: 'purple' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-6 rounded-[16px] text-[13px] font-black transition-all duration-300 whitespace-nowrap ${
                activeTab === tab.id 
                  ? `bg-[#3D2B1F] text-white shadow-md` 
                  : `text-gray-400 hover:text-[#3D2B1F] hover:bg-gray-50`
              }`}
            >
              {tab.icon}
              <span className="uppercase tracking-widest">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ── Tab Content: Promotions Wall ── */}
        {activeTab === 'wall' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Search bulk offers..." 
                value={wallSearch}
                onChange={(e) => setWallSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-white border border-[#E0DBD5] rounded-2xl focus:ring-2 focus:ring-[#3D2B1F]/5 outline-none font-bold text-[14px]"
              />
            </div>

            {wallLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400 space-y-3">
                <Loader2 size={32} className="animate-spin" />
                <p className="text-[13px] font-bold">Fetching campaigns...</p>
              </div>
            ) : filteredWall.length === 0 ? (
              <div className="bg-white border border-dashed border-[#E0DBD5] rounded-[32px] py-20 text-center">
                <p className="text-4xl mb-4">🏷️</p>
                <p className="text-[16px] font-black text-gray-400">No campaigns found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredWall.map(promo => {
                  const _stored = JSON.parse(localStorage.getItem('user'));
                  const myUserId = _stored?.id || _stored?._id;
                  const myRecord = promo.participatingRetailers?.find(r => {
                    const rid = r.retailerId?._id || r.retailerId;
                    return rid?.toString() === myUserId?.toString();
                  });
                  const isOptedIn = !!myRecord;
                  const alreadyRated = !!myRecord?.rating;
                  const isCompleted = new Date(promo.endDate) < new Date();

                  return (
                    <div key={promo._id} className="bg-white rounded-[28px] p-6 shadow-sm border border-[#E0DBD5] hover:shadow-xl transition-all duration-300 flex flex-col justify-between group">
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <span className="px-3 py-1 bg-blue-50 text-blue-700 text-[10px] font-black rounded-full uppercase tracking-widest border border-blue-100">
                            {promo.category?.replace('_', ' ') || 'PROMO'}
                          </span>
                          {promo.discount && (
                             <span className="flex items-center text-green-600 font-black bg-green-50 px-2.5 py-1 rounded-xl border border-green-100 text-[11px]">
                               <Percent size={12} className="mr-1" /> {promo.discount}% OFF
                             </span>
                          )}
                        </div>
                        <h3 className="text-[19px] font-black text-[#2C1810] mb-2 leading-tight">{promo.title}</h3>
                        <p className="text-gray-500 text-[13px] mb-6 line-clamp-2 font-medium leading-relaxed">{promo.description}</p>
                        
                        <div className="flex items-center text-[12px] text-gray-400 font-bold mb-6">
                          <Calendar size={14} className="mr-2 opacity-60" />
                          <span>Ends {new Date(promo.endDate).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        {isOptedIn ? (
                          <div className="space-y-2">
                            <button disabled className="w-full py-3 rounded-2xl bg-green-50 border border-green-200 text-green-700 font-black text-[13px] flex items-center justify-center">
                              <CheckCircle size={16} className="mr-2" />
                              <span>OPTED IN</span>
                            </button>
                            
                            {alreadyRated ? (
                              <div className="flex flex-col items-center pt-1">
                                <div className="flex justify-center text-amber-400">
                                  {[...Array(5)].map((_, i) => (
                                    <Star key={i} size={14} fill={i < Math.floor(myRecord.rating/2) ? "currentColor" : "none"} />
                                  ))}
                                </div>
                                <p className="text-[9px] text-gray-400 font-black uppercase mt-1 tracking-widest">Feedback Sent</p>
                              </div>
                            ) : (
                              <button 
                                onClick={() => setRatingData({ id: promo._id, score: 0, feedback: '', unitsSold: '' })}
                                className={`w-full py-3 rounded-2xl font-black text-[13px] transition-all flex items-center justify-center shadow-sm ${
                                  isCompleted 
                                    ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-amber-200' 
                                    : 'bg-[#F8F7F5] text-[#3D2B1F] hover:bg-[#F0EDE8]'
                                }`}
                              >
                                <Star size={14} className="mr-2" />
                                <span>{isCompleted ? 'FINAL REVIEW' : 'GIVE FEEDBACK'}</span>
                              </button>
                            )}
                          </div>
                        ) : (
                          <button 
                            disabled={isCompleted}
                            onClick={() => handleOptIn(promo._id)}
                            className={`w-full py-3.5 rounded-2xl font-black transition-all shadow-md active:scale-95 text-[14px] ${
                              isCompleted 
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none' 
                                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200'
                            }`}
                          >
                            {isCompleted ? 'CAMPAIGN ENDED' : 'OPT IN NOW'}
                          </button>
                        )}
                        
                        <button 
                          onClick={() => { setChatPromotionId(promo._id); setIsChatOpen(true); }}
                          className="w-full py-3 rounded-2xl border border-[#E0DBD5] text-[#3D2B1F] font-black text-[13px] hover:bg-gray-50 transition-colors"
                        >
                          ASK QUESTION
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Tab Content: Smart Picks ── */}
        {activeTab === 'smart' && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
             <section>
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-sm border border-amber-100">
                    <Bell size={20} />
                  </div>
                  <div>
                    <h2 className="text-[17px] font-black text-[#2C1810] uppercase tracking-wider">Past Favourites</h2>
                    <p className="text-[12px] text-gray-400 font-medium">Get notified when your top-rated campaigns return</p>
                  </div>
                </div>

                {favLoading ? (
                  <div className="flex justify-center py-20"><Loader2 className="animate-spin text-amber-500" /></div>
                ) : favorites.length === 0 ? (
                  <div className="bg-white rounded-[32px] border border-dashed border-[#E0DBD5] py-20 text-center">
                    <p className="text-4xl mb-4">⭐</p>
                    <p className="text-[15px] font-black text-gray-400">Your high-rated campaigns will appear here</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {favorites.map(promo => (
                      <RetailerPromotionCard
                        key={promo.promotionId}
                        promo={promo}
                        variant="favorite"
                        busy={!!toggleBusy[promo.promotionId]}
                        onToggleNotify={handleToggleNotify}
                      />
                    ))}
                  </div>
                )}
             </section>

             <section>
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm border border-blue-100">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h2 className="text-[17px] font-black text-[#2C1810] uppercase tracking-wider">Similar To Favourites</h2>
                    <p className="text-[12px] text-gray-400 font-medium">Active offers matched to your successful history</p>
                  </div>
                </div>

                {simLoading ? (
                  <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" /></div>
                ) : similar.length === 0 ? (
                  <div className="bg-white rounded-[32px] border border-dashed border-[#E0DBD5] py-20 text-center">
                    <p className="text-4xl mb-4">🎁</p>
                    <p className="text-[15px] font-black text-gray-400">No matches found right now</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {similar.map(promo => (
                      <RetailerPromotionCard
                        key={promo._id}
                        promo={promo}
                        variant="similar"
                        onOptIn={() => setActiveTab('wall')}
                      />
                    ))}
                  </div>
                )}
             </section>
          </div>
        )}

        {/* ── Tab Content: Customer Deals ── */}
        {activeTab === 'customer' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {b2cLoading ? (
              <div className="flex flex-col items-center justify-center py-24 space-y-4">
                <Loader2 className="animate-spin text-[#3D2B1F]" size={40} />
                <p className="text-[15px] font-bold text-gray-500 tracking-tight">Syncing store offers...</p>
              </div>
            ) : b2cPromos.length === 0 ? (
              <div className="bg-white border border-[#E0DBD5] rounded-[40px] p-24 text-center space-y-6 shadow-sm">
                <div className="w-20 h-20 bg-gray-50 rounded-[24px] flex items-center justify-center mx-auto border border-gray-100">
                  <ShoppingBag className="text-gray-300" size={40} />
                </div>
                <div>
                  <h3 className="text-[20px] font-black text-[#2C1810]">No Active Customer Offers</h3>
                  <p className="text-[14px] text-gray-400 mt-2 max-w-sm mx-auto font-medium leading-relaxed">
                    Official Nestlé B2C promotions will appear here when available.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {b2cPromos.map((promo) => (
                  <div 
                    key={promo._id}
                    className={`relative group bg-white border rounded-[36px] overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 ${
                      promo.isActiveInMyStore 
                        ? 'border-green-600 ring-4 ring-green-50 shadow-xl' 
                        : 'border-[#E0DBD5]'
                    }`}
                  >
                    <div className="p-8 lg:p-10">
                      <div className="flex justify-between items-start mb-6">
                         <div className="space-y-1.5">
                            <div className="flex items-center space-x-2">
                               <span className="px-2.5 py-1 bg-purple-50 text-purple-700 text-[10px] font-black rounded-lg uppercase tracking-[0.15em] border border-purple-100 shadow-sm">B2C DEAL</span>
                               {promo.isActiveInMyStore && <span className="px-2.5 py-1 bg-green-500 text-white text-[10px] font-black rounded-lg uppercase tracking-[0.15em] shadow-md animate-pulse">ACTIVE</span>}
                            </div>
                            <h3 className="text-[24px] font-black text-[#2C1810] leading-tight tracking-tight mt-2">{promo.b2cConfig?.displayName || promo.title}</h3>
                         </div>
                         <div className="w-14 h-14 bg-[#F8F7F5] rounded-2xl flex items-center justify-center border border-[#E0DBD5] shadow-inner">
                            <Users className="text-purple-600" size={24} />
                         </div>
                      </div>

                      <div className="bg-[#3D2B1F] text-white rounded-[24px] p-6 mb-8 shadow-inner relative overflow-hidden group-hover:bg-[#2C1810] transition-colors duration-500">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
                        <div className="flex items-center justify-between relative z-10">
                          <div className="space-y-1">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest opacity-60">Bundle Rules</p>
                            <p className="text-[20px] font-black">{promo.b2cConfig?.bundleRules || 'Flash Sale'}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest opacity-60">Store Price</p>
                            <p className="text-[24px] font-black text-amber-400">
                              ₨{promo.b2cConfig?.customerFacingPrice?.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-6 border-t border-[#F0EDE8]">
                        <div className="flex items-center space-x-2 text-[12px] font-black text-gray-400 uppercase tracking-widest">
                           <Info size={16} />
                           <span>Offer ends {new Date(promo.endDate).toLocaleDateString()}</span>
                        </div>

                        <button 
                          onClick={() => toggleB2CActivation(promo._id, promo.isActiveInMyStore)}
                          disabled={activatingId === promo._id}
                          className={`flex items-center justify-center space-x-3 px-10 py-4 rounded-2xl text-[14px] font-black transition-all duration-300 transform active:scale-95 shadow-lg ${
                            promo.isActiveInMyStore
                              ? 'bg-white border-2 border-green-600 text-green-600 hover:bg-green-50 shadow-green-100'
                              : 'bg-[#3D2B1F] text-white hover:bg-[#2C1810] shadow-gray-200'
                          } disabled:opacity-50`}
                        >
                          {activatingId === promo._id ? <Loader2 size={18} className="animate-spin" /> : (promo.isActiveInMyStore ? <CheckCircle size={18}/> : <Zap size={18}/>)}
                          <span>{promo.isActiveInMyStore ? 'DEACTIVATE' : 'ACTIVATE IN STORE'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Support Chat Overlay */}
        {chatPromotionId && (
          <PromotionChat 
            promotionId={chatPromotionId} 
            isOpen={isChatOpen} 
            onClose={() => setIsChatOpen(false)} 
          />
        )}

        {/* Feedback Modal */}
        {ratingData.id && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#2C1810]/60 backdrop-blur-md p-4">
            <div className="bg-white rounded-[48px] p-10 w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-300">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-[28px] font-black text-[#2C1810] tracking-tight leading-none mb-2">Campaign Impact</h3>
                    <p className="text-[14px] text-gray-500 font-medium tracking-tight">How did this promotion perform for your store?</p>
                  </div>
                  <button onClick={() => setRatingData({ id: null, score: 0, feedback: '', unitsSold: '' })} className="p-2 hover:bg-gray-100 rounded-full text-gray-400">
                    <RefreshCw size={24} className="rotate-45" />
                  </button>
                </div>
                
                <form onSubmit={handleRateSubmit} className="space-y-6">
                  <div className="space-y-2.5">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Total Units Sold (to date)</label>
                    <div className="relative">
                      <Package size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input 
                        type="number" required
                        placeholder="e.g. 250"
                        className="w-full pl-12 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-[24px] text-[15px] font-black focus:bg-white focus:ring-4 focus:ring-[#3D2B1F]/5 outline-none transition-all"
                        value={ratingData.unitsSold}
                        onChange={e => setRatingData({...ratingData, unitsSold: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Your Recommendation Score</label>
                    <div className="bg-[#F8F7F5] p-6 rounded-[24px] border border-[#F0EDE8]">
                      <input 
                        type="range" min="1" max="10" step="1"
                        className="w-full accent-[#3D2B1F] h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        value={ratingData.score || 5}
                        onChange={e => setRatingData({...ratingData, score: Number(e.target.value)})}
                      />
                      <div className="flex justify-between mt-3 text-[14px] font-black text-[#3D2B1F]">
                        <span className="opacity-40">1</span> 
                        <span className="bg-[#3D2B1F] text-white px-5 py-1 rounded-full text-[12px] shadow-lg">{ratingData.score || 5} / 10</span> 
                        <span className="opacity-40">10</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Private Comments</label>
                    <textarea 
                      placeholder="Share your thoughts on pricing, demand, or logistics..."
                      className="w-full bg-gray-50 border border-gray-100 rounded-[24px] p-6 text-[14px] font-bold focus:bg-white focus:ring-4 focus:ring-[#3D2B1F]/5 outline-none h-28 resize-none transition-all"
                      value={ratingData.feedback}
                      onChange={e => setRatingData({...ratingData, feedback: e.target.value})}
                    />
                  </div>

                  <div className="flex space-x-4 pt-4">
                    <button type="button" onClick={() => setRatingData({ id: null, score: 0, feedback: '', unitsSold: '' })} className="flex-1 py-4.5 rounded-[24px] bg-gray-100 text-gray-600 font-black text-[14px] hover:bg-gray-200 transition-colors">DISMISS</button>
                    <button type="submit" className="flex-[2] bg-[#3D2B1F] text-white py-4.5 px-10 rounded-[24px] font-black uppercase tracking-[0.2em] text-[14px] shadow-xl shadow-[#3D2B1F]/20 hover:bg-[#2C1810] transition-all transform active:scale-95">SUBMIT IMPACT</button>
                  </div>
                </form>
            </div>
          </div>
        )}
      </div>
    </RetailerLayout>
  );
};

export default Promotions;
