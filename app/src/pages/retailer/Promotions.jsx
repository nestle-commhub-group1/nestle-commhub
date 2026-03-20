import React, { useState } from 'react';
import RetailerLayout from '../../components/layout/RetailerLayout';
import { X, Clock, Tag } from 'lucide-react';

const PROMOTIONS = [
  { id: 1, title: 'Nescafé Ramadan Special', category: 'Beverages', discount: '15% OFF', status: 'Active', description: 'Exclusive pricing on Nescafé Classic 200g and 3-in-1 sachets for Ramadan season. Available exclusively for registered retail partners.', valid: 'Mar 1 — Apr 10, 2026', terms: 'Minimum order of 10 units. Cannot be combined with other offers. Subject to stock availability.' },
  { id: 2, title: 'Milo Back-to-School Bundle', category: 'Beverages', discount: '10% OFF', status: 'Active', description: 'Bundle deals on Milo 400g and 1kg for the school season. Perfect timing for student demand peak.', valid: 'Mar 15 — Mar 31, 2026', terms: 'Bundle purchase only. Minimum 5 bundles per order.' },
  { id: 3, title: 'Maggi Family Pack Offer', category: 'Food', discount: null, status: 'Active', description: 'Buy 3 Maggi packs get 1 free on all variants. Great for stocking up before festive season.', valid: 'Mar 10 — Apr 5, 2026', terms: 'Offer applies per set of 4 units. Mix-and-match allowed across variants.' },
  { id: 4, title: 'KitKat Easter Special', category: 'Confectionery', discount: '20% OFF', status: 'Upcoming', description: 'Special Easter pricing on KitKat multipacks. Drive confectionery sales with seasonal appeal.', valid: 'Apr 1 — Apr 20, 2026', terms: 'Applicable on multipacks only. Single bars excluded.' },
  { id: 5, title: 'Nestlé Dairy Boost', category: 'Dairy', discount: null, status: 'Upcoming', description: 'Reduced pricing on Nestlé milk powder range to drive dairy category growth.', valid: 'Apr 15 — May 15, 2026', terms: 'Applies to 400g and 1kg variants. Limited to 30 units per retailer per week.' },
  { id: 6, title: 'Nescafé Gold Launch', category: 'Beverages', discount: null, status: 'Expired', description: 'Introductory pricing on Nescafé Gold range at product launch. Campaign has concluded.', valid: 'Feb 1 — Feb 28, 2026', terms: 'No longer valid.' },
];

const TABS = ['All', 'Active', 'Upcoming', 'Expired'];
const CATEGORIES = ['All', 'Beverages', 'Food', 'Dairy', 'Confectionery'];

const gradients = {
  Beverages: 'from-blue-400 to-blue-600',
  Food: 'from-orange-400 to-orange-600',
  Dairy: 'from-green-400 to-green-600',
  Confectionery: 'from-purple-400 to-purple-600',
};

const statusBadge = {
  Active: 'bg-green-100 text-green-700 border border-green-200',
  Upcoming: 'bg-blue-100 text-blue-700 border border-blue-200',
  Expired: 'bg-gray-100 text-gray-500 border border-gray-200',
};

