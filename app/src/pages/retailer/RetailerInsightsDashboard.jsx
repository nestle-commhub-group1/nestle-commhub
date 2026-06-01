import React, { useState, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import RetailerLayout from '../../components/layout/RetailerLayout';
import { useAuth } from '../../context/AuthContext';
import API_URL from '../../config/api';
import { useLanguage } from '../../i18n/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
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

const NoData = () => {
  const { t } = useLanguage();
  return (
    <div className="flex justify-center items-center min-h-[200px] text-gray-400 font-medium text-sm italic">
      {t('No data available')}
    </div>
  );
};

const MetricCard = ({ label, value, sub, subColor = '#9CA3AF', accentColor }) => (
  <div
    data-testid="metric-card"
    className="retailer-metric-card bg-white rounded-[20px] p-6 shadow-sm border border-[#E0DBD5]"
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
  const { t } = useLanguage();
  const { theme } = useTheme();
  const [period, setPeriod] = useState('30');

  const [perf, setPerf] = useState(null);
  const [orders, setOrders] = useState(null);
  const [products, setProducts] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const [lPerf, setLPerf] = useState(true);
  const [lOrders, setLOrders] = useState(true);
  const [lProducts, setLProducts] = useState(true);
  const [lFeedback, setLFeedback] = useState(true);
  const isDark = theme === 'dark';
  const chartText = isDark ? '#fff8ef' : '#6B7280';
  const chartMuted = isDark ? '#eaded2' : '#9CA3AF';
  const chartGrid = isDark ? 'rgba(255,248,239,0.18)' : 'rgba(0,0,0,0.04)';
  const chartBrown = isDark ? '#f0b47e' : '#3D2B1F';
  const chartFill = isDark ? 'rgba(240,180,126,0.46)' : 'rgba(61,43,31,0.12)';
  const themedChartOptions = {
    ...CHART_DEFAULTS,
    plugins: {
      ...CHART_DEFAULTS.plugins,
      legend: {
        ...CHART_DEFAULTS.plugins.legend,
        labels: { ...CHART_DEFAULTS.plugins.legend.labels, color: chartText },
      },
    },
    scales: {
      x: {
        ...CHART_DEFAULTS.scales.x,
        ticks: { ...CHART_DEFAULTS.scales.x.ticks, color: chartMuted },
        grid: { ...CHART_DEFAULTS.scales.x.grid, color: chartGrid },
      },
      y: {
        ...CHART_DEFAULTS.scales.y,
        ticks: { ...CHART_DEFAULTS.scales.y.ticks, color: chartMuted },
        grid: { ...CHART_DEFAULTS.scales.y.grid, color: chartGrid },
      },
    },
  };

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
      { label: t('Ordered'), data: orders.map(w => w.ordered), borderColor: '#3B82F6', backgroundColor: 'rgba(59,130,246,0.08)', pointBackgroundColor: '#fff', pointBorderColor: '#3B82F6', pointRadius: 4, tension: 0.35, fill: true },
      { label: t('Fulfilled'), data: orders.map(w => w.fulfilled), borderColor: '#22C55E', pointBackgroundColor: '#fff', pointBorderColor: '#22C55E', pointRadius: 4, tension: 0.35 },
      { label: t('Rejected'), data: orders.map(w => w.rejected), borderColor: '#EF4444', pointBackgroundColor: '#fff', pointBorderColor: '#EF4444', pointRadius: 4, tension: 0.35 },
    ],
  } : null;

  const top5 = products ? products.slice(0, 5) : [];
  const productsBarData = {
    labels: top5.map(p => p.productName),
    datasets: [{ label: t('Units ordered'), data: top5.map(p => p.unitCount), backgroundColor: chartFill, borderColor: chartBrown, borderWidth: 1, borderRadius: 4, barThickness: 22 }],
  };

  const doughnutData = feedback && feedback.total > 0 ? {
    labels: [`Positive ${feedback.positivePct}%`, `Neutral ${feedback.neutralPct}%`, `Negative ${feedback.negativePct}%`],
    datasets: [{ data: [feedback.positive, feedback.neutral, feedback.negative], backgroundColor: ['#22C55E', '#F59E0B', '#EF4444'], borderColor: '#FFFFFF', borderWidth: 3, cutout: '60%' }],
  } : null;

  const selectCls = 'w-full px-4 py-3 bg-[#F8F7F5] border border-[#E0DBD5] rounded-[14px] font-semibold text-[14px] text-[#3D2B1F] outline-none focus:ring-2 focus:ring-[#3D2B1F]/20 cursor-pointer';

  return (
    <RetailerLayout>
      <div className="min-h-screen bg-nestle-gray p-4 sm:p-6 lg:p-8 font-sans space-y-6">

        {/* Header */}
        <div className="min-w-0">
          <h1 className="text-[26px] sm:text-[28px] font-black text-[#2C1810] tracking-tight leading-tight">{t('My Performance')}</h1>
          <p className="text-[14px] text-gray-500 font-medium mt-1">{t('Your orders, fulfillment and feedback vs national average')}</p>
        </div>

        {/* Filter Bar */}
        <div className="retailer-chart-card bg-white rounded-[24px] border border-[#E0DBD5] shadow-sm p-5 flex flex-wrap gap-4">
          <div className="flex-1 min-w-[180px]">
            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">{t('Period')}</label>
            <select className={selectCls} value={period} onChange={e => setPeriod(e.target.value)}>
              <option value="7">{t('Last 7 days')}</option>
              <option value="30">{t('Last 30 days')}</option>
              <option value="90">{t('Last 90 days')}</option>
              <option value="all">{t('All time')}</option>
            </select>
          </div>
        </div>

        {/* Metric Cards */}
        {lPerf ? <Spinner /> : perf ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <MetricCard label={t('My Orders Placed')} value={(perf.myOrderVolume ?? 0).toLocaleString()} sub={t('This period')} accentColor="#3B82F6" />
            <MetricCard
              label={t('My Fulfillment Rate')}
              value={`${perf.myFulfillmentRate ?? 0}%`}
              sub={`${t('Top')} ${100 - (perf.myOrderVolumePercentile ?? 50)}% ${t('of retailers')}`}
              subColor={perf.myOrderVolumePercentile >= 75 ? '#22C55E' : perf.myOrderVolumePercentile >= 50 ? '#F59E0B' : '#EF4444'}
              accentColor="#22C55E"
            />
            <MetricCard
              label={t('My Feedback Score')}
              value={`${perf.myFeedbackScore ?? 0} / 10`}
              sub={perf.myFeedbackScore >= 7 ? t('Excellent') : perf.myFeedbackScore >= 4 ? t('Average') : t('Needs improvement')}
              subColor={perf.myFeedbackScore >= 7 ? '#22C55E' : perf.myFeedbackScore >= 4 ? '#F59E0B' : '#EF4444'}
              accentColor="#F59E0B"
            />
            <MetricCard label={t('Avg Order Value')} value={`Rs ${(perf.myAvgOrderValue ?? 0).toLocaleString()}`} sub={`${t('National avg')}: Rs ${(perf.nationalAvgOrderValue ?? 0).toLocaleString()}`} accentColor="#3D2B1F" />
          </div>
        ) : <NoData />}

        {/* Chart: Order history */}
        <div className="retailer-chart-card bg-white rounded-[24px] border border-[#E0DBD5] shadow-sm p-5 sm:p-6">
          <h2 className="text-[17px] font-black text-[#2C1810] mb-5">{t('Order History — Ordered vs Fulfilled vs Rejected')}</h2>
          {lOrders ? <Spinner /> : ordersLineData ? (
            <div className="h-[330px] sm:h-[360px]">
                <Line aria-label="Order history Line Chart" data={ordersLineData} options={themedChartOptions} />
            </div>
          ) : <NoData />}
        </div>

        {/* Charts row: top products + feedback */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="retailer-chart-card bg-white rounded-[24px] border border-[#E0DBD5] shadow-sm p-5 sm:p-6">
            <h2 className="text-[17px] font-black text-[#2C1810] mb-5">{t('My Top 5 Products')}</h2>
            {lProducts ? <Spinner /> : top5.length > 0 ? (
              <div className="h-[300px]">
                <Bar aria-label="My top 5 products Bar Chart" data={productsBarData} options={{ ...themedChartOptions, indexAxis: 'y' }} />
              </div>
            ) : <NoData />}
          </div>

          <div className="retailer-chart-card bg-white rounded-[24px] border border-[#E0DBD5] shadow-sm p-5 sm:p-6">
            <h2 className="text-[17px] font-black text-[#2C1810] mb-5">{t('My Feedback Sentiment')}</h2>
            {lFeedback ? <Spinner /> : doughnutData ? (
              <div className="h-[300px]">
                <Doughnut aria-label="My feedback sentiment Doughnut Chart" data={doughnutData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top', labels: { padding: 14, color: chartText, font: { size: 12, weight: '600' } } } } }} />
              </div>
            ) : <NoData />}
          </div>
        </div>

        {/* Performance vs National Average */}
        <div className="retailer-chart-card bg-white rounded-[24px] border border-[#E0DBD5] shadow-sm p-5 sm:p-6">
          <h2 className="text-[17px] font-black text-[#2C1810] mb-6">{t('Performance vs National Average')}</h2>
          {lPerf ? <Spinner /> : perf ? (
            <div className="max-w-2xl">
              <ProgressComparison label={t('Fulfillment rate')} myValue={perf.myFulfillmentRate} avgValue={perf.nationalAvgFulfillmentRate} myLabel={t('You')} avgLabel={t('Avg')} max={100} suffix="%" />
              <ProgressComparison label={t('Feedback score')} myValue={perf.myFeedbackScore} avgValue={perf.nationalAvgFeedbackScore} myLabel={t('You')} avgLabel={t('Avg')} max={10} suffix="/10" />
              <ProgressComparison label={t('Order volume percentile')} myValue={perf.myOrderVolumePercentile} avgValue={50} myLabel={t('You')} avgLabel={t('Median')} max={100} suffix="%" />
              <ProgressComparison label={t('Average order value')} myValue={perf.myAvgOrderValue} avgValue={perf.nationalAvgOrderValue} myLabel={t('You')} avgLabel={t('Avg')} max={Math.max(perf.myAvgOrderValue, perf.nationalAvgOrderValue, 1) * 1.2} suffix="" />
            </div>
          ) : <NoData />}
        </div>

      </div>
    </RetailerLayout>
  );
};

export default RetailerInsightsDashboard;
