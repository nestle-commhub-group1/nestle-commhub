import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../../config/api';
import StockManagerLayout from '../../components/layout/StockManagerLayout';
import { Package, ShoppingBag, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';

const StockManagerDashboard = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStock: 0,
    pendingOrders: 0,
    completedOrders: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [productsRes, ordersRes] = await Promise.all([
        axios.get(`${API_URL}/api/products`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/api/orders/all`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const products = productsRes.data;
      const orders = ordersRes.data;

      setStats({
        totalProducts: products.length,
        lowStock: products.filter(p => p.stockQuantity < 20).length,
        pendingOrders: orders.filter(o => o.status === 'pending').length,
        completedOrders: orders.filter(o => o.status === 'delivered').length
      });
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, color, trend }) => (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-start justify-between">
      <div>
        <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
        <h3 className="text-2xl font-black text-nestle-brown">{value}</h3>
        {trend && (
          <div className="flex items-center mt-2 text-xs font-bold text-green-600">
            <TrendingUp size={14} className="mr-1" />
            {trend}
          </div>
        )}
      </div>
      <div className={`p-3 rounded-xl ${color}`}>
        {icon}
      </div>
    </div>
  );

  return (
    <StockManagerLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-black text-nestle-brown">Inventory Overview</h1>
        <p className="text-gray-500 font-medium">Monitor your stock levels and manage retailer orders.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Total Products" 
          value={stats.totalProducts} 
          icon={<Package className="text-blue-600" />} 
          color="bg-blue-50"
        />
        <StatCard 
          title="Low Stock Alerts" 
          value={stats.lowStock} 
          icon={<AlertTriangle className="text-amber-600" />} 
          color="bg-amber-50"
          trend={`${stats.lowStock > 0 ? 'Action required' : 'All clear'}`}
        />
        <StatCard 
          title="Pending Orders" 
          value={stats.pendingOrders} 
          icon={<ShoppingBag className="text-purple-600" />} 
          color="bg-purple-50"
        />
        <StatCard 
          title="Delivered Orders" 
          value={stats.completedOrders} 
          icon={<CheckCircle className="text-green-600" />} 
          color="bg-green-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <h2 className="text-xl font-black text-nestle-brown mb-6 flex items-center">
            <Package className="mr-2 text-blue-500" size={24} />
            Quick Inventory Actions
          </h2>
          <div className="space-y-4">
            <button className="w-full text-left p-4 rounded-2xl border border-gray-100 hover:border-nestle-brown hover:bg-nestle-brown/5 transition-all group">
              <span className="block font-black text-nestle-brown group-hover:translate-x-1 transition-transform">Add New Product Catalog</span>
              <span className="text-sm text-gray-500">Add new items to Nestlé's product line.</span>
            </button>
            <button className="w-full text-left p-4 rounded-2xl border border-gray-100 hover:border-nestle-brown hover:bg-nestle-brown/5 transition-all group">
              <span className="block font-black text-nestle-brown group-hover:translate-x-1 transition-transform">Bulk Stock Update</span>
              <span className="text-sm text-gray-500">Update quantity for multiple products at once.</span>
            </button>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <h2 className="text-xl font-black text-nestle-brown mb-6 flex items-center">
            <ShoppingBag className="mr-2 text-purple-500" size={24} />
            Recent Orders
          </h2>
          <div className="text-center py-12 text-gray-400">
            <ShoppingBag size={48} className="mx-auto mb-4 opacity-10" />
            <p className="italic">No recent order activity found.</p>
          </div>
        </div>
      </div>
    </StockManagerLayout>
  );
};

export default StockManagerDashboard;