export default function Promotions() {
  const [tab, setTab] = useState('All');
  const [category, setCategory] = useState('All');
  const [modal, setModal] = useState(null);
  const [acknowledged, setAcknowledged] = useState(new Set());

  const filtered = PROMOTIONS.filter(p => {
    const matchTab = tab === 'All' || p.status === tab;
    const matchCat = category === 'All' || p.category === category;
    return matchTab && matchCat;
  });

  return (
    <RetailerLayout>
      <div className="pb-10 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-[26px] font-extrabold text-[#2C1810]">Promotions</h1>
          <p className="text-[15px] font-medium text-gray-500 mt-1">Latest offers from Nestlé</p>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          {/* Status Tabs */}
          <div className="flex space-x-1 border-b border-[#E0DBD5] w-full sm:w-auto">
            {TABS.map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-4 py-2.5 text-[13px] font-bold whitespace-nowrap border-b-2 -mb-px transition-colors ${tab === t ? 'border-[#3D2B1F] text-[#3D2B1F]' : 'border-transparent text-gray-500 hover:text-[#3D2B1F]'}`}>
                {t}
                <span className="ml-1.5 text-[11px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">
                  {t === 'All' ? PROMOTIONS.length : PROMOTIONS.filter(p => p.status === t).length}
                </span>
              </button>
            ))}
          </div>
          {/* Category Filter */}
          <select value={category} onChange={e => setCategory(e.target.value)}
            className="border border-[#E0DBD5] rounded-[10px] px-4 py-2.5 text-[13px] font-medium text-[#2C1810] bg-white focus:outline-none focus:ring-2 focus:ring-[#3D2B1F]/20">
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 bg-white border border-[#E0DBD5] rounded-[20px]">
            <p className="text-4xl mb-3">🏷️</p>
            <p className="text-[16px] font-bold text-[#2C1810]">No promotions found</p>
            <p className="text-[14px] text-gray-500 mt-1">Try a different filter</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(promo => (
              <div key={promo.id} className="bg-white border border-[#E0DBD5] rounded-[20px] shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
                {/* Banner */}
                <div className={`bg-gradient-to-r ${gradients[promo.category]} h-24 relative flex-shrink-0 p-4 flex items-end justify-between`}>
                  {promo.discount && (
                    <span className="bg-[#3D2B1F] text-white text-[12px] font-extrabold px-3 py-1 rounded-full shadow">{promo.discount}</span>
                  )}
                  <span className="ml-auto bg-white/20 backdrop-blur-sm text-white text-[11px] font-bold px-2.5 py-1 rounded-lg border border-white/30">{promo.category}</span>
                </div>
                {/* Body */}
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-[15px] font-extrabold text-[#2C1810] leading-snug">{promo.title}</h3>
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${statusBadge[promo.status]}`}>{promo.status}</span>
                  </div>
                  <p className="text-[13px] text-gray-500 font-medium leading-relaxed line-clamp-2 mb-4">{promo.description}</p>
                  <div className="mt-auto flex items-center text-[12px] text-gray-500 font-medium border-t border-[#F0EDE8] pt-3 mb-4">
                    <Clock size={14} className="mr-1.5 text-gray-400 flex-shrink-0" />
                    <span>{promo.valid}</span>
                  </div>
                  <button
                    onClick={() => setModal(promo)}
                    className={`w-full py-2.5 rounded-[10px] text-[13px] font-bold border-2 transition-colors ${acknowledged.has(promo.id) ? 'border-[#2D7A4F] text-[#2D7A4F] bg-green-50' : 'border-[#3D2B1F] text-[#3D2B1F] hover:bg-[#F5F3F0]'}`}>
                    {acknowledged.has(promo.id) ? '✓ Acknowledged' : 'View Details'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" onClick={() => setModal(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[24px] shadow-2xl w-full max-w-lg overflow-hidden">
              <div className={`bg-gradient-to-r ${gradients[modal.category]} p-6 relative`}>
                <button onClick={() => setModal(null)} className="absolute top-4 right-4 bg-white/20 text-white rounded-full p-1.5 hover:bg-white/30 transition-colors"><X size={18} /></button>
                <div className="flex items-end justify-between">
                  {modal.discount && <span className="bg-[#3D2B1F] text-white text-[13px] font-extrabold px-3 py-1 rounded-full">{modal.discount}</span>}
                  <span className={`text-[12px] font-bold px-3 py-1 rounded-full ml-auto ${statusBadge[modal.status]}`}>{modal.status}</span>
                </div>
              </div>
              <div className="p-6">
                <h2 className="text-[20px] font-extrabold text-[#2C1810] mb-1">{modal.title}</h2>
                <p className="text-[12px] text-gray-500 font-medium mb-4 flex items-center gap-1"><Tag size={12} />{modal.category}</p>
                <p className="text-[14px] text-gray-600 font-medium leading-relaxed mb-5">{modal.description}</p>
                <div className="bg-[#F8F7F5] border border-[#E0DBD5] rounded-[12px] p-4 mb-5">
                  <p className="text-[11px] font-extrabold text-[#3D2B1F] uppercase tracking-widest mb-2">Terms & Conditions</p>
                  <p className="text-[13px] text-gray-600 font-medium">{modal.terms}</p>
                </div>
                <div className="flex items-center gap-2 text-[13px] text-gray-500 font-medium mb-6">
                  <Clock size={14} className="text-gray-400" />{modal.valid}
                </div>
                <button
                  onClick={() => { setAcknowledged(s => new Set(s).add(modal.id)); setModal(null); }}
                  className="w-full bg-[#3D2B1F] text-white font-bold py-3.5 rounded-[12px] hover:bg-[#2C1810] transition-colors text-[15px]">
                  Acknowledge Promotion
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </RetailerLayout>
  );
}
