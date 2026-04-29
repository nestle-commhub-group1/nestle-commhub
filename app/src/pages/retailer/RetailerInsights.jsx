import React, { useState, useEffect } from 'react';
import { Lightbulb, Loader2 } from 'lucide-react';
import RetailerLayout from '../../components/layout/RetailerLayout';
import InsightCard from '../../components/InsightCard';
import API_URL from '../../config/api';

/* ─── Retailer-visible groups ───────────────────────────────────────────────── */

const RETAILER_GROUPS = {
  fulfillment: {
    heading: 'Order Fulfillment',
    types: ['order_fulfillment_rate', 'own_fulfillment_rate'],
    cardType: 'stock',
  },
  feedback: {
    heading: 'Feedback Insights',
    types: ['feedback_avg_rating', 'own_feedback_score'],
    cardType: 'feedback',
  },
};

const GROUP_ORDER = ['fulfillment', 'feedback'];

const RetailerInsights = () => {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLatestInsights = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/api/insights/latest`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();

        if (res.ok && data.success) {
          setInsights(data.insights);
        } else {
          setInsights([]);
        }
      } catch (err) {
        console.error('Failed to fetch insights:', err);
        setError('Failed to load insights.');
      } finally {
        setLoading(false);
      }
    };

    fetchLatestInsights();
  }, []);

  const getGroupInsights = (groupKey) => {
    const group = RETAILER_GROUPS[groupKey];
    if (!group) return [];
    return insights.filter((i) => group.types.includes(i.type));
  };

  return (
    <RetailerLayout>
      <div className="space-y-8 pb-10">
        <h1 className="text-[26px] font-extrabold text-[#2C1810]">Your Performance</h1>

        {/* Loading state */}
        {loading && (
          <div className="bg-white rounded-[20px] shadow-sm border border-nestle-border p-10 flex flex-col items-center justify-center gap-3">
            <Loader2 size={28} className="text-gray-400 animate-spin" />
            <p className="text-[14px] font-medium text-gray-400">Loading insights…</p>
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="bg-white rounded-[20px] shadow-sm border border-nestle-border p-10 text-center">
            <p className="text-[14px] font-medium text-nestle-danger">{error}</p>
          </div>
        )}

        {/* Grouped insight sections */}
        {!loading && !error && GROUP_ORDER.map((groupKey) => {
          const group = RETAILER_GROUPS[groupKey];
          const groupInsights = getGroupInsights(groupKey);

          return (
            <div key={groupKey} className="space-y-3">
              <h2 className="text-[17px] font-extrabold text-nestle-brown flex items-center gap-2">
                <div className="w-1 h-5 rounded-full bg-amber-400" />
                {group.heading}
              </h2>

              {groupInsights.length === 0 ? (
                <div className="bg-white rounded-[16px] shadow-sm border border-nestle-border p-6 flex items-center gap-3">
                  <div className="bg-gray-100 p-2 rounded-xl">
                    <Lightbulb size={18} className="text-gray-400" />
                  </div>
                  <p className="text-[13px] font-medium text-gray-400">No insights available</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {groupInsights.map((insight, idx) => (
                    <InsightCard
                      key={insight._id || idx}
                      title={group.heading}
                      message={insight.message}
                      type={group.cardType}
                      timestamp={insight.createdAt}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </RetailerLayout>
  );
};

export default RetailerInsights;
