import React, { useState, useEffect } from 'react';
import PromotionManagerLayout from '../../components/layout/PromotionManagerLayout';
import { 
  Package, Users, Clock, Star, 
  TrendingUp, CheckCircle, AlertCircle, ArrowUpRight 
} from 'lucide-react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const PromotionManagerDashboard = () => {
  const [stats, setStats] = useState({
    activePromotions: 0,
    totalOptIns: 0,
    pendingAssignments: 0,
    averageRating: 0
  });
  const [recentOptIns, setRecentOptIns] = useState([]);
  const [topRated, setTopRated] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/promotions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const promos = res.data.promotions || [];
      
      // Fetch full details for each to get opt-ins and ratings
      const fullPromos = await Promise.all(
        promos.map(async (p) => {
          try {
            const d = await axios.get(`/api/promotions/${p._id}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            return d.data.promotion;
          } catch (e) {
            return p;
          }
        })
      );

      // Calculate stats
      const activeCount = fullPromos.filter(p => p.status === 'active').length;
      let optInCount = 0;
      let pendingCount = 0;
      let totalRating = 0;
      let ratingCount = 0;
      let allOptIns = [];

      fullPromos.forEach(p => {
        if (p.participatingRetailers) {
          optInCount += p.participatingRetailers.length;
          p.participatingRetailers.forEach(r => {
            if (!r.assignedDistributor) pendingCount++;
            if (r.rating) {
              totalRating += r.rating;
              ratingCount++;
            }
            allOptIns.push({
              ...r,
              promoTitle: p.title,
              promoId: p._id
            });
          });
        }
      });

      setStats({
        activePromotions: activeCount,
        totalOptIns: optInCount,
        pendingAssignments: pendingCount,
        averageRating: ratingCount > 0 ? (totalRating / ratingCount).toFixed(1) : 0
      });

      // Recent opt-ins (last 5)
      setRecentOptIns(allOptIns.slice(-5).reverse());

      // Top rated (sort by rating)
      const sorted = [...fullPromos].sort((a, b) => {
         const avgA = a.participatingRetailers?.reduce((acc, curr) => acc + (curr.rating || 0), 0) / (a.participatingRetailers?.length || 1);
         const avgB = b.participatingRetailers?.reduce((acc, curr) => acc + (curr.rating || 0), 0) / (b.participatingRetailers?.length || 1);
         return avgB - avgA;
      });
      setTopRated(sorted.slice(0, 3));

      setLoading(false);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      // Fallback with mock data for UI demonstration if needed
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, subtext }) => (
    <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100 flex items-center space-x-5">
      <div className={`p-4 rounded-[20px] ${color}`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-[14px] font-bold text-gray-400 uppercase tracking-wider">{title}</p>
        <h3 className="text-[28px] font-black text-[#2C1810] mt-1">{value}</h3>
        {subtext && <p className="text-[12px] text-gray-500 font-medium mt-1">{subtext}</p>}
      </div>
    </div>
  );

  return (
    <PromotionManagerLayout>
      <div className="space-y-8 pb-12">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-[32px] font-black text-[#2C1810] tracking-tight">Main Dashboard</h1>
            <p className="text-[15px] text-gray-500 font-medium mt-1">Global summary of your promotional campaigns</p>
          </div>
          <Link to="/promotion-manager/create" className="bg-[#3D2B1F] hover:bg-[#2c1f16] text-white font-bold py-3.5 px-6 rounded-[16px] shadow-lg shadow-brown-200/50 transition-all flex items-center space-x-2">
            <PlusCircle size={20} />
            <span>Launch Promotion</span>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Active Campaigns" 
            value={stats.activePromotions} 
            icon={Package} 
            color="bg-nestle-brown/10 text-nestle-brown"
            subtext="Running currently"
          />
          <StatCard 
            title="Total Opt-ins" 
            value={stats.totalOptIns} 
            icon={Users} 
            color="bg-blue-50 text-blue-600"
            subtext="Retailer participations"
          />
          <StatCard 
            title="Pending Actions" 
            value={stats.pendingAssignments} 
            icon={Clock} 
            color="bg-orange-50 text-orange-600"
            subtext="Material assignments"
          />
          <StatCard 
            title="Avg. Rating" 
            value={`${stats.averageRating}/10`} 
            icon={Star} 
            color="bg-yellow-50 text-yellow-600"
            subtext="Promotion feedback"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Opt-ins */}
          <div className="lg:col-span-2 bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-center">
              <h3 className="text-[18px] font-black text-[#2C1810] flex items-center">
                <Clock size={20} className="mr-3 text-nestle-brown" />
                Recent Retailer Opt-ins
              </h3>
              <Link to="/promotion-manager/promotions" className="text-[13px] font-bold text-nestle-brown hover:underline">View All</Link>
            </div>
            <div className="p-2">
              {loading ? (
                <div className="py-20 text-center font-bold text-gray-300">Loading...</div>
              ) : recentOptIns.length === 0 ? (
                <div className="py-20 text-center text-gray-400 font-medium italic">No recent participation activity.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-[11px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/50">
                        <th className="px-6 py-4">Retailer</th>
                        <th className="px-6 py-4">Promotion</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {recentOptIns.map((opt, idx) => (
                        <tr key={idx} className="group hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-5">
                            <div className="flex flex-col">
                              <span className="text-[14px] font-bold text-[#2C1810]">{opt.retailerId?.fullName || 'Unknown Retailer'}</span>
                              <span className="text-[12px] text-gray-500 font-medium">{opt.retailerId?.businessName}</span>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <span className="text-[13px] font-bold text-gray-700">{opt.promoTitle}</span>
                          </td>
                          <td className="px-6 py-5">
                            {opt.assignedDistributor ? (
                              <span className="flex items-center text-green-600 font-black text-[10px] uppercase tracking-wider bg-green-50 px-2 py-1 rounded-full w-max">
                                <CheckCircle size={10} className="mr-1" /> Assigned
                              </span>
                            ) : (
                              <span className="flex items-center text-orange-600 font-black text-[10px] uppercase tracking-wider bg-orange-50 px-2 py-1 rounded-full w-max">
                                <AlertCircle size={10} className="mr-1" /> Pending
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-5 text-right">
                            <Link 
                                to="/promotion-manager/promotions"
                                className="p-2 rounded-full hover:bg-white hover:shadow-md transition-all inline-block group-hover:translate-x-1"
                            >
                              <ArrowUpRight size={18} className="text-nestle-brown" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Top Rated Promotions */}
          <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-50">
              <h3 className="text-[18px] font-black text-[#2C1810] flex items-center">
                <TrendingUp size={20} className="mr-3 text-nestle-brown" />
                Top Performing
              </h3>
            </div>
            <div className="p-6 space-y-6">
              {loading ? (
                <div className="py-20 text-center font-bold text-gray-300">Loading...</div>
              ) : topRated.length === 0 ? (
                <div className="py-10 text-center text-gray-400 font-medium italic">No performance data.</div>
              ) : (
                topRated.map((promo, idx) => {
                  const avgRating = promo.participatingRetailers?.reduce((acc, curr) => acc + (curr.rating || 0), 0) / (promo.participatingRetailers?.length || 1);
                  return (
                    <div key={promo._id} className="flex items-center justify-between p-4 rounded-[20px] bg-gray-50/50 border border-transparent hover:border-gray-100 hover:bg-white hover:shadow-sm transition-all">
                      <div className="flex items-center space-x-4">
                        <div className={`h-10 w-10 flex items-center justify-center rounded-full font-black text-[14px] ${idx === 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'}`}>
                          {idx + 1}
                        </div>
                        <div>
                          <p className="text-[14px] font-black text-[#2C1810] line-clamp-1">{promo.title}</p>
                          <p className="text-[12px] text-gray-500 font-medium">{promo.participatingRetailers?.length || 0} participants</p>
                        </div>
                      </div>
                      <div className="flex items-center text-yellow-600 font-black">
                        <span className="text-[15px]">{avgRating.toFixed(1)}</span>
                        <Star size={14} className="ml-1" fill="currentColor" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div className="px-8 py-5 bg-nestle-brown/5 text-center">
               <p className="text-[12px] font-bold text-nestle-brown uppercase tracking-wider">Performance updated hourly</p>
            </div>
          </div>
        </div>
      </div>
    </PromotionManagerLayout>
  );
};

export default PromotionManagerDashboard;
