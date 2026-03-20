import React, { useState } from 'react';
import StaffLayout from '../../components/layout/StaffLayout';
import { Tag, Radio } from 'lucide-react';

const INIT_BROADCASTS = [
  { id: 1, type: 'Promotion', title: "Nescafé Ramadan Special — Now Live", preview: "The Ramadan special promotion is now active. Please inform all retailers in your territory immediately and ensure adequate stock.", date: 'Mar 15, 2026', read: false, full: "The Ramadan special promotion is now active until April 10. Please inform all retailers in your territory immediately. Retailers can access the promo via the Promotions section. Ensure adequate stock is available — contact your distributor if stock is low. Target: min 30% uplift in Nescafé sales during promotion period." },
  { id: 2, type: 'Announcement', title: "Q1 Sales Targets Update", preview: "Western Province has achieved 78% of Q1 targets. Strong performance from Colombo district with several staff exceeding personal targets.", date: 'Mar 14, 2026', read: false, full: "Q1 Sales Targets Update — Western Province\n\nWestern Province has achieved 78% of Q1 targets. Key highlights:\n• Colombo district: 92% target achieved (top performer)\n• Gampaha district: 71% target achieved\n• Kalutara district: 65% target achieved (needs attention)\n\nSeveral staff members exceeded personal targets. Full Q1 review meeting scheduled for March 31 via Teams." },
  { id: 3, type: 'Promotion', title: "Milo Back-to-School Bundle", preview: "New bundle promotion starting March 15. Ensure all retailers are informed and stocked. Bundle: Milo 400g + 1kg at 10% discount.", date: 'Mar 12, 2026', read: true, full: "Milo Back-to-School Bundle promotion is now live until March 31. Discount: 10% on bundle purchase (400g + 1kg). Minimum order: 5 bundles per retailer. Please ensure all retailers in your territory are informed and have adequate stock. Contact your distributor if restocking is needed before March 14." },
  { id: 4, type: 'Announcement', title: "New Stock Arrival — Colombo Warehouse", preview: "Fresh stock of Milo 400g and Nescafé Classic has arrived at Colombo Warehouse. Distributor deliveries begin Monday.", date: 'Mar 10, 2026', read: true, full: "Fresh stock has arrived at the Colombo Central Warehouse:\n• Milo 400g: 5,000 units\n• Nescafé Classic 200g: 3,000 units\n• Maggi Noodles Mixed: 8,000 units\n\nDistributor deliveries will begin this Monday. Retailers who submitted stock requests this week will receive priority delivery. For urgent requests contact the distribution team directly." },
  { id: 5, type: 'Promotion', title: "Maggi Family Pack — Buy 3 Get 1 Free", preview: "New Maggi promotion active from March 10. Share with all retailers immediately. Valid until April 5 across all Maggi variants.", date: 'Mar 08, 2026', read: true, full: "Maggi Family Pack promotion is now active — Buy 3 packs get 1 free on all Maggi Noodles variants. Valid March 10 to April 5. Mix-and-match allowed. No minimum order. Please share with all retailers in your territory immediately. Update retailer records once they acknowledge the promotion." },
];

const TABS = ['All', 'Promotions', 'Announcements', 'Unread'];

export default function Broadcasts() {
  const [broadcasts, setBroadcasts] = useState(INIT_BROADCASTS);
  const [tab, setTab] = useState('All');
  const [expanded, setExpanded] = useState(null);

  function toggleExpand(id) {
    setExpanded(prev => prev === id ? null : id);
    // Mark as read
    setBroadcasts(bs => bs.map(b => b.id === id ? { ...b, read: true } : b));
  }

  const filtered = broadcasts.filter(b => {
    if (tab === 'Unread') return !b.read;
    if (tab === 'Promotions') return b.type === 'Promotion';
    if (tab === 'Announcements') return b.type === 'Announcement';
    return true;
  });

  const unreadCount = broadcasts.filter(b => !b.read).length;

  return (
    <StaffLayout>
      <div className="pb-10 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-[26px] font-extrabold text-[#2C1810]">Broadcasts</h1>
          <p className="text-[15px] font-medium text-gray-500 mt-1">View promotions and announcements from Nestlé HQ</p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 border-b border-[#E0DBD5] overflow-x-auto pb-px">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-[13px] font-bold whitespace-nowrap border-b-2 -mb-px transition-colors ${tab === t ? 'border-[#3D2B1F] text-[#3D2B1F]' : 'border-transparent text-gray-500 hover:text-[#3D2B1F]'}`}>
              {t}
              {t === 'Unread' && unreadCount > 0 && (
                <span className="ml-1.5 bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{unreadCount}</span>
              )}
            </button>
          ))}
        </div>

        {/* Broadcasts List */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 bg-white border border-[#E0DBD5] rounded-[20px]">
            <p className="text-3xl mb-2">📭</p>
            <p className="text-[15px] font-bold text-[#2C1810]">No broadcasts found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(b => {
              const isOpen = expanded === b.id;
              return (
                <div key={b.id} className={`bg-white border rounded-[16px] shadow-sm transition-all overflow-hidden ${!b.read ? 'border-blue-200 bg-blue-50/20' : 'border-[#E0DBD5]'}`}>
                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className={`w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0 ${b.type === 'Promotion' ? 'bg-[#3D2B1F]' : 'bg-[#1D4ED8]'}`}>
                        {b.type === 'Promotion' ? <Tag size={18} className="text-white" /> : <Radio size={18} className="text-white" />}
                      </div>
                      {/* Body */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${b.type === 'Promotion' ? 'bg-[#FEF3C7] text-[#92400E]' : 'bg-blue-100 text-blue-700'}`}>{b.type}</span>
                              {!b.read && <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />}
                            </div>
                            <h3 className={`text-[15px] font-extrabold text-[#2C1810] leading-snug ${!b.read ? '' : 'opacity-90'}`}>{b.title}</h3>
                            <p className="text-[13px] text-gray-500 font-medium mt-1 leading-relaxed line-clamp-2">{b.preview}</p>
                          </div>
                          <span className="text-[12px] text-gray-400 font-medium whitespace-nowrap flex-shrink-0">{b.date}</span>
                        </div>

                        {/* Expanded content */}
                        {isOpen && (
                          <div className="mt-4 p-4 bg-[#F8F7F5] border border-[#E0DBD5] rounded-[12px]">
                            <p className="text-[14px] text-[#2C1810] font-medium leading-relaxed whitespace-pre-line">{b.full}</p>
                          </div>
                        )}

                        <button
                          onClick={() => toggleExpand(b.id)}
                          className="mt-3 text-[13px] font-bold text-[#3D2B1F] hover:underline transition-colors flex items-center gap-1"
                        >
                          {isOpen ? 'Show Less ↑' : 'Read More →'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </StaffLayout>
  );
}
