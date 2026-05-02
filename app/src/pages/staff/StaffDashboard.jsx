import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FileText, CheckCircle, Store, AlertCircle, TrendingUp, Check, Loader2, Clock } from 'lucide-react';
import API_URL from '../../config/api';
import StaffLayout from '../../components/layout/StaffLayout';
import { getCurrentGreeting, formatCurrentDate, formatDate } from '../../utils/dateUtils';

const StaffDashboard = () => {

  const [user, setUser] = useState({ fullName: 'Nadeeka' });
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All');

  const isDevMode = import.meta.env.DEV && localStorage.getItem('token')?.startsWith('dev-token-');

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        const name = parsedUser.fullName || parsedUser.name || 'User';
        setUser({ ...parsedUser, fullName: name.split(' ')[0] });
      } catch (e) { }
    }

    const fetchTickets = async () => {
      // Skip API if dev mode
      if (isDevMode) {
        setTickets([
          { _id: '1', ticketNumber: 'TKT-1041', category: 'stock_out', priority: 'high', status: 'in_progress', createdAt: new Date().toISOString() },
          { _id: '2', ticketNumber: 'TKT-1037', category: 'packaging_damage', priority: 'medium', status: 'open', createdAt: new Date().toISOString() }
        ]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem("user");
        const storedUserData = userStr ? JSON.parse(userStr) : null;

        if (!token || !storedUserData) {
          console.log("Missing token or user data in StaffDashboard");
          setLoading(false);
          return;
        }

        const response = await axios.get(`${API_URL}/api/tickets`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.success) {
          setTickets(response.data.tickets || []);
        } else {
          console.warn("API returned success:false in StaffDashboard");
          setTickets([]);
        }
      } catch (err) {
        console.error('Dashboard error:', err.response?.data || err.message);
        // Do NOT crash - just show empty state
        setTickets([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, [isDevMode]);

  const stats = {
    assigned: Array.isArray(tickets) ? tickets.length : 0,
    overdue: Array.isArray(tickets) ? tickets.filter(t => t.isEscalated || (t.slaDeadline && new Date(t.slaDeadline) < new Date() && t.status !== 'resolved')).length : 0,
    resolved: Array.isArray(tickets) ? tickets.filter(t => t.status === 'resolved').length : 0,
    inProgress: Array.isArray(tickets) ? tickets.filter(t => t.status === 'in_progress').length : 0,
  };

  const calculateSLA = (priority) => {
    if (!tickets || tickets.length === 0) return 0;
    const filtered = priority 
      ? tickets.filter(t => t.priority === priority) 
      : tickets;
    if (filtered.length === 0) return 100; // No tickets means 100% compliance
    const onTime = filtered.filter(t => {
      if (t.status === 'resolved') {
        return !t.slaDeadline || new Date(t.resolvedAt || t.updatedAt) <= new Date(t.slaDeadline);
      }
      return !t.slaDeadline || new Date() <= new Date(t.slaDeadline);
    }).length;
    return Math.round((onTime / filtered.length) * 100);
  };

  const slaPerformance = {
    overall: calculateSLA(),
    critical: calculateSLA('critical'),
    high: calculateSLA('high')
  };

  const summaryCards = [
    { 
      title: 'Assigned Tickets', 
      count: stats.assigned, 
      label: 'My workload', 
      icon: <FileText size={20} className="text-[#3B82F6]" />, 
      borderColor: 'border-l-[4px] border-l-[#3B82F6]', 
      bgColor: 'bg-blue-50', 
      link: '/staff/tickets' 
    },
    { 
      title: 'Overdue', 
      count: stats.overdue, 
      label: 'SLA breached', 
      icon: <AlertCircle size={20} className="text-red-600" />, 
      borderColor: 'border-l-[4px] border-l-red-500', 
      bgColor: 'bg-red-50', 
      link: '/staff/tickets' 
    },
    { 
      title: 'Resolved', 
      count: stats.resolved, 
      label: 'Total resolved', 
      icon: <CheckCircle size={20} className="text-green-600" />, 
      borderColor: 'border-l-[4px] border-l-green-500', 
      bgColor: 'bg-green-50', 
      link: '/staff/tickets' 
    },
    { 
      title: 'Active Tasks', 
      count: stats.inProgress, 
      label: 'Work in progress', 
      icon: <Store size={20} className="text-[#3D2B1F]" />, 
      borderColor: 'border-l-[4px] border-l-[#3D2B1F]', 
      bgColor: 'bg-[#F8F7F5]', 
      link: '/staff/tickets' 
    }
  ];

  const getPriorityClasses = (p) => {
    switch (p?.toLowerCase()) {
      case 'critical': return 'text-red-700 bg-red-100 border border-red-200';
      case 'high': return 'text-orange-700 bg-orange-100 border border-orange-200';
      case 'medium': return 'text-yellow-700 bg-yellow-100 border border-yellow-200';
      case 'low': return 'text-gray-700 bg-gray-100 border border-gray-200';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  const getStatusClasses = (s) => {
    switch (s?.toLowerCase()) {
      case 'open': return 'text-red-700 bg-red-50 border border-red-200';
      case 'in_progress': return 'text-yellow-700 bg-yellow-50 border border-yellow-200';
      case 'resolved': return 'text-green-700 bg-green-50 border border-green-200';
      case 'escalated': return 'text-purple-700 bg-purple-50 border border-purple-200';
      default: return 'text-gray-700 bg-gray-50';
    }
  };

  const filteredTickets = tickets.filter(t => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Overdue') return t.isEscalated || (t.slaDeadline && new Date(t.slaDeadline) < new Date() && t.status !== 'resolved');
    if (activeTab === 'In Progress') return t.status === 'in_progress';
    if (activeTab === 'Open') return t.status === 'open';
    return true;
  }).slice(0, 5);

  return (
    <StaffLayout>
      <div className="space-y-8 pb-10">
        {isDevMode && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded-[10px] text-[12px] font-bold flex items-center mb-4">
            Dev mode — showing sample data
          </div>
        )}

        <div>
          <h1 className="text-[26px] font-extrabold text-[#2C1810]">{getCurrentGreeting()}, {user.fullName}</h1>
          <div className="flex items-center text-gray-500 mt-1 text-[14px]">
            <Clock className="w-4 h-4 mr-2" />
            {formatCurrentDate()}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {summaryCards.map((card, idx) => (
            <Link to={card.link} key={idx} className={`bg-white rounded-[16px] p-6 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow relative ${card.borderColor}`}>
              <div>
                <p className="text-[14px] font-semibold text-gray-500 mb-1">{card.title}</p>
                <p className="text-[32px] font-extrabold text-[#3D2B1F] leading-none">{card.count}</p>
                <p className="text-[13px] text-gray-500 mt-2 font-medium">{card.label}</p>
              </div>
              <div className={`p-3.5 rounded-2xl ${card.bgColor} mt-[-20px]`}>
                {card.icon}
              </div>
            </Link>
          ))}
        </div>

        {/* SLA Compliance Section */}
        <div className="bg-white rounded-[20px] p-6 shadow-sm border border-[#E0DBD5]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-[20px] font-extrabold text-[#2C1810] flex items-center">
              <TrendingUp className="mr-2 text-gray-400" size={20} /> SLA Performance
            </h2>
            <span className={`${slaPerformance.overall >= 80 ? 'text-green-600' : 'text-red-600'} font-bold text-[14px] flex items-center`}>
              <TrendingUp className="mr-1" size={16} /> {slaPerformance.overall}% overall
            </span>
          </div>

          <div className="mb-8">
            <div className="flex justify-between text-[13px] font-semibold text-gray-500 mb-2">
              <span>Resolution Rate: 80% Target</span>
              <span className="text-[#3D2B1F] font-bold">{slaPerformance.overall}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3">
              <div className={`${slaPerformance.overall >= 80 ? 'bg-green-500' : 'bg-red-500'} h-3 rounded-full`} style={{ width: `${slaPerformance.overall}%` }}></div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div className="bg-gray-50 p-4 rounded-[12px] border border-[#E0DBD5]">
              <div className="flex justify-between text-[14px] mb-2 font-bold">
                <span className="text-[#3D2B1F]">Critical</span>
                <span>{slaPerformance.critical}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div className={`${slaPerformance.critical >= 90 ? 'bg-green-500' : 'bg-orange-500'} h-2 rounded-full`} style={{ width: `${slaPerformance.critical}%` }}></div>
              </div>
              <p className="text-[12px] text-gray-500 font-medium">Critical issues within resolution time</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-[12px] border border-[#E0DBD5]">
              <div className="flex justify-between text-[14px] mb-2 font-bold">
                <span className="text-[#3D2B1F]">High</span>
                <span>{slaPerformance.high}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div className={`${slaPerformance.high >= 80 ? 'bg-green-500' : 'bg-yellow-500'} h-2 rounded-full`} style={{ width: `${slaPerformance.high}%` }}></div>
              </div>
              <p className="text-[12px] text-gray-500 font-medium">High priority workload status</p>
            </div>
          </div>
        </div>

        {/* Assigned Tickets Section */}
        <div className="bg-white border border-[#E0DBD5] rounded-[20px] shadow-sm overflow-hidden mt-8">
          <div className="px-6 py-5 flex justify-between items-center">
            <h2 className="text-[20px] font-extrabold text-[#2C1810]">My Recent Tickets</h2>
            <Link to="/staff/tickets" className="text-[14px] font-bold text-[#3D2B1F] hover:underline transition-colors">
              View All <span>›</span>
            </Link>
          </div>

          <div className="px-6 border-b border-[#E0DBD5] flex space-x-6 text-[14px] font-bold">
            {['All', 'Open', 'In Progress', 'Overdue'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3 relative flex items-center transition-colors ${activeTab === tab ? 'text-[#3D2B1F]' : 'text-gray-400 hover:text-[#2C1810]'}`}
              >
                {tab}
                {tab === 'Overdue' && stats.overdue > 0 && (
                  <span className="ml-2 bg-red-600 text-white text-[10px] px-1.5 py-0.5 rounded-full">{stats.overdue}</span>
                )}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#3D2B1F] rounded-t-full"></div>
                )}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-[#3D2B1F] animate-spin mb-3" />
                <p className="text-[14px] font-medium text-gray-500">Updating dashboard...</p>
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-[15px] font-bold text-gray-400 italic">No tickets found for this category</p>
              </div>
            ) : (
              <table className="w-full text-left text-[14px] whitespace-nowrap">
                <thead className="bg-[#F8F7F5] text-gray-500 font-bold text-[12px] tracking-wider uppercase">
                  <tr>
                    <th className="px-6 py-4 border-b border-[#E0DBD5]">TICKET ID</th>
                    <th className="px-6 py-4 border-b border-[#E0DBD5]">RETAILER NAME</th>
                    <th className="px-6 py-4 border-b border-[#E0DBD5]">ISSUE TYPE</th>
                    <th className="px-6 py-4 border-b border-[#E0DBD5]">PRIORITY</th>
                    <th className="px-6 py-4 border-b border-[#E0DBD5]">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E0DBD5] font-medium text-[13px]">
                  {filteredTickets.map((ticket) => (
                    <tr key={ticket._id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <Link to={`/staff/tickets/${ticket._id}`} className="font-bold text-[#2563EB] hover:underline">
                          {ticket.ticketNumber}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-[#2C1810]">{ticket.retailerId?.businessName || ticket.retailerId?.fullName || 'Retailer'}</td>
                      <td className="px-6 py-4 text-gray-600">
                        {(ticket.category || "").replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-[6px] text-[11px] font-bold ${getPriorityClasses(ticket.priority)}`}>
                          {ticket.priority.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[11px] font-bold ${getStatusClasses(ticket.status)}`}>
                          {(ticket.status === 'in_progress' ? 'In Progress' : ticket.status).toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Recent Activity (Placeholder logic for now) */}
        <div className="bg-white rounded-[20px] p-6 shadow-sm border border-[#E0DBD5] mt-8">
          <h2 className="text-[20px] font-extrabold text-[#2C1810] mb-6">Operations Log</h2>

          <div className="space-y-6">
            {tickets.slice(0, 5).map((t, idx) => (
              <div key={idx} className="flex relative items-start">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 z-10 mt-0.5 ${t.status === 'resolved' ? 'bg-green-500' : 'bg-[#3D2B1F]'}`}>
                   {t.status === 'resolved' ? <Check size={14} className="text-white" /> : <FileText size={14} className="text-white" />}
                </div>
                <div className="ml-4">
                  <p className="text-[14px] font-bold text-[#2C1810] leading-snug">
                    {t.status === 'resolved' ? 'Resolved' : 'Active'} ticket {t.ticketNumber} — {(t.category || "").replace(/_/g, ' ')}
                  </p>
                  <p className="text-[12px] text-gray-400 font-medium mt-1">{formatDate(t.updatedAt || t.createdAt)}</p>
                </div>
              </div>
            ))}
            {tickets.length === 0 && (
              <p className="text-[14px] text-gray-400 italic">No recent activity found.</p>
            )}
          </div>
          <p className="text-center text-[12px] text-gray-400 mt-8 italic font-medium">End of activity log</p>
        </div>

      </div>
    </StaffLayout>
  );
};

export default StaffDashboard;
