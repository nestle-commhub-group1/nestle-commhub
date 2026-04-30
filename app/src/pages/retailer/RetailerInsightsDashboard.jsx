import React, { useState, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import RetailerLayout from '../../components/layout/RetailerLayout';
import { useAuth } from '../../context/AuthContext';
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
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Title, Tooltip, Legend, Filler
);

const CHART_DEFAULTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'top', labels: { padding: 16, color: '#6B7280', font: { size: 12, weight: '600' } } },
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

const MetricCard = ({ label, value, sub, subColor = '#9CA3AF', accentColor }) => (
  <div
    data-testid="metric-card"
    className="bg-white rounded-[20px] p-6 shadow-sm border border-[#E0DBD5]"
    style={{ borderLeft: `4px solid ${accentColor}` }}
  >
    <p className="text-[13px] font-semibold text-gray-500 mb-1">{label}</p>
    <p className="text-[32px] font-extrabold text-[#2C1810] leading-none">{value}</p>
    <p className="text-[12px] mt-2 font-medium" style={{ color: subColor }}>{sub}</p>
  </div>
);

/* ── Progress comparison bar (Retailer vs National) ── */
const ProgressComparison = ({ label, myValue, avgValue, myLabel, avgLabel, max, suffix = '' }) => {
  const clamp = v => Math.min(Math.max(v, 0), max);
  const myPct = (clamp(myValue) / max) * 100;
  const avgPct = (clamp(avgValue) / max) * 100;

  return (
    <div className="mb-6">
      <p className="text-[14px] font-bold text-[#2C1810] mb-3">{label}</p>
      <div className="flex items-center gap-3 mb-2">
        <span className="w-20 text-[12px] font-semibold text-gray-500 flex-shrink-0">{myLabel}</span>
        <div className="flex-1 h-3 bg-[#F5F3F0] rounded-full overflow-hidden border border-[#E0DBD5]">
          <div className="h-full bg-[#22C55E] rounded-full transition-all duration-500" style={{ width: `${myPct}%` }} />
        </div>
        <span className="w-16 text-[13px] font-bold text-[#22C55E] text-right">{myValue}{suffix}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="w-20 text-[12px] font-semibold text-gray-500 flex-shrink-0">{avgLabel}</span>
        <div className="flex-1 h-3 bg-[#F5F3F0] rounded-full overflow-hidden border border-[#E0DBD5]">
          <div className="h-full bg-[#F59E0B] rounded-full transition-all duration-500" style={{ width: `${avgPct}%` }} />
        </div>
        <span className="w-16 text-[13px] font-bold text-[#F59E0B] text-right">{avgValue}{suffix}</span>
      </div>
    </div>
  );
};

async function apiFetch(path) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) return null;
  const json = await res.json();
  return json.data ?? null;
}

