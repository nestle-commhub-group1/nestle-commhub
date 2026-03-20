import React from 'react';
import RetailerLayout from '../../components/layout/RetailerLayout';
import { Truck } from 'lucide-react';

export default function DeliveryTracking() {
  return (
    <RetailerLayout>
      <div className="pb-10">
        <div className="mb-8">
          <h1 className="text-[26px] font-extrabold text-[#2C1810]">Delivery Tracking</h1>
          <p className="text-[15px] font-medium text-gray-500 mt-1">Track your incoming deliveries in real time</p>
        </div>
        <div className="bg-white border border-[#E0DBD5] rounded-[24px] shadow-sm flex flex-col items-center justify-center py-24 px-8 text-center">
          <div className="w-20 h-20 bg-[#F5F3F0] rounded-full flex items-center justify-center mb-6">
            <Truck size={36} className="text-[#3D2B1F]" />
          </div>
          <h2 className="text-[22px] font-extrabold text-[#2C1810] mb-2">Coming Soon</h2>
          <p className="text-[15px] text-gray-500 font-medium max-w-sm leading-relaxed">
            Real-time delivery tracking is under development. You'll be able to track your deliveries live from dispatch to doorstep.
          </p>
          <div className="mt-8 bg-[#F5F3F0] border border-[#E0DBD5] rounded-[14px] px-6 py-4 text-left max-w-sm w-full">
            <p className="text-[12px] font-extrabold text-[#3D2B1F] uppercase tracking-widest mb-3">Planned Features</p>
            {['Live GPS tracking for all deliveries', 'Estimated arrival time updates', 'Delivery confirmation & sign-off', 'Delivery history & records'].map(f => (
              <div key={f} className="flex items-center space-x-2 mb-2">
                <span className="w-1.5 h-1.5 bg-[#3D2B1F] rounded-full flex-shrink-0" />
                <p className="text-[13px] text-gray-600 font-medium">{f}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </RetailerLayout>
  );
}
