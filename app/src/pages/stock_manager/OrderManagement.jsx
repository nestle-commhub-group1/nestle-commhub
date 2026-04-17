import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../../config/api';
import StockManagerLayout from '../../components/layout/StockManagerLayout';
import { ShoppingBag, Truck, Calendar, User, Check, X, MapPin, Eye } from 'lucide-react';

const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [distributors, setDistributors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [processData, setProcessData] = useState({
    status: '',
    distributor: '',
    eta: ''
  });

  useEffect(() => {
    fetchOrders();
    fetchDistributors();
  }, []);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/orders/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(res.data);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDistributors = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_URL}/api/users/distributors`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDistributors(res.data.distributors || []);
    } catch (err) {
      console.error('Error fetching distributors:', err);
    }
  };

  const handleOpenProcess = (order) => {
    setSelectedOrder(order);
    setProcessData({
      status: order.status,
      distributor: order.distributor?._id || '',
      eta: order.eta || ''
    });
    setIsProcessModalOpen(true);
  };

  const handleProcessSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_URL}/api/orders/${selectedOrder._id}/status`, processData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIsProcessModalOpen(false);
      fetchOrders();
    } catch (err) {
      alert('Update failed');
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'pending': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'accepted': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'shipped': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      case 'delivered': return 'bg-green-50 text-green-600 border-green-100';
      case 'denied': return 'bg-red-50 text-red-600 border-red-100';
      default: return 'bg-gray-50 text-gray-600 border-gray-100';
    }
  };

  return (
    <StockManagerLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-black text-nestle-brown">Manage Orders</h1>
        <p className="text-gray-500 font-medium">Review retailer orders, assign distributors, and track deliveries.</p>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-[11px] font-black text-gray-400 uppercase tracking-widest">
                <th className="px-6 py-4">Order ID</th>
                <th className="px-6 py-4">Retailer</th>
                <th className="px-6 py-4">Total Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Distributor</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 font-medium">
              {orders.map((order) => (
                <tr key={order._id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 text-xs font-black text-gray-400">
                    {order._id.substring(order._id.length - 8).toUpperCase()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="font-bold text-nestle-brown">{order.retailer?.businessName}</span>
                      <span className="text-[10px] text-gray-400">{order.retailer?.fullName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-black text-nestle-brown">
                    LKR {order.totalAmount?.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusStyle(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {order.distributor ? (
                      <div className="flex items-center text-nestle-brown font-bold">
                        <Truck size={14} className="mr-1.5 text-blue-500" />
                        {order.distributor.fullName}
                      </div>
                    ) : (
                      <span className="text-gray-400 italic">Unassigned</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => handleOpenProcess(order)}
                      className="flex items-center px-4 py-2 bg-gray-50 text-nestle-brown hover:bg-nestle-brown hover:text-white rounded-xl transition-all border border-gray-100 text-[13px] font-bold"
                    >
                      <Eye size={16} className="mr-2" />
                      View & Process
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isProcessModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl">
            <div className="px-8 py-6 bg-nestle-brown text-white flex justify-between items-center">
              <div>
                <h2 className="text-xl font-black">Process Order</h2>
                <p className="text-xs text-white/70 font-bold uppercase tracking-widest mt-1">Order #{selectedOrder._id.substring(selectedOrder._id.length-8).toUpperCase()}</p>
              </div>
              <button onClick={() => setIsProcessModalOpen(false)} className="hover:rotate-90 transition-transform">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-8">
                <div className="grid grid-cols-2 gap-8 mb-8">
                    <div>
                        <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center">
                            <User size={14} className="mr-2" /> Customer Details
                        </h3>
                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                            <p className="font-black text-nestle-brown">{selectedOrder.retailer?.businessName}</p>
                            <p className="text-sm text-gray-500 font-medium mb-2">{selectedOrder.retailer?.businessAddress}</p>
                            <div className="flex items-center text-xs text-gray-400 font-bold">
                                <MapPin size={12} className="mr-1" /> {selectedOrder.retailer?.district || 'Western Province'}
                            </div>
                        </div>
                    </div>
                    <div>
                        <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center">
                            <ShoppingBag size={14} className="mr-2" /> Order Items
                        </h3>
                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 max-h-40 overflow-y-auto">
                            {selectedOrder.items.map((item, id) => (
                                <div key={id} className="flex justify-between items-center mb-2 last:mb-0 pb-2 last:pb-0 border-b last:border-0 border-gray-200/50">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-nestle-brown">{item.product?.name}</span>
                                        <span className="text-[10px] text-gray-500">Qty: {item.quantity}</span>
                                    </div>
                                    <span className="text-xs font-black text-nestle-brown">LKR { (item.priceAtTime * item.quantity).toLocaleString() }</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <form onSubmit={handleProcessSubmit} className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Update Status</label>
                            <select 
                                value={processData.status} 
                                onChange={(e) => setProcessData({...processData, status: e.target.value})}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none font-black text-nestle-brown appearance-none"
                            >
                                <option value="pending">Pending Review</option>
                                <option value="accepted">Accept Order</option>
                                <option value="denied">Deny Order</option>
                                <option value="shipped">Shipped (Out for Delivery)</option>
                                <option value="delivered">Delivered</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Set Delivery ETA</label>
                            <div className="relative">
                                <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input 
                                    type="text" 
                                    placeholder="e.g. 3-5 Business Days"
                                    value={processData.eta} 
                                    onChange={(e) => setProcessData({...processData, eta: e.target.value})}
                                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 outline-none font-bold text-nestle-brown"
                                />
                            </div>
                        </div>
                        <div className="col-span-2">
                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Assign Distributor</label>
                            <div className="relative">
                                <Truck size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                <select 
                                    value={processData.distributor} 
                                    onChange={(e) => setProcessData({...processData, distributor: e.target.value})}
                                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 outline-none font-black text-nestle-brown appearance-none"
                                >
                                    <option value="">Select Distributor</option>
                                    {distributors.map(d => (
                                        <option key={d._id} value={d._id}>{d.fullName}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="flex space-x-4 pt-4">
                        <button 
                            type="button"
                            onClick={() => setIsProcessModalOpen(false)}
                            className="flex-1 py-4 bg-gray-50 text-gray-500 rounded-xl font-black hover:bg-gray-100 transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            className="flex-2 py-4 px-8 bg-nestle-brown text-white rounded-xl font-black shadow-xl shadow-nestle-brown/20 flex items-center justify-center hover:-translate-y-1 transition-all"
                        >
                            <Check size={20} className="mr-2" />
                            Update Order Details
                        </button>
                    </div>
                </form>
            </div>
          </div>
        </div>
      )}
    </StockManagerLayout>
  );
};

export default OrderManagement;
