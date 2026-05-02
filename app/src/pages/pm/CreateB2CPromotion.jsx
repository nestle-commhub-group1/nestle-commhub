/**
 * CreateB2CPromotion.jsx — Form for B2C customer-facing promotion offers.
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Loader2, Sparkles, Copy, Percent, TrendingUp } from 'lucide-react';
import PromotionManagerLayout from '../../components/layout/PromotionManagerLayout';
import API_URL from '../../config/api';

const BUNDLE_OPTIONS = ['2 for 1', 'Buy 2 Get 1 Free', 'Special Price', 'Buy 3 Pay 2', '50% Off Second Unit', 'Custom'];

const INITIAL = {
  title: '', displayName: '', description: '', category: 'bundled',
  bundleRule: '2 for 1', customBundle: '',
  customerFacingPrice: '', requiresRetailerApproval: true,
  startDate: '', endDate: '',
};

export default function CreateB2CPromotion() {
  const navigate = useNavigate();
  const [form,    setForm]    = useState(INITIAL);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');
  const [topPerformers, setTopPerformers] = useState([]);
  const [tpLoading, setTpLoading] = useState(true);

  useEffect(() => {
    async function fetchTop() {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/api/promotions-intelligence/top-performers`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();
        setTopPerformers(json.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setTpLoading(false);
      }
    }
    fetchTop();
  }, []);

  function handleCopy(promo) {
    setForm({
      ...INITIAL,
      title: `${promo.title} (Re-run)`,
      displayName: promo.b2cConfig?.displayName || '',
      description: promo.description,
      category: promo.category,
      bundleRule: BUNDLE_OPTIONS.includes(promo.b2cConfig?.bundleRules) ? promo.b2cConfig.bundleRules : 'Custom',
      customBundle: BUNDLE_OPTIONS.includes(promo.b2cConfig?.bundleRules) ? '' : (promo.b2cConfig?.bundleRules || ''),
      customerFacingPrice: promo.b2cConfig?.customerFacingPrice || '',
      requiresRetailerApproval: promo.b2cConfig?.requiresRetailerApproval ?? true,
    });
    showToast(`Pre-filled from "${promo.title}"`);
  }

  function showToast(msg) {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  }

  function set(field, val) { setForm(p => ({ ...p, [field]: val })); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!form.title || !form.displayName || !form.startDate || !form.endDate) {
      return setError('Name, display name, start date and end date are required.');
    }

    const bundleRules = form.bundleRule === 'Custom' ? form.customBundle.trim() : form.bundleRule;
    if (!bundleRules) return setError('Specify a bundle rule.');

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/api/promotions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title:         form.title,
          description:   form.description,
          category:      form.category,
          startDate:     form.startDate,
          endDate:       form.endDate,
          promotionType: 'B2C_CUSTOMER',
          b2cConfig: {
            displayName:              form.displayName,
            bundleRules,
            customerFacingPrice:      form.customerFacingPrice ? Number(form.customerFacingPrice) : undefined,
            requiresRetailerApproval: form.requiresRetailerApproval,
          },
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to create promotion');
      setSuccess(`B2C promotion "${form.title}" created!${form.requiresRetailerApproval ? ' Retailers can now activate it in their stores.' : ' It has been auto-activated for all retailers.'}`);
      setTimeout(() => navigate('/promotion-manager/promotions'), 1600);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const inputCls = "w-full px-4 py-3 bg-gray-50 border border-[#E0DBD5] rounded-[14px] text-[14px] font-semibold text-[#2C1810] outline-none focus:ring-2 focus:ring-[#3D2B1F]/20 focus:border-[#3D2B1F] transition-all";
  const labelCls = "block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-1.5";

  return (
    <PromotionManagerLayout>
      <div className="max-w-2xl mx-auto pb-12">
        <button onClick={() => navigate(-1)} className="flex items-center space-x-2 text-[13px] font-bold text-gray-500 hover:text-[#2C1810] mb-6 transition-colors">
          <ArrowLeft size={16}/><span>Back</span>
        </button>
        <div className="flex items-center space-x-3 mb-8">
          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
            <Users size={20} className="text-purple-600"/>
          </div>
          <div>
            <h1 className="text-[22px] font-black text-[#2C1810]">Create B2C Promotion</h1>
            <p className="text-[13px] text-gray-500 font-medium">Customer-facing bundle offers delivered through retailers</p>
          </div>
        </div>

        {/* Smart Builder — Top Performers */}
        <section className="mb-10">
          <div className="flex items-center space-x-2 mb-4">
            <Sparkles size={18} className="text-amber-500" />
            <h2 className="text-[14px] font-black text-[#2C1810] uppercase tracking-widest">Smart Builder — Top Performers</h2>
          </div>
          
          <div className="bg-white rounded-[24px] border border-[#E0DBD5] shadow-sm overflow-hidden">
            {tpLoading ? (
              <div className="p-10 flex justify-center"><Loader2 size={24} className="animate-spin text-gray-300" /></div>
            ) : topPerformers.length === 0 ? (
              <div className="p-10 text-center text-gray-400 italic text-[13px]">No performance data available yet</div>
            ) : (
              <div className="divide-y divide-[#F0EDE8]">
                {topPerformers.map(tp => (
                  <div key={tp._id} className="p-4 hover:bg-[#F8F7F5] transition-colors flex items-center justify-between group">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex flex-col items-center justify-center">
                        <span className="text-[14px] font-black text-[#3D2B1F]">{tp.performanceScore}</span>
                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-tighter">Score</span>
                      </div>
                      <div>
                        <p className="text-[14px] font-black text-[#2C1810]">{tp.title}</p>
                        <div className="flex items-center space-x-3 mt-0.5">
                          <span className="flex items-center space-x-1 text-[11px] font-bold text-purple-600"><Percent size={10}/><span>{tp.b2cConfig?.bundleRules}</span></span>
                          <span className="flex items-center space-x-1 text-[11px] font-bold text-blue-600"><TrendingUp size={10}/><span>{tp.optIns} Activations</span></span>
                        </div>
                      </div>
                    </div>
                    <button 
                      type="button"
                      onClick={() => handleCopy(tp)}
                      className="flex items-center space-x-1.5 px-3 py-2 bg-[#3D2B1F]/5 text-[#3D2B1F] text-[11px] font-black rounded-[10px] hover:bg-[#3D2B1F] hover:text-white transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Copy size={12} />
                      <span>Use Template</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <p className="text-[11px] text-gray-400 font-medium mt-2 italic px-2">
            ✨ AI-ranked based on conversion rate, retailer ratings, and revenue impact.
          </p>
        </section>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Names */}
          <div className="bg-white rounded-[20px] border border-[#E0DBD5] shadow-sm p-6 space-y-5">
            <h2 className="text-[13px] font-black text-gray-400 uppercase tracking-widest">Promotion Identity</h2>
            <div>
              <label className={labelCls}>Internal Name *</label>
              <input className={inputCls} placeholder="e.g. KitKat Summer B2C Jun-2026" value={form.title} onChange={e=>set('title',e.target.value)} required />
              <p className="text-[11px] text-gray-400 mt-1 font-medium">Only shown to Promotion Managers</p>
            </div>
            <div>
              <label className={labelCls}>Customer Display Name *</label>
              <input className={inputCls} placeholder="e.g. KitKat 4-Pack: 2 for 1!" value={form.displayName} onChange={e=>set('displayName',e.target.value)} required />
              <p className="text-[11px] text-gray-400 mt-1 font-medium">What customers see in-store</p>
            </div>
            <div>
              <label className={labelCls}>Description</label>
              <textarea className={inputCls} rows={2} placeholder="Brief description of this offer..." value={form.description} onChange={e=>set('description',e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Category</label>
              <select className={inputCls} value={form.category} onChange={e=>set('category',e.target.value)}>
                {['seasonal','discount','bundled','flash_sale','other'].map(c=>(
                  <option key={c} value={c}>{c.replace('_',' ').replace(/\b\w/g,l=>l.toUpperCase())}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Bundle + Price */}
          <div className="bg-white rounded-[20px] border border-[#E0DBD5] shadow-sm p-6 space-y-5">
            <h2 className="text-[13px] font-black text-gray-400 uppercase tracking-widest">Bundle Configuration</h2>
            <div>
              <label className={labelCls}>Bundle Rule *</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {BUNDLE_OPTIONS.map(opt => (
                  <button type="button" key={opt} onClick={()=>set('bundleRule',opt)}
                    className={`py-3 px-3 rounded-[12px] border text-[12px] font-black text-left transition-colors ${form.bundleRule===opt?'border-[#3D2B1F] bg-[#3D2B1F] text-white':'border-[#E0DBD5] text-[#2C1810] hover:border-[#3D2B1F]/40'}`}>
                    {opt}
                  </button>
                ))}
              </div>
              {form.bundleRule === 'Custom' && (
                <div className="mt-3">
                  <input className={inputCls} placeholder='e.g. "Buy 4 Pay 3"' value={form.customBundle} onChange={e=>set('customBundle',e.target.value)} />
                </div>
              )}
            </div>
            <div>
              <label className={labelCls}>Customer Facing Price (₨)</label>
              <input type="number" min={0} className={inputCls} placeholder="450" value={form.customerFacingPrice} onChange={e=>set('customerFacingPrice',e.target.value)} />
              <p className="text-[11px] text-gray-400 mt-1 font-medium">Leave blank if bundle rule describes the deal fully</p>
            </div>
          </div>

          {/* Activation */}
          <div className="bg-white rounded-[20px] border border-[#E0DBD5] shadow-sm p-6 space-y-4">
            <h2 className="text-[13px] font-black text-gray-400 uppercase tracking-widest">Retailer Activation</h2>
            {[
              { val: true,  label: 'Requires retailer approval', sub: 'Each retailer must explicitly activate this in their store. They see an [Activate] button.' },
              { val: false, label: 'Auto-active for all retailers', sub: 'Immediately live in all retailer stores. Retailers cannot disable it.' },
            ].map(opt => (
              <button type="button" key={String(opt.val)} onClick={()=>set('requiresRetailerApproval',opt.val)}
                className={`w-full flex items-start space-x-4 px-4 py-4 rounded-[14px] border text-left transition-colors ${form.requiresRetailerApproval===opt.val?'border-[#3D2B1F] bg-[#3D2B1F]/5':'border-[#E0DBD5] hover:border-[#3D2B1F]/40'}`}>
                <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center ${form.requiresRetailerApproval===opt.val?'border-[#3D2B1F] bg-[#3D2B1F]':'border-gray-300'}`}>
                  {form.requiresRetailerApproval===opt.val && <div className="w-2 h-2 bg-white rounded-full"/>}
                </div>
                <div>
                  <p className="text-[14px] font-black text-[#2C1810]">{opt.label}</p>
                  <p className="text-[12px] text-gray-500 font-medium mt-0.5">{opt.sub}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Dates */}
          <div className="bg-white rounded-[20px] border border-[#E0DBD5] shadow-sm p-6 space-y-4">
            <h2 className="text-[13px] font-black text-gray-400 uppercase tracking-widest">Duration</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Start Date *</label>
                <input type="datetime-local" className={inputCls} value={form.startDate} onChange={e=>set('startDate',e.target.value)} required />
              </div>
              <div>
                <label className={labelCls}>End Date *</label>
                <input type="datetime-local" className={inputCls} value={form.endDate} onChange={e=>set('endDate',e.target.value)} required />
              </div>
            </div>
          </div>

          {error   && <p className="text-red-500 text-[13px] font-semibold bg-red-50 rounded-[10px] px-4 py-3">{error}</p>}
          {success && <p className="text-green-600 text-[13px] font-semibold bg-green-50 rounded-[10px] px-4 py-3">✅ {success}</p>}

          <div className="flex space-x-3">
            <button type="button" onClick={()=>navigate(-1)} className="flex-1 py-3.5 rounded-[16px] border border-gray-200 text-[14px] font-bold text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-3.5 rounded-[16px] bg-purple-700 hover:bg-purple-800 text-white text-[14px] font-black transition-colors disabled:opacity-50 flex items-center justify-center space-x-2">
              {loading ? <><Loader2 size={15} className="animate-spin"/><span>Creating…</span></> : <><Users size={15}/><span>Create B2C Promotion</span></>}
            </button>
          </div>
        </form>
      </div>
    </PromotionManagerLayout>
  );
}
