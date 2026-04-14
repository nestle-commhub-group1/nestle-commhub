import PromotionManagerLayout from '../../components/layout/PromotionManagerLayout';
import { Sparkles, Calendar, Tag, FileText, Send } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const CreatePromotion = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'seasonal',
    startDate: '',
    endDate: '',
    discount: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/promotions', {
        ...formData,
        discount: formData.discount ? Number(formData.discount) : undefined
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Promotion created successfully');
      navigate('/promotion-manager/dashboard');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create promotion');
      setLoading(false);
    }
  };

  return (
    <PromotionManagerLayout>
      <div className="max-w-4xl mx-auto py-10 space-y-10">
        <div className="text-center">
            <div className="inline-flex items-center justify-center p-3 bg-nestle-brown/5 rounded-[24px] mb-4">
                <Sparkles className="text-nestle-brown" size={32} />
            </div>
            <h1 className="text-[36px] font-black text-[#2C1810] tracking-tight">Launch New Campaign</h1>
            <p className="text-[16px] text-gray-500 font-medium max-w-lg mx-auto mt-2">Design and publish a new promotional offer for your retail network.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="bg-white rounded-[40px] shadow-xl shadow-gray-200/50 border border-gray-100 p-10 md:p-14 space-y-10">
          <div className="space-y-6">
            <div className="flex items-center space-x-3 text-nestle-brown mb-2">
                <FileText size={20} />
                <h2 className="text-[18px] font-black uppercase tracking-widest">Campaign Details</h2>
            </div>
            
            <div className="grid grid-cols-1 gap-8">
              <div className="space-y-2">
                <label className="text-[13px] font-black text-gray-400 uppercase tracking-widest ml-1">Campaign Title</label>
                <input 
                  required type="text" 
                  placeholder="e.g. Summer Essentials Discount"
                  className="w-full bg-gray-50/50 border border-gray-100 rounded-[20px] px-6 py-4 text-[16px] font-bold text-[#2C1810] focus:bg-white focus:ring-4 focus:ring-nestle-brown/5 focus:border-nestle-brown outline-none transition-all placeholder:text-gray-300"
                  value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-[13px] font-black text-gray-400 uppercase tracking-widest ml-1">Description & Strategy</label>
                <textarea 
                  required 
                  placeholder="Describe the goals and details of this promotion..."
                  className="w-full bg-gray-50/50 border border-gray-100 rounded-[20px] px-6 py-4 text-[16px] font-bold text-[#2C1810] h-36 focus:bg-white focus:ring-4 focus:ring-nestle-brown/5 focus:border-nestle-brown outline-none transition-all placeholder:text-gray-300 resize-none"
                  value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-6">
                <div className="flex items-center space-x-3 text-nestle-brown mb-2">
                    <Tag size={20} />
                    <h2 className="text-[18px] font-black uppercase tracking-widest">Category & Value</h2>
                </div>
                
                <div className="space-y-2">
                    <label className="text-[13px] font-black text-gray-400 uppercase tracking-widest ml-1">Category</label>
                    <select 
                        className="w-full bg-gray-50/50 border border-gray-100 rounded-[20px] px-6 py-4 text-[16px] font-bold text-[#2C1810] focus:bg-white focus:ring-4 focus:ring-nestle-brown/5 focus:border-nestle-brown outline-none transition-all appearance-none cursor-pointer"
                        value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}
                    >
                        <option value="seasonal">Seasonal Campaign</option>
                        <option value="discount">Direct Discount</option>
                        <option value="bundled">Bundled Offer</option>
                        <option value="flash_sale">Flash Sale</option>
                        <option value="other">Other Type</option>
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-[13px] font-black text-gray-400 uppercase tracking-widest ml-1">Discount Magnitude (%)</label>
                    <div className="relative">
                        <input 
                            type="number" min="0" max="100" 
                            placeholder="0"
                            className="w-full bg-gray-50/50 border border-gray-100 rounded-[20px] px-6 py-4 text-[16px] font-bold text-[#2C1810] focus:bg-white focus:ring-4 focus:ring-nestle-brown/5 focus:border-nestle-brown outline-none transition-all placeholder:text-gray-300"
                            value={formData.discount} onChange={e => setFormData({...formData, discount: e.target.value})}
                        />
                        <span className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 font-black">%</span>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <div className="flex items-center space-x-3 text-nestle-brown mb-2">
                    <Calendar size={20} />
                    <h2 className="text-[18px] font-black uppercase tracking-widest">Timeline</h2>
                </div>

                <div className="space-y-2">
                    <label className="text-[13px] font-black text-gray-400 uppercase tracking-widest ml-1">Activation Date</label>
                    <input 
                        required type="date" 
                        className="w-full bg-gray-50/50 border border-gray-100 rounded-[20px] px-6 py-4 text-[16px] font-bold text-[#2C1810] focus:bg-white focus:ring-4 focus:ring-nestle-brown/5 focus:border-nestle-brown outline-none transition-all cursor-pointer"
                        value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-[13px] font-black text-gray-400 uppercase tracking-widest ml-1">Expiry Date</label>
                    <input 
                        required type="date" 
                        className="w-full bg-gray-50/50 border border-gray-100 rounded-[20px] px-6 py-4 text-[16px] font-bold text-[#2C1810] focus:bg-white focus:ring-4 focus:ring-nestle-brown/5 focus:border-nestle-brown outline-none transition-all cursor-pointer"
                        value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})}
                    />
                </div>
            </div>
          </div>
          
          <div className="pt-6">
            <button 
              type="submit" disabled={loading}
              className="w-full md:w-auto bg-[#3D2B1F] hover:bg-[#2c1f16] text-white font-black py-5 px-12 rounded-[24px] transition-all flex items-center justify-center space-x-3 shadow-xl shadow-brown-100/50 disabled:opacity-50 active:scale-[0.98] ml-auto"
            >
              {loading ? (
                <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    <span>Processing...</span>
                </>
              ) : (
                <>
                    <Send size={20} />
                    <span className="uppercase tracking-widest">Publish Campaign</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </PromotionManagerLayout>
  );
};

export default CreatePromotion;
