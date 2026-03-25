import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, Ticket, AlertCircle, Clock, CheckCircle, TrendingUp, ChevronRight, BarChart3, ShieldAlert,
  FileText, Map, Check, Loader2
} from 'lucide-react';
import axios from 'axios';
import API_URL from '../../config/api';
import AdminLayout from '../../components/layout/AdminLayout';
import { isToday } from '../../utils/dateUtils';

const AdminDashboard = () => {
  const [user, setUser] = useState({ fullName: 'Admin' });
  const [activeTab, setActiveTab] = useState('All');
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({ total: 0, critical: 0, slaBreaches: 0, resolvedToday: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const [usersCount, setUsersCount] = useState(0);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (e) { }
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const [ticketsRes, usersRes] = await Promise.all([
          axios.get(`${API_URL}/api/tickets`, { headers: { Authorization: "Bearer " + token } }),
          axios.get(`${API_URL}/api/users`, { headers: { Authorization: "Bearer " + token } })
        ]);
        
        if (ticketsRes.data.success) {
          const allTickets = ticketsRes.data.tickets || [];
          setTickets(allTickets);
          
          // Calculate stats
          const critical = allTickets.filter(t => t.priority === "critical").length;
          const slaBreaches = allTickets.filter(t => 
            t.slaDeadline && new Date(t.slaDeadline) < new Date() && t.status !== "resolved"
          ).length;
          const resolvedToday = allTickets.filter(t => 
            t.status === "resolved" && isToday(t.resolvedAt)
          ).length;
          
          setStats({
            total: allTickets.length,
            critical,
            slaBreaches,
            resolvedToday
          });
        }

        if (usersRes.data.success) {
          setUsersCount(usersRes.data.users?.length || 0);
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setError("Failed to load platform data");
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchData();
    else setLoading(false);
  }, []);

  const firstName = user?.fullName?.split(" ")[0] || "Admin";

  const summaryCards = [
    { title: 'Total Tickets', count: stats.total, label: 'Across all regions', icon: <FileText size={20} className="text-[#3B82F6]" />, borderColor: 'border-l-[4px] border-l-[#3B82F6]', bgColor: 'bg-blue-50', link: '#' },
    { title: 'Critical Tickets', count: stats.critical, label: 'Needs immediate attention', icon: <AlertCircle size={20} className="text-nestle-danger" />, borderColor: 'border-l-[4px] border-l-nestle-danger', bgColor: 'bg-red-50', link: '#' },
    { title: 'SLA Breaches', count: stats.slaBreaches, label: 'Across all regions', icon: <AlertCircle size={20} className="text-nestle-danger" />, borderColor: 'border-l-[4px] border-l-nestle-danger', bgColor: 'bg-red-50', link: '#' },
    { title: 'Active Users', count: usersCount, label: 'On the platform', icon: <Users size={20} className="text-nestle-success" />, borderColor: 'border-l-[4px] border-l-nestle-success', bgColor: 'bg-green-50', link: '/admin/users' },
    { title: 'Regions', count: 5, label: 'Active regions', icon: <Map size={20} className="text-[#8B5A2B]" />, borderColor: 'border-l-[4px] border-l-nestle-brown', bgColor: 'bg-[#FDF8F3]', link: '#' },
    { title: 'Resolved Today', count: stats.resolvedToday, label: 'Platform wide', icon: <CheckCircle size={20} className="text-nestle-success" />, borderColor: 'border-l-[4px] border-l-nestle-success', bgColor: 'bg-green-50', link: '#' }
  ];

  const regionalSLA = [
    { region: 'Western Province', total: 48, resolved: 41, sla: '85%', status: 'On Track', statusColor: 'text-nestle-success bg-green-50 border-green-200' },
    { region: 'Central Province', total: 31, resolved: 24, sla: '77%', status: 'At Risk', statusColor: 'text-nestle-warning bg-yellow-50 border-yellow-200' },
    { region: 'Southern Province', total: 27, resolved: 21, sla: '78%', status: 'At Risk', statusColor: 'text-nestle-warning bg-yellow-50 border-yellow-200' },
    { region: 'Northern Province', total: 22, resolved: 15, sla: '68%', status: 'Breached', statusColor: 'text-nestle-danger bg-red-50 border-red-200' },
    { region: 'Eastern Province', total: 14, resolved: 10, sla: '71%', status: 'At Risk', statusColor: 'text-nestle-warning bg-yellow-50 border-yellow-200' }
  ];

  const escalatedTickets = tickets.filter(t => t.isEscalated);

  const filteredTickets = activeTab === 'All' 
    ? tickets 
    : activeTab === 'Critical' 
    ? tickets.filter(t => t.priority === 'critical')
    : activeTab === 'Escalated'
    ? tickets.filter(t => t.isEscalated)
    : activeTab === 'SLA Breached'
    ? tickets.filter(t => t.slaDeadline && new Date(t.slaDeadline) < new Date() && t.status !== 'resolved')
    : tickets;

  const formatType = (type) => type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Issue';

  const getPriorityClasses = (priority) => {
    switch (priority) {
      case 'Critical': return 'text-red-700 bg-red-100 border border-red-200';
      case 'High': return 'text-orange-700 bg-orange-100 border border-orange-200';
      case 'Medium': return 'text-yellow-700 bg-yellow-100 border border-yellow-200';
      case 'Low': return 'text-gray-700 bg-gray-100 border border-gray-200';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  const getStatusClasses = (status) => {
    switch (status) {
      case 'Open': return 'text-red-700 bg-red-50 border border-red-200';
      case 'In Progress': return 'text-yellow-700 bg-yellow-50 border border-yellow-200';
      case 'Resolved': return 'text-green-700 bg-green-50 border border-green-200';
      case 'Escalated': return 'text-nestle-brown bg-nestle-brown/10 border border-nestle-brown/20';
      case 'SLA Breached': return 'text-white bg-nestle-danger border border-red-700';
      default: return 'text-gray-700 bg-gray-50';
    }
  };

  const recentActivity = tickets.slice(0, 5).map(t => ({
    type: t.isEscalated ? 'escalated' : t.status === 'resolved' ? 'resolved' : 'update',
    text: `${t.isEscalated ? 'Escalated' : t.status === 'resolved' ? 'Resolved' : 'Updated'} ticket ${t.ticketNumber} — ${(t.category || "").replace(/_/g, ' ')}`,
    subtext: `Western · ${new Date(t.updatedAt || t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
    color: t.isEscalated ? 'bg-nestle-danger' : t.status === 'resolved' ? 'bg-nestle-success' : 'bg-[#3B82F6]',
    icon: t.status === 'resolved' ? <Check size={14} className="text-white" /> : <AlertCircle size={14} className="text-white" />
  }));

  const overallSLA = stats.total > 0 ? Math.round(((stats.total - stats.slaBreaches) / stats.total) * 100) : 100;

  return (
    <AdminLayout>
      <div className="space-y-8 pb-10">
        <div>
          <h1 className="text-[26px] font-extrabold text-[#2C1810]">Welcome back, {firstName} 👋</h1>
          <div className="flex items-center text-gray-500 mt-1 text-[14px]">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            {currentDate}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {summaryCards.map((card, idx) => (
            <Link to={card.link} key={idx} className={`bg-white rounded-[16px] p-6 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow relative ${card.borderColor}`}>
              <div>
                <p className="text-[14px] font-semibold text-gray-500 mb-1">{card.title}</p>
                <p className="text-[32px] font-extrabold text-nestle-brown leading-none">{card.count}</p>
                <p className="text-[13px] text-gray-500 mt-2 font-medium">{card.label}</p>
              </div>
              <div className={`p-3.5 rounded-2xl ${card.bgColor} mt-[-20px]`}>
                {card.icon}
              </div>
            </Link>
          ))}
        </div>

        {/* Platform SLA Compliance Section */}
        <div className="bg-white rounded-[20px] p-6 shadow-sm border border-nestle-border">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-[20px] font-extrabold text-nestle-brown flex items-center">
              <TrendingUp className="mr-2 text-gray-400" size={20} /> Platform SLA Compliance
            </h2>
          </div>

          <div className="mb-8">
            <div className="flex justify-between text-[13px] font-semibold text-gray-500 mb-2">
              <span>Overall SLA Target: 80%</span>
              <span className={`${overallSLA >= 80 ? 'text-nestle-success' : 'text-nestle-danger'} font-bold`}>{overallSLA}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3">
              <div className={`${overallSLA >= 80 ? 'bg-nestle-success' : 'bg-nestle-danger'} h-3 rounded-full transition-all`} style={{ width: `${overallSLA}%` }}></div>
            </div>
          </div>

          <div className="overflow-x-auto border border-nestle-border rounded-[12px]">
            <table className="w-full text-left text-[14px] whitespace-nowrap">
              <thead className="bg-[#F8F7F5] text-gray-500 font-bold text-[12px] tracking-wider uppercase border-b border-nestle-border">
                <tr>
                  <th className="px-5 py-3">Region</th>
                  <th className="px-5 py-3">Total</th>
                  <th className="px-5 py-3">Resolved</th>
                  <th className="px-5 py-3">SLA %</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-[13px]">
                {regionalSLA.map((region, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50">
                    <td className="px-5 py-3 text-nestle-brown font-bold">{region.region}</td>
                    <td className="px-5 py-3 text-gray-600">{region.total}</td>
                    <td className="px-5 py-3 text-gray-600">{region.resolved}</td>
                    <td className="px-5 py-3 font-bold text-nestle-brown">{region.sla}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2.5 py-1 rounded-[6px] text-[11px] font-bold border ${region.statusColor}`}>
                        {region.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Escalated to HQ Section */}
        <div className="bg-white border text-nestle-brown border-red-200 rounded-[20px] shadow-sm overflow-hidden mt-8">
          <div className="px-6 py-5 flex items-center bg-red-50/30 border-b border-red-100">
            <h2 className="text-[20px] font-extrabold text-[#8B0000]">Escalated to HQ</h2>
            <span className="ml-3 bg-nestle-danger text-white text-[11px] font-bold px-2 py-0.5 rounded-full">{escalatedTickets.length}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[14px] whitespace-nowrap">
              <thead className="bg-[#F8F7F5] text-gray-500 font-bold text-[12px] tracking-wider uppercase">
                <tr>
                  <th className="px-6 py-4 border-b border-nestle-border">TICKET ID</th>
                  <th className="px-6 py-4 border-b border-nestle-border">REGION</th>
                  <th className="px-6 py-4 border-b border-nestle-border">RETAILER</th>
                  <th className="px-6 py-4 border-b border-nestle-border">ISSUE TYPE</th>
                  <th className="px-6 py-4 border-b border-nestle-border">ESCALATED BY</th>
                  <th className="px-6 py-4 border-b border-nestle-border">PRIORITY</th>
                  <th className="px-6 py-4 border-b border-nestle-border">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-[13px]">
                {escalatedTickets.length > 0 ? escalatedTickets.map((ticket, idx) => (
                  <tr key={idx} className="hover:bg-red-50/20 transition-colors">
                    <td className="px-6 py-4 font-bold text-nestle-brown">{ticket.ticketNumber}</td>
                    <td className="px-6 py-4 text-gray-600 font-bold">Western</td>
                    <td className="px-6 py-4 text-nestle-brown">{ticket.retailerId?.businessName || ticket.retailerId?.fullName || 'Retailer'}</td>
                    <td className="px-6 py-4 text-gray-600">{formatType(ticket.category)}</td>
                    <td className="px-6 py-4 text-gray-600">{ticket.assignedTo?.fullName || 'Unassigned'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-[6px] text-[11px] font-bold ${getPriorityClasses(ticket.priority?.charAt(0).toUpperCase() + ticket.priority?.slice(1))}`}>
                        {ticket.priority?.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Link to={`/admin/tickets/${ticket._id}`} className="bg-nestle-brown text-white px-4 py-1.5 rounded-[8px] text-[12px] font-bold hover:bg-[#2e1f15] transition-colors shadow-sm inline-block">
                        Review
                      </Link>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-10 text-center text-gray-400 italic font-medium">No escalated tickets</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* All Tickets Section */}
        <div className="bg-white border text-nestle-brown border-nestle-border rounded-[20px] shadow-sm overflow-hidden mt-8">
          <div className="px-6 py-5 flex justify-between items-center">
            <h2 className="text-[20px] font-extrabold text-nestle-brown">All Tickets</h2>
          </div>

          <div className="px-6 border-b border-gray-100 flex space-x-6 text-[14px] font-bold">
            {['All', 'Critical', 'Escalated', 'SLA Breached'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3 relative flex items-center ${activeTab === tab ? 'text-nestle-brown' : 'text-gray-400 hover:text-gray-600'}`}
              >
                {tab}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-nestle-brown"></div>
                )}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[14px] whitespace-nowrap">
              <thead className="bg-[#F8F7F5] text-gray-500 font-bold text-[12px] tracking-wider uppercase">
                <tr>
                  <th className="px-6 py-4 border-b border-nestle-border">TICKET ID</th>
                  <th className="px-6 py-4 border-b border-nestle-border">REGION</th>
                  <th className="px-6 py-4 border-b border-nestle-border">RETAILER</th>
                  <th className="px-6 py-4 border-b border-nestle-border">ISSUE TYPE</th>
                  <th className="px-6 py-4 border-b border-nestle-border">ASSIGNED TO</th>
                  <th className="px-6 py-4 border-b border-nestle-border">PRIORITY</th>
                  <th className="px-6 py-4 border-b border-nestle-border">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-[13px]">
                {loading ? (
                   <tr>
                    <td colSpan="7" className="px-6 py-10 text-center">
                      <div className="flex justify-center items-center">
                        <Loader2 className="animate-spin mr-2 text-nestle-brown" size={20} />
                        <span className="text-gray-500 font-medium">Loading platform data...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredTickets.length > 0 ? filteredTickets.map((ticket, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-nestle-brown">{ticket.ticketNumber}</td>
                    <td className="px-6 py-4 text-gray-600 font-bold">Western</td>
                    <td className="px-6 py-4 text-nestle-brown">{ticket.retailerId?.businessName || ticket.retailerId?.fullName || "Retailer"}</td>
                    <td className="px-6 py-4 text-gray-600">{formatType(ticket.category)}</td>
                    <td className="px-6 py-4 text-gray-600">{ticket.assignedTo?.fullName || 'Unassigned'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-[6px] text-[11px] font-bold ${getPriorityClasses(ticket.priority?.charAt(0).toUpperCase() + ticket.priority?.slice(1))}`}>
                        {ticket.priority?.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[11px] font-bold ${getStatusClasses(ticket.status === 'in_progress' ? 'In Progress' : ticket.status?.charAt(0).toUpperCase() + ticket.status?.slice(1))}`}>
                        {ticket.status?.replace('_',' ').toUpperCase()}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-10 text-center text-gray-400 font-medium">No tickets found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 border-t border-nestle-border flex items-center justify-between text-sm text-gray-500 bg-[#F8F7F5]/50">
            <div className="text-[13px] font-medium text-gray-500">
              Showing {filteredTickets.length} tickets
            </div>
            <div className="flex space-x-1.5 items-center">
              <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-200 transition-colors text-gray-400">‹</button>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#3D2B1F] text-white font-bold shadow-sm">1</button>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-200 transition-colors font-bold text-nestle-brown">2</button>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-200 transition-colors text-gray-400">›</button>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-[20px] p-6 shadow-sm border border-nestle-border mt-8">
          <h2 className="text-[20px] font-extrabold text-nestle-brown mb-6">Recent Activity</h2>

          <div className="space-y-6">
            {recentActivity.map((activity, idx) => (
              <div key={idx} className="flex relative items-start">
                {idx !== recentActivity.length - 1 && (
                  <div className="absolute top-8 bottom-[-24px] left-[11px] w-[2px] bg-gray-100"></div>
                )}
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 z-10 mt-0.5 ${activity.color}`}>
                  {activity.icon}
                </div>
                <div className="ml-4">
                  <p className="text-[14px] font-bold text-nestle-brown leading-snug">{activity.text}</p>
                  <p className="text-[12px] text-gray-400 font-medium mt-1">{activity.subtext}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
