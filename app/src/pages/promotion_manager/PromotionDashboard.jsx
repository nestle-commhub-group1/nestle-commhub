import PromotionManagerLayout from '../../components/layout/PromotionManagerLayout';
import { Users, Truck, Star, CheckCircle, Search, Filter } from 'lucide-react';
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
    <PromotionManagerLayout>
      <div className="space-y-8 pb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-[28px] font-black text-[#2C1810]">Promotions Dashboard</h1>
            <p className="text-[14px] text-gray-500 font-medium mt-1">Manage active campaigns, view opt-ins, and assign materials.</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Search promotions..." 
                className="pl-10 pr-4 py-2 bg-white border border-gray-100 rounded-[12px] text-sm focus:outline-none focus:ring-2 focus:ring-nestle-brown/20 w-full md:w-[240px]"
              />
            </div>
            <button className="p-2 bg-white border border-gray-100 rounded-[12px] text-gray-500 hover:text-nestle-brown transition-colors">
              <Filter size={20} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-nestle-brown mx-auto"></div>
            <p className="mt-4 font-bold text-gray-400">Fetching promotions...</p>
          </div>
        ) : promotions.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[32px] shadow-sm border border-gray-100 mt-6">
            <Package size={48} className="mx-auto text-gray-200 mb-4" />
            <p className="text-gray-500 font-bold tracking-wide">No active promotions found.</p>
            <Link to="/promotion-manager/create" className="text-nestle-brown font-bold mt-2 inline-block hover:underline">Create your first promotion</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8">
            {promotions.map(promo => (
              <div key={promo._id} className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden group hover:shadow-md transition-all">
                <div className="px-8 py-6 border-b border-gray-50 bg-gray-50/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    <div className="h-14 w-14 bg-white rounded-[20px] shadow-sm border border-gray-100 flex items-center justify-center text-nestle-brown">
                      <Package size={28} />
                    </div>
                    <div>
                      <h3 className="text-[20px] font-black text-[#3D2B1F] group-hover:text-nestle-brown transition-colors">{promo.title}</h3>
                      <div className="flex items-center space-x-3 mt-1">
                        <span className="bg-[#3D2B1F] text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">{promo.category}</span>
                        <span className="text-[12px] font-bold text-gray-400 uppercase tracking-widest">ID: {promo._id.slice(-6)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6 self-end md:self-center">
                    <div className="text-center">
                      <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Opt-ins</p>
                      <p className="text-[18px] font-black text-[#3D2B1F]">{promo.participatingRetailers?.length || 0}</p>
                    </div>
                    <div className={`px-4 py-1.5 rounded-full border text-[11px] font-black uppercase tracking-widest ${
                      promo.status === 'active' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-gray-50 text-gray-500 border-gray-100'
                    }`}>
                      {promo.status}
                    </div>
                  </div>
                </div>

                <div className="p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-[14px] font-black text-[#2C1810] flex items-center uppercase tracking-widest">
                      <Users size={18} className="mr-2.5 text-nestle-brown"/> Participating Retailers
                    </h4>
                  </div>
                  
                  {promo.participatingRetailers?.length === 0 ? (
                    <div className="bg-gray-50/50 rounded-[24px] p-10 text-center border-2 border-dashed border-gray-100">
                      <p className="text-sm font-bold text-gray-400 italic">No retailers have opted in to this campaign yet.</p>
                      <button className="mt-4 text-[12px] font-black text-nestle-brown uppercase tracking-widest hover:underline">Copy Invite Link</button>
                    </div>
                  ) : (
                    <div className="overflow-hidden border border-gray-50 rounded-[24px]">
                      <table className="w-full text-left text-[14px]">
                        <thead>
                          <tr className="bg-gray-50/50 text-gray-400 font-black text-[11px] tracking-widest uppercase">
                            <th className="px-6 py-4">Retailer Information</th>
                            <th className="px-6 py-4">Campaign Feedback</th>
                            <th className="px-6 py-4">Distributor Assignment</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {promo.participatingRetailers.map(r => (
                            <tr key={r.retailerId?._id} className="hover:bg-gray-50/30 transition-colors">
                              <td className="px-6 py-5">
                                <div className="flex flex-col">
                                  <span className="text-[15px] font-bold text-[#3D2B1F]">{r.retailerId?.fullName}</span>
                                  <span className="text-[12px] text-gray-500 font-medium">{r.retailerId?.businessName}</span>
                                </div>
                              </td>
                              <td className="px-6 py-5">
                                {r.rating ? (
                                  <div className="flex items-center">
                                    <div className="flex text-yellow-500 mr-2">
                                      {[...Array(5)].map((_, i) => (
                                        <Star key={i} size={14} fill={i < Math.floor(r.rating/2) ? "currentColor" : "none"} />
                                      ))}
                                    </div>
                                    <span className="text-[14px] font-black text-[#3D2B1F]">{r.rating}<span className="text-gray-300 font-bold ml-0.5">/10</span></span>
                                  </div>
                                ) : <span className="text-gray-300 font-bold text-[12px] uppercase">Pending Review</span>}
                              </td>
                              <td className="px-6 py-5">
                                {r.assignedDistributor ? (
                                  <div className="flex items-center space-x-3 bg-blue-50/50 border border-blue-100 px-4 py-2 rounded-[16px] w-max">
                                    <div className="h-8 w-8 bg-white rounded-full flex items-center justify-center text-blue-600 shadow-sm">
                                      <Truck size={14} />
                                    </div>
                                    <span className="text-[13px] font-black text-blue-800">{r.assignedDistributor.fullName}</span>
                                  </div>
                                ) : <span className="px-4 py-2 bg-orange-50/50 border border-orange-100 text-orange-600 rounded-[16px] text-[12px] font-black uppercase tracking-wider">Unassigned</span>}
                              </td>
                              <td className="px-6 py-5 text-right">
                                {!r.assignedDistributor ? (
                                  <div className="flex justify-end items-center space-x-3">
                                    <input 
                                      type="text" placeholder="Enter Distributor ID..." 
                                      className="bg-gray-50 border border-gray-100 outline-none focus:bg-white focus:ring-2 focus:ring-nestle-brown/10 focus:border-nestle-brown rounded-[12px] px-4 py-2 text-[13px] w-[200px] font-medium"
                                      onChange={e => setDistributorId(e.target.value)}
                                    />
                                    <button 
                                      onClick={() => handleAssignDistributor(promo._id, r.retailerId._id)}
                                      className="bg-nestle-brown text-white px-6 py-2 rounded-[12px] text-[12px] font-black uppercase tracking-widest hover:bg-[#2c1f16] shadow-sm transition-all active:scale-95"
                                    >
                                      Assign
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex justify-end items-center text-green-600 font-black text-[12px] uppercase tracking-widest bg-green-50 px-4 py-2 rounded-[12px] w-max ml-auto">
                                    <CheckCircle size={16} className="mr-2"/> Fulfilled
                                  </div>
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
    </PromotionManagerLayout>
  );
};

export default PromotionDashboard;
