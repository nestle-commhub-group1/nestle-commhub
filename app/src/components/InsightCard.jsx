import React from 'react';
import { Lightbulb } from 'lucide-react';

const TYPE_STYLES = {
  stock: 'border-l-[#3B82F6]',        // blue
  promotion: 'border-l-[#22C55E]',    // green
  feedback: 'border-l-[#EAB308]',     // yellow
  alert: 'border-l-[#EF4444]',        // red
};

const DEFAULT_STYLE = 'border-l-gray-300';

const formatTimestamp = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const InsightCard = ({ title, message, type, timestamp }) => {
  const borderClass = TYPE_STYLES[type] || DEFAULT_STYLE;

  return (
    <div className={`bg-white rounded-[16px] shadow-sm border border-nestle-border border-l-[4px] ${borderClass} overflow-hidden`}>
      <div className="px-5 py-4 flex items-start gap-3">
        <div className="bg-amber-50 p-2 rounded-xl mt-0.5 shrink-0">
          <Lightbulb size={18} className="text-amber-500" />
        </div>
        <div className="min-w-0">
          <h3 className="text-[15px] font-extrabold text-nestle-brown leading-snug">{title}</h3>
          <p className="text-[13px] font-medium text-gray-600 mt-1 leading-relaxed">{message}</p>
          {timestamp && (
            <p className="text-[11px] text-gray-400 font-medium mt-2">
              {formatTimestamp(timestamp)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default InsightCard;
