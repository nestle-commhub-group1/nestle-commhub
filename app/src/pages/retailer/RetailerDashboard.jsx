import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText, Tag, Package, Truck, CheckCircle, Clock, RefreshCw, PiggyBank
} from 'lucide-react';
import axios from 'axios';
import API_URL from '../../config/api';
import RetailerLayout from '../../components/layout/RetailerLayout';
import { useLanguage } from '../../i18n/LanguageContext';
import { 
  getCurrentGreeting,
} from "../../utils/dateUtils";

const PriorityBadge = ({ priority, t }) => {
  const getPriorityClasses = (p) => {
    const cls = p?.toLowerCase();
    if (cls === 'critical') return 'text-red-700 bg-red-100 border border-red-200';
    if (cls === 'high') return 'text-orange-700 bg-orange-100 border border-orange-200';
    if (cls === 'medium') return 'text-yellow-700 bg-yellow-100 border border-yellow-200';
    if (cls === 'low') return 'text-gray-700 bg-gray-100 border border-gray-200';
    return 'text-gray-700 bg-gray-100';
  };
  const label = priority?.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()) || '';
  return (
    <span className={`px-2.5 py-1 rounded-[6px] text-[12px] font-bold ${getPriorityClasses(priority)}`}>
      {t(label).toUpperCase()}
    </span>
  );
};

const StatusBadge = ({ status, t }) => {
  const getStatusClasses = (s) => {
    const cls = s?.toLowerCase();
    if (cls === 'open') return 'text-red-700 bg-red-50 border border-red-200';
    if (cls === 'in_progress') return 'text-yellow-700 bg-yellow-50 border border-yellow-200';
    if (cls === 'resolved') return 'text-green-700 bg-green-50 border border-green-200';
    return 'text-gray-700 bg-gray-50';
  };
  const label = status?.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()) || '';
  return (
    <span className={`px-3 py-1 rounded-full text-[12px] font-bold ${getStatusClasses(status)}`}>
      {t(label).toUpperCase()}
    </span>
  );
};

