import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { loginAsRole, clearDevAuth, devUsers } from '../utils/devAuth';
import { Lock, ShieldAlert, Key } from 'lucide-react';

const roleConfig = {
  retailer: {
    label: 'Retailer',
    badge: { text: 'Retailer', bg: 'bg-green-100', text_color: 'text-green-800', border: 'border-green-200' },
    description: 'Customer-facing retailer portal',
  },
  staff: {
    label: 'Sales Staff',
    badge: { text: 'Sales Staff', bg: 'bg-blue-100', text_color: 'text-blue-800', border: 'border-blue-200' },
    description: 'Field sales representative view',
  },
  hq_admin: {
    label: 'HQ Admin',
    badge: { text: 'HQ Admin', bg: 'bg-red-100', text_color: 'text-[#8B0000]', border: 'border-red-200' },
    description: 'Full platform administration access',
  },
  distributor: {
    label: 'Distributor',
    badge: { text: 'Distributor', bg: 'bg-orange-100', text_color: 'text-orange-800', border: 'border-orange-200' },
    description: 'Distribution management portal',
  },
  promotion_manager: {
    label: 'Project Manager',
    badge: { text: 'Project Manager', bg: 'bg-purple-100', text_color: 'text-purple-800', border: 'border-purple-200' },
    description: 'Manage marketing promotions',
  },
  stock_manager: {
    label: 'Stock Manager',
    badge: { text: 'Stock Manager', bg: 'bg-blue-100', text_color: 'text-blue-800', border: 'border-blue-200' },
    description: 'Manage inventory and orders',
  },
};

const allRoutes = [
  { group: 'Retailer', paths: ['/retailer/dashboard', '/retailer/profile', '/retailer/submit-issue', '/retailer/tickets', '/retailer/promotions', '/retailer/stock-requests', '/retailer/delivery'] },
  { group: 'Staff', paths: ['/staff/dashboard', '/staff/profile', '/staff/tickets', '/staff/broadcasts'] },
  { group: 'HQ Admin', paths: ['/admin/dashboard', '/admin/profile', '/admin/users', '/admin/sla', '/admin/analytics', '/admin/broadcasts', '/admin/evaluations'] },
  { group: 'Promotion Manager', paths: ['/promotion-manager/dashboard', '/promotion-manager/promotions', '/promotion-manager/create', '/promotion-manager/profile'] },
  { group: 'Distributor', paths: ['/distributor/dashboard', '/distributor/promotions'] },
  { group: 'Stock Manager', paths: ['/stock-manager/dashboard', '/stock-manager/inventory', '/stock-manager/orders', '/stock-manager/profile'] },
  { group: 'Public/Auth', paths: ['/login', '/register', '/otp', '/forgot-password', '/unauthorized'] },
];

const initials = (name) => {
  const parts = name.trim().split(' ');
  return parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : name[0];
};

