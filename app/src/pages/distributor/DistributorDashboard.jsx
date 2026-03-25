import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ClipboardList, ArrowRight,
  Clock, CheckCircle, AlertCircle
} from 'lucide-react';
import API_URL from '../../config/api';
import DistributorLayout from '../../components/layout/DistributorLayout';

const priClass = p => ({
  critical: 'bg-red-50 text-red-700 border-red-200',
  high:     'bg-orange-50 text-orange-700 border-orange-200',
  medium:   'bg-yellow-50 text-yellow-700 border-yellow-200',
  low:      'bg-gray-50 text-gray-700 border-gray-200',
}[p?.toLowerCase()] ?? 'bg-gray-50 text-gray-700');

const staClass = s => ({
  open:        'bg-red-50 text-red-700',
  in_progress: 'bg-yellow-50 text-yellow-700',
  resolved:    'bg-green-50 text-green-700',
  escalated:   'bg-purple-50 text-purple-700',
}[s?.toLowerCase()] ?? 'bg-gray-50 text-gray-600');

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
}

const DistributorDashboard = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) { navigate('/login'); return; }
        const res = await axios.get(`${API_URL}/api/tickets`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data.success) setTickets(res.data.tickets || []);
        else setError('Could not load tickets.');
      } catch (e) {
        setError(e.response?.data?.message || 'Failed to connect to the server.');
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  const stats = [
    {
      label: 'Total Allocated',
      count: tickets.length,
      icon: <ClipboardList size={20} className="text-blue-500"/>,
      bg: 'bg-blue-50',
    },
    {
      label: 'Active Issues',
      count: tickets.filter(t => t.status !== 'resolved').length,
      icon: <AlertCircle size={20} className="text-orange-500"/>,
      bg: 'bg-orange-50',
    },
    {
      label: 'Resolved',
      count: tickets.filter(t => t.status === 'resolved').length,
      icon: <CheckCircle size={20} className="text-green-500"/>,
      bg: 'bg-green-50',
    },
  ];

  return (
    <DistributorLayout>
      <div className="space-y-8 pb-10">
        <div>
          <h1 className="text-[26px] font-extrabold text-[#2C1810]">Distributor Dashboard</h1>
          <p className="text-[15px] font-medium text-gray-500 mt-1">Manage and update your allocated issues</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {stats.map(s => (
            <div key={s.label} className="bg-white rounded-[16px] border border-nestle-border shadow-sm p-6 flex items-center gap-5">
              <div className={`p-3.5 rounded-2xl ${s.bg}`}>{s.icon}</div>
              <div>
                <p className="text-[13px] text-gray-500 font-semibold">{s.label}</p>
                <p className="text-[32px] font-extrabold text-nestle-brown leading-none">{s.count}</p>
              </div>
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-[12px] px-5 py-4 font-medium text-[14px]">
            ⚠️ {error}
          </div>
        )}

        {/* Ticket cards */}
        <div>
          <h2 className="text-[20px] font-extrabold text-nestle-brown mb-5 flex items-center">
            Active Allocations
            <span className="ml-3 bg-nestle-danger text-white text-[12px] font-bold px-2 py-0.5 rounded-full">
              {tickets.length}
            </span>
          </h2>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 text-gray-400">
              <div className="w-10 h-10 border-4 border-nestle-brown border-t-transparent rounded-full animate-spin mb-4"/>
              <p className="font-medium">Loading your allocations...</p>
            </div>
          ) : tickets.length === 0 ? (
            <div className="bg-white border border-dashed border-nestle-border rounded-[24px] py-24 flex flex-col items-center text-gray-400">
              <CheckCircle size={48} className="mb-4 text-gray-300"/>
              <p className="text-[18px] font-extrabold text-gray-500 mb-1">No Active Allocations</p>
              <p className="text-[14px] font-medium">HQ hasn't allocated any issues to you yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {tickets.map(ticket => (
                <button
                  key={ticket._id}
                  onClick={() => navigate(`/distributor/tickets/${ticket._id}`)}
                  className="text-left bg-white border border-nestle-border rounded-[20px] p-6 shadow-sm hover:shadow-md transition-all group relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-red-50 to-transparent rounded-bl-[100px]"/>

                  <div className="flex items-start justify-between mb-3">
                    <span className="font-bold text-[15px] text-nestle-brown tracking-tight">{ticket.ticketNumber}</span>
                    <span className={`px-2 py-1 rounded-[6px] text-[10px] font-bold tracking-widest uppercase border ${priClass(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                  </div>

                  <p className="font-extrabold text-[15px] text-nestle-brown mb-1">
                    {(ticket.category || '').replace(/_/g, ' ')}
                  </p>
                  <p className="text-[13px] text-gray-500 font-medium mb-5 capitalize">
                    {ticket.retailerId?.businessName || ticket.retailerId?.fullName || 'Retailer'}
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${staClass(ticket.status)}`}>
                      {(ticket.status || '').replace('_', ' ').toUpperCase()}
                    </span>
                    <span className="flex items-center gap-1 text-[12px] font-bold text-[#3B82F6] opacity-0 group-hover:opacity-100 transition-opacity -translate-x-1 group-hover:translate-x-0 duration-200">
                      View Details <ArrowRight size={13}/>
                    </span>
                  </div>

                  <p className="text-[11px] text-gray-400 font-medium mt-3 flex items-center gap-1">
                    <Clock size={11}/> {formatDate(ticket.createdAt)}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </DistributorLayout>
  );
};

export default DistributorDashboard;
