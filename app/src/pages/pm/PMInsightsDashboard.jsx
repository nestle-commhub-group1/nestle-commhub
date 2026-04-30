import React, { useState, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import PromotionManagerLayout from '../../components/layout/PromotionManagerLayout';
import API_URL from '../../config/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement, PointElement,
  ArcElement, Title, Tooltip, Legend, Filler
);

/* ── Chart defaults — warm palette to match app ── */
const CHART_DEFAULTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
      labels: { padding: 16, color: '#6B7280', font: { size: 12, weight: '600' } },
    },
  },
  scales: {
    x: { ticks: { color: '#9CA3AF', font: { size: 11 } }, grid: { color: 'rgba(0,0,0,0.04)' } },
    y: { ticks: { color: '#9CA3AF', font: { size: 11 } }, grid: { color: 'rgba(0,0,0,0.04)' } },
  },
};

const Spinner = () => (
  <div className="flex justify-center items-center min-h-[200px] text-gray-400">
    <Loader2 size={28} className="animate-spin" />
  </div>
);

const NoData = () => (
  <div className="flex justify-center items-center min-h-[200px] text-gray-400 font-medium text-sm italic">
    No data available
  </div>
);

/* ── Metric Card ── */
const MetricCard = ({ label, value, sub, accentColor }) => (
  <div
    data-testid="metric-card"
    className="bg-white rounded-[20px] p-6 shadow-sm border border-[#E0DBD5] flex items-center justify-between"
    style={{ borderLeft: `4px solid ${accentColor}` }}
  >
    <div>
      <p className="text-[13px] font-semibold text-gray-500 mb-1">{label}</p>
      <p className="text-[32px] font-extrabold text-[#2C1810] leading-none">{value}</p>
      <p className="text-[12px] text-gray-400 mt-2 font-medium">{sub}</p>
    </div>
  </div>
);

