import React, { useState, useEffect } from 'react';
import { Tag, Calendar, Percent, CheckCircle, Search } from 'lucide-react';
// Assuming use of standard context and layout, though not explicit in prompt
import RetailerLayout from '../../components/layout/RetailerLayout';
import axios from 'axios';

const PromotionsWall = () => {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/promotions', {
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

  const handleOptIn = async (promoId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/promotions/${promoId}/opt-in`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Successfully opted in!');
      fetchPromotions(); // Refresh state
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to opt in');
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
          <div className="mt-4 md:mt-0 relative w-full md:w-auto">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search promotions..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 w-full md:w-64 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
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
              const isOptedIn = promo.participatingRetailers?.some(
                r => r.retailerId === myUserId || r.retailerId?._id === myUserId
              );

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
                    
                    <div className="space-y-2 mb-6 text-sm text-gray-500 font-medium">
                      <div className="flex items-center">
                        <Calendar size={16} className="mr-2 text-gray-400" />
                        Valid: {new Date(promo.startDate).toLocaleDateString()} - {new Date(promo.endDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  
                  {isOptedIn ? (
                    <button disabled className="w-full py-3 rounded-xl bg-green-50 border border-green-200 text-green-700 font-bold flex items-center justify-center">
                      <CheckCircle size={18} className="mr-2" />
                      Opted In
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleOptIn(promo._id)}
                      className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors"
                    >
                      Opt In Now
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </RetailerLayout>
  );
};

export default PromotionsWall;
