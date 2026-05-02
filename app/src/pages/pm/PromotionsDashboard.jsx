/**
 * PromotionsDashboard.jsx — PM promotions hub with B2B | B2C tabs.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Users, PlusCircle, RefreshCw, Percent, Package, CheckCircle, Loader2 } from 'lucide-react';
import PromotionManagerLayout from '../../components/layout/PromotionManagerLayout';
import API_URL from '../../config/api';

function fmt(d) { return d ? new Date(d).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' }) : '—'; }
function StatusPill({ status }) {
  const m = { active:'bg-green-100 text-green-700', inactive:'bg-gray-100 text-gray-500', archived:'bg-red-100 text-red-600' };
  return <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${m[status]||m.inactive}`}>{status}</span>;
}

function AnalyticsStrip({ promotions, tab }) {
  if (!promotions.length) return null;
  const active = promotions.filter(p=>p.status==='active').length;
  const b2bAvgDisc = tab==='B2B' ? (promotions.reduce((s,p)=>s+(p.b2bConfig?.discountPercentage||p.discount||0),0)/promotions.length).toFixed(1) : null;
  const totalActivations = tab==='B2C' ? promotions.reduce((s,p)=>s+(p.activationCount||0),0) : null;
  const items = [
    { label:'Total', value:promotions.length, icon:'📋', color:'#3B82F6' },
    { label:'Active', value:active, icon:'✅', color:'#22C55E' },
    tab==='B2B'
      ? { label:'Avg Discount', value:`${b2bAvgDisc}%`, icon:'💰', color:'#F59E0B' }
      : { label:'Total Activations', value:totalActivations, icon:'⚡', color:'#8B5CF6' },
    { label: tab==='B2B'?'Total Opt-Ins':'Avg Activations',
      value: tab==='B2B'
        ? promotions.reduce((s,p)=>s+(p.participatingRetailers?.length||0),0)
        : (totalActivations/Math.max(promotions.length,1)).toFixed(1),
      icon: tab==='B2B'?'🤝':'🔔', color:'#EF4444' },
  ];
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
      {items.map(i=>(
        <div key={i.label} className="bg-white rounded-[14px] border border-[#E0DBD5] p-4 shadow-sm" style={{borderLeft:`3px solid ${i.color}`}}>
          <div className="flex items-center space-x-1.5 mb-1">
            <span className="text-sm">{i.icon}</span>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{i.label}</p>
          </div>
          <p className="text-[20px] font-black text-[#2C1810]">{i.value}</p>
        </div>
      ))}
    </div>
  );
}

function B2BTable({ promotions }) {
  return (
    <div className="bg-white rounded-[20px] border border-[#E0DBD5] shadow-sm overflow-hidden">
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#F8F7F5]">
            <tr>{['Promotion','Discount','Min Units','Target','Dates','Status','Opt-Ins'].map(h=>(<th key={h} className="px-4 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">{h}</th>))}</tr>
          </thead>
          <tbody className="divide-y divide-[#F0EDE8]">
            {promotions.map(p=>(
              <tr key={p._id} className="hover:bg-[#FAFAF9] transition-colors">
                <td className="px-4 py-4"><p className="font-black text-[14px] text-[#2C1810] truncate max-w-[180px]">{p.title}</p><p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">{p.description}</p></td>
                <td className="px-4 py-4"><span className="flex items-center space-x-1 text-[14px] font-black text-green-700"><Percent size={12}/><span>{p.b2bConfig?.discountPercentage||p.discount||0}%</span></span></td>
                <td className="px-4 py-4"><span className="flex items-center space-x-1 text-[13px] font-bold text-gray-600"><Package size={12}/><span>{(p.b2bConfig?.minUnitsRequired||0).toLocaleString()}</span></span></td>
                <td className="px-4 py-4"><div className="flex flex-wrap gap-1">{(p.b2bConfig?.targetRetailers||['ALL']).map(t=>(<span key={t} className="bg-blue-100 text-blue-700 text-[9px] font-black px-2 py-0.5 rounded-full uppercase">{t.replace('_',' ')}</span>))}</div></td>
                <td className="px-4 py-4"><p className="text-[12px] font-bold text-gray-600">{fmt(p.startDate)}</p><p className="text-[11px] text-gray-400">→ {fmt(p.endDate)}</p></td>
                <td className="px-4 py-4"><StatusPill status={p.status}/></td>
                <td className="px-4 py-4 text-[14px] font-black text-[#2C1810]">{p.participatingRetailers?.length||0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="md:hidden divide-y divide-[#F0EDE8]">
        {promotions.map(p=>(
          <div key={p._id} className="p-4 space-y-2">
            <div className="flex justify-between"><p className="font-black text-[14px] text-[#2C1810]">{p.title}</p><StatusPill status={p.status}/></div>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[{l:'Discount',v:`${p.b2bConfig?.discountPercentage||0}%`},{l:'Min Units',v:p.b2bConfig?.minUnitsRequired||0},{l:'Opt-Ins',v:p.participatingRetailers?.length||0}].map(m=>(<div key={m.l} className="bg-[#FAFAF9] rounded-[10px] p-2 border border-[#F0EDE8]"><p className="text-[9px] font-black text-gray-400 uppercase">{m.l}</p><p className="text-[13px] font-black text-[#2C1810]">{m.v}</p></div>))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function B2CTable({ promotions }) {
  return (
    <div className="bg-white rounded-[20px] border border-[#E0DBD5] shadow-sm overflow-hidden">
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-[#F8F7F5]">
            <tr>{['Promotion','Display Name','Bundle Rule','Price','Activation','Dates','Activated By'].map(h=>(<th key={h} className="px-4 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">{h}</th>))}</tr>
          </thead>
          <tbody className="divide-y divide-[#F0EDE8]">
            {promotions.map(p=>(
              <tr key={p._id} className="hover:bg-[#FAFAF9] transition-colors">
                <td className="px-4 py-4"><p className="font-black text-[14px] text-[#2C1810] max-w-[180px] truncate">{p.title}</p><p className="text-[11px] text-gray-400 line-clamp-1">{p.description}</p></td>
                <td className="px-4 py-4 text-[13px] font-bold text-purple-700">{p.b2cConfig?.displayName||'—'}</td>
                <td className="px-4 py-4"><span className="bg-orange-100 text-orange-700 text-[11px] font-black px-2.5 py-0.5 rounded-full border border-orange-200">{p.b2cConfig?.bundleRules||'—'}</span></td>
                <td className="px-4 py-4 text-[13px] font-black text-[#2C1810]">{p.b2cConfig?.customerFacingPrice?`₨${p.b2cConfig.customerFacingPrice.toLocaleString()}`:'—'}</td>
                <td className="px-4 py-4">{p.b2cConfig?.requiresRetailerApproval?(<span className="bg-amber-100 text-amber-700 text-[10px] font-black px-2 py-0.5 rounded-full">Opt-in</span>):(<span className="bg-green-100 text-green-700 text-[10px] font-black px-2 py-0.5 rounded-full">Auto</span>)}</td>
                <td className="px-4 py-4"><p className="text-[12px] font-bold text-gray-600">{fmt(p.startDate)}</p><p className="text-[11px] text-gray-400">→ {fmt(p.endDate)}</p></td>
                <td className="px-4 py-4"><div className="flex items-center space-x-1"><CheckCircle size={13} className="text-green-500"/><span className="text-[14px] font-black text-[#2C1810]">{p.activationCount||0}</span></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="md:hidden divide-y divide-[#F0EDE8]">
        {promotions.map(p=>(
          <div key={p._id} className="p-4 space-y-2">
            <p className="font-black text-[14px] text-[#2C1810]">{p.title}</p>
            <p className="text-[11px] text-purple-600">{p.b2cConfig?.displayName}</p>
            <div className="flex gap-2 flex-wrap">
              <span className="bg-orange-100 text-orange-700 text-[11px] font-black px-2 py-0.5 rounded-full">{p.b2cConfig?.bundleRules||'—'}</span>
              {p.b2cConfig?.requiresRetailerApproval?<span className="bg-amber-100 text-amber-700 text-[10px] font-black px-2 py-0.5 rounded-full">Opt-in</span>:<span className="bg-green-100 text-green-700 text-[10px] font-black px-2 py-0.5 rounded-full">Auto-active</span>}
            </div>
            <p className="text-[12px] text-gray-500">{p.activationCount||0} retailers activated</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PromotionsDashboard() {
  const navigate = useNavigate();
  const [tab,     setTab]     = useState('B2B');
  const [b2b,     setB2b]     = useState([]);
  const [b2c,     setB2c]     = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');
  const headers = { Authorization:`Bearer ${token}` };

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [rb,rc] = await Promise.all([
        fetch(`${API_URL}/api/promotions/b2b`, { headers }),
        fetch(`${API_URL}/api/promotions/b2c`, { headers }),
      ]);
      const [jb,jc] = await Promise.all([rb.json(), rc.json()]);
      setB2b(jb.promotions||[]); setB2c(jc.promotions||[]);
    } catch { setB2b([]); setB2c([]); } finally { setLoading(false); }
  }, []);

  useEffect(()=>{ fetchAll(); },[fetchAll]);

  const current = tab==='B2B' ? b2b : b2c;

  return (
    <PromotionManagerLayout>
      <div className="space-y-6 pb-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-[26px] font-black text-[#2C1810]">Promotions Dashboard</h1>
            <p className="text-[13px] text-gray-500 mt-1 font-medium">B2B retailer discounts and B2C customer offers</p>
          </div>
          <button onClick={fetchAll} disabled={loading} className="flex items-center space-x-2 px-4 py-2.5 bg-white border border-[#E0DBD5] rounded-[12px] text-[13px] font-bold text-[#3D2B1F] hover:bg-[#F8F7F5] transition-colors disabled:opacity-50">
            <RefreshCw size={14} className={loading?'animate-spin':''}/>
            <span>Refresh</span>
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex bg-[#F8F7F5] rounded-[16px] p-1.5 w-fit gap-1">
          {[{key:'B2B',label:'B2B — Retailer Discounts',Icon:Building2,count:b2b.length},{key:'B2C',label:'B2C — Customer Offers',Icon:Users,count:b2c.length}].map(t=>(
            <button key={t.key} onClick={()=>setTab(t.key)} className={`flex items-center space-x-2 px-5 py-2.5 rounded-[12px] text-[13px] font-black transition-all ${tab===t.key?'bg-[#3D2B1F] text-white shadow-sm':'text-gray-500 hover:text-[#3D2B1F]'}`}>
              <t.Icon size={15}/><span>{t.label}</span>
              {t.count>0&&<span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${tab===t.key?'bg-white/20 text-white':'bg-gray-200 text-gray-500'}`}>{t.count}</span>}
            </button>
          ))}
        </div>

        <div className="flex justify-end">
          <button onClick={()=>navigate(tab==='B2B'?'/promotion-manager/create-b2b':'/promotion-manager/create-b2c')} className="flex items-center space-x-2 px-5 py-3 bg-[#3D2B1F] hover:bg-[#2C1810] text-white rounded-[14px] text-[13px] font-black transition-colors shadow-sm">
            <PlusCircle size={16}/><span>Create {tab} Promotion</span>
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center min-h-[200px]"><Loader2 size={24} className="animate-spin text-gray-400"/></div>
        ) : current.length===0 ? (
          <div className="py-20 text-center space-y-4">
            <p className="text-5xl">{tab==='B2B'?'🏢':'🛍️'}</p>
            <p className="text-[16px] font-black text-gray-400">No {tab} promotions yet</p>
            <button onClick={()=>navigate(tab==='B2B'?'/promotion-manager/create-b2b':'/promotion-manager/create-b2c')} className="inline-flex items-center space-x-2 px-5 py-3 bg-[#3D2B1F] hover:bg-[#2C1810] text-white rounded-[14px] text-[13px] font-black transition-colors">
              <PlusCircle size={16}/><span>Create {tab} Promotion</span>
            </button>
          </div>
        ) : (<><AnalyticsStrip promotions={current} tab={tab}/>{tab==='B2B'?<B2BTable promotions={b2b}/>:<B2CTable promotions={b2c}/>}</>)}
      </div>
    </PromotionManagerLayout>
  );
}
