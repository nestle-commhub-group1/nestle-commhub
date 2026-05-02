import React, { useState, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import HeatMap from './HeatMap';
import {
  Chart as ChartJS,
  BarElement,
  LineElement,
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import API_URL from '../../config/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  ArcElement,
  PointElement,
  Tooltip,
  Legend,
  Filler
);



const CHART_DEFAULTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: 'top', labels: { padding: 16 } } },
};

const Spinner = () => (
  <div className="flex justify-center items-center min-h-[200px] text-gray-400">
    <Loader2 size={28} className="animate-spin" />
  </div>
);

const NoData = () => (
  <div className="flex justify-center items-center min-h-[200px] text-gray-500 font-medium text-sm">
    No data available
  </div>
);

const InsightsDashboard = () => {
  const [period, setPeriod] = useState('30');
  const [region, setRegion] = useState('all');
  const [activeTab, setActiveTab] = useState('Promotions');

  /* Data States */
  const [summary, setSummary] = useState(null);
  const [promotions, setPromotions] = useState(null);
  const [stock, setStock] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [fulfillment, setFulfillment] = useState(null);
  const [products, setProducts] = useState(null);

  /* Loading States */
  const [loadState, setLoadState] = useState({
    summary: true, promos: true, stock: true, feedback: true, fulfillment: true, products: true
  });

  const updateLoadState = (key, val) => setLoadState(prev => ({ ...prev, [key]: val }));

  const apiFetch = async (path, key) => {
    updateLoadState(key, true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}${path}`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      updateLoadState(key, false);
      return json.data || null;
    } catch (e) {
      updateLoadState(key, false);
      return null;
    }
  };

  const fetchAll = useCallback(async () => {
    const qs = `?period=${period}d${region !== 'all' ? `&region=${encodeURIComponent(region)}` : ''}`;

    apiFetch(`/api/analytics/summary${qs}`, 'summary').then(setSummary);
    apiFetch(`/api/analytics/promotions${qs}`, 'promos').then(setPromotions);
    apiFetch(`/api/analytics/stock${qs}`, 'stock').then(setStock);
    apiFetch(`/api/analytics/feedback${qs}`, 'feedback').then(setFeedback);
    apiFetch(`/api/analytics/fulfillment${qs}`, 'fulfillment').then(setFulfillment);
    apiFetch(`/api/analytics/products${qs}`, 'products').then(setProducts);
  }, [period, region]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /* ── Chart Configurations ── */

  // Promotions Bar Chart
  const promosBarData = promotions ? {
    labels: promotions.map(p => p.title),
    datasets: [{
      label: 'Units Sold',
      data: promotions.map(p => p.totalUnitsSold),
      backgroundColor: '#3b82f6',
      borderRadius: 4,
    }]
  } : null;

  // Stock Line Chart with Threshold
  const maxStock = stock ? Math.max(...stock.map(s => s.totalUnits)) : 0;
  const threshold = maxStock > 0 ? Math.round(maxStock * 0.9) : 0;
  const stockLineData = stock ? {
    labels: stock.map(s => s.day),
    datasets: [
      {
        label: 'Avg Requests',
        data: stock.map(s => s.totalUnits),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59,130,246,0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'High Demand Threshold',
        data: stock.map(() => threshold),
        borderColor: '#ef4444',
        borderDash: [5, 5],
        pointRadius: 0,
        fill: false,
      }
    ]
  } : null;

  // Feedback Doughnut Chart
  const doughnutData = feedback && feedback.total > 0 ? {
    labels: [`Positive ${feedback.positivePct}%`, `Neutral ${feedback.neutralPct}%`, `Negative ${feedback.negativePct}%`],
    datasets: [{
      data: [feedback.positive, feedback.neutral, feedback.negative],
      backgroundColor: ['#22c55e', '#f59e0b', '#ef4444'],
      borderWidth: 0,
    }]
  } : null;

  // Fulfillment Region Chart
  const fulfillmentBarData = fulfillment ? {
    labels: fulfillment.map(f => f.region),
    datasets: [{
      label: 'Fulfillment Rate %',
      data: fulfillment.map(f => f.fulfillmentRate),
      backgroundColor: fulfillment.map(f => f.fulfillmentRate >= 90 ? '#10b981' : f.fulfillmentRate >= 70 ? '#f59e0b' : '#ef4444'),
      borderRadius: 4,
    }]
  } : null;

  // Products Horizontal Bar Chart
  const productsBarData = products ? {
    labels: products.slice(0, 5).map(p => p.productName),
    datasets: [{
      label: 'Units Ordered',
      data: products.slice(0, 5).map(p => p.requestCount),
      backgroundColor: '#8b5cf6',
      borderRadius: 4,
    }]
  } : null;

  return (
    <div className="p-8 min-h-screen bg-nestle-gray text-gray-800 font-sans">
      <h1 className="text-3xl font-extrabold mb-6 text-gray-900 tracking-tight">HQ Analytics Dashboard</h1>

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-4 mb-8 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Period</label>
          <select 
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-semibold outline-none focus:ring-2 focus:ring-blue-500"
            value={period} onChange={(e) => setPeriod(e.target.value)}
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="all">All time</option>
          </select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Region</label>
          <select 
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-semibold outline-none focus:ring-2 focus:ring-blue-500"
            value={region} onChange={(e) => setRegion(e.target.value)}
          >
            <option value="all">All regions</option>
            <option value="Western">Western</option>
            <option value="Central">Central</option>
            <option value="Northern">Northern</option>
            <option value="Eastern">Eastern</option>
            <option value="Southern">Southern</option>
          </select>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {loadState.summary ? <Spinner /> : summary ? (
          <>
            <div data-testid="metric-card" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="text-sm font-bold text-gray-500 mb-1 uppercase tracking-wide">Total Orders</div>
              <div className="text-3xl font-extrabold text-gray-900">{summary.totalOrders?.toLocaleString() || 0}</div>
            </div>
            <div data-testid="metric-card" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="text-sm font-bold text-gray-500 mb-1 uppercase tracking-wide">Avg Fulfillment Rate</div>
              <div className="text-3xl font-extrabold text-gray-900">{summary.avgFulfillmentRate || 0}%</div>
            </div>
            <div data-testid="metric-card" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="text-sm font-bold text-gray-500 mb-1 uppercase tracking-wide">Avg Feedback Score</div>
              <div className="text-3xl font-extrabold text-gray-900">{summary.avgFeedbackRating || 0} <span className="text-lg text-gray-400 font-semibold">/ 10</span></div>
            </div>
            <div data-testid="metric-card" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="text-sm font-bold text-gray-500 mb-1 uppercase tracking-wide">Promo Units Sold</div>
              <div className="text-3xl font-extrabold text-gray-900">{summary.totalPromoUnitsSold?.toLocaleString() || 0}</div>
            </div>
          </>
        ) : <NoData />}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-gray-100 p-1.5 rounded-xl w-fit">
        {[
          { id: 'Promotions', label: 'Promotions' },
          { id: 'Stock', label: 'Stock' },
          { id: 'Feedback', label: 'Feedback' },
          { id: 'Fulfillment', label: 'Fulfillment' },
          { id: 'heatmap', label: 'Issue Heat Map' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2.5 rounded-lg font-bold text-sm transition-all duration-200 ${
              activeTab === tab.id ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Contents */}
      <div className="space-y-6">
        {/* PROMOTIONS TAB */}
        {activeTab === 'Promotions' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-extrabold mb-4 text-gray-800">Promotions Performance</h2>
            {loadState.promos ? <Spinner /> : promosBarData ? (
              <div className="h-[400px]">
                <Bar aria-label="Promotions Performance Bar Chart" data={promosBarData} options={{ ...CHART_DEFAULTS, indexAxis: 'y' }} />
              </div>
            ) : <NoData />}
          </div>
        )}

        {/* STOCK TAB */}
        {activeTab === 'Stock' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-extrabold mb-4 text-gray-800">Stock Request Trends</h2>
            {loadState.stock ? <Spinner /> : stockLineData ? (
              <div className="h-[400px]">
                <Line aria-label="Stock Request Trends Line Chart" data={stockLineData} options={CHART_DEFAULTS} />
              </div>
            ) : <NoData />}
          </div>
        )}

        {/* FEEDBACK TAB */}
        {activeTab === 'Feedback' && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-extrabold mb-4 text-gray-800">Overall Feedback Sentiment</h2>
            {loadState.feedback ? <Spinner /> : doughnutData ? (
              <div className="h-[400px]">
                <Doughnut aria-label="Overall Feedback Sentiment Doughnut Chart" data={doughnutData} options={{ ...CHART_DEFAULTS, maintainAspectRatio: false }} />
              </div>
            ) : <NoData />}
          </div>
        )}

        {/* FULFILLMENT TAB */}
        {activeTab === 'Fulfillment' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-extrabold mb-4 text-gray-800">Fulfillment by Region</h2>
              {loadState.fulfillment ? <Spinner /> : fulfillmentBarData ? (
                <div className="h-[350px]">
                  <Bar aria-label="Fulfillment by Region Bar Chart" data={fulfillmentBarData} options={{ ...CHART_DEFAULTS, indexAxis: 'y', scales: { x: { max: 100 } } }} />
                </div>
              ) : <NoData />}
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-extrabold mb-4 text-gray-800">Top 5 Products Requested</h2>
              {loadState.products ? <Spinner /> : productsBarData ? (
                <div className="h-[350px]">
                  <Bar aria-label="Top 5 Products Requested Bar Chart" data={productsBarData} options={CHART_DEFAULTS} />
                </div>
              ) : <NoData />}
            </div>
          </div>
        )}

        {/* HEATMAP TAB */}
        { activeTab === 'heatmap' && <HeatMap embedded={true} /> }
      </div>
    </div>
  );
};

export default InsightsDashboard;
