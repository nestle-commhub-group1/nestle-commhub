import React, { useState, useEffect } from 'react';
import { Camera, Save, Loader2 } from 'lucide-react';
import axios from 'axios';
import API_URL from '../../config/api';
import AdminLayout from '../../components/layout/AdminLayout';

const AdminProfile = () => {
  const [user, setUser] = useState({
    fullName: '',
    initials: '?',
    email: '',
    phone: '',
    employeeId: '',
    department: '',
    officeLocation: '',
  });

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
  });

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        const name = parsed.fullName || parsed.name || 'Admin';
        const parts = name.split(' ');
        const initials = parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : name[0];

        setUser({
          fullName: name,
          initials: initials.toUpperCase(),
          email: parsed.email || '',
          phone: parsed.phone || '',
          employeeId: parsed.employeeId || '',
          department: parsed.department || '',
          officeLocation: parsed.officeLocation || '',
        });

        setFormData({
          fullName: name,
          phone: parsed.phone || '',
        });
      } catch (e) {
        console.error('Failed to parse stored user:', e);
      }
    }
  }, []);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setSuccessMsg('');
    setErrorMsg('');
  };

  const handleSave = async () => {
    if (!formData.fullName.trim()) {
      setErrorMsg('Full name cannot be empty.');
      return;
    }
    try {
      setSaving(true);
      setErrorMsg('');
      const token = localStorage.getItem('token');
      const res = await axios.put(`${API_URL}/api/users/profile`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) {
        const updated = res.data.user;
        const name = updated.fullName;
        const parts = name.split(' ');
        const initials = parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : name[0];

        setUser(prev => ({
          ...prev,
          ...updated,
          initials: initials.toUpperCase(),
        }));
        setFormData({ fullName: updated.fullName, phone: updated.phone || '' });

        // Persist updated user to localStorage so layout reflects changes
        const storedUser = localStorage.getItem('user');
        const parsed = storedUser ? JSON.parse(storedUser) : {};
        localStorage.setItem('user', JSON.stringify({ ...parsed, ...updated }));

        setSuccessMsg('Profile updated successfully.');
      }
    } catch (err) {
      console.error('Profile update error:', err.response?.data || err.message);
      setErrorMsg(err.response?.data?.message || 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-3xl pb-10">
        <div className="mb-8">
          <h1 className="text-[26px] font-extrabold text-nestle-brown">My Profile</h1>
          <p className="text-[15px] font-medium text-gray-500 mt-1">View and update your account details</p>
        </div>

        {/* Top Card */}
        <div className="bg-white border border-nestle-border rounded-[20px] p-6 shadow-sm mb-6 flex items-center space-x-6">
          <div className="relative">
            <div className="h-[90px] w-[90px] rounded-full bg-nestle-brown text-white flex items-center justify-center text-[32px] font-bold shadow-inner border border-nestle-brown/20">
              {user.initials}
            </div>
            <button className="absolute bottom-0 right-0 bg-white border border-nestle-border shadow-sm p-1.5 rounded-full text-gray-600 hover:text-nestle-brown transition-colors">
              <Camera size={16} />
            </button>
          </div>
          <div>
            <h2 className="text-[20px] font-extrabold text-nestle-brown">{user.fullName || '—'}</h2>
            <p className="text-[14px] font-medium text-gray-500 mt-0.5">{user.email}</p>
            <span className="inline-block mt-3 bg-[#FFE4E4] text-[#8B0000] text-[12px] font-bold px-3 py-1 rounded-md shadow-sm border border-[#8B0000]/20">
              HQ Admin
            </span>
          </div>
        </div>

        {/* Personal Info */}
        <div className="bg-white border border-nestle-border rounded-[20px] p-8 shadow-sm mb-6">
          <h3 className="text-[13px] font-extrabold text-[#3D2B1F] tracking-widest uppercase mb-6">PERSONAL INFORMATION</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-[12px] font-bold text-[#3D2B1F] mb-2 uppercase tracking-wide">
                FULL NAME <span className="text-nestle-danger">*</span>
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className="w-full border border-nestle-border rounded-[10px] px-4 py-3 text-[15px] font-medium text-nestle-brown focus:outline-none focus:ring-2 focus:ring-nestle-brown/20 focus:border-nestle-brown bg-white shadow-sm"
              />
            </div>
            <div>
              <label className="block text-[12px] font-bold text-[#3D2B1F] mb-2 uppercase tracking-wide">
                PHONE NUMBER <span className="text-nestle-danger">*</span>
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full border border-nestle-border rounded-[10px] px-4 py-3 text-[15px] font-medium text-nestle-brown focus:outline-none focus:ring-2 focus:ring-nestle-brown/20 focus:border-nestle-brown bg-white shadow-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-bold text-[#3D2B1F] mb-2 uppercase tracking-wide">EMAIL ADDRESS</label>
            <input
              type="text"
              value={user.email}
              disabled
              className="w-full border border-nestle-border rounded-[10px] px-4 py-3 text-[15px] font-medium text-gray-500 bg-[#F8F7F5] cursor-not-allowed"
            />
          </div>
        </div>

        {/* Employment Details */}
        <div className="bg-white border border-nestle-border rounded-[20px] p-8 shadow-sm mb-8">
          <h3 className="text-[13px] font-extrabold text-[#3D2B1F] tracking-widest uppercase mb-6">
            EMPLOYMENT DETAILS <span className="text-gray-400 font-medium ml-2 text-[12px] normal-case tracking-normal">(Read only)</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-[12px] font-bold text-[#3D2B1F] mb-2 uppercase tracking-wide">EMPLOYEE ID</label>
              <input
                type="text"
                value={user.employeeId}
                disabled
                className="w-full border border-nestle-border rounded-[10px] px-4 py-3 text-[15px] font-medium text-gray-500 bg-[#F8F7F5] cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-[12px] font-bold text-[#3D2B1F] mb-2 uppercase tracking-wide">DEPARTMENT</label>
              <input
                type="text"
                value={user.department}
                disabled
                className="w-full border border-nestle-border rounded-[10px] px-4 py-3 text-[15px] font-medium text-gray-500 bg-[#F8F7F5] cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-bold text-[#3D2B1F] mb-2 uppercase tracking-wide">OFFICE LOCATION</label>
            <input
              type="text"
              value={user.officeLocation}
              disabled
              className="w-full border border-nestle-border rounded-[10px] px-4 py-3 text-[15px] font-medium text-gray-500 bg-[#F8F7F5] cursor-not-allowed"
            />
          </div>
        </div>

        {/* Feedback messages */}
        {successMsg && (
          <p className="mb-4 text-sm font-medium text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
            ✓ {successMsg}
          </p>
        )}
        {errorMsg && (
          <p className="mb-4 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            ✕ {errorMsg}
          </p>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full md:w-auto bg-[#3D2B1F] text-white font-bold text-[15px] px-8 py-3.5 rounded-[12px] hover:bg-nestle-brown transition-colors flex items-center justify-center space-x-2 shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          <span>{saving ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>
    </AdminLayout>
  );
};

export default AdminProfile;
