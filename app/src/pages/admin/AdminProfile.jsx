import React from 'react';
import { Camera, Save } from 'lucide-react';
import AdminLayout from '../../components/layout/AdminLayout';

const AdminProfile = () => {
  const user = { 
    fullName: 'Kamal Silva', 
    initials: 'KS', 
    email: 'kamal.silva@nestle.com',
    phone: '+94 77 123 4567',
    employeeId: 'NES100',
    department: 'HQ Administration',
    officeLocation: 'Colombo Head Office'
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
            <h2 className="text-[20px] font-extrabold text-nestle-brown">{user.fullName}</h2>
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
              <label className="block text-[12px] font-bold text-[#3D2B1F] mb-2 uppercase tracking-wide">FULL NAME <span className="text-nestle-danger">*</span></label>
              <input type="text" defaultValue={user.fullName} className="w-full border border-nestle-border rounded-[10px] px-4 py-3 text-[15px] font-medium text-nestle-brown focus:outline-none focus:ring-2 focus:ring-nestle-brown/20 focus:border-nestle-brown bg-white shadow-sm" />
            </div>
            <div>
              <label className="block text-[12px] font-bold text-[#3D2B1F] mb-2 uppercase tracking-wide">PHONE NUMBER <span className="text-nestle-danger">*</span></label>
              <input type="text" defaultValue={user.phone} className="w-full border border-nestle-border rounded-[10px] px-4 py-3 text-[15px] font-medium text-nestle-brown focus:outline-none focus:ring-2 focus:ring-nestle-brown/20 focus:border-nestle-brown bg-white shadow-sm" />
            </div>
          </div>
          
          <div>
            <label className="block text-[12px] font-bold text-[#3D2B1F] mb-2 uppercase tracking-wide">EMAIL ADDRESS</label>
            <input type="text" value={user.email} disabled className="w-full border border-nestle-border rounded-[10px] px-4 py-3 text-[15px] font-medium text-gray-500 bg-[#F8F7F5] cursor-not-allowed" />
          </div>
        </div>

        {/* Employment Details */}
        <div className="bg-white border border-nestle-border rounded-[20px] p-8 shadow-sm mb-8">
          <h3 className="text-[13px] font-extrabold text-[#3D2B1F] tracking-widest uppercase mb-6 flex items-center">
            EMPLOYMENT DETAILS
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-[12px] font-bold text-[#3D2B1F] mb-2 uppercase tracking-wide">EMPLOYEE ID</label>
              <input type="text" value={user.employeeId} disabled className="w-full border border-nestle-border rounded-[10px] px-4 py-3 text-[15px] font-medium text-gray-500 bg-[#F8F7F5] cursor-not-allowed" />
            </div>
            <div>
              <label className="block text-[12px] font-bold text-[#3D2B1F] mb-2 uppercase tracking-wide">DEPARTMENT</label>
              <input type="text" value={user.department} disabled className="w-full border border-nestle-border rounded-[10px] px-4 py-3 text-[15px] font-medium text-gray-500 bg-[#F8F7F5] cursor-not-allowed" />
            </div>
          </div>
          
          <div>
            <label className="block text-[12px] font-bold text-[#3D2B1F] mb-2 uppercase tracking-wide">OFFICE LOCATION</label>
            <input type="text" defaultValue={user.officeLocation} className="w-full border border-nestle-border rounded-[10px] px-4 py-3 text-[15px] font-medium text-nestle-brown focus:outline-none focus:ring-2 focus:ring-nestle-brown/20 focus:border-nestle-brown bg-white shadow-sm" />
          </div>
        </div>

        <button className="w-full md:w-auto bg-[#3D2B1F] text-white font-bold text-[15px] px-8 py-3.5 rounded-[12px] hover:bg-nestle-brown transition-colors flex items-center justify-center space-x-2 shadow-md hover:shadow-lg">
          <Save size={18} />
          <span>Save Changes</span>
        </button>

      </div>
    </AdminLayout>
  );
};

export default AdminProfile;
