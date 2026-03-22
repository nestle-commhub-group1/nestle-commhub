import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText, Tag, Package, Truck, CheckCircle, Clock, RefreshCw
} from 'lucide-react';
import axios from 'axios';
import API_URL from '../../config/api';
import RetailerLayout from '../../components/layout/RetailerLayout';
import { 
  formatDate, 
  getCurrentGreeting,
  formatCurrentDate
} from "../../utils/dateUtils";

const PriorityBadge = ({ priority }) => {
  const getPriorityClasses = (p) => {
    const cls = p?.toLowerCase();
    if (cls === 'critical') return 'text-red-700 bg-red-100 border border-red-200';
    if (cls === 'high') return 'text-orange-700 bg-orange-100 border border-orange-200';
    if (cls === 'medium') return 'text-yellow-700 bg-yellow-100 border border-yellow-200';
    if (cls === 'low') return 'text-gray-700 bg-gray-100 border border-gray-200';
    return 'text-gray-700 bg-gray-100';
  };
  return (
    <span className={`px-2.5 py-1 rounded-[6px] text-[12px] font-bold ${getPriorityClasses(priority)}`}>
      {priority?.replace('_', ' ').toUpperCase()}
    </span>
  );
};

const StatusBadge = ({ status }) => {
  const getStatusClasses = (s) => {
    const cls = s?.toLowerCase();
    if (cls === 'open') return 'text-red-700 bg-red-50 border border-red-200';
    if (cls === 'in_progress') return 'text-yellow-700 bg-yellow-50 border border-yellow-200';
    if (cls === 'resolved') return 'text-green-700 bg-green-50 border border-green-200';
    return 'text-gray-700 bg-gray-50';
  };
  return (
    <span className={`px-3 py-1 rounded-full text-[12px] font-bold ${getStatusClasses(status)}`}>
      {status?.replace('_', ' ').toUpperCase()}
    </span>
  );
};

