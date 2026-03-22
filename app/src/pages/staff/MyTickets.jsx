import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import API_URL from '../../config/api';
import StaffLayout from '../../components/layout/StaffLayout';
import { Search, ChevronDown, Loader2, AlertCircle } from 'lucide-react';

const TABS = ['All', 'Open', 'In Progress', 'Overdue', 'Escalated'];

const priCls = p => ({
  Critical: 'text-red-700 bg-red-100 border border-red-200',
  High: 'text-orange-700 bg-orange-100 border border-orange-200',
  Medium: 'text-yellow-700 bg-yellow-100 border border-yellow-200',
  Low: 'text-gray-600 bg-gray-100 border border-gray-200'
}[p] || 'text-gray-600 bg-gray-100');

const staCls = s => ({
  'Open': 'text-red-700 bg-red-50 border border-red-200',
  'In Progress': 'text-yellow-700 bg-yellow-50 border border-yellow-200',
  'Resolved': 'text-green-700 bg-green-50 border border-green-200',
  'Escalated': 'text-purple-700 bg-purple-100 border border-purple-200'
}[s] || 'text-gray-600 bg-gray-50');

export default function StaffMyTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [sort, setSort] = useState('Newest First');

  const isDevMode = import.meta.env.DEV && localStorage.getItem('token')?.startsWith('dev-token-');

  useEffect(() => {
    const fetchTickets = async () => {
      const token = localStorage.getItem('token');
      if (!token) { setLoading(false); return; }

      // Skip API if dev mode
      if (isDevMode) {
        setTickets([
          { id: 'TKT-1041', retailer: 'Saman General Stores', issue: 'Stock Out', priority: 'High', status: 'In Progress', sla: 'Mar 15, 2:23 PM', slaBreached: false, _id: '1041' },
          { id: 'TKT-1037', retailer: 'Chamara Perera', issue: 'Packaging Damage', priority: 'Medium', status: 'Open', sla: 'Mar 18, 5:00 PM', slaBreached: false, _id: '1037' },
          { id: 'TKT-0992', retailer: 'Aruna Mini Mart', issue: 'Logistics Delay', priority: 'Low', status: 'Resolved', sla: 'Mar 10, 11:00 AM', slaBreached: true, _id: '0992' }
        ]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const res = await axios.get(`${API_URL}/api/tickets`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          const mapped = res.data.tickets.map(t => ({
            id: t.ticketNumber || t._id,
            retailer: t.retailerId?.businessName || t.retailerId?.fullName || 'Retailer',
            issue: (t.category || "unknown").replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
            priority: (t.priority || "medium").charAt(0).toUpperCase() + (t.priority || "medium").slice(1),
            status: (t.status || "open").replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
            sla: t.slaDeadline ? new Date(t.slaDeadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—',
            slaBreached: t.isEscalated || (t.slaDeadline && new Date(t.slaDeadline) < new Date() && t.status !== 'resolved'),
            _id: t._id,
          }));
          setTickets(mapped);
          setError(null);
        }
      } catch (err) {
        console.error('Error fetching staff tickets:', err);
        setError('Failed to load tickets. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchTickets();
  }, [isDevMode]);

  const stats = {
    assigned: tickets.length,
    overdue: tickets.filter(t => t.slaBreached).length,
    resolvedToday: tickets.filter(t => t.status === 'Resolved').length, // Simple count
    inProgress: tickets.filter(t => t.status === 'In Progress').length,
  };

  const filtered = tickets.filter(t => {
    const matchTab =
      activeTab === 'All' ||
      (activeTab === 'Overdue' ? t.slaBreached : t.status === activeTab);
    const q = search.toLowerCase();
    return matchTab && (!q || (t.id || "").toLowerCase().includes(q) || (t.retailer || "").toLowerCase().includes(q));
  });

  return (
    <StaffLayout>
      <div className="pb-10 space-y-6">
        {isDevMode && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded-[10px] text-[12px] font-bold flex items-center mb-4">
            <span className="mr-2">ℹ️</span> Dev mode — showing sample data
          </div>
        )}

        <div>
          <h1 className="text-[26px] font-extrabold text-[#2C1810]">My Tickets</h1>
          <p className="text-[15px] font-medium text-gray-500 mt-1">Manage and resolve assigned retailer issues</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Assigned', value: stats.assigned, accent: 'border-l-4 border-l-[#3B82F6]', icon: '🎫', text: 'text-[#2C1810]' },
            { label: 'Overdue', value: stats.overdue, accent: 'border-l-4 border-l-red-500', icon: '⚠️', text: 'text-red-600' },
            { label: 'Resolved', value: stats.resolvedToday, accent: 'border-l-4 border-l-green-500', icon: '✅', text: 'text-green-600' },
            { label: 'In Progress', value: stats.inProgress, accent: 'border-l-4 border-l-yellow-400', icon: '🔄', text: 'text-yellow-700' },
          ].map(c => (
            <div key={c.label} className={`bg-white rounded-[16px] p-5 shadow-sm ${c.accent}`}>
              <p className="text-[12px] font-bold text-gray-400 uppercase tracking-widest mb-1">{c.label}</p>
              <p className={`text-[32px] font-extrabold leading-none ${c.text}`}>{c.value}</p>
            </div>
          ))}
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by ticket ID or retailer name..." className="w-full pl-10 pr-4 py-3 border border-[#E0DBD5] rounded-[10px] text-[14px] font-medium text-[#2C1810] placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-[#3D2B1F]/20" />
          </div>
          <div className="relative">
            <select value={sort} onChange={e => setSort(e.target.value)} className="appearance-none border border-[#E0DBD5] rounded-[10px] px-4 pr-10 py-3 text-[14px] font-medium text-[#2C1810] bg-white focus:outline-none w-40">
              <option>Newest First</option>
              <option>Oldest First</option>
              <option>Priority: High</option>
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Status Tabs */}
        <div className="flex space-x-1 border-b border-[#E0DBD5] overflow-x-auto pb-px">
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-[13px] font-bold whitespace-nowrap border-b-2 -mb-px transition-colors ${activeTab === tab ? 'border-[#3D2B1F] text-[#3D2B1F]' : 'border-transparent text-gray-500 hover:text-[#3D2B1F]'}`}>
              {tab}
              {tab === 'Overdue' && stats.overdue > 0 && (
                <span className="ml-1.5 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{stats.overdue}</span>
              )}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white border border-[#E0DBD5] rounded-[20px] shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Loader2 className="w-8 h-8 text-[#3D2B1F] animate-spin mb-3" />
              <p className="text-[14px] font-medium">Loading tickets...</p>
            </div>
          ) : error ? (
            <div className="text-center py-20 bg-red-50">
              <AlertCircle size={40} className="text-red-500 mx-auto mb-3" />
              <p className="text-[15px] font-bold text-red-700">{error}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-3xl mb-2">🎉</p>
              <p className="text-[15px] font-bold text-[#2C1810]">No tickets found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px] whitespace-nowrap">
                <thead className="bg-[#F8F7F5] text-gray-500 font-bold text-[11px] tracking-wider uppercase">
                  <tr>
                    {['Ticket ID', 'Retailer', 'Issue Type', 'Priority', 'Status', 'SLA Deadline', 'Action'].map(h => (
                      <th key={h} className="px-5 py-4 border-b border-[#E0DBD5]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E0DBD5]/50 font-medium">
                  {filtered.map(t => (
                    <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-4 font-bold text-[#2563EB]">{t.id}</td>
                      <td className="px-5 py-4 text-[#2C1810]">{t.retailer}</td>
                      <td className="px-5 py-4 text-gray-600">{t.issue}</td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 rounded-[6px] text-[11px] font-bold ${priCls(t.priority)}`}>{t.priority.toUpperCase()}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-3 py-1 rounded-full text-[11px] font-bold ${staCls(t.status)}`}>{t.status}</span>
                      </td>
                      <td className="px-5 py-4">
                        {t.slaBreached ? (
                          <span className="text-[11px] font-bold text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">SLA BREACHED</span>
                        ) : (
                          <span className="text-[13px] font-medium text-gray-600">{t.sla}</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <Link to={`/staff/tickets/${t._id}`}
                          className="text-[12px] font-bold px-3 py-1.5 border border-[#3D2B1F] text-[#3D2B1F] rounded-[8px] hover:bg-[#F5F3F0] transition-colors">
                          View
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
    </StaffLayout>
  );
}
