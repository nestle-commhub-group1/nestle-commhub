import React, { useState, useEffect } from 'react';
import DistributorLayout from '../../components/layout/DistributorLayout';
import { Package, MapPin, CheckCircle, Clock } from 'lucide-react';
import axios from 'axios';

const PromotionalMaterials = () => {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssignedPromotions();
  }, []);

  const fetchAssignedPromotions = async () => {
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user'));
      
      const res = await axios.get('/api/promotions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const fullPromos = await Promise.all(
        res.data.promotions.map(async (p) => {
           const d = await axios.get(`/api/promotions/${p._id}`, {
             headers: { Authorization: `Bearer ${token}` }
           });
           return d.data.promotion;
        })
      );

      // Filter to only those where this distributor is assigned to at least one retailer
      const assigned = fullPromos.filter(promo => 
        promo.participatingRetailers.some(r => r.assignedDistributor?._id === user._id)
      );

      setPromotions(assigned);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <DistributorLayout>
      <div className="space-y-6 pb-10 max-w-6xl mx-auto px-4">
        <div className="mt-6">
          <h1 className="text-3xl font-extrabold text-[#2C1810]">Promotional Material Deliveries</h1>
          <p className="text-gray-500 mt-1">Assigned marketing materials for upcoming retailer promotions</p>
        </div>

        {loading ? (
          <div className="text-center py-10 font-medium text-gray-500">Loading deliveries...</div>
        ) : promotions.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100 mt-6">
            <Package className="mx-auto text-gray-300 mb-4" size={48} />
            <p className="text-gray-500 font-medium">No promotional materials assigned to you currently.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {promotions.map(promo => {
              const user = JSON.parse(localStorage.getItem('user'));
              const myTasks = promo.participatingRetailers.filter(r => r.assignedDistributor?._id === user._id);
              
              return (
                <div key={promo._id} className="bg-white rounded-[20px] p-6 shadow-sm border border-[#0091DA]/20 border-t-4 border-t-[#0091DA]">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-bold text-[#2C1810] flex-1">{promo.title}</h3>
                    <span className="bg-[#0091DA]/10 text-[#0091DA] px-3 py-1 rounded-full text-xs font-bold uppercase shrink-0 ml-2">
                       {myTasks.length} Deliveries
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{promo.description}</p>
                  
                  <div className="space-y-3">
                     <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Delivery Targets</p>
                     {myTasks.map((task, idx) => (
                       <div key={idx} className="bg-gray-50 rounded-xl p-4 flex items-start border border-gray-100">
                         <MapPin size={18} className="text-[#0091DA] mt-0.5 mr-3 shrink-0" />
                         <div>
                            <p className="font-bold text-gray-800 text-sm">{task.retailerId?.businessName}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{task.retailerId?.fullName} • {task.retailerId?.email}</p>
                         </div>
                       </div>
                     ))}
                  </div>

                  <div className="mt-5 pt-4 border-t border-gray-100">
                    <p className="text-xs text-center text-gray-500 font-medium flex items-center justify-center">
                       <Clock size={14} className="mr-1" />
                       Please deliver before promotion start: {new Date(promo.startDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DistributorLayout>
  );
};

export default PromotionalMaterials;
