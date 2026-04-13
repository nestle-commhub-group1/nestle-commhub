import React from 'react';
import { Navigate } from 'react-router-dom';
import { loginAsRole, clearDevAuth, devUsers } from '../utils/devAuth';

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
    label: 'Promotion Manager',
    badge: { text: 'Manager', bg: 'bg-purple-100', text_color: 'text-purple-800', border: 'border-purple-200' },
    description: 'Manage marketing promotions',
  },
};

const initials = (name) => {
  const parts = name.trim().split(' ');
  return parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : name[0];
};

const DevLauncher = () => {
  if (!import.meta.env.DEV) {
    return <Navigate to="/login" replace />;
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
            Clear Session &amp; Go to Login
          </button>
        </div>
      </div>

      {/* Warning banner */}
      <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-2.5">
        <p className="max-w-4xl mx-auto text-[13px] text-yellow-800 font-medium">
          ⚠️ This page is only visible in development mode (<code className="bg-yellow-100 px-1 rounded font-mono text-[12px]">import.meta.env.DEV === true</code>). It will redirect to /login in production.
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
                    {initials(user.fullName)}
                  </div>
                  <div>
                    <p className="text-[16px] font-extrabold text-[#2C1810] leading-tight">{user.fullName}</p>
                    <p className="text-[12px] text-gray-400 font-medium mt-0.5">{user.email}</p>
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

        {/* Bottom clear session */}
        <div className="mt-10 text-center">
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
