import React from 'react';
import { useNavigate } from 'react-router-dom';

const UnderDevelopment = ({ pageName }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-[#F5F3F0]">
      <div className="bg-white p-[60px] rounded-[16px] shadow-sm max-w-[400px] text-center border border-[#E0DBD5]">
        <div className="flex justify-center mb-6">
          {/* Nestlé-inspired logo placeholder / text */}
          <span className="text-[14px] font-black tracking-tighter text-[#2C1810] uppercase">Nestlé</span>
        </div>
        
        <div className="text-[60px] mb-6">🚧</div>
        
        <h1 className="text-[24px] font-bold text-[#3D2B1F] mb-2">{pageName}</h1>
        
        <p className="text-[#6B7280] text-[15px] mb-1 font-medium italic">
          This feature is currently under development
        </p>
        
        <p className="text-[#9CA3AF] text-[13px] mb-8 font-medium">
          Coming in Sprint 2
        </p>
        
        <button
          onClick={() => navigate(-1)}
          className="w-full bg-[#3D2B1F] text-white font-bold text-[14px] py-3.5 rounded-[12px] hover:bg-[#2C1810] transition-colors shadow-sm"
        >
          Go Back
        </button>
      </div>
    </div>
  );
};

export default UnderDevelopment;
