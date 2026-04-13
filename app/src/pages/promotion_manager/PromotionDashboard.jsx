import React, { useState, useEffect } from 'react';
import ManagerLayout from '../../components/layout/ManagerLayout';
import { Users, Truck, Star, CheckCircle } from 'lucide-react';
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
      <div className="space-y-6 pb-10">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-[26px] font-extrabold text-[#2C1810]">Promotions Dashboard</h1>
            <p className="text-[14px] text-gray-500 font-medium mt-1">Manage active promotions and assignments</p>
          </div>
          <Link to="/promotion-manager/create" className="bg-[#3D2B1F] hover:bg-[#2c1f16] text-white font-bold py-2.5 px-5 rounded-[12px] shadow-sm transition-all focus:ring-2 focus:ring-offset-1 focus:ring-[#3D2B1F]">
            + New Promotion
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-10 font-bold text-gray-400">Loading...</div>
        ) : promotions.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[20px] shadow-sm border border-gray-100 mt-6">
            <p className="text-gray-500 font-medium tracking-wide">No active promotions.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {promotions.map(promo => (
              <div key={promo._id} className="bg-white rounded-[20px] shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-200 bg-[#F8F7F5]/50 flex justify-between items-center">
                  <div>
                    <h3 className="text-[18px] font-extrabold text-[#3D2B1F]">{promo.title}</h3>
                    <p className="text-[13px] font-medium text-gray-500 mt-0.5 tracking-wide">CATEGORY: {promo.category.toUpperCase()} | Created by you</p>
                  </div>
                  <div className="text-right">
                    <span className="bg-green-50 text-green-700 border border-green-200 px-3 py-1 rounded-[8px] text-[11px] font-extrabold tracking-wider uppercase">{promo.status}</span>
                    <p className="text-[13px] font-bold text-gray-600 mt-2">{promo.participatingRetailers?.length || 0} Opt-ins</p>
                  </div>
                </div>

                <div className="p-6">
                  <h4 className="text-[14px] font-bold text-gray-700 mb-4 flex items-center uppercase tracking-wider"><Users size={16} className="mr-2 text-gray-400"/> Participating Retailers</h4>
                  {promo.participatingRetailers?.length === 0 ? (
                    <div className="bg-gray-50 rounded-xl p-6 text-center text-sm font-medium text-gray-400 italic">No retailers have opted in yet.</div>
                  ) : (
                    <div className="overflow-x-auto border border-gray-100 rounded-xl">
                      <table className="w-full text-left text-[14px] whitespace-nowrap">
                        <thead className="bg-[#F8F7F5] text-gray-500 font-bold text-[12px] tracking-wider uppercase">
                          <tr>
                            <th className="px-5 py-3">Retailer</th>
                            <th className="px-5 py-3">Rating</th>
                            <th className="px-5 py-3">Distributor Status</th>
                            <th className="px-5 py-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="font-medium text-[13px]">
                          {promo.participatingRetailers.map(r => (
                            <tr key={r.retailerId?._id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50">
                              <td className="px-5 py-4 text-[#3D2B1F] font-bold">
                                {r.retailerId?.fullName} <br/><span className="text-[12px] text-gray-500 font-medium">{r.retailerId?.businessName}</span>
                              </td>
                              <td className="px-5 py-4">
                                {r.rating ? (
                                  <div className="flex items-center text-yellow-500 font-bold text-[14px]">
                                    {r.rating} <Star size={14} className="ml-1" fill="currentColor"/>
                                    <span className="text-gray-400 font-medium text-xs ml-1">/ 10</span>
                                  </div>
                                ) : <span className="text-gray-400 italic font-medium">No rating</span>}
                              </td>
                              <td className="px-5 py-4">
                                {r.assignedDistributor ? (
                                  <span className="flex items-center text-blue-700 font-bold bg-blue-50 px-3 py-1.5 rounded-lg w-max border border-blue-100">
                                    <Truck size={14} className="mr-2"/> {r.assignedDistributor.fullName}
                                  </span>
                                ) : <span className="text-gray-400 italic font-medium px-2">—</span>}
                              </td>
                              <td className="px-5 py-4 text-right">
                                {!r.assignedDistributor ? (
                                  <div className="flex justify-end items-center space-x-2">
                                    <input 
                                      type="text" placeholder="Assign Distributor ID" 
                                      className="border border-gray-200 outline-none focus:border-[#3D2B1F] rounded-[8px] px-3 py-1.5 text-xs w-[180px] font-medium"
                                      onChange={e => setDistributorId(e.target.value)}
                                    />
                                    <button 
                                      onClick={() => handleAssignDistributor(promo._id, r.retailerId._id)}
                                      className="bg-[#3D2B1F] text-white px-4 py-1.5 rounded-[8px] text-[12px] font-bold hover:bg-[#2c1f16] transition-colors"
                                    >
                                      Assign
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-green-600 font-bold text-[12px] flex justify-end items-center"><CheckCircle size={14} className="mr-1"/> Assigned</span>
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
