import React, { useState, useEffect } from 'react';
import { Tag, Calendar, Percent, CheckCircle, Search, FileText, Star, Download, Package, DollarSign } from 'lucide-react';
// Assuming use of standard context and layout, though not explicit in prompt
import RetailerLayout from '../../components/layout/RetailerLayout';
import PromotionChat from '../../components/PromotionChat';
import axios from 'axios';
import API_URL from '../../config/api';

const PromotionsWall = () => {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [chatPromotionId, setChatPromotionId] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [ratingData, setRatingData] = useState({ id: null, score: 0, feedback: '', unitsSold: '' });
  const [userCredits, setUserCredits] = useState(0);

  useEffect(() => {
    fetchPromotions();
    fetchUserCredits();
  }, []);

  const fetchUserCredits = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/users/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserCredits(res.data.user?.credits || 0);
    } catch (err) {
      console.error('Error fetching credits:', err);
    }
  };

  const fetchPromotions = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/promotions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPromotions(res.data.promotions || []);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Failed to load promotions');
      setLoading(false);
    }
  };

  const handleAskQuestion = (promoId) => {
    setChatPromotionId(promoId);
    setIsChatOpen(true);
  };

  const handleOptIn = async (promoId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/api/promotions/${promoId}/opt-in`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Successfully opted in!');
      setRatingData({ id: promoId, score: 0, feedback: '', unitsSold: '' });
      fetchPromotions(); // Refresh state
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to opt in');
    }
  };

  const handleRate = async (e) => {
    e.preventDefault();
    if (!ratingData.id || ratingData.score === 0) return;
    try {
      const token = localStorage.getItem('token');
      
      // 1. Submit Rating
      await axios.post(`${API_URL}/api/promotions/${ratingData.id}/rate`, {
        rating: ratingData.score,
        feedback: ratingData.feedback
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // 2. Submit Sales if provided
      if (ratingData.unitsSold) {
        await axios.post(`${API_URL}/api/promotions/${ratingData.id}/sales-report`, {
          unitsSold: parseInt(ratingData.unitsSold)
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      alert('Rating and performance submitted successfully!');
      setRatingData({ id: null, score: 0, feedback: '', unitsSold: '' });
      fetchPromotions();
    } catch (err) {
      alert('Error submitting feedback');
    }
  };

  const filtered = promotions.filter(p => p.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <RetailerLayout>
      <div className="space-y-6 pb-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mt-6">
          <div>
            <h1 className="text-3xl font-extrabold text-[#2C1810]">Promotions Wall</h1>
            <p className="text-gray-500 mt-1">Discover and opt-in to available promotions from Nestlé</p>
          </div>
          
          <div className="flex flex-col md:flex-row items-stretch md:items-center space-y-4 md:space-y-0 md:space-x-6 mt-6 md:mt-0 w-full md:w-auto">
             {/* Wallet Balance */}
             <div className="bg-nestle-brown px-6 py-3 rounded-2xl text-white shadow-lg shadow-nestle-brown/20 flex items-center space-x-4 border-b-4 border-[#2C1810]">
                <div className="p-2 bg-white/20 rounded-xl">
                   <DollarSign size={20} />
                </div>
                <div>
                   <p className="text-[9px] font-black uppercase tracking-widest opacity-60 leading-none mb-1">Rewards Wallet</p>
                   <p className="text-xl font-black">{userCredits.toLocaleString()} <span className="text-[10px] opacity-80">CREDITS</span></p>
                </div>
             </div>

             <div className="relative">
                <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Search promotions..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 pr-4 py-3 w-full md:w-64 border border-gray-100 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-nestle-brown/20 shadow-sm font-medium"
                />
             </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-500 font-medium">Loading promotions...</div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
            <Tag className="mx-auto text-gray-300 mb-3" size={48} />
            <p className="text-gray-500 font-medium text-lg">No active promotions available right now.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {filtered.map(promo => {
              const myUserId = JSON.parse(localStorage.getItem('user'))?._id;
              const myRecord = promo.participatingRetailers?.find(
                r => r.retailerId === myUserId || r.retailerId?._id === myUserId
              );
              const isOptedIn = !!myRecord;
              const alreadyRated = !!myRecord?.rating;

              return (
                <div key={promo._id} className="bg-white rounded-[20px] p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full uppercase tracking-wider">
                        {promo.category.replace('_', ' ')}
                      </span>
                      {promo.discount && (
                         <span className="flex items-center text-green-600 font-bold bg-green-50 px-2 py-1 rounded-lg">
                           <Percent size={14} className="mr-1" /> {promo.discount}% OFF
                         </span>
                      )}
                    </div>
                    <h3 className="text-xl font-extrabold text-[#2C1810] mb-2">{promo.title}</h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">{promo.description}</p>
                    
                    <div className="space-y-4 mb-6">
                      <div className="flex items-center text-sm text-gray-500 font-medium">
                        <Calendar size={16} className="mr-2 text-gray-400" />
                        Valid: {new Date(promo.startDate).toLocaleDateString()} - {new Date(promo.endDate).toLocaleDateString()}
                      </div>
                      
                      {promo.attachments && promo.attachments.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Campaign Materials</p>
                          <div className="grid grid-cols-2 gap-2">
                            {promo.attachments.map((file, idx) => {
                              const isImage = file.filename.match(/\.(jpg|jpeg|png|gif|webp)$/i) || (file.url && file.url.startsWith('data:image'));
                              if (isImage) {
                                return (
                                  <div key={idx} className="group relative rounded-xl overflow-hidden border border-gray-100 aspect-video bg-gray-50">
                                    <img src={file.url} alt={file.filename} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                      <a href={file.url} download={file.filename} className="p-2 bg-white rounded-full text-nestle-brown hover:scale-110 transition-transform shadow-lg">
                                        <Download size={14} />
                                      </a>
                                    </div>
                                  </div>
                                );
                              }
                              return (
                                <a 
                                  key={idx} href={file.url} download={file.filename}
                                  className="flex items-center space-x-1.5 px-3 py-2 bg-gray-50 border border-gray-100 rounded-xl text-[11px] font-bold text-gray-500 hover:text-nestle-brown hover:border-nestle-brown/20 transition-all truncate"
                                >
                                  <FileText size={12} className="flex-shrink-0" />
                                  <span className="truncate">{file.filename}</span>
                                </a>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {isOptedIn ? (
                      <div className="space-y-2">
                        <button disabled className="w-full py-3 rounded-xl bg-green-50 border border-green-200 text-green-700 font-bold flex items-center justify-center">
                          <CheckCircle size={18} className="mr-2" />
                          Opted In
                        </button>
                        
                        {alreadyRated ? (
                          <div className="flex flex-col items-center pt-1">
                            <div className="flex justify-center text-yellow-500">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} size={14} fill={i < Math.floor(myRecord.rating/2) ? "currentColor" : "none"} />
                              ))}
                            </div>
                            <p className="text-[10px] text-gray-400 font-black uppercase mt-1">Review Submitted</p>
                          </div>
                        ) : (
                          <button 
                            onClick={() => setRatingData({ id: promo._id, score: 0, feedback: '', unitsSold: '' })}
                            className="w-full py-2.5 rounded-xl bg-[#F8F7F5] text-nestle-brown font-bold text-[13px] hover:bg-nestle-brown/5 transition-colors flex items-center justify-center"
                          >
                            <Star size={14} className="mr-2" />
                            Rate Campaign
                          </button>
                        )}
                      </div>
                    ) : (
                      <button 
                        onClick={() => handleOptIn(promo._id)}
                        className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors shadow-lg shadow-blue-200/50"
                      >
                        Opt In Now
                      </button>
                    )}
                    
                    <button 
                      onClick={() => handleAskQuestion(promo._id)}
                      className="w-full py-2.5 rounded-xl border border-gray-100 text-[#3D2B1F] font-bold text-[13px] hover:bg-gray-50 transition-colors"
                    >
                      Ask a Question
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {chatPromotionId && (
        <PromotionChat 
          promotionId={chatPromotionId} 
          isOpen={isChatOpen} 
          onClose={() => setIsChatOpen(false)} 
        />
      )}

      {/* Rating Modal */}
      {ratingData.id && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#2C1810]/40 backdrop-blur-sm p-4">
           <div className="bg-white rounded-[40px] p-8 w-full max-w-md shadow-2xl">
              <h3 className="text-[24px] font-black text-[#2C1810] mb-2">Campaign Feedback</h3>
              <p className="text-sm text-gray-500 mb-6">How is your experience with this campaign?</p>
              
              <form onSubmit={handleRate} className="space-y-5">
                 <div className="space-y-2">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Daily Sales Performance</label>
                    <div className="relative">
                      <Package size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input 
                        type="number" 
                        placeholder="How many products sold today?"
                        className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-[20px] text-sm font-bold focus:bg-white focus:ring-2 focus:ring-nestle-brown/10 outline-none"
                        value={ratingData.unitsSold}
                        onChange={e => setRatingData({...ratingData, unitsSold: e.target.value})}
                      />
                    </div>
                 </div>

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
                    <button type="button" onClick={() => setRatingData({ id: null, score: 0, feedback: '', unitsSold: '' })} className="flex-1 py-4 rounded-[20px] bg-gray-100 text-gray-600 font-bold text-sm">Dismiss</button>
                    <button type="submit" className="flex-2 bg-nestle-brown text-white py-4 px-8 rounded-[20px] font-black uppercase tracking-widest text-sm shadow-lg shadow-brown-100/50">Submit Review</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </RetailerLayout>
  );
};

export default PromotionsWall;

