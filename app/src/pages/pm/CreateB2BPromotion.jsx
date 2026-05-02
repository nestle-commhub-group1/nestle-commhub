/**
 * CreateB2BPromotion.jsx — Form for B2B bulk-discount promotions.
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, Loader2, Check, Sparkles, Copy, Calendar, Percent, TrendingUp } from 'lucide-react';
import PromotionManagerLayout from '../../components/layout/PromotionManagerLayout';
import API_URL from '../../config/api';

const TARGET_OPTIONS = [
  { value: 'ALL',         label: 'All Retailers',       sub: 'Available to every registered retailer' },
  { value: 'HIGH_VOLUME', label: 'High-Volume Only',    sub: 'Retailers with 500+ units ordered historically' },
  { value: 'LOW_VOLUME',  label: 'Low-Volume Only',     sub: 'Retailers with < 500 units — growth incentive' },
];

const INITIAL = {
  title: '', description: '', category: 'discount',
  startDate: '', endDate: '',
  discountPercentage: '', minUnitsRequired: '',
  targetRetailers: ['ALL'],
};

export default function CreateB2BPromotion() {
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
      description: promo.description,
      category: promo.category,
      discountPercentage: promo.b2bConfig?.discountPercentage || promo.discount || '',
      minUnitsRequired: promo.b2bConfig?.minUnitsRequired || '',
      targetRetailers: promo.b2bConfig?.targetRetailers || ['ALL'],
    });
    showToast(`Pre-filled from "${promo.title}"`);
  }

  function showToast(msg) {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 3000);
  }

  function set(field, val) { setForm(p => ({ ...p, [field]: val })); }

  function toggleTarget(val) {
    setForm(p => {
      const cur = p.targetRetailers;
      if (cur.includes(val)) return { ...p, targetRetailers: cur.filter(v => v !== val) };
      return { ...p, targetRetailers: [...cur, val] };
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setSuccess('');

    if (!form.title || !form.startDate || !form.endDate) {
      return setError('Name, start date and end date are required.');
    }
    if (!form.discountPercentage || Number(form.discountPercentage) < 1) {
      return setError('Discount percentage must be at least 1%.');
    }
    if (!form.targetRetailers.length) {
      return setError('Select at least one target group.');
    }

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
          discount:      Number(form.discountPercentage),
          promotionType: 'B2B_RETAILER',
          b2bConfig: {
            discountPercentage: Number(form.discountPercentage),
            minUnitsRequired:   Number(form.minUnitsRequired) || 0,
            targetRetailers:    form.targetRetailers,
          },
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to create promotion');
      setSuccess(`B2B promotion "${form.title}" created! Retailers are being notified.`);
      setTimeout(() => navigate('/promotion-manager/promotions'), 1500);
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
        {/* Header */}
        <button onClick={() => navigate(-1)} className="flex items-center space-x-2 text-[13px] font-bold text-gray-500 hover:text-[#2C1810] mb-6 transition-colors">
          <ArrowLeft size={16}/><span>Back</span>
        </button>
        <div className="flex items-center space-x-3 mb-8">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <Building2 size={20} className="text-blue-600"/>
          </div>
          <div>
            <h1 className="text-[22px] font-black text-[#2C1810]">Create B2B Promotion</h1>
            <p className="text-[13px] text-gray-500 font-medium">Bulk discount for retailers who hit minimum order targets</p>
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
                          <span className="flex items-center space-x-1 text-[11px] font-bold text-green-600"><Percent size={10}/><span>{tp.discount}%</span></span>
                          <span className="flex items-center space-x-1 text-[11px] font-bold text-blue-600"><TrendingUp size={10}/><span>{tp.optIns} Opt-ins</span></span>
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
          <div className="bg-white rounded-[20px] border border-[#E0DBD5] shadow-sm p-6 space-y-5">
            <h2 className="text-[13px] font-black text-gray-400 uppercase tracking-widest">Promotion Details</h2>

            <div>
              <label className={labelCls}>Promotion Name *</label>
              <input className={inputCls} placeholder="e.g. Nescafé Bulk Summer Deal" value={form.title} onChange={e=>set('title',e.target.value)} required />
            </div>

            <div>
              <label className={labelCls}>Description</label>
              <textarea className={inputCls} rows={3} placeholder="Explain the promotion to retailers..." value={form.description} onChange={e=>set('description',e.target.value)} />
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

          {/* B2B Config */}
          <div className="bg-white rounded-[20px] border border-[#E0DBD5] shadow-sm p-6 space-y-5">
            <h2 className="text-[13px] font-black text-gray-400 uppercase tracking-widest">Discount Configuration</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Discount Percentage *</label>
                <div className="relative">
                  <input type="number" min={1} max={100} className={inputCls} placeholder="15" value={form.discountPercentage} onChange={e=>set('discountPercentage',e.target.value)} required />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-black text-[14px]">%</span>
                </div>
              </div>
              <div>
                <label className={labelCls}>Min Units Required</label>
                <input type="number" min={0} className={inputCls} placeholder="500" value={form.minUnitsRequired} onChange={e=>set('minUnitsRequired',e.target.value)} />
              </div>
            </div>

            {/* Target retailers */}
            <div>
              <label className={labelCls}>Target Retailers *</label>
              <div className="space-y-2">
                {TARGET_OPTIONS.map(opt => {
                  const checked = form.targetRetailers.includes(opt.value);
                  return (
                    <button type="button" key={opt.value} onClick={()=>toggleTarget(opt.value)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-[14px] border text-left transition-colors ${checked?'border-[#3D2B1F] bg-[#3D2B1F]/5':'border-[#E0DBD5] hover:border-[#3D2B1F]/40'}`}>
                      <div>
                        <p className="text-[14px] font-black text-[#2C1810]">{opt.label}</p>
                        <p className="text-[11px] text-gray-400 font-medium">{opt.sub}</p>
                      </div>
                      {checked && <Check size={16} className="text-[#3D2B1F] flex-shrink-0"/>}
                    </button>
                  );
                })}
              </div>
            </div>
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
            <button type="submit" disabled={loading} className="flex-1 py-3.5 rounded-[16px] bg-[#3D2B1F] hover:bg-[#2C1810] text-white text-[14px] font-black transition-colors disabled:opacity-50 flex items-center justify-center space-x-2">
              {loading ? <><Loader2 size={15} className="animate-spin"/><span>Creating…</span></> : <><Building2 size={15}/><span>Create B2B Promotion</span></>}
            </button>
          </div>
        </form>
      </div>
    </PromotionManagerLayout>
  );
}
