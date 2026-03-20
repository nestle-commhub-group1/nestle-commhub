import React, { useState, useEffect } from 'react';
import { Search, Plus, Loader2 } from 'lucide-react';
import axios from 'axios';
import AdminLayout from '../../components/layout/AdminLayout';
import { formatDate } from '../../utils/dateUtils';

const UserManagement = () => {
  const [activeTab, setActiveTab] = useState('All');

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5001/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data.users || []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (id, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`http://localhost:5001/api/users/${id}/status`, 
        { isActive: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setUsers(prev => prev.map(u => u._id === id ? { ...u, isActive: !currentStatus } : u));
      }
    } catch (err) {
      console.error('Failed to update user status:', err);
    }
  };

  const stats = {
    total: users.length,
    staff: users.filter(u => u.role === 'sales_staff').length,
    retailers: users.filter(u => u.role === 'retailer').length,
    distributors: users.filter(u => u.role === 'distributor').length,
    admins: users.filter(u => u.role === 'hq_admin').length
  };

  const filteredUsers = users.filter(u => {
    const matchesTab = activeTab === 'All' || 
      (activeTab === 'Sales Staff' && u.role === 'sales_staff') ||
      (activeTab === 'Regional Manager' && u.role === 'regional_manager') ||
      (activeTab === 'Distributor' && u.role === 'distributor') ||
      (activeTab === 'Retailer' && u.role === 'retailer') ||
      (activeTab === 'Delivery Driver' && u.role === 'delivery_driver');
    
    const searchStr = searchTerm.toLowerCase();
    const matchesSearch = u.fullName.toLowerCase().includes(searchStr) || 
      u.email.toLowerCase().includes(searchStr) ||
      (u.businessName && u.businessName.toLowerCase().includes(searchStr));
    
    return matchesTab && matchesSearch;
  });

  const getRoleLabel = (role) => {
    switch(role) {
      case 'sales_staff': return 'Sales Staff';
      case 'retailer': return 'Retailer';
      case 'hq_admin': return 'HQ Admin';
      case 'distributor': return 'Distributor';
      case 'delivery_driver': return 'Delivery Driver';
      case 'regional_manager': return 'Regional Manager';
      default: return role;
    }
  };

  const getRoleBadge = (role) => {
    switch(role) {
      case 'sales_staff': return 'text-[#1D4ED8] bg-[#DBEAFE] border-[#1D4ED8]/20';
      case 'regional_manager': return 'text-[#6B21A8] bg-[#F3E8FF] border-[#6B21A8]/20';
      case 'hq_admin': return 'text-[#8B0000] bg-[#FFE4E4] border-[#8B0000]/20';
      case 'distributor': return 'text-[#C2410C] bg-[#FFEDD5] border-[#C2410C]/20';
      case 'retailer': return 'text-nestle-success bg-green-50 border-green-200';
      case 'delivery_driver': return 'text-gray-700 bg-gray-100 border-gray-200';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 pb-10">
        <div className="flex justify-between items-center">
          <h1 className="text-[26px] font-extrabold text-[#2C1810]">User Management</h1>
          <button className="bg-nestle-brown text-white px-5 py-2.5 rounded-[12px] text-[14px] font-bold flex items-center shadow-sm hover:bg-[#2e1f15] transition-colors">
            <Plus size={18} className="mr-2" /> Add New User
          </button>
        </div>

        <div className="flex space-x-6 text-[14px] font-bold text-gray-500 bg-white p-4 rounded-[12px] shadow-sm border border-nestle-border overflow-x-auto">
          <span className="text-nestle-brown">Total: {stats.total}</span>
          <span className="text-gray-300">|</span>
          <span>Staff: {stats.staff}</span>
          <span className="text-gray-300">|</span>
          <span>Retailers: {stats.retailers}</span>
          <span className="text-gray-300">|</span>
          <span>Distributors: {stats.distributors}</span>
          <span className="text-gray-300">|</span>
          <span>HQ Admin: {stats.admins}</span>
        </div>

        <div className="bg-white border text-nestle-brown border-nestle-border rounded-[20px] shadow-sm overflow-hidden">
          {/* Tabs and Search */}
          <div className="px-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex space-x-6 text-[14px] font-bold overflow-x-auto hide-scrollbar">
              {['All', 'Sales Staff', 'Regional Manager', 'Distributor', 'Retailer', 'Delivery Driver'].map((tab) => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 relative flex items-center whitespace-nowrap ${activeTab === tab ? 'text-nestle-brown' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  {tab}
                  {activeTab === tab && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-nestle-brown"></div>
                  )}
                </button>
              ))}
            </div>
            
            <div className="relative py-3 md:py-0 w-full md:w-64">
              <Search className="absolute left-3 top-1/2 md:top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Search users..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#F5F5F5] border-transparent focus:bg-white focus:border-nestle-brown border rounded-lg pl-10 pr-4 py-2 text-[14px] outline-none transition-colors"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24">
                <Loader2 className="w-10 h-10 text-nestle-brown animate-spin mb-4" />
                <p className="text-gray-500 font-medium">Loading user directory...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-[15px] font-bold text-gray-400 italic">No users found</p>
              </div>
            ) : (
              <>
                <table className="w-full text-left text-[14px] whitespace-nowrap">
                  <thead className="bg-[#F8F7F5] text-gray-500 font-bold text-[12px] tracking-wider uppercase border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4">Name</th>
                      <th className="px-6 py-4">Email</th>
                      <th className="px-6 py-4">Role</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Joined</th>
                      <th className="px-6 py-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium text-[13px]">
                    {filteredUsers.map((u) => (
                      <tr key={u._id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-nestle-brown">{u.fullName}</span>
                            {u.businessName && <span className="text-[11px] text-gray-400 font-medium">{u.businessName}</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-500">{u.email}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-[6px] text-[11px] font-bold border ${getRoleBadge(u.role)}`}>
                            {getRoleLabel(u.role)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className={`w-2 h-2 rounded-full mr-2 ${u.isActive ? 'bg-nestle-success' : 'bg-red-500'}`}></div>
                            <span className={u.isActive ? 'text-nestle-success font-bold' : 'text-red-500 font-bold'}>{u.isActive ? 'Active' : 'Inactive'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-500">{formatDate(u.createdAt)}</td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-3">
                            <button 
                              onClick={() => toggleUserStatus(u._id, u.isActive)}
                              className={`font-bold hover:underline ${u.isActive ? 'text-red-500' : 'text-nestle-success'}`}
                            >
                              {u.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                            <button className="text-gray-400 font-bold hover:text-nestle-brown transition-colors">Details</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="px-6 py-4 border-t border-nestle-border flex items-center justify-between text-sm text-gray-500 bg-[#F8F7F5]/50">
                  <div className="text-[13px] font-medium text-gray-500">
                    Showing {filteredUsers.length} of {users.length} users
                  </div>
                  <div className="flex space-x-1.5 items-center">
                    <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-200 transition-colors text-gray-400">‹</button>
                    <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#3D2B1F] text-white font-bold shadow-sm">1</button>
                    <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-200 transition-colors text-gray-400">›</button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

      </div>
    </AdminLayout>
  );
};

export default UserManagement;
