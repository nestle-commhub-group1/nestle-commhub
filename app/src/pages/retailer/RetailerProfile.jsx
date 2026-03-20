import React, { useState, useEffect } from 'react';
import { Camera, Save } from 'lucide-react';
import RetailerLayout from '../../components/layout/RetailerLayout';

const RetailerProfile = () => {
  const [user, setUser] = useState({ 
    fullName: 'Chaminda Jayawardena', 
    initials: 'CJ', 
    email: 'chaminda@samanstores.lk',
    phone: '+94 77 123 4567',
    businessName: 'Saman General Stores',
    taxId: 'PV-00087412',
    address: '12/A, Baseline Road, Colombo 09'
  });

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        const name = parsedUser.fullName || parsedUser.name || 'User';
        const parts = name.split(' ');
        const initials = parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : name[0];
        
        setUser(prev => ({
          ...prev,
          ...parsedUser,
          fullName: name,
          initials: initials.toUpperCase(),
          email: parsedUser.email || prev.email,
          phone: parsedUser.contactNumber || prev.phone,
          businessName: parsedUser.businessName || prev.businessName,
          taxId: parsedUser.taxId || prev.taxId,
          address: parsedUser.address || prev.address
        }));

        setFormData({
          fullName: name,
          phone: parsedUser.contactNumber || '+94 77 123 4567'
        });
      } catch (e) {}
    } else {
      setFormData({
        fullName: 'Chaminda Jayawardena',
        phone: '+94 77 123 4567'
      });
    }
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSave = () => {
    // Basic save simulation
    const updatedUser = { ...user, ...formData };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    alert('Changes saved successfully!');
  };

  return (
    <RetailerLayout>
      <div className="max-w-3xl pb-10">
        <div className="mb-8">
          <h1 className="text-[26px] font-extrabold text-nestle-brown">My Profile</h1>
          <p className="text-[15px] font-medium text-gray-500 mt-1">View and update your account details</p>
        </div>

        {/* Top Card */}
        <div className="bg-white border border-nestle-border rounded-[20px] p-6 shadow-sm mb-6 flex items-center space-x-6">
          <div className="relative">
             <div className="h-[90px] w-[90px] rounded-full bg-nestle-brown text-white flex items-center justify-center text-[32px] font-bold shadow-inner">
              {user.initials}
             </div>
             <button className="absolute bottom-0 right-0 bg-white border border-nestle-border shadow-sm p-1.5 rounded-full text-gray-600 hover:text-nestle-brown transition-colors">
               <Camera size={16} />
             </button>
          </div>
          <div>
            <h2 className="text-[20px] font-extrabold text-nestle-brown">{user.fullName}</h2>
            <p className="text-[14px] font-medium text-gray-500 mt-0.5">{user.email}</p>
            <span className="inline-block mt-3 bg-[#FEF3C7] text-[#92400E] text-[12px] font-bold px-3 py-1 rounded-md shadow-sm">
              Retailer
            </span>
          </div>
        </div>

        {/* Personal Info */}
        <div className="bg-white border border-nestle-border rounded-[20px] p-8 shadow-sm mb-6">
          <h3 className="text-[13px] font-extrabold text-[#3D2B1F] tracking-widest uppercase mb-6">PERSONAL INFORMATION</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-[12px] font-bold text-[#3D2B1F] mb-2 uppercase tracking-wide">FULL NAME <span className="text-nestle-danger">*</span></label>
              <input 
                type="text" 
                name="fullName"
                value={formData.fullName} 
                onChange={handleChange}
                className="w-full border border-nestle-border rounded-[10px] px-4 py-3 text-[15px] font-medium text-nestle-brown focus:outline-none focus:ring-2 focus:ring-nestle-brown/20 focus:border-nestle-brown bg-white shadow-sm"
              />
            </div>
            <div>
              <label className="block text-[12px] font-bold text-[#3D2B1F] mb-2 uppercase tracking-wide">PHONE NUMBER <span className="text-nestle-danger">*</span></label>
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

        {/* Business Info */}
        <div className="bg-white border border-nestle-border rounded-[20px] p-8 shadow-sm mb-8">
          <h3 className="text-[13px] font-extrabold text-[#3D2B1F] tracking-widest uppercase mb-6 flex items-center">
            BUSINESS INFORMATION <span className="text-gray-400 font-medium ml-2 text-[12px] normal-case tracking-normal hover:bg-gray-100 px-2 py-0.5 rounded-md">(Read only)</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-[12px] font-bold text-[#3D2B1F] mb-2 uppercase tracking-wide">BUSINESS NAME</label>
              <input 
                type="text" 
                value={user.businessName} 
                disabled
                className="w-full border border-nestle-border rounded-[10px] px-4 py-3 text-[15px] font-medium text-gray-600 bg-[#F8F7F5] cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-[12px] font-bold text-[#3D2B1F] mb-2 uppercase tracking-wide">TAX ID / REG. NUMBER</label>
              <input 
                type="text" 
                value={user.taxId} 
                disabled
                className="w-full border border-nestle-border rounded-[10px] px-4 py-3 text-[15px] font-medium text-gray-600 bg-[#F8F7F5] cursor-not-allowed"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-[12px] font-bold text-[#3D2B1F] mb-2 uppercase tracking-wide">BUSINESS ADDRESS</label>
            <input 
              type="text" 
              value={user.address} 
              disabled
              className="w-full border border-nestle-border rounded-[10px] px-4 py-3 text-[15px] font-medium text-gray-600 bg-[#F8F7F5] cursor-not-allowed"
            />
          </div>
        </div>

        <button 
          onClick={handleSave}
          className="w-full md:w-auto bg-[#3D2B1F] text-white font-bold text-[15px] px-8 py-3.5 rounded-[12px] hover:bg-nestle-brown transition-colors flex items-center justify-center space-x-2 shadow-md hover:shadow-lg"
        >
          <Save size={18} />
          <span>Save Changes</span>
        </button>

      </div>
    </RetailerLayout>
  );
};

export default RetailerProfile;
