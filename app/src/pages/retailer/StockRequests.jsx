import React, { useState } from 'react';
import RetailerLayout from '../../components/layout/RetailerLayout';
import { Search, Plus, Minus } from 'lucide-react';

const PRODUCTS = [
  { id: 1, name: 'Milo 400g', sku: 'MLO-400', stock: 'Out of Stock' },
  { id: 2, name: 'Nescafé Classic 200g', sku: 'NES-200', stock: 'Low Stock' },
  { id: 3, name: 'Maggi Noodles Mixed', sku: 'MAG-MIX', stock: 'Low Stock' },
  { id: 4, name: 'KitKat 4 Finger', sku: 'KIT-4F', stock: 'Out of Stock' },
  { id: 5, name: 'Nestlé Munch', sku: 'MUN-CHO', stock: 'In Stock' },
];

const PAST = [
  { id: 'REQ-001', date: 'Mar 10', items: 3, status: 'Delivered' },
  { id: 'REQ-002', date: 'Mar 05', items: 2, status: 'Processing' },
  { id: 'REQ-003', date: 'Feb 28', items: 5, status: 'Delivered' },
];

const stockBadge = { 'Out of Stock': 'bg-red-100 text-red-700 border border-red-200', 'Low Stock': 'bg-yellow-100 text-yellow-700 border border-yellow-200', 'In Stock': 'bg-green-100 text-green-700 border border-green-200' };
const statusBadge = { 'Delivered': 'bg-green-100 text-green-700', 'Processing': 'bg-yellow-100 text-yellow-700' };

const defaultQty = Object.fromEntries(PRODUCTS.map(p => [p.id, 1]));

