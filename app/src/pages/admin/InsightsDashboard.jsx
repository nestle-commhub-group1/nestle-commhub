import React, { useState, useEffect } from 'react';
import { Lightbulb, Loader2 } from 'lucide-react';
import AdminLayout from '../../components/layout/AdminLayout';
import InsightCard from '../../components/InsightCard';
import { useAuth } from '../../context/AuthContext';
import API_URL from '../../config/api';

/* ─── Group definitions ─────────────────────────────────────────────────────── */
// Each group maps a UI section to the insight `type` values produced by the backend

const INSIGHT_GROUPS = {
  promotion: {
    heading: 'Promotion Insights',
    types: ['promotion_performance'],
    cardType: 'promotion',
  },
  stock: {
    heading: 'Stock Insights',
    types: ['stock_request_trend', 'stock_forecast'],
    cardType: 'stock',
  },
  feedback: {
    heading: 'Feedback Insights',
    types: ['feedback_avg_rating', 'own_feedback_score'],
    cardType: 'feedback',
  },
  fulfillment: {
    heading: 'Order Fulfillment',
    types: ['order_fulfillment_rate', 'own_fulfillment_rate'],
    cardType: 'stock',
  },
  alert: {
    heading: 'Alerts',
    types: ['low_stock_alert'],
    cardType: 'alert',
  },
  retailerPattern: {
    heading: 'Retailer Patterns',
    types: ['retailer_order_pattern'],
    cardType: 'promotion',
  },
};

/* ─── Which groups each role can see ────────────────────────────────────────── */

const ROLE_GROUPS = {
  hq_admin:           Object.keys(INSIGHT_GROUPS), // all
  staff:              Object.keys(INSIGHT_GROUPS), // all
  promotion_manager:  ['promotion', 'stock', 'feedback', 'fulfillment'],
  stock_manager:      ['stock', 'alert', 'fulfillment', 'retailerPattern'],
  retailer:           ['fulfillment', 'feedback'],
};

/* ─── Component ─────────────────────────────────────────────────────────────── */

const InsightsDashboard = () => {
  const { user } = useAuth();
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const role = user?.role || 'retailer';
  const isRetailer = role === 'retailer';

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

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Determine which groups this role can see
  const visibleGroupKeys = ROLE_GROUPS[role] || ROLE_GROUPS.retailer;

  // Group insights by their matching group key
  const getGroupInsights = (groupKey) => {
    const group = INSIGHT_GROUPS[groupKey];
    if (!group) return [];
    return insights.filter((i) => group.types.includes(i.type));
  };

  return (
    <AdminLayout>
      <div className="space-y-8 pb-10">
        <h1 className="text-[26px] font-extrabold text-[#2C1810]">
          {isRetailer ? 'Your Performance' : 'AI Insights'}
        </h1>

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
        {!loading && !error && visibleGroupKeys.map((groupKey) => {
          const group = INSIGHT_GROUPS[groupKey];
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
    </AdminLayout>
  );
};

export default InsightsDashboard;
