import React, { useState, useEffect } from 'react';
import { Camera, Save, Loader2, User, Mail, Phone, Briefcase, MapPin, BadgeCheck } from 'lucide-react';
import axios from 'axios';
import API_URL from '../../config/api';
import PromotionManagerLayout from '../../components/layout/PromotionManagerLayout';

const PromotionManagerProfile = () => {
  const [user, setUser] = useState({
    fullName: '',
    initials: '?',
    email: '',
    phone: '',
    employeeId: '',
    department: 'Marketing & Promotions',
    officeLocation: 'HQ - Colombo',
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
        const name = parsed.fullName || parsed.name || 'Promotion Manager';
        const parts = name.split(' ');
        const initials = parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : name[0];

        setUser({
          fullName: name,
          initials: initials.toUpperCase(),
          email: parsed.email || '',
          phone: parsed.phone || '',
          employeeId: parsed.employeeId || 'PM-NEST-2026',
          department: parsed.department || 'Marketing & Promotions',
          officeLocation: parsed.officeLocation || 'HQ - Colombo',
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

        const storedUser = localStorage.getItem('user');
        const parsed = storedUser ? JSON.parse(storedUser) : {};
        localStorage.setItem('user', JSON.stringify({ ...parsed, ...updated }));

        setSuccessMsg('Profile updated successfully.');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <PromotionManagerLayout>
      <div className="max-w-4xl mx-auto py-10 space-y-10">
        <div>
          <h1 className="text-[32px] font-black text-[#2C1810]">Manager Profile</h1>
          <p className="text-[16px] text-gray-500 font-medium">Control your personal and professional profile details.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left: Identity Card */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-[32px] border border-gray-100 p-8 shadow-sm flex flex-col items-center text-center">
              <div className="relative group">
                <div className="h-32 w-32 rounded-full bg-nestle-brown text-white flex items-center justify-center text-[44px] font-black shadow-xl mb-6">
                  {user.initials}
                </div>
                <button className="absolute bottom-6 right-0 bg-white shadow-lg p-2.5 rounded-full text-nestle-brown hover:scale-110 transition-transform border border-gray-50">
                  <Camera size={20} />
                </button>
              </div>
              
              <h2 className="text-[22px] font-black text-[#2C1810]">{user.fullName}</h2>
              <div className="flex items-center text-gray-400 font-bold text-[14px] mt-1 mb-4">
                <Mail size={14} className="mr-2" />
                {user.email}
              </div>
              
              <span className="bg-[#DCFCE7] text-[#166534] text-[12px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest border border-[#166534]/10">
                Promotion Manager
              </span>

              <div className="w-full mt-10 pt-8 border-t border-gray-50 space-y-4">
                   <div className="flex items-center justify-between text-[13px]">
                        <span className="font-bold text-gray-400 uppercase tracking-widest">Employee ID</span>
                        <span className="font-black text-[#2C1810]">{user.employeeId}</span>
                   </div>
                   <div className="flex items-center justify-between text-[13px]">
                        <span className="font-bold text-gray-400 uppercase tracking-widest">Account Status</span>
                        <span className="font-black text-green-600 flex items-center">
                            <BadgeCheck size={14} className="mr-1" /> Verified
                        </span>
                   </div>
              </div>
            </div>
          </div>

          {/* Right: Edit Form */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-[32px] border border-gray-100 p-10 shadow-sm">
                <div className="flex items-center space-x-3 text-nestle-brown mb-8">
                    <User size={20} />
                    <h2 className="text-[18px] font-black uppercase tracking-widest">Personal Information</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <div className="space-y-2">
                        <label className="text-[12px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
                        <input
                            type="text" name="fullName" value={formData.fullName} onChange={handleChange}
                            className="w-full bg-gray-50/50 border border-gray-100 rounded-[16px] px-5 py-3.5 text-[15px] font-bold text-[#2C1810] focus:bg-white focus:ring-4 focus:ring-nestle-brown/5 focus:border-nestle-brown outline-none transition-all"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[12px] font-black text-gray-400 uppercase tracking-widest ml-1">Phone Contact</label>
                        <input
                            type="text" name="phone" value={formData.phone} onChange={handleChange}
                            className="w-full bg-gray-50/50 border border-gray-100 rounded-[16px] px-5 py-3.5 text-[15px] font-bold text-[#2C1810] focus:bg-white focus:ring-4 focus:ring-nestle-brown/5 focus:border-nestle-brown outline-none transition-all"
                        />
                    </div>
                </div>

                <div className="flex items-center space-x-3 text-nestle-brown mb-8 pt-4">
                    <Briefcase size={20} />
                    <h2 className="text-[18px] font-black uppercase tracking-widest">Employment</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                    <div className="space-y-2">
                        <label className="text-[12px] font-black text-gray-400 uppercase tracking-widest ml-1 opacity-60">Department</label>
                        <div className="flex items-center bg-gray-100/50 border border-gray-50 rounded-[16px] px-5 py-3.5 text-[15px] font-bold text-gray-500 cursor-not-allowed">
                            {user.department}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[12px] font-black text-gray-400 uppercase tracking-widest ml-1 opacity-60">Office Hub</label>
                        <div className="flex items-center bg-gray-100/50 border border-gray-50 rounded-[16px] px-5 py-3.5 text-[15px] font-bold text-gray-500 cursor-not-allowed">
                            <MapPin size={14} className="mr-2" /> {user.officeLocation}
                        </div>
                    </div>
                </div>

                {successMsg && (
                    <div className="mb-8 p-4 bg-green-50 border border-green-100 text-green-700 rounded-[16px] text-sm font-bold flex items-center">
                        <BadgeCheck size={18} className="mr-2" /> {successMsg}
                    </div>
                )}
                {errorMsg && (
                    <div className="mb-8 p-4 bg-red-50 border border-red-100 text-red-700 rounded-[16px] text-sm font-bold">
                        {errorMsg}
                    </div>
                )}

                <button
                    onClick={handleSave} disabled={saving}
                    className="w-full md:w-auto bg-[#3D2B1F] text-white font-black py-4 px-10 rounded-[20px] transition-all flex items-center justify-center space-x-3 shadow-lg shadow-brown-100/30 disabled:opacity-50 active:scale-[0.98]"
                >
                    {saving ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                    <span className="uppercase tracking-widest text-[14px]">Update Security Details</span>
                </button>
            </div>
          </div>
        </div>
      </div>
    </PromotionManagerLayout>
  );
};

export default PromotionManagerProfile;
