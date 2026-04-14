import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../../config/api';
import { Star, MessageSquare, TrendingUp, DollarSign, Package } from 'lucide-react';
import PromotionChat from '../../components/PromotionChat';
import RetailerLayout from '../../components/layout/RetailerLayout';

const MyPromotions = () => {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ratingData, setRatingData] = useState({ id: null, score: 0, feedback: '' });
  const [unitsSold, setUnitsSold] = useState({});
  const [chatPromotionId, setChatPromotionId] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    fetchMyPromotions();
  }, []);

  const fetchMyPromotions = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/promotions/retailer/my-promotions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPromotions(res.data.promotions || []);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleSubmitSales = async (promotionId) => {
    const units = unitsSold[promotionId];
    if (!units || units < 0) return alert('Please enter valid units');
    
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_URL}/api/promotions/${promotionId}/sales-report`, {
        unitsSold: parseInt(units)
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      alert(`Performance reported! Reward earned: $${res.data.rewardAmount} (${res.data.rewardTier})`);
      fetchMyPromotions();
    } catch (err) {
      alert(err.response?.data?.error || 'Error submitting sales');
    }
  };

  const handleAskQuestion = (promoId) => {
    setChatPromotionId(promoId);
    setIsChatOpen(true);
  };

  const handleRate = async (e) => {
    e.preventDefault();
    if (!ratingData.id || ratingData.score === 0) return;
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/api/promotions/${ratingData.id}/rate`, {
        rating: ratingData.score,
        feedback: ratingData.feedback
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Rating submitted successfully!');
      setRatingData({ id: null, score: 0, feedback: '' });
      fetchMyPromotions();
    } catch (err) {
      alert('Error submitting rating');
    }
  };

  return (
    <RetailerLayout>
      <div className="space-y-6 pb-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mt-6">
          <h1 className="text-3xl font-extrabold text-[#2C1810]">My Promotions</h1>
          <p className="text-gray-500 mt-1">Promotions you have opted into</p>
        </div>

        {loading ? (
          <div className="text-center py-10">Loading...</div>
        ) : promotions.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
            <p className="text-gray-500 font-medium">You haven't opted into any promotions yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {promotions.map(promo => {
              const myUserId = JSON.parse(localStorage.getItem('user'))?._id;
              const myRecord = promo.participatingRetailers.find(
                r => r.retailerId === myUserId || r.retailerId?._id === myUserId
              );
              
              return (
                <div key={promo._id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded">{promo.category}</span>
                        {promo.discount && <span className="text-green-600 font-bold text-sm">{promo.discount}% OFF</span>}
                      </div>
                      <h3 className="text-xl font-bold text-[#2C1810] mt-2">{promo.title}</h3>
                      <p className="text-gray-600 text-sm mt-1">{promo.description}</p>
                    </div>
                    <div className="flex-shrink-0 w-full md:w-[320px] space-y-4">
                      {/* Rewards & Sales Reporting Section */}
                      <div className="bg-[#F8F7F5] p-5 rounded-[24px] border border-gray-100">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-[12px] font-black text-[#2C1810] uppercase tracking-widest flex items-center">
                            <TrendingUp size={14} className="mr-2 text-nestle-brown" /> Sales Performance
                          </h4>
                        </div>
                        
                        {promo.salesData?.find(s => s.retailerId === myUserId || s.retailerId?._id === myUserId) ? (
                          <div className="space-y-3">
                            <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-50 shadow-sm">
                              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-tight">Units Reported</span>
                              <span className="text-[15px] font-black text-[#3D2B1F]">
                                {promo.salesData.find(s => s.retailerId === myUserId || s.retailerId?._id === myUserId).unitsSold}
                              </span>
                            </div>
                            <div className="flex justify-between items-center bg-green-50/50 p-3 rounded-xl border border-green-100">
                              <span className="text-[11px] font-bold text-green-700 uppercase tracking-tight">Reward Earned</span>
                              <span className="text-[15px] font-black text-green-800 flex items-center">
                                <DollarSign size={14} />{promo.salesData.find(s => s.retailerId === myUserId || s.retailerId?._id === myUserId).rewardAmount}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="relative">
                              <Package size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                              <input 
                                type="number" 
                                placeholder="Units sold..."
                                value={unitsSold[promo._id] || ''}
                                onChange={(e) => setUnitsSold({...unitsSold, [promo._id]: e.target.value})}
                                className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-[14px] font-bold focus:ring-2 focus:ring-nestle-brown/10 outline-none"
                              />
                            </div>
                            <button 
                              onClick={() => handleSubmitSales(promo._id)}
                              className="w-full py-3 bg-nestle-brown text-white rounded-xl text-[13px] font-black uppercase tracking-widest hover:bg-[#2c1f16] shadow-sm transition-all"
                            >
                              Report Global Sales
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Feedback & Interaction */}
                      <div className="bg-white p-5 rounded-[24px] border border-gray-100 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-[12px] font-black text-[#2C1810] uppercase tracking-widest flex items-center">
                            <MessageSquare size={14} className="mr-2 text-nestle-brown" /> Support & Feedback
                          </h4>
                        </div>
                        
                        <div className="space-y-3">
                           <button 
                             onClick={() => handleAskQuestion(promo._id)}
                             className="w-full py-3 bg-white border border-nestle-brown text-nestle-brown rounded-xl text-[12px] font-black uppercase tracking-widest hover:bg-nestle-brown/5 transition-all flex items-center justify-center"
                           >
                             Campaign Chat
                           </button>

                           {myRecord?.rating ? (
                             <div className="pt-2 border-t border-gray-50">
                               <div className="flex text-yellow-500 mb-1">
                                 {[...Array(5)].map((_, i) => (
                                   <Star key={i} size={12} fill={i < Math.floor(myRecord.rating/2) ? "currentColor" : "none"} />
                                 ))}
                               </div>
                               <p className="text-[11px] text-gray-500 italic font-medium">"{myRecord.feedback || 'Excellent promotion!'}"</p>
                             </div>
                           ) : (
                             <button 
                               onClick={() => setRatingData({ id: promo._id, score: 0, feedback: '' })}
                               className="w-full py-3 bg-[#F8F7F5] text-[#3D2B1F] rounded-xl text-[12px] font-black uppercase tracking-widest hover:bg-[#efede9] transition-all"
                             >
                               Rate Campaign
                             </button>
                           )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Chat Layer */}
      {chatPromotionId && (
        <PromotionChat 
          promotionId={chatPromotionId} 
          isOpen={isChatOpen} 
          onClose={() => setIsChatOpen(false)} 
        />
      )}

      {/* Rating Modal (Existing but enhanced) */}
      {ratingData.id && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#2C1810]/40 backdrop-blur-sm p-4">
           <div className="bg-white rounded-[40px] p-8 w-full max-w-md shadow-2xl">
              <h3 className="text-[24px] font-black text-[#2C1810] mb-2">Campaign Feedback</h3>
              <p className="text-sm text-gray-500 mb-6">How was the summer essentials campaign experience?</p>
              
              <form onSubmit={handleRate} className="space-y-5">
                 <div className="space-y-2">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Overall Rating (1-10)</label>
                    <input 
                      type="range" min="1" max="10" step="1"
                      className="w-full accent-nestle-brown h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer"
                      value={ratingData.score || 5}
                      onChange={e => setRatingData({...ratingData, score: Number(e.target.value)})}
                    />
                    <div className="flex justify-between text-[14px] font-black text-[#3D2B1F]">
                      <span>1</span> <span className="text-nestle-brown bg-nestle-brown/5 px-3 py-1 rounded-full">{ratingData.score || 5}/10</span> <span>10</span>
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Details & Impact</label>
                    <textarea 
                      placeholder="Help us improve our next launch..."
                      className="w-full bg-gray-50 border border-gray-100 rounded-[20px] p-4 text-sm font-bold focus:bg-white focus:ring-2 focus:ring-nestle-brown/10 outline-none h-24 resize-none"
                      value={ratingData.feedback}
                      onChange={e => setRatingData({...ratingData, feedback: e.target.value})}
                    />
                 </div>

                 <div className="flex space-x-3 pt-2">
                    <button type="button" onClick={() => setRatingData({ id: null, score: 0, feedback: '' })} className="flex-1 py-4 rounded-[20px] bg-gray-100 text-gray-600 font-bold text-sm">Dismiss</button>
                    <button type="submit" className="flex-2 bg-nestle-brown text-white py-4 px-8 rounded-[20px] font-black uppercase tracking-widest text-sm shadow-lg shadow-brown-100/50">Submit Review</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </RetailerLayout>
  );
};

export default MyPromotions;
