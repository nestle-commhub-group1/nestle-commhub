import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, Download, FileText } from 'lucide-react';
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
    className="bg-white rounded-[20px] p-6 shadow-sm border border-[#E0DBD5] flex items-center justify-between group hover:shadow-md transition-all"
    style={{ borderLeft: `4px solid ${accentColor}` }}
  >
    <div>
      <p className="text-[13px] font-semibold text-gray-500 mb-1 uppercase tracking-wider">{label}</p>
      <p className="text-[32px] font-extrabold text-[#2C1810] leading-none">{value}</p>
      <p className="text-[12px] text-gray-400 mt-2 font-medium">{sub}</p>
    </div>
  </div>
);

const NestleLogo = () => (
  <div className="flex items-center space-x-2">
    <div className="w-8 h-8 bg-[#3D2B1F] rounded-lg flex items-center justify-center">
      <span className="text-white font-black text-xl">N</span>
    </div>
    <span className="text-[#3D2B1F] font-black tracking-tighter text-xl">CommHub</span>
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

  const unitsChartRef = React.useRef(null);
  const stockChartRef = React.useRef(null);
  const sentimentChartRef = React.useRef(null);
  const conversionChartRef = React.useRef(null);
  const fulfillmentChartRef = React.useRef(null);

  // Hidden PDF refs
  const pdfUnitsRef = React.useRef(null);
  const pdfStockRef = React.useRef(null);
  const pdfSentimentRef = React.useRef(null);
  const pdfFulfillmentRef = React.useRef(null);

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
    const periodQs = period === 'all' ? 'period=all' : `period=${period}d`;
    const promoQs = promoFilter === 'all' ? '' : `&promotionId=${promoFilter}`;
    const qs = `?${periodQs}${promoQs}`;

    apiFetch(`/api/analytics/summary${qs}`, 'summary').then(setSummary);
    apiFetch(`/api/analytics/promotions${qs}`, 'promos').then(setPromotions);
    apiFetch(`/api/analytics/conversions${qs}`, 'conversions').then(setConversions);
    apiFetch(`/api/analytics/feedback${qs}`, 'feedback').then(setFeedback);
    apiFetch(`/api/analytics/stock${qs}`, 'stock').then(setStock);
  }, [period, promoFilter]);

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

  const filteredConversions = conversions
    ? promoFilter === 'all'
      ? conversions
      : conversions.filter(c => c.promotionId === promoFilter)
    : [];

  const conversionData = filteredConversions.length > 0 ? {
    labels: filteredConversions.map(c => c.promotionName),
    datasets: [{
      label: 'Conversion %',
      data: filteredConversions.map(c => c.conversionRate),
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

  const fulfillmentData = filteredConversions.length > 0 ? {
    labels: filteredConversions.map(c => c.promotionName),
    datasets: [
      {
        label: 'Fulfilled',
        data: filteredConversions.map(c => c.fulfillmentRate),
        backgroundColor: '#22C55E',
        borderRadius: 4,
      },
      {
        label: 'Rejected',
        data: filteredConversions.map(c => parseFloat((100 - c.fulfillmentRate).toFixed(1))),
        backgroundColor: '#FCA5A5',
        borderRadius: 4,
      },
    ],
  } : null;

  const exportPDF = () => {
    if (!summary) return;

    const unitsImg = pdfUnitsRef.current?.toBase64Image();
    const stockImg = pdfStockRef.current?.toBase64Image();
    const sentimentImg = pdfSentimentRef.current?.toBase64Image();
    const fulfillmentImg = pdfFulfillmentRef.current?.toBase64Image();

    const printWindow = window.open('', '_blank');
    const html = `
      <html>
        <head>
          <title>Promotion Manager Report - ${new Date().toLocaleDateString()}</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
            body { font-family: 'Inter', sans-serif; background: white; color: #3D2B1F; }
            @media print { .no-print { display: none; } body { padding: 0; margin: 0; } .page-break { page-break-after: always; } }
          </style>
        </head>
        <body class="p-12">
          <div class="flex justify-between items-start border-b-2 border-[#F0EDE8] pb-8 mb-8">
            <div>
              <div class="flex items-center space-x-2 mb-4">
                <div class="w-10 h-10 bg-[#3D2B1F] rounded-xl flex items-center justify-center text-white font-black text-2xl">N</div>
                <div class="text-3xl font-black tracking-tighter">CommHub</div>
              </div>
              <h1 class="text-4xl font-black uppercase tracking-tight">Campaign ROI Report</h1>
              <p class="text-gray-500 font-bold mt-2 italic">Promotion Manager Insights Dashboard</p>
            </div>
            <div class="text-right">
              <p class="text-sm font-black text-gray-400 uppercase tracking-widest">Report Scope</p>
              <p class="text-xl font-black mt-1">${promoFilter === 'all' ? 'All Campaigns' : 'Single Campaign Analysis'}</p>
              <p class="text-sm font-bold text-gray-500">Last ${period} Days</p>
              <p class="text-xs text-gray-400 mt-4 italic">Generated on ${new Date().toLocaleString()}</p>
            </div>
          </div>

          <div class="grid grid-cols-4 gap-6 mb-12">
            <div class="bg-[#F8F7F5] p-6 rounded-3xl border border-[#F0EDE8]">
              <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Active Promos</p>
              <p class="text-3xl font-black">${summary.activePromotions || 0}</p>
            </div>
            <div class="bg-[#F8F7F5] p-6 rounded-3xl border border-[#F0EDE8]">
              <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Total Sold</p>
              <p class="text-3xl font-black text-amber-600">${(summary.totalUnitsSold || 0).toLocaleString()}</p>
            </div>
            <div class="bg-[#F8F7F5] p-6 rounded-3xl border border-[#F0EDE8]">
              <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Conversion</p>
              <p class="text-3xl font-black text-green-600">${summary.avgConversionRate || 0}%</p>
            </div>
            <div class="bg-[#F8F7F5] p-6 rounded-3xl border border-[#F0EDE8]">
              <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Retailer Sat.</p>
              <p class="text-3xl font-black text-blue-600">${summary.avgFeedbackRating || 0}/10</p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-12 mb-12">
            <div class="space-y-4">
              <h3 class="text-lg font-black uppercase tracking-widest text-gray-400">Campaign Performance</h3>
              ${unitsImg ? `<img src="${unitsImg}" class="w-full rounded-2xl border border-gray-100 p-4" />` : ''}
            </div>
            <div class="space-y-4">
              <h3 class="text-lg font-black uppercase tracking-widest text-gray-400">Retailer Sentiment</h3>
              ${sentimentImg ? `<img src="${sentimentImg}" class="w-48 mx-auto" />` : ''}
              <div class="grid grid-cols-3 gap-2 text-center mt-4 font-black">
                <div class="p-2 bg-green-50 rounded-xl text-green-600 text-xs">${feedback?.positive || 0} Positive</div>
                <div class="p-2 bg-amber-50 rounded-xl text-amber-600 text-xs">${feedback?.neutral || 0} Neutral</div>
                <div class="p-2 bg-red-50 rounded-xl text-red-600 text-xs">${feedback?.negative || 0} Negative</div>
              </div>
            </div>
          </div>

          <div class="page-break"></div>

          <div class="mt-12 space-y-8">
            <h3 class="text-lg font-black uppercase tracking-widest text-gray-400 mb-6">Detailed Campaign Metrics</h3>
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-[#F8F7F5]">
                  <th class="p-4 text-xs font-black uppercase tracking-widest text-gray-400 border-b border-[#F0EDE8]">Promotion</th>
                  <th class="p-4 text-xs font-black uppercase tracking-widest text-gray-400 border-b border-[#F0EDE8]">Units Sold</th>
                  <th class="p-4 text-xs font-black uppercase tracking-widest text-gray-400 border-b border-[#F0EDE8]">Conversion %</th>
                  <th class="p-4 text-xs font-black uppercase tracking-widest text-gray-400 border-b border-[#F0EDE8]">Fulfillment %</th>
                </tr>
              </thead>
              <tbody>
                ${filteredConversions?.map(c => `
                  <tr>
                    <td class="p-4 font-bold border-b border-[#F8F7F5]">${c.promotionName}</td>
                    <td class="p-4 border-b border-[#F8F7F5]">${c.totalUnitsSold || '--'}</td>
                    <td class="p-4 font-black text-amber-600 border-b border-[#F8F7F5]">${c.conversionRate}%</td>
                    <td class="p-4 font-black text-green-600 border-b border-[#F8F7F5]">${c.fulfillmentRate}%</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="mt-12">
              <h3 class="text-lg font-black uppercase tracking-widest text-gray-400 mb-6">Demand Trend (Promoted Goods)</h3>
              ${stockImg ? `<img src="${stockImg}" class="w-full h-64 object-contain rounded-2xl border border-gray-100 p-4" />` : ''}
            </div>
          </div>

          <div class="mt-24 pt-8 border-t border-[#F0EDE8] text-center text-xs text-gray-400 font-bold uppercase tracking-widest">
            Nestle CommHub Promotion Manager Confidential • Internal Use Only
          </div>

          <script>window.onload = () => { setTimeout(() => window.print(), 1000); };</script>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  /* ── Select style ── */
  const selectCls =
    'w-full px-4 py-3 bg-[#F8F7F5] border border-[#E0DBD5] rounded-[14px] font-semibold text-[14px] text-[#3D2B1F] outline-none focus:ring-2 focus:ring-[#3D2B1F]/20 cursor-pointer appearance-none';

  return (
    <PromotionManagerLayout>
      {/* Page background matches app warm beige */}
      <div className="min-h-screen bg-nestle-gray p-6 lg:p-8 font-sans space-y-6">

        {/* ── Page Header ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-[28px] font-black text-[#2C1810] tracking-tight">
              Promotion Analytics
            </h1>
            <p className="text-[14px] text-gray-500 font-medium mt-1">
              Insights for active campaigns, conversions and feedback
            </p>
          </div>
          <button 
            onClick={exportPDF}
            className="flex items-center space-x-2 px-6 py-3 bg-[#3D2B1F] text-white rounded-[16px] hover:bg-[#2C1810] transition-all shadow-md hover:shadow-lg active:scale-95"
          >
            <Download size={16} className="text-white/80" />
            <span className="text-[12px] font-black uppercase tracking-wider">Export ROI Report</span>
          </button>
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
                    ref={unitsChartRef}
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
                    ref={stockChartRef}
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
                    ref={sentimentChartRef}
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
                    ref={conversionChartRef}
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
                  ref={fulfillmentChartRef}
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

        {/* Hidden Report Engine */}
        <div className="fixed -left-[9999px] top-0 opacity-0 pointer-events-none" aria-hidden="true">
          {unitsSoldData && <div className="w-[800px] h-[400px]"><Bar ref={pdfUnitsRef} data={unitsSoldData} options={{...CHART_DEFAULTS, animation: false, indexAxis: 'y'}} /></div>}
          {stockLineData && <div className="w-[800px] h-[400px]"><Line ref={pdfStockRef} data={stockLineData} options={{...CHART_DEFAULTS, animation: false}} /></div>}
          {doughnutData && <div className="w-[400px] h-[400px]"><Doughnut ref={pdfSentimentRef} data={doughnutData} options={{...CHART_DEFAULTS, animation: false}} /></div>}
          {fulfillmentData && <div className="w-[800px] h-[400px]"><Bar ref={pdfFulfillmentRef} data={fulfillmentData} options={{...CHART_DEFAULTS, animation: false, scales: {x: {stacked: true}, y: {stacked: true, max: 100}}}} /></div>}
        </div>

      </div>
    </PromotionManagerLayout>
  );
};

export default PMInsightsDashboard;