const PMInsightsDashboard = () => {
  const [period, setPeriod] = useState('30');
  const [promoFilter, setPromoFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('Promotions');

  const [summary, setSummary] = useState(null);
  const [promotions, setPromotions] = useState(null);
  const [conversions, setConversions] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [stock, setStock] = useState(null);

  const [loadState, setLoadState] = useState({
    summary: true, promos: true, conversions: true, feedback: true, stock: true,
  });

  const updateLoad = (key, val) =>
    setLoadState(prev => ({ ...prev, [key]: val }));

  const apiFetch = async (path, key) => {
    updateLoad(key, true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}${path}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      updateLoad(key, false);
      return json.data ?? null;
    } catch {
      updateLoad(key, false);
      return null;
    }
  };

  const fetchAll = useCallback(async () => {
    const qs = `?period=${period}d`;
    apiFetch(`/api/analytics/summary${qs}`, 'summary').then(setSummary);
    apiFetch(`/api/analytics/promotions`, 'promos').then(setPromotions);
    apiFetch(`/api/analytics/conversions${qs}`, 'conversions').then(setConversions);
    apiFetch(`/api/analytics/feedback`, 'feedback').then(setFeedback);
    apiFetch(`/api/analytics/stock${qs}`, 'stock').then(setStock);
  }, [period]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filteredPromos = promotions
    ? promoFilter === 'all'
      ? promotions
      : promotions.filter(p => p.promotionId === promoFilter)
    : [];

  /* ── Chart data ── */

  const unitsSoldData = {
    labels: filteredPromos.map(p => p.title),
    datasets: [{
      label: 'Units Sold',
      data: filteredPromos.map(p => p.totalUnitsSold),
      backgroundColor: '#3D2B1F',
      borderRadius: 6,
    }],
  };

  const conversionData = conversions ? {
    labels: conversions.map(c => c.promotionName),
    datasets: [{
      label: 'Conversion %',
      data: conversions.map(c => c.conversionRate),
      backgroundColor: '#F59E0B',
      borderRadius: 4,
    }],
  } : null;

  const doughnutData = feedback && feedback.total > 0 ? {
    labels: [
      `Positive ${feedback.positivePct}%`,
      `Neutral ${feedback.neutralPct}%`,
      `Negative ${feedback.negativePct}%`,
    ],
    datasets: [{
      data: [feedback.positive, feedback.neutral, feedback.negative],
      backgroundColor: ['#22C55E', '#F59E0B', '#EF4444'],
      borderWidth: 2,
      borderColor: '#F8F7F5',
    }],
  } : null;

  const maxStock = stock ? Math.max(...stock.map(s => s.totalUnits)) : 0;
  const threshold = maxStock > 0 ? Math.round(maxStock * 0.9) : 0;
  const stockLineData = stock ? {
    labels: stock.map(s => s.day),
    datasets: [
      {
        label: 'Stock Requests',
        data: stock.map(s => s.totalUnits),
        borderColor: '#3D2B1F',
        backgroundColor: 'rgba(61,43,31,0.08)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#fff',
        pointBorderColor: '#3D2B1F',
        pointRadius: 4,
      },
      {
        label: 'High Demand Threshold',
        data: stock.map(() => threshold),
        borderColor: '#EF4444',
        borderDash: [6, 4],
        pointRadius: 0,
        fill: false,
      },
    ],
  } : null;

  const fulfillmentData = conversions ? {
    labels: conversions.map(c => c.promotionName),
    datasets: [
      {
        label: 'Fulfilled',
        data: conversions.map(c => c.fulfillmentRate),
        backgroundColor: '#22C55E',
        borderRadius: 4,
      },
      {
        label: 'Rejected',
        data: conversions.map(c => parseFloat((100 - c.fulfillmentRate).toFixed(1))),
        backgroundColor: '#FCA5A5',
        borderRadius: 4,
      },
    ],
  } : null;

  /* ── Select style ── */
  const selectCls =
    'w-full px-4 py-3 bg-[#F8F7F5] border border-[#E0DBD5] rounded-[14px] font-semibold text-[14px] text-[#3D2B1F] outline-none focus:ring-2 focus:ring-[#3D2B1F]/20 cursor-pointer appearance-none';

  return (
    <PromotionManagerLayout>
      {/* Page background matches app warm beige */}
      <div className="min-h-screen bg-nestle-gray p-6 lg:p-8 font-sans space-y-6">

        {/* ── Page Header ── */}
        <div>
          <h1 className="text-[28px] font-black text-[#2C1810] tracking-tight">
            Promotion Analytics
          </h1>
          <p className="text-[14px] text-gray-500 font-medium mt-1">
            Insights for active campaigns, conversions and feedback
          </p>
        </div>

        {/* ── Filter Bar ── */}
        <div className="bg-white rounded-[24px] border border-[#E0DBD5] shadow-sm p-5 flex flex-wrap gap-4">
          <div className="flex-1 min-w-[180px]">
            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">
              Period
            </label>
            <select
              className={selectCls}
              value={period}
              onChange={e => setPeriod(e.target.value)}
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="all">All time</option>
            </select>
          </div>
          <div className="flex-1 min-w-[180px]">
            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">
              Promotion
            </label>
            <select
              className={selectCls}
              value={promoFilter}
              onChange={e => setPromoFilter(e.target.value)}
            >
              <option value="all">All promotions</option>
              {(promotions || []).map(p => (
                <option key={p.promotionId} value={p.promotionId}>{p.title}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Metric Cards ── */}
        {loadState.summary ? (
          <Spinner />
        ) : summary ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <MetricCard
              label="Active Promotions"
              value={summary.activePromotions ?? 0}
              sub={`${summary.endingSoon ?? 0} ending this week`}
              accentColor="#F59E0B"
            />
            <MetricCard
              label="Total Units Sold"
              value={(summary.totalUnitsSold ?? 0).toLocaleString()}
              sub="via promotions"
              accentColor="#3D2B1F"
            />
            <MetricCard
              label="Avg Conversion Rate"
              value={`${summary.avgConversionRate ?? 0}%`}
              sub={`${summary.conversionDelta ?? '--'} vs last period`}
              accentColor="#22C55E"
            />
            <MetricCard
              label="Avg Feedback Rating"
              value={`${summary.avgFeedbackRating ?? 0} / 10`}
              sub={`${summary.totalReviews ?? 0} total reviews`}
              accentColor="#3B82F6"
            />
          </div>
        ) : (
          <NoData />
        )}

        {/* ── Tab Bar ── */}
        <div className="flex gap-2 bg-white border border-[#E0DBD5] p-1.5 rounded-[16px] w-fit shadow-sm">
          {['Promotions', 'Feedback', 'Fulfillment'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-[12px] font-black text-[13px] uppercase tracking-widest transition-all duration-200 ${
                activeTab === tab
                  ? 'bg-[#3D2B1F] text-white shadow-sm'
                  : 'text-gray-400 hover:text-[#2C1810]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ── Tab Contents ── */}

        {/* PROMOTIONS */}
        {activeTab === 'Promotions' && (
          <div className="space-y-6">
            <div className="bg-white rounded-[24px] border border-[#E0DBD5] shadow-sm p-6">
              <h2 className="text-[17px] font-black text-[#2C1810] mb-5">
                Units Sold per Campaign
              </h2>
              {loadState.promos ? <Spinner /> : filteredPromos.length > 0 ? (
                <div className="h-[380px]">
                  <Bar
                    aria-label="Units Sold per Campaign Bar Chart"
                    data={unitsSoldData}
                    options={{ ...CHART_DEFAULTS, indexAxis: 'y' }}
                  />
                </div>
              ) : <NoData />}
            </div>

            <div className="bg-white rounded-[24px] border border-[#E0DBD5] shadow-sm p-6">
              <h2 className="text-[17px] font-black text-[#2C1810] mb-5">
                Stock Request Trend — Promoted Products
              </h2>
              {loadState.stock ? <Spinner /> : stockLineData ? (
                <div className="h-[380px]">
                  <Line
                    aria-label="Stock Request Trend Line Chart"
                    data={stockLineData}
                    options={CHART_DEFAULTS}
                  />
                </div>
              ) : <NoData />}
            </div>
          </div>
        )}

        {/* FEEDBACK */}
        {activeTab === 'Feedback' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-[24px] border border-[#E0DBD5] shadow-sm p-6">
              <h2 className="text-[17px] font-black text-[#2C1810] mb-5">
                Overall Feedback Sentiment
              </h2>
              {loadState.feedback ? <Spinner /> : doughnutData ? (
                <div className="h-[380px]">
                  <Doughnut
                    aria-label="Feedback Sentiment Doughnut Chart"
                    data={doughnutData}
                    options={{ ...CHART_DEFAULTS, maintainAspectRatio: false }}
                  />
                </div>
              ) : <NoData />}
            </div>

            <div className="bg-white rounded-[24px] border border-[#E0DBD5] shadow-sm p-6">
              <h2 className="text-[17px] font-black text-[#2C1810] mb-5">
                Conversion Rate by Promotion
              </h2>
              {loadState.conversions ? <Spinner /> : conversionData ? (
                <div className="h-[380px]">
                  <Bar
                    aria-label="Conversion Rate by Promotion Bar Chart"
                    data={conversionData}
                    options={{
                      ...CHART_DEFAULTS,
                      indexAxis: 'y',
                      scales: {
                        ...CHART_DEFAULTS.scales,
                        x: { ...CHART_DEFAULTS.scales.x, max: 100, ticks: { ...CHART_DEFAULTS.scales.x.ticks, callback: v => `${v}%` } },
                      },
                    }}
                  />
                </div>
              ) : <NoData />}
            </div>
          </div>
        )}

        {/* FULFILLMENT */}
        {activeTab === 'Fulfillment' && (
          <div className="bg-white rounded-[24px] border border-[#E0DBD5] shadow-sm p-6">
            <h2 className="text-[17px] font-black text-[#2C1810] mb-5">
              Order Fulfillment Rate by Promotion
            </h2>
            {loadState.conversions ? <Spinner /> : fulfillmentData ? (
              <div className="h-[400px]">
                <Bar
                  aria-label="Order Fulfillment Rate by Promotion Bar Chart"
                  data={fulfillmentData}
                  options={{
                    ...CHART_DEFAULTS,
                    scales: {
                      x: { ...CHART_DEFAULTS.scales.x, stacked: true, ticks: { ...CHART_DEFAULTS.scales.x.ticks, maxRotation: 45 } },
                      y: { ...CHART_DEFAULTS.scales.y, stacked: true, max: 100, ticks: { ...CHART_DEFAULTS.scales.y.ticks, callback: v => `${v}%` } },
                    },
                  }}
                />
              </div>
            ) : <NoData />}
          </div>
        )}

      </div>
    </PromotionManagerLayout>
  );
};

export default PMInsightsDashboard;
