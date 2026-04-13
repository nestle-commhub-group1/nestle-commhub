import React, { useState, useEffect } from 'react';
import { Star, MessageSquare } from 'lucide-react';
import RetailerLayout from '../../components/layout/RetailerLayout';
import axios from 'axios';

const MyPromotions = () => {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ratingData, setRatingData] = useState({ id: null, score: 0, feedback: '' });

  useEffect(() => {
    fetchMyPromotions();
  }, []);

  const fetchMyPromotions = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/promotions/retailer/my-promotions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPromotions(res.data.promotions || []);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleRate = async (e) => {
    e.preventDefault();
    if (!ratingData.id || ratingData.score === 0) return;
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/promotions/${ratingData.id}/rate`, {
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
                    <div className="min-w-[250px] bg-gray-50 p-4 rounded-xl">
                      {myRecord?.rating ? (
                        <div>
                          <p className="font-bold text-gray-700 text-sm mb-1">Your Rating</p>
                          <div className="flex text-yellow-400">
                            {[...Array(10)].map((_, i) => (
                              <Star key={i} size={16} fill={i < myRecord.rating ? "currentColor" : "none"} />
                            ))}
                          </div>
                          {myRecord.feedback && <p className="text-gray-500 text-sm mt-2 flex items-start"><MessageSquare size={14} className="mr-1 mt-0.5" />{myRecord.feedback}</p>}
                        </div>
                      ) : (
                        <div className="text-center">
                          {ratingData.id === promo._id ? (
                            <form onSubmit={handleRate} className="space-y-3">
                              <input 
                                type="number" min="1" max="10" placeholder="Rating (1-10)" required
                                value={ratingData.score || ''}
                                onChange={e => setRatingData({...ratingData, score: Number(e.target.value)})}
                                className="w-full border border-gray-300 rounded p-2 text-sm"
                              />
                              <textarea 
                                placeholder="Feedback (optional)"
                                value={ratingData.feedback}
                                onChange={e => setRatingData({...ratingData, feedback: e.target.value})}
                                className="w-full border border-gray-300 rounded p-2 text-sm h-16"
                              />
                              <div className="flex gap-2">
                                <button type="submit" className="flex-1 bg-blue-600 text-white rounded p-2 text-sm font-bold">Submit</button>
                                <button type="button" onClick={() => setRatingData({ id: null, score: 0, feedback: '' })} className="flex-1 bg-gray-200 text-gray-800 rounded p-2 text-sm font-bold">Cancel</button>
                              </div>
                            </form>
                          ) : (
                            <button 
                              onClick={() => setRatingData({ id: promo._id, score: 0, feedback: '' })}
                              className="w-full py-2 bg-yellow-400 text-yellow-900 rounded-lg font-bold text-sm"
                            >
                              Rate Promotion
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </RetailerLayout>
  );
};

export default MyPromotions;