export default function StockRequests() {
  const [activeTab, setActiveTab] = useState('new');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [qty, setQty] = useState(defaultQty);
  const [address, setAddress] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const filtered = PRODUCTS.filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()));

  function toggleProduct(id) {
    setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  function adjustQty(id, delta) {
    setQty(q => ({ ...q, [id]: Math.max(1, (q[id] || 1) + delta) }));
  }

  function handleSubmit() {
    const order = PRODUCTS.filter(p => selected.has(p.id)).map(p => ({ ...p, qty: qty[p.id] }));
    console.log('Stock request:', { items: order, address, deliveryDate, notes });
    setSubmitted(true);
    setTimeout(() => { setSubmitted(false); setSelected(new Set()); setAddress(''); setDeliveryDate(''); setNotes(''); }, 3000);
  }

  const selectedItems = PRODUCTS.filter(p => selected.has(p.id));

  return (
    <RetailerLayout>
      <div className="pb-10 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-[26px] font-extrabold text-[#2C1810]">Stock Requests</h1>
          <p className="text-[15px] font-medium text-gray-500 mt-1">Request stock replenishment from Nestlé</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#E0DBD5]">
          {[['new', 'New Request'], ['history', 'My Requests']].map(([value, label]) => (
            <button key={value} onClick={() => setActiveTab(value)}
              className={`px-5 py-3 text-[14px] font-bold border-b-2 -mb-px transition-colors ${activeTab === value ? 'border-[#3D2B1F] text-[#3D2B1F]' : 'border-transparent text-gray-500 hover:text-[#3D2B1F]'}`}>
              {label}
            </button>
          ))}
        </div>

        {/* NEW REQUEST TAB */}
        {activeTab === 'new' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left — Product Selection */}
            <div>
              <h3 className="text-[12px] font-extrabold text-[#3D2B1F] uppercase tracking-widest mb-4">Select Products</h3>
              <div className="relative mb-3">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..." className="w-full pl-9 pr-4 py-2.5 border border-[#E0DBD5] rounded-[10px] text-[14px] text-[#2C1810] font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3D2B1F]/20 bg-white" />
              </div>
              <div className="space-y-2">
                {filtered.map(p => {
                  const isSel = selected.has(p.id);
                  return (
                    <div key={p.id} className={`bg-white border-2 rounded-[14px] p-4 transition-all ${isSel ? 'border-[#3D2B1F] shadow-sm' : 'border-[#E0DBD5]'}`}>
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-3">
                          <input type="checkbox" checked={isSel} onChange={() => toggleProduct(p.id)} className="w-4 h-4 accent-[#3D2B1F]" />
                          <div>
                            <p className="text-[14px] font-bold text-[#2C1810]">{p.name}</p>
                            <p className="text-[11px] text-gray-400 font-medium">{p.sku}</p>
                          </div>
                        </div>
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${stockBadge[p.stock]}`}>{p.stock}</span>
                      </div>
                      {isSel && (
                        <div className="mt-3 flex items-center gap-3">
                          <span className="text-[12px] text-gray-500 font-medium">Quantity:</span>
                          <div className="flex items-center border border-[#E0DBD5] rounded-[8px] overflow-hidden">
                            <button onClick={() => adjustQty(p.id, -1)} className="px-3 py-1.5 hover:bg-[#F5F3F0] transition-colors text-[#3D2B1F]"><Minus size={14} /></button>
                            <span className="px-4 py-1.5 text-[14px] font-bold text-[#2C1810] border-x border-[#E0DBD5]">{qty[p.id]}</span>
                            <button onClick={() => adjustQty(p.id, 1)} className="px-3 py-1.5 hover:bg-[#F5F3F0] transition-colors text-[#3D2B1F]"><Plus size={14} /></button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right — Order Summary */}
            <div>
              <h3 className="text-[12px] font-extrabold text-[#3D2B1F] uppercase tracking-widest mb-4">Order Summary</h3>
              <div className="bg-white border border-[#E0DBD5] rounded-[20px] p-6 shadow-sm space-y-5">
                {selectedItems.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-3xl mb-2">📦</p>
                    <p className="text-[14px] font-bold text-gray-500">No products selected yet</p>
                    <p className="text-[12px] text-gray-400 mt-0.5">Select products from the list</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedItems.map(p => (
                      <div key={p.id} className="flex items-center justify-between text-[14px]">
                        <span className="font-medium text-[#2C1810] truncate mr-2">{p.name}</span>
                        <span className="font-bold text-[#2C1810] flex-shrink-0">× {qty[p.id]}</span>
                      </div>
                    ))}
                    <div className="border-t border-[#E0DBD5] pt-2 mt-2">
                      <p className="text-[13px] text-gray-500 font-medium">{selectedItems.length} product type(s) selected</p>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[12px] font-bold text-[#3D2B1F] uppercase tracking-wide mb-2">Delivery Address</label>
                  <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Enter delivery address..." className="w-full border border-[#E0DBD5] rounded-[10px] px-4 py-3 text-[14px] font-medium text-[#2C1810] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3D2B1F]/20" />
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-[#3D2B1F] uppercase tracking-wide mb-2">Preferred Delivery Date</label>
                  <input type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} className="w-full border border-[#E0DBD5] rounded-[10px] px-4 py-3 text-[14px] font-medium text-[#2C1810] focus:outline-none focus:ring-2 focus:ring-[#3D2B1F]/20" />
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-[#3D2B1F] uppercase tracking-wide mb-2">Additional Notes <span className="text-gray-400 normal-case font-medium tracking-normal">(optional)</span></label>
                  <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any special instructions..." className="w-full border border-[#E0DBD5] rounded-[10px] px-4 py-3 text-[14px] font-medium text-[#2C1810] placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-[#3D2B1F]/20" />
                </div>

                {submitted ? (
                  <div className="bg-green-50 border border-green-200 rounded-[12px] p-4 text-center">
                    <p className="text-[15px] font-bold text-green-700">✓ Request submitted successfully!</p>
                    <p className="text-[13px] text-green-600 mt-1">Our team will process your order shortly.</p>
                  </div>
                ) : (
                  <button onClick={handleSubmit} disabled={selectedItems.length === 0}
                    className="w-full bg-[#3D2B1F] text-white font-bold py-3.5 rounded-[12px] hover:bg-[#2C1810] transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-[15px]">
                    Submit Request
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* MY REQUESTS TAB */}
        {activeTab === 'history' && (
          <div className="bg-white border border-[#E0DBD5] rounded-[20px] shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[14px] text-left">
                <thead className="bg-[#F8F7F5] text-gray-500 text-[12px] font-bold uppercase tracking-wider">
                  <tr>
                    {['Request ID', 'Date', 'Items', 'Status', 'Action'].map(h => (
                      <th key={h} className="px-6 py-4 border-b border-[#E0DBD5]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E0DBD5]/50">
                  {PAST.map(r => (
                    <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-[#2563EB]">{r.id}</td>
                      <td className="px-6 py-4 text-gray-600 font-medium">{r.date}</td>
                      <td className="px-6 py-4 text-gray-600 font-medium">{r.items} items</td>
                      <td className="px-6 py-4">
                        <span className={`text-[12px] font-bold px-3 py-1 rounded-full ${statusBadge[r.status]}`}>{r.status}</span>
                      </td>
                      <td className="px-6 py-4">
                        <button className="text-[13px] font-bold text-[#3D2B1F] hover:underline">View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </RetailerLayout>
  );
}
