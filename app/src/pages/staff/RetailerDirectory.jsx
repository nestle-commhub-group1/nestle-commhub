import React, { useState } from 'react';
import RetailerLayout from '../../components/layout/RetailerLayout';
import { Search, Phone, Mail, MapPin } from 'lucide-react';
import StaffLayout from '../../components/layout/StaffLayout';

const RETAILERS = [
  { initials:'SG', business:'Saman General Stores', owner:'Saman Perera',        address:'12/A Baseline Rd, Colombo 09', phone:'+94 77 123 4567', status:'Active',   openTickets:2 },
  { initials:'CS', business:'City Supermart',        owner:'Chaminda Silva',       address:'45 Galle Rd, Colombo 03',     phone:'+94 71 234 5678', status:'Active',   openTickets:1 },
  { initials:'GV', business:'Green Valley Grocery',  owner:'Pradeep Jayawardena',  address:'23 Kandy Rd, Nugegoda',       phone:'+94 77 345 6789', status:'Active',   openTickets:1 },
  { initials:'PM', business:'Priya Mini Market',     owner:'Priya Fernando',       address:'8 High St, Dehiwala',         phone:'+94 76 456 7890', status:'Active',   openTickets:0 },
  { initials:'LS', business:'Lakeside Stores',        owner:'Nuwan Bandara',        address:'55 Lake Rd, Colombo 08',      phone:'+94 71 567 8901', status:'Active',   openTickets:0 },
  { initials:'PR', business:'Park Road Groceries',   owner:'Kamala Dissanayake',   address:'17 Park Rd, Borella',         phone:'+94 77 678 9012', status:'Active',   openTickets:0 },
  { initials:'RJ', business:'Raja Traders',           owner:'Raja Jayasena',        address:'33 Main St, Maharagama',      phone:'+94 70 789 0123', status:'Inactive', openTickets:0 },
  { initials:'NK', business:'Nimal Kade',             owner:'Nimal Kumara',         address:'4 Temple Rd, Kelaniya',       phone:'+94 76 890 1234', status:'Inactive', openTickets:0 },
];

const AVATAR_COLORS = ['bg-[#2C1810]','bg-[#1D4ED8]','bg-[#2D7A4F]','bg-[#7C3AED]','bg-[#B45309]','bg-[#0E7490]','bg-[#BE185D]','bg-[#374151]'];

export default function RetailerDirectory() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');

  const stats = { total: RETAILERS.length, active: RETAILERS.filter(r => r.status === 'Active').length, inactive: RETAILERS.filter(r => r.status === 'Inactive').length };

  const filtered = RETAILERS.filter(r => {
    const matchFilter = filter === 'All' || r.status === filter;
    const q = search.toLowerCase();
    return matchFilter && (!q || r.business.toLowerCase().includes(q) || r.owner.toLowerCase().includes(q) || r.address.toLowerCase().includes(q));
  });

  return (
    <StaffLayout>
      <div className="pb-10 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-[26px] font-extrabold text-[#2C1810]">Retailer Directory</h1>
          <p className="text-[15px] font-medium text-gray-500 mt-1">All retailers in your territory</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label:'Total Retailers', value:stats.total,    cls:'text-[#2C1810]' },
            { label:'Active',          value:stats.active,   cls:'text-green-600' },
            { label:'Inactive',        value:stats.inactive, cls:'text-red-600'   },
          ].map(s => (
            <div key={s.label} className="bg-white border border-[#E0DBD5] rounded-[16px] p-5 shadow-sm text-center">
              <p className={`text-[28px] font-extrabold leading-none ${s.cls}`}>{s.value}</p>
              <p className="text-[12px] font-bold text-gray-400 uppercase tracking-widest mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"/>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or address..." className="w-full pl-10 pr-4 py-3 border border-[#E0DBD5] rounded-[10px] text-[14px] font-medium text-[#2C1810] placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-[#3D2B1F]/20"/>
          </div>
          <div className="flex border-b border-transparent">
            {['All','Active','Inactive'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-5 py-3 border rounded-[10px] mr-2 text-[13px] font-bold transition-colors ${filter === f ? 'bg-[#3D2B1F] text-white border-[#3D2B1F]' : 'bg-white border-[#E0DBD5] text-gray-600 hover:border-[#3D2B1F] hover:text-[#3D2B1F]'}`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 bg-white border border-[#E0DBD5] rounded-[20px]">
            <p className="text-3xl mb-2">🔍</p>
            <p className="text-[15px] font-bold text-[#2C1810]">No retailers found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((r, idx) => (
              <div key={r.business} className="bg-white border border-[#E0DBD5] rounded-[20px] p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                {/* Top */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 rounded-full ${AVATAR_COLORS[idx % AVATAR_COLORS.length]} text-white flex items-center justify-center text-[16px] font-extrabold flex-shrink-0`}>
                      {r.initials}
                    </div>
                    <div>
                      <h3 className="text-[14px] font-extrabold text-[#2C1810] leading-snug">{r.business}</h3>
                      <p className="text-[12px] text-gray-500 font-medium">{r.owner}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${r.status === 'Active' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>{r.status}</span>
                    {r.openTickets > 0 && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">{r.openTickets} open</span>
                    )}
                  </div>
                </div>

                {/* Contact info */}
                <div className="space-y-2 mb-5 flex-1">
                  <div className="flex items-start gap-2 text-[12px] text-gray-600 font-medium">
                    <MapPin size={13} className="text-gray-400 flex-shrink-0 mt-0.5"/>
                    <span className="truncate">{r.address}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[12px] text-gray-600 font-medium">
                    <Phone size={13} className="text-gray-400 flex-shrink-0"/>
                    {r.phone}
                  </div>
                </div>

                <button className="w-full border-2 border-[#3D2B1F] text-[#3D2B1F] text-[13px] font-bold py-2.5 rounded-[10px] hover:bg-[#F5F3F0] transition-colors">
                  View Profile
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </StaffLayout>
  );
}