const RetailerDashboard = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    setUser(storedUser);
    fetchTickets();
  }, []);

  // Refetch when user navigates back to this tab/window
  useEffect(() => {
    const handleFocus = () => fetchTickets();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const fetchTickets = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        window.location.href = "/login";
        return;
      }
      const res = await axios.get(`${API_URL}/api/tickets/my`, {
        headers: { Authorization: "Bearer " + token }
      });
      setTickets(res.data.tickets || []);
    } catch (err) {
      console.error("Failed to fetch tickets:", err.response?.data || err.message);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const openCount = tickets.filter(t => t.status === "open").length;
  const inProgressCount = tickets.filter(t => t.status === "in_progress").length;
  const resolvedCount = tickets.filter(t => t.status === "resolved").length;

  const recentTickets = [...tickets]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 4);

  const formatCategory = (category) => {
    const map = {
      stock_out: "Stock Out",
      product_quality: "Product Quality",
      logistics_delay: "Logistics Delay",
      pricing_issue: "Pricing Issue"
    };
    return map[category] || (category?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()));
  };

  const summaryCards = [
    { title: 'Open Tickets', count: openCount, label: 'Awaiting response', icon: <FileText size={20} className="text-nestle-danger" />, borderColor: 'border-red-200', bgColor: 'bg-red-50', link: '#' },
    { title: 'In Progress', count: inProgressCount, label: 'Being handled', icon: <Package size={20} className="text-nestle-warning" />, borderColor: 'border-yellow-200', bgColor: 'bg-yellow-50', link: '#' },
    { title: 'Resolved', count: resolvedCount, label: 'Completed', icon: <CheckCircle size={20} className="text-nestle-success" />, borderColor: 'border-green-200', bgColor: 'bg-green-50', link: '#' },
    { title: 'Promotions', count: 3, label: 'Currently active', icon: <Tag size={20} className="text-blue-500" />, borderColor: 'border-blue-200', bgColor: 'bg-blue-50', link: '#' }
  ];

  if (loading) {
    return (
      <RetailerLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nestle-brown mx-auto mb-4"></div>
            <p className="text-gray-500 font-bold">Loading your dashboard...</p>
          </div>
        </div>
      </RetailerLayout>
    );
  }

  const firstName = user?.fullName?.split(" ")[0] || "there";

  return (
    <RetailerLayout>
      <div className="space-y-8 pb-10">
        <div>
          <h1 className="text-[26px] font-extrabold text-[#2C1810]">{getCurrentGreeting()}, {firstName} 👋</h1>
          <p className="text-[14px] text-gray-500 font-medium mt-1 uppercase tracking-wider">{formatCurrentDate()}</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {summaryCards.map((card, idx) => (
            <Link to={card.link} key={idx} className={`bg-white rounded-[20px] p-6 border shadow-sm flex items-center justify-between hover:shadow-md transition-shadow relative overflow-hidden group border-nestle-border`}>
              {/* Added a subtle color accent bar on the left of each card */}
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${card.bgColor.replace('50', '400')}`}></div>
              <div>
                <p className="text-[14px] font-medium text-gray-500 mb-1 tracking-wide">{card.title}</p>
                <p className="text-[32px] font-extrabold text-nestle-brown leading-none">{card.count}</p>
                <p className="text-[13px] text-gray-500 mt-2 font-medium">{card.label}</p>
              </div>
              <div className={`p-3.5 rounded-2xl ${card.bgColor} transition-transform group-hover:scale-110`}>
                {card.icon}
              </div>
            </Link>
          ))}
        </div>

        {/* Recent Tickets Section */}
        <div className="bg-white border text-nestle-brown border-nestle-border rounded-[20px] shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-nestle-border flex justify-between items-center bg-white">
            <h2 className="text-[18px] font-bold text-nestle-brown tracking-wide">Recent Tickets</h2>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchTickets}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 transition-colors"
                title="Refresh tickets"
              >
                <RefreshCw size={14} />
                Refresh
              </button>
              <Link to="/retailer/tickets" className="text-[14px] font-bold text-nestle-brown-light hover:text-nestle-brown transition-colors flex items-center group">
                View All <span className="ml-1 text-xl leading-none group-hover:translate-x-1 transition-transform">›</span>
              </Link>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[14px] whitespace-nowrap">
              <thead className="bg-[#F8F7F5] text-gray-500 font-bold text-[12px] tracking-wider uppercase">
                <tr>
                  <th className="px-6 py-4 border-b border-nestle-border">Ticket ID</th>
                  <th className="px-6 py-4 border-b border-nestle-border">Issue Type</th>
                  <th className="px-6 py-4 border-b border-nestle-border">Priority</th>
                  <th className="px-6 py-4 border-b border-nestle-border">Status</th>
                  <th className="px-6 py-4 border-b border-nestle-border">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-nestle-border/50 font-medium text-nestle-brown">
                {recentTickets.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-gray-400 font-medium italic">
                      No tickets yet. Submit your first issue!
                    </td>
                  </tr>
                ) : (
                  recentTickets.map(ticket => (
                    <tr key={ticket._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold">{ticket.ticketNumber}</td>
                      <td className="px-6 py-4">{formatCategory(ticket.category)}</td>
                      <td className="px-6 py-4">
                        <PriorityBadge priority={ticket.priority} />
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={ticket.status} />
                      </td>
                      <td className="px-6 py-4 text-gray-500 font-bold">{formatDate(ticket.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 border-t border-nestle-border flex items-center justify-end text-sm text-gray-500 bg-[#F8F7F5]/50">
            <div className="flex space-x-1.5 items-center">
              <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-200 transition-colors text-gray-400">‹</button>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#3D2B1F] text-white font-bold shadow-sm">1</button>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-200 transition-colors font-bold text-nestle-brown">2</button>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-200 transition-colors text-gray-400">›</button>
            </div>
          </div>
        </div>

        {/* Promotions */}
        <div className="bg-white border border-nestle-border rounded-[20px] p-8 shadow-sm text-center">
          <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Tag size={32} />
          </div>
          <h3 className="text-[20px] font-extrabold text-nestle-brown mb-2">Promotions Coming Soon</h3>
          <p className="text-gray-500 font-medium max-w-sm mx-auto">
            Our personalized promotion system is currently under development and will be available in Sprint 2.
          </p>
          <div className="inline-block mt-6 px-4 py-1.5 bg-[#F5F3F0] rounded-full text-[12px] font-bold text-gray-400 uppercase tracking-widest">
            Sprint 2 Development
          </div>
        </div>

        {/* Quick Actions Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
          <button className="bg-[#F5F3F0] border-2 border-transparent hover:border-[#3D2B1F] rounded-[20px] p-6 transition-all flex items-center space-x-5 text-left group">
            <div className="bg-white shadow-sm p-4 rounded-[14px] group-hover:scale-105 transition-transform text-nestle-brown">
              <Package size={28} />
            </div>
            <div>
              <h3 className="font-extrabold text-nestle-brown text-[18px]">Request Stock</h3>
              <p className="text-[14px] font-medium text-gray-500 mt-0.5">Order additional inventory</p>
            </div>
          </button>
          <button className="bg-[#F5F3F0] border-2 border-transparent hover:border-[#3D2B1F] rounded-[20px] p-6 transition-all flex items-center space-x-5 text-left group">
            <div className="bg-white shadow-sm p-4 rounded-[14px] group-hover:scale-105 transition-transform text-nestle-brown">
              <Truck size={28} />
            </div>
            <div>
              <h3 className="font-extrabold text-nestle-brown text-[18px]">Track Delivery</h3>
              <p className="text-[14px] font-medium text-gray-500 mt-0.5">Check your delivery status</p>
            </div>
          </button>
        </div>

      </div>
    </RetailerLayout>
  );
};

export default RetailerDashboard;
