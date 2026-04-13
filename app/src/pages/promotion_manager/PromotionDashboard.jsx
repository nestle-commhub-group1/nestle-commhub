import React, { useState, useEffect } from 'react';
import ManagerLayout from '../../components/layout/ManagerLayout';
import { Users, Truck, Star } from 'lucide-react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const PromotionDashboard = () => {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [distributorId, setDistributorId] = useState('');

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    try {
      const token = localStorage.getItem('token');
      // Managers can see all promotions
      const res = await axios.get('/api/promotions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Further we may need full details for each, but get all active first
      const fullPromos = await Promise.all(
        res.data.promotions.map(async (p) => {
           const d = await axios.get(`/api/promotions/${p._id}`, {
             headers: { Authorization: `Bearer ${token}` }
           });
           return d.data.promotion;
        })
      );
      setPromotions(fullPromos);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleAssignDistributor = async (promoId, retailerId) => {
    if (!distributorId) return alert('Please enter a distributor ID');
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/promotions/${promoId}/assign-distributor`, {
        retailerId,
        distributorId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Distributor assigned!');
      setDistributorId('');
      fetchPromotions();
    } catch (err) {
      alert(err.response?.data?.error || 'Error assigning distributor');
    }
  };

  return (
    <ManagerLayout>
      <div className="space-y-6 pb-10 max-w-6xl mx-auto px-4">
        <div className="flex justify-between items-center mt-6">
          <div>
            <h1 className="text-3xl font-extrabold text-[#2C1810]">Promotions Dashboard</h1>
            <p className="text-gray-500 mt-1">Manage active promotions and assignments</p>
          </div>
          <Link to="/promotion-manager/create" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl transition-colors">
            + New Promotion
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-10">Loading...</div>
        ) : promotions.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100 mt-6">
            <p className="text-gray-500 font-medium tracking-wide">No active promotions.</p>
          </div>
        ) : (
          <div className="space-y-6 mt-6">
            {promotions.map(promo => (
              <div key={promo._id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex justify-between border-b border-gray-100 pb-4 mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-[#2C1810]">{promo.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">Category: {promo.category} | Created by you</p>
                  </div>
                  <div className="text-right">
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold uppercase">{promo.status}</span>
                    <p className="text-sm font-medium mt-2">{promo.participatingRetailers?.length || 0} Opt-ins</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-bold flex items-center text-gray-700"><Users size={16} className="mr-2"/> Participating Retailers</h4>
                  {promo.participatingRetailers?.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">No retailers have opted in yet.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-gray-50 text-gray-500 font-bold uppercase rounded-xl">
                          <tr>
                            <th className="px-4 py-3">Retailer</th>
                            <th className="px-4 py-3">Rating</th>
                            <th className="px-4 py-3">Assigned Distributor</th>
                            <th className="px-4 py-3 text-right">Assign</th>
                          </tr>
                        </thead>
                        <tbody>
                          {promo.participatingRetailers.map(r => (
                            <tr key={r.retailerId?._id} className="border-b border-gray-50">
                              <td className="px-4 py-3 font-medium text-gray-800">
                                {r.retailerId?.fullName} <br/><span className="text-xs text-gray-500">{r.retailerId?.businessName}</span>
                              </td>
                              <td className="px-4 py-3">
                                {r.rating ? (
                                  <div className="flex items-center text-yellow-500 font-bold">
                                    {r.rating}/10 <Star size={14} className="ml-1" fill="currentColor"/>
                                  </div>
                                ) : <span className="text-gray-400">Not rated</span>}
                              </td>
                              <td className="px-4 py-3">
                                {r.assignedDistributor ? (
                                  <span className="flex items-center text-blue-700 font-medium">
                                    <Truck size={14} className="mr-2"/> {r.assignedDistributor.fullName}
                                  </span>
                                ) : <span className="text-gray-400">Unassigned</span>}
                              </td>
                              <td className="px-4 py-3 text-right flex justify-end items-center space-x-2">
                                {!r.assignedDistributor && (
                                  <>
                                    <input 
                                      type="text" placeholder="Distributor ID Object ID" 
                                      className="border rounded px-2 py-1 text-xs w-32"
                                      onChange={e => setDistributorId(e.target.value)}
                                    />
                                    <button 
                                      onClick={() => handleAssignDistributor(promo._id, r.retailerId._id)}
                                      className="bg-gray-800 text-white px-3 py-1 rounded text-xs font-bold hover:bg-gray-700"
                                    >
                                      Assign
                                    </button>
                                  </>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ManagerLayout>
  );
};

export default PromotionDashboard;