const RetailerDashboard = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const { language, t } = useLanguage();

  useEffect(() => {
    fetchProfile();
    fetchTickets();
    fetchPromotions();
  }, []);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/api/users/profile`, {
        headers: { Authorization: "Bearer " + token }
      });
      if (res.data.success) {
        setUser(res.data.user);
        localStorage.setItem("user", JSON.stringify(res.data.user));
      }
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    }
  };

  // Refetch when user navigates back to this tab/window
  useEffect(() => {
    const handleFocus = () => {
      fetchProfile();
      fetchTickets();
      fetchPromotions();
    };
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

  const [promotions, setPromotions] = useState([]);
  const fetchPromotions = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/api/promotions`, {
        headers: { Authorization: "Bearer " + token }
      });
      setPromotions(res.data.promotions || []);
    } catch (err) {
      console.error("Failed to fetch promotions:", err);
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
    const label = map[category] || (category?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()));
    return t(label || '');
  };

  const summaryCards = [
    { title: 'Loyalty Wallet', count: (user?.credits || 0).toLocaleString(), label: 'Points available', icon: <PiggyBank size={20} className="text-amber-500" />, borderColor: 'border-amber-200', bgColor: 'bg-amber-50', link: '/retailer/promotions' },
    { title: 'Open Tickets', count: openCount, label: 'Awaiting response', icon: <FileText size={20} className="text-nestle-danger" />, borderColor: 'border-red-200', bgColor: 'bg-red-50', link: '#' },
    { title: 'In Progress', count: inProgressCount, label: 'Being handled', icon: <Package size={20} className="text-nestle-warning" />, borderColor: 'border-yellow-200', bgColor: 'bg-yellow-50', link: '#' },
    { title: 'Resolved', count: resolvedCount, label: 'Completed', icon: <CheckCircle size={20} className="text-nestle-success" />, borderColor: 'border-green-200', bgColor: 'bg-green-50', link: '/retailer/tickets' },
  ];

  if (loading) {
    return (
      <RetailerLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nestle-brown mx-auto mb-4"></div>
            <p className="text-gray-500 font-bold">{t('Loading your dashboard...')}</p>
          </div>
        </div>
      </RetailerLayout>
    );
  }

  const firstName = user?.fullName?.split(" ")[0] || "there";
  const locale = language === 'si' ? 'si-LK' : language === 'ta' ? 'ta-LK' : 'en-US';
  const localizedDate = new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());
  const formatTicketDate = (date) => date
    ? new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(date))
    : '—';

  return (
    <RetailerLayout>
      <div className="space-y-8 pb-10">
        <div>
          <h1 className="text-[26px] font-extrabold text-[#2C1810]">{t(getCurrentGreeting())}, {firstName} 👋</h1>
          <p className="text-[14px] text-gray-500 font-medium mt-1 uppercase tracking-wider">{localizedDate}</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {summaryCards.map((card, idx) => (
            <Link to={card.link} key={idx} className={`bg-white rounded-[20px] p-6 border shadow-sm flex items-center justify-between hover:shadow-md transition-shadow relative overflow-hidden group border-nestle-border`}>
              {/* Added a subtle color accent bar on the left of each card */}
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${card.bgColor.replace('50', '400')}`}></div>
              <div>
                <p className="text-[14px] font-medium text-gray-500 mb-1 tracking-wide">{t(card.title)}</p>
                <p className="text-[32px] font-extrabold text-nestle-brown leading-none">{card.count}</p>
                <p className="text-[13px] text-gray-500 mt-2 font-medium">{t(card.label)}</p>
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
            <h2 className="text-[18px] font-bold text-nestle-brown tracking-wide">{t('Recent Tickets')}</h2>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchTickets}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 transition-colors"
                title={t('Refresh')}
              >
                <RefreshCw size={14} />
                {t('Refresh')}
              </button>
              <Link to="/retailer/tickets" className="text-[14px] font-bold text-nestle-brown-light hover:text-nestle-brown transition-colors flex items-center group">
                {t('View All')} <span className="ml-1 text-xl leading-none group-hover:translate-x-1 transition-transform">›</span>
              </Link>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[14px] whitespace-nowrap">
              <thead className="bg-[#F8F7F5] text-gray-500 font-bold text-[12px] tracking-wider uppercase">
                <tr>
                  <th className="px-6 py-4 border-b border-nestle-border">{t('Ticket ID')}</th>
                  <th className="px-6 py-4 border-b border-nestle-border">{t('Issue Type')}</th>
                  <th className="px-6 py-4 border-b border-nestle-border">{t('Priority')}</th>
                  <th className="px-6 py-4 border-b border-nestle-border">{t('Status')}</th>
                  <th className="px-6 py-4 border-b border-nestle-border">{t('Date')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-nestle-border/50 font-medium text-nestle-brown">
                {recentTickets.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-gray-400 font-medium italic">
                      {t('No tickets yet. Submit your first issue!')}
                    </td>
                  </tr>
                ) : (
                  recentTickets.map(ticket => (
                    <tr key={ticket._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold">{ticket.ticketNumber}</td>
                      <td className="px-6 py-4">{formatCategory(ticket.category)}</td>
                      <td className="px-6 py-4">
                        <PriorityBadge priority={ticket.priority} t={t} />
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={ticket.status} t={t} />
                      </td>
                      <td className="px-6 py-4 text-gray-500 font-bold">{formatTicketDate(ticket.createdAt)}</td>
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

        {/* Active Promotions Preview */}
        <div className="bg-white border text-nestle-brown border-nestle-border rounded-[20px] shadow-sm overflow-hidden mt-8">
          <div className="px-6 py-5 border-b border-nestle-border flex justify-between items-center bg-white">
            <div className="flex items-center gap-2">
              <Tag size={20} className="text-blue-500" />
              <h2 className="text-[18px] font-bold text-nestle-brown tracking-wide">{t('Featured Promotions')}</h2>
            </div>
            <Link to="/retailer/promotions" className="text-[14px] font-bold text-nestle-brown-light hover:text-nestle-brown transition-colors flex items-center group">
              {t('Explore Wall')} <span className="ml-1 text-xl leading-none group-hover:translate-x-1 transition-transform">›</span>
            </Link>
          </div>
          
          <div className="p-6">
            {promotions.length === 0 ? (
              <div className="text-center py-6 text-gray-400 font-medium italic">
                {t('No active promotions at the moment.')}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {promotions.slice(0, 2).map(promo => (
                  <Link 
                    to="/retailer/promotions" 
                    key={promo._id} 
                    className="p-4 rounded-2xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/10 transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-blue-500 bg-blue-50 px-2 py-0.5 rounded">
                          {promo.category?.replace('_', ' ')}
                        </span>
                        {promo.discount && (
                          <span className="text-[12px] font-black text-green-600">
                            {promo.discount}% OFF
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-nestle-brown group-hover:text-blue-600 transition-colors line-clamp-1">{promo.title}</h3>
                      <p className="text-[12px] text-gray-500 mt-1 line-clamp-2 leading-relaxed font-medium">
                        {promo.description}
                      </p>
                    </div>
                    <div className="mt-3 flex items-center text-[11px] font-bold text-nestle-brown-light">
                      {t('View details')} 
                      <span className="ml-1 group-hover:translate-x-1 transition-transform">→</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
          <Link to="/retailer/stock-requests" className="bg-[#F5F3F0] border-2 border-transparent hover:border-[#3D2B1F] rounded-[20px] p-6 transition-all flex items-center space-x-5 text-left group">
            <div className="bg-white shadow-sm p-4 rounded-[14px] group-hover:scale-105 transition-transform text-nestle-brown">
              <Package size={28} />
            </div>
            <div>
              <h3 className="font-extrabold text-nestle-brown text-[18px]">{t('Request Stock')}</h3>
              <p className="text-[14px] font-medium text-gray-500 mt-0.5">{t('Order additional inventory')}</p>
            </div>
          </Link>
          <Link to="/retailer/submit-issue" className="bg-[#F5F3F0] border-2 border-transparent hover:border-[#3D2B1F] rounded-[20px] p-6 transition-all flex items-center space-x-5 text-left group">
            <div className="bg-white shadow-sm p-4 rounded-[14px] group-hover:scale-105 transition-transform text-nestle-brown">
              <FileText size={28} />
            </div>
            <div>
              <h3 className="font-extrabold text-nestle-brown text-[18px]">{t('Submit Ticket')}</h3>
              <p className="text-[14px] font-medium text-gray-500 mt-0.5">{t('Need help or found an issue?')}</p>
            </div>
          </Link>
        </div>

      </div>
    </RetailerLayout>
  );
};

export default RetailerDashboard;