const RetailerInsightsDashboard = () => {
  const { user } = useAuth();
  const [period, setPeriod] = useState('30');

  const [perf, setPerf] = useState(null);
  const [orders, setOrders] = useState(null);
  const [products, setProducts] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const [lPerf, setLPerf] = useState(true);
  const [lOrders, setLOrders] = useState(true);
  const [lProducts, setLProducts] = useState(true);
  const [lFeedback, setLFeedback] = useState(true);

  const fetchAll = useCallback(async () => {
    setLPerf(true); setLOrders(true); setLProducts(true); setLFeedback(true);
    const qs = `?period=${period}d`;
    apiFetch(`/api/analytics/my-performance${qs}`).then(d => { setPerf(d); setLPerf(false); });
    apiFetch(`/api/analytics/my-orders${qs}`).then(d => { setOrders(d); setLOrders(false); });
    apiFetch(`/api/analytics/my-products${qs}`).then(d => { setProducts(d); setLProducts(false); });
    apiFetch(`/api/analytics/my-feedback`).then(d => { setFeedback(d); setLFeedback(false); });
  }, [period]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /* ── Chart data ── */
  const ordersLineData = orders && orders.length > 0 ? {
    labels: orders.map(w => w.week),
    datasets: [
      { label: 'Ordered', data: orders.map(w => w.ordered), borderColor: '#3B82F6', backgroundColor: 'rgba(59,130,246,0.08)', pointBackgroundColor: '#fff', pointBorderColor: '#3B82F6', pointRadius: 4, tension: 0.35, fill: true },
      { label: 'Fulfilled', data: orders.map(w => w.fulfilled), borderColor: '#22C55E', pointBackgroundColor: '#fff', pointBorderColor: '#22C55E', pointRadius: 4, tension: 0.35 },
      { label: 'Rejected', data: orders.map(w => w.rejected), borderColor: '#EF4444', pointBackgroundColor: '#fff', pointBorderColor: '#EF4444', pointRadius: 4, tension: 0.35 },
    ],
  } : null;

  const top5 = products ? products.slice(0, 5) : [];
  const productsBarData = {
    labels: top5.map(p => p.productName),
    datasets: [{ label: 'Units ordered', data: top5.map(p => p.unitCount), backgroundColor: '#3D2B1F', borderRadius: 4, barThickness: 22 }],
  };

  const doughnutData = feedback && feedback.total > 0 ? {
    labels: [`Positive ${feedback.positivePct}%`, `Neutral ${feedback.neutralPct}%`, `Negative ${feedback.negativePct}%`],
    datasets: [{ data: [feedback.positive, feedback.neutral, feedback.negative], backgroundColor: ['#22C55E', '#F59E0B', '#EF4444'], borderColor: '#FFFFFF', borderWidth: 3, cutout: '60%' }],
  } : null;

  const selectCls = 'w-full px-4 py-3 bg-[#F8F7F5] border border-[#E0DBD5] rounded-[14px] font-semibold text-[14px] text-[#3D2B1F] outline-none focus:ring-2 focus:ring-[#3D2B1F]/20 cursor-pointer';

  return (
    <RetailerLayout>
      <div className="min-h-screen bg-nestle-gray p-6 lg:p-8 font-sans space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-[28px] font-black text-[#2C1810] tracking-tight">My Performance</h1>
          <p className="text-[14px] text-gray-500 font-medium mt-1">Your orders, fulfillment and feedback vs national average</p>
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-[24px] border border-[#E0DBD5] shadow-sm p-5 flex flex-wrap gap-4">
          <div className="flex-1 min-w-[180px]">
            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Period</label>
            <select className={selectCls} value={period} onChange={e => setPeriod(e.target.value)}>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="all">All time</option>
            </select>
          </div>
        </div>

        {/* Metric Cards */}
        {lPerf ? <Spinner /> : perf ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <MetricCard label="My Orders Placed" value={(perf.myOrderVolume ?? 0).toLocaleString()} sub="This period" accentColor="#3B82F6" />
            <MetricCard
              label="My Fulfillment Rate"
              value={`${perf.myFulfillmentRate ?? 0}%`}
              sub={`Top ${100 - (perf.myOrderVolumePercentile ?? 50)}% of retailers`}
              subColor={perf.myOrderVolumePercentile >= 75 ? '#22C55E' : perf.myOrderVolumePercentile >= 50 ? '#F59E0B' : '#EF4444'}
              accentColor="#22C55E"
            />
            <MetricCard
              label="My Feedback Score"
              value={`${perf.myFeedbackScore ?? 0} / 10`}
              sub={perf.myFeedbackScore >= 7 ? 'Excellent' : perf.myFeedbackScore >= 4 ? 'Average' : 'Needs improvement'}
              subColor={perf.myFeedbackScore >= 7 ? '#22C55E' : perf.myFeedbackScore >= 4 ? '#F59E0B' : '#EF4444'}
              accentColor="#F59E0B"
            />
            <MetricCard label="Avg Order Value" value={`Rs ${(perf.myAvgOrderValue ?? 0).toLocaleString()}`} sub={`National avg: Rs ${(perf.nationalAvgOrderValue ?? 0).toLocaleString()}`} accentColor="#3D2B1F" />
          </div>
        ) : <NoData />}

        {/* Chart: Order history */}
        <div className="bg-white rounded-[24px] border border-[#E0DBD5] shadow-sm p-6">
          <h2 className="text-[17px] font-black text-[#2C1810] mb-5">Order History — Ordered vs Fulfilled vs Rejected</h2>
          {lOrders ? <Spinner /> : ordersLineData ? (
            <div className="h-[360px]">
              <Line aria-label="Order history Line Chart" data={ordersLineData} options={CHART_DEFAULTS} />
            </div>
          ) : <NoData />}
        </div>

        {/* Charts row: top products + feedback */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-[24px] border border-[#E0DBD5] shadow-sm p-6">
            <h2 className="text-[17px] font-black text-[#2C1810] mb-5">My Top 5 Products</h2>
            {lProducts ? <Spinner /> : top5.length > 0 ? (
              <div className="h-[300px]">
                <Bar aria-label="My top 5 products Bar Chart" data={productsBarData} options={{ ...CHART_DEFAULTS, indexAxis: 'y' }} />
              </div>
            ) : <NoData />}
          </div>

          <div className="bg-white rounded-[24px] border border-[#E0DBD5] shadow-sm p-6">
            <h2 className="text-[17px] font-black text-[#2C1810] mb-5">My Feedback Sentiment</h2>
            {lFeedback ? <Spinner /> : doughnutData ? (
              <div className="h-[300px]">
                <Doughnut aria-label="My feedback sentiment Doughnut Chart" data={doughnutData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top', labels: { padding: 14, color: '#6B7280', font: { size: 12, weight: '600' } } } } }} />
              </div>
            ) : <NoData />}
          </div>
        </div>

        {/* Performance vs National Average */}
        <div className="bg-white rounded-[24px] border border-[#E0DBD5] shadow-sm p-6">
          <h2 className="text-[17px] font-black text-[#2C1810] mb-6">Performance vs National Average</h2>
          {lPerf ? <Spinner /> : perf ? (
            <div className="max-w-2xl">
              <ProgressComparison label="Fulfillment rate" myValue={perf.myFulfillmentRate} avgValue={perf.nationalAvgFulfillmentRate} myLabel="You" avgLabel="Avg" max={100} suffix="%" />
              <ProgressComparison label="Feedback score" myValue={perf.myFeedbackScore} avgValue={perf.nationalAvgFeedbackScore} myLabel="You" avgLabel="Avg" max={10} suffix="/10" />
              <ProgressComparison label="Order volume percentile" myValue={perf.myOrderVolumePercentile} avgValue={50} myLabel="You" avgLabel="Median" max={100} suffix="%" />
              <ProgressComparison label="Average order value" myValue={perf.myAvgOrderValue} avgValue={perf.nationalAvgOrderValue} myLabel="You" avgLabel="Avg" max={Math.max(perf.myAvgOrderValue, perf.nationalAvgOrderValue, 1) * 1.2} suffix="" />
            </div>
          ) : <NoData />}
        </div>

      </div>
    </RetailerLayout>
  );
};

export default RetailerInsightsDashboard;