const DevLauncher = () => {
  const [password, setPassword] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [error, setError] = useState('');

  // Default dev password if not provided in ENV
  const DEV_PASSWORD = import.meta.env.VITE_DEV_PASSWORD || 'nestle_dev_2024';

  const handleAuth = (e) => {
    e.preventDefault();
    if (password === DEV_PASSWORD) {
      setIsAuthorized(true);
      setError('');
    } else {
      setError('Invalid developer password');
    }
  };

  // Skip auth screen in local development
  if (!isAuthorized && !import.meta.env.DEV) {
    return (
      <div className="min-h-screen bg-[#F5F3F0] flex items-center justify-center p-6 font-sans">
        <div className="w-full max-w-md bg-white rounded-[32px] border border-[#E0DBD5] shadow-xl overflow-hidden animate-in fade-in zoom-in duration-300">
          <div className="bg-[#2C1810] p-10 text-center">
            <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center mx-auto mb-6 backdrop-blur-md">
              <Lock className="text-white" size={40} />
            </div>
            <h1 className="text-2xl font-black text-white uppercase tracking-tighter">Dev Entry Point</h1>
            <p className="text-gray-400 text-sm mt-2 font-medium">Remote development tools are restricted</p>
          </div>
          
          <form onSubmit={handleAuth} className="p-10 space-y-8">
            <div className="space-y-3">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">Verification Required</label>
              <div className="relative group">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Master Password"
                  className="w-full bg-[#F5F3F0] border-2 border-transparent rounded-2xl py-4.5 px-6 text-[16px] font-bold focus:border-[#3D2B1F] focus:bg-white transition-all outline-none"
                  autoFocus
                />
                <Key className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-[#3D2B1F] transition-colors" size={24} />
              </div>
              {error && (
                <div className="flex items-center space-x-2 mt-4 px-2 text-red-500 animate-bounce">
                  <ShieldAlert size={16} />
                  <span className="text-[13px] font-black uppercase">{error}</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-[#3D2B1F] text-white font-black py-5 rounded-2xl hover:bg-[#2C1810] active:scale-[0.97] transition-all shadow-xl shadow-[#3D2B1F]/20 text-[15px] uppercase tracking-widest"
            >
              Verify Identity
            </button>
            
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => window.location.href = '/login'}
                className="text-gray-400 font-bold text-[13px] hover:text-[#2C1810] transition-colors flex items-center justify-center mx-auto"
              >
                Return to Public Portal
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F3F0] font-sans">
      {/* Header */}
      <div className="bg-[#2C1810] text-white px-6 py-5">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3">
              <span className="text-[22px] font-extrabold tracking-tight">Nestlé CommHub</span>
              <span className="bg-yellow-400 text-yellow-900 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">Dev Mode</span>
            </div>
            <p className="text-gray-400 text-[13px] font-medium mt-0.5">Developer Quick Access — Skip login and jump straight to any dashboard</p>
          </div>
          <button
            onClick={clearDevAuth}
            className="text-[13px] font-semibold text-gray-400 hover:text-white border border-gray-600 hover:border-gray-400 px-4 py-2 rounded-lg transition-colors"
          >
            Logout & Exit
          </button>
        </div>
      </div>

      {/* Warning banner */}
      <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-2.5">
        <p className="max-w-4xl mx-auto text-[13px] text-yellow-800 font-medium">
          ⚠️ You are accessing the system via the <strong>Developer Entry Point</strong>. All actions will use standardized test accounts.
        </p>
      </div>

      {/* Cards Grid — 2x2 */}
      <div className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-[13px] font-extrabold text-gray-400 tracking-widest uppercase mb-6">Select a role to open its dashboard</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {Object.entries(roleConfig).map(([roleKey, config]) => {
            const user = devUsers[roleKey];
            const badge = config.badge;

            return (
              <div
                key={roleKey}
                className="bg-white rounded-[20px] border border-[#E0DBD5] shadow-sm hover:shadow-md transition-shadow p-6 flex flex-col"
              >
                {/* Avatar + name */}
                <div className="flex items-center space-x-4 mb-4">
                  <div className="h-12 w-12 rounded-full bg-[#2C1810] text-white flex items-center justify-center text-[16px] font-bold flex-shrink-0">
                    {user ? initials(user.fullName) : '?'}
                  </div>
                  <div>
                    <p className="text-[16px] font-extrabold text-[#2C1810] leading-tight">{user ? user.fullName : 'Unknown'}</p>
                    <p className="text-[12px] text-gray-400 font-medium mt-0.5">{user ? user.email : ''}</p>
                  </div>
                </div>

                {/* Role badge */}
                <span className={`inline-block w-max text-[11px] font-bold px-2.5 py-1 rounded-md border mb-3 ${badge.bg} ${badge.text_color} ${badge.border}`}>
                  {badge.text}
                </span>

                {/* Description */}
                <p className="text-[13px] text-gray-500 font-medium mb-5 flex-1">{config.description}</p>

                {/* Open button */}
                <button
                  onClick={() => loginAsRole(roleKey)}
                  className="w-full bg-[#3D2B1F] text-white font-bold text-[14px] py-3 rounded-[12px] hover:bg-[#2C1810] active:scale-[0.98] transition-all shadow-sm"
                >
                  Open Dashboard →
                </button>
              </div>
            );
          })}
        </div>

        {/* Sitemap / All Routes Section */}
        <div className="mt-16 bg-white rounded-[32px] border border-[#E0DBD5] shadow-sm overflow-hidden">
          <div className="bg-gray-50 px-8 py-5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-[14px] font-black text-[#2C1810] uppercase tracking-widest">Complete System Sitemap</h2>
            <span className="text-[10px] bg-gray-200 text-gray-600 font-bold px-2 py-0.5 rounded-full uppercase">All Interfaces</span>
          </div>
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {allRoutes.map((section, idx) => (
              <div key={idx} className="space-y-3">
                <h3 className="text-[12px] font-black text-nestle-brown uppercase tracking-wider border-b border-gray-100 pb-2">{section.group}</h3>
                <div className="flex flex-col space-y-1.5">
                  {section.paths.map((path, pIdx) => (
                    <a 
                      key={pIdx} 
                      href={path}
                      className="text-[13px] text-gray-500 hover:text-nestle-brown hover:underline font-medium flex items-center"
                    >
                      <span className="w-1.5 h-1.5 bg-gray-300 rounded-full mr-2"></span>
                      {path}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom clear session */}
        <div className="mt-10 text-center pb-20">
          <button
            onClick={clearDevAuth}
            className="text-[14px] font-semibold text-gray-500 hover:text-[#2C1810] underline underline-offset-4 transition-colors"
          >
            Clear Session &amp; Return to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default DevLauncher;
