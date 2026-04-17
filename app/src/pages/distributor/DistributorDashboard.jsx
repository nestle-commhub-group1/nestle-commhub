import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ClipboardList, ArrowRight, Truck,
  Clock, CheckCircle, AlertCircle, ShoppingBag, MapPin, Navigation, Eye, Map
} from 'lucide-react';
import API_URL from '../../config/api';
import DistributorLayout from '../../components/layout/DistributorLayout';

const DistributorDashboard = () => {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [activeView, setActiveView] = useState('tickets'); // 'tickets' or 'orders'

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) { navigate('/login'); return; }
      
      const [ticketsRes, ordersRes] = await Promise.all([
        axios.get(`${API_URL}/api/tickets`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/api/orders/distributor`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (ticketsRes.data.success) setTickets(ticketsRes.data.tickets || []);
      setOrders(ordersRes.data || []);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
        const token = localStorage.getItem('token');
        await axios.put(`${API_URL}/api/orders/${orderId}/status`, { status }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        fetchData();
    } catch (err) {
        alert('Status update failed');
    }
  };

  const stats = [
    {
      label: 'Active Tickets',
      count: tickets.filter(t => t.status !== 'resolved').length,
      icon: <ClipboardList size={20} className="text-blue-500"/>,
      bg: 'bg-blue-50',
    },
    {
      label: 'Pending Deliveries',
      count: orders.filter(o => o.status !== 'delivered').length,
      icon: <Truck size={20} className="text-purple-500"/>,
      bg: 'bg-purple-50',
    },
    {
      label: 'Completed Tasks',
      count: tickets.filter(t => t.status === 'resolved').length + orders.filter(o => o.status === 'delivered').length,
      icon: <CheckCircle size={20} className="text-green-500"/>,
      bg: 'bg-green-50',
    },
  ];

  return (
    <DistributorLayout>
      <div className="space-y-8 pb-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-nestle-brown">Distributor Dashboard</h1>
            <p className="text-[15px] font-medium text-gray-500 mt-1">Real-time logistics and field service management.</p>
          </div>
          <div className="flex bg-gray-100 p-1 rounded-xl">
             <button 
                onClick={() => setActiveView('tickets')}
                className={`px-4 py-2 rounded-lg text-sm font-black transition-all ${activeView === 'tickets' ? 'bg-white text-nestle-brown shadow-sm' : 'text-gray-500'}`}
             >
                Support Tickets
             </button>
             <button 
                onClick={() => setActiveView('orders')}
                className={`px-4 py-2 rounded-lg text-sm font-black transition-all ${activeView === 'orders' ? 'bg-white text-nestle-brown shadow-sm' : 'text-gray-500'}`}
             >
                Order Deliveries
             </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map(s => (
            <div key={s.label} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex items-center gap-5 hover:shadow-md transition-all">
              <div className={`p-4 rounded-2xl ${s.bg}`}>{s.icon}</div>
              <div>
                <p className="text-[13px] text-gray-500 font-bold uppercase tracking-wider">{s.label}</p>
                <p className="text-3xl font-black text-nestle-brown">{s.count}</p>
              </div>
            </div>
          ))}
        </div>

        {activeView === 'orders' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-xl font-black text-nestle-brown flex items-center">
                        <Navigation className="mr-2 text-blue-500" size={24} />
                        Active Delivery Routes
                    </h2>
                    
                    {orders.length === 0 ? (
                        <div className="bg-white border border-gray-100 rounded-3xl py-24 flex flex-col items-center text-gray-400 shadow-sm">
                            <Truck size={48} className="mb-4 opacity-10"/>
                            <p className="text-lg font-black text-gray-500">No Orders Assigned</p>
                            <p className="text-sm">You'll see delivery tasks here when assigned by Stock Manager.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {orders.map(order => (
                                <div key={order._id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                                                <ShoppingBag size={20} />
                                            </div>
                                            <div>
                                                <p className="font-black text-nestle-brown">Order #{order._id.substring(order._id.length-8).toUpperCase()}</p>
                                                <p className="text-xs text-gray-500 font-bold">{order.retailer?.businessName}</p>
                                            </div>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                            order.status === 'delivered' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600 animate-pulse'
                                        }`}>
                                            {order.status}
                                        </span>
                                    </div>

                                    <div className="bg-gray-50 p-4 rounded-2xl mb-4 flex items-center justify-between">
                                        <div className="flex items-center">
                                            <MapPin size={16} className="text-red-500 mr-2" />
                                            <span className="text-sm font-medium text-gray-600">{order.retailer?.businessAddress}</span>
                                        </div>
                                        <span className="text-xs font-black text-nestle-brown bg-white px-3 py-1 rounded-lg shadow-sm border border-gray-100">ETA: {order.eta || '3 Days'}</span>
                                    </div>

                                    <div className="flex gap-3">
                                        {order.status !== 'delivered' && (
                                            <button 
                                                onClick={() => updateOrderStatus(order._id, 'delivered')}
                                                className="flex-1 py-3 bg-green-600 text-white rounded-xl font-black shadow-lg shadow-green-600/20 hover:bg-green-700 transition-all flex items-center justify-center"
                                            >
                                                <CheckCircle size={18} className="mr-2" />
                                                Mark Delivered
                                            </button>
                                        )}
                                        <button className="px-4 py-3 bg-gray-100 text-gray-500 rounded-xl hover:bg-gray-200 transition-colors">
                                            <Eye size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm sticky top-8">
                        <h2 className="text-lg font-black text-nestle-brown mb-4 flex items-center">
                            <Map className="mr-2 text-nestle-brown" size={20} />
                            Delivery Radar
                        </h2>
                        <div className="aspect-square bg-blue-50 rounded-2xl relative overflow-hidden border border-blue-100">
                            {/* Visual Mock of a delivery map */}
                            <div className="absolute inset-0 opacity-20">
                                <div className="absolute top-10 left-10 w-40 h-1 bg-blue-300 rotate-45"></div>
                                <div className="absolute top-20 right-5 w-32 h-1 bg-blue-300 -rotate-12"></div>
                                <div className="absolute bottom-10 left-5 w-64 h-1 bg-blue-300 rotate-2"></div>
                            </div>
                            
                            {orders.map((o, idx) => (
                                <div 
                                    key={o._id} 
                                    className={`absolute w-8 h-8 rounded-full border-2 border-white shadow-xl flex items-center justify-center transition-all animate-bounce`}
                                    style={{ 
                                        top: `${20 + (idx * 25) % 60}%`, 
                                        left: `${20 + (idx * 35) % 60}%`,
                                        backgroundColor: o.status === 'delivered' ? '#10B981' : '#3B82F6'
                                    }}
                                >
                                    <MapPin size={14} className="text-white" />
                                </div>
                            ))}

                            <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm p-3 rounded-xl shadow-lg border border-gray-200">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[10px] font-black uppercase text-gray-400">Total Distance</span>
                                    <span className="text-sm font-black text-nestle-brown">42.5 KM</span>
                                </div>
                                <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-blue-500 h-full w-2/3"></div>
                                </div>
                            </div>
                        </div>
                        <p className="text-[11px] text-gray-400 mt-4 font-medium italic text-center">Map data synchronized with Nestlé Logistics Service.</p>
                    </div>
                </div>
            </div>
        )}

        {activeView === 'tickets' && (
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
                        className="text-left bg-white border border-gray-100 rounded-[20px] p-6 shadow-sm hover:shadow-md transition-all group relative overflow-hidden"
                    >
                        <div className="flex items-start justify-between mb-3">
                        <span className="font-bold text-[15px] text-nestle-brown tracking-tight">{ticket.ticketNumber}</span>
                        </div>
                        <p className="font-black text-[15px] text-nestle-brown mb-1 capitalize">
                        {(ticket.category || '').replace(/_/g, ' ')}
                        </p>
                        <p className="text-[13px] text-gray-500 font-medium mb-5 capitalize">
                        {ticket.retailerId?.businessName || 'Retailer'}
                        </p>
                        <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                            <span className="text-[11px] font-black px-2.5 py-1 rounded-full bg-gray-50 text-gray-500 uppercase">
                                {ticket.status}
                            </span>
                            <span className="flex items-center gap-1 text-[12px] font-bold text-blue-500">
                                Details <ArrowRight size={13}/>
                            </span>
                        </div>
                    </button>
                 ))}
               </div>
             )}
           </div>
        )}
      </div>
    </DistributorLayout>
  );
};

export default DistributorDashboard;
