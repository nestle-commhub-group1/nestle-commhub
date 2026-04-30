import React, { useState, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import StockManagerLayout from '../../components/layout/StockManagerLayout';
import { useAuth } from '../../context/AuthContext';
import API_URL from '../../config/api';
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
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(
  BarElement, LineElement, ArcElement,
  CategoryScale, LinearScale, PointElement,
  Tooltip, Legend, Filler
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

async function apiFetch(path) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) return null;
  const json = await res.json();
  return json.data ?? null;
}

const StockManagerInsightsDashboard = () => {
  const { user } = useAuth();

  const [period, setPeriod] = useState('7');
  const [regionFilter, setRegionFilter] = useState('all');
  const [productFilter, setProductFilter] = useState('all');

  const [summary, setSummary] = useState(null);
  const [stock, setStock] = useState(null);
  const [products, setProducts] = useState(null);
  const [lowStock, setLowStock] = useState(null);
  const [fulfillment, setFulfillment] = useState(null);
  const [topRetailers, setTopRetailers] = useState(null);

  const [lSummary, setLSummary] = useState(true);
  const [lStock, setLStock] = useState(true);
  const [lProducts, setLProducts] = useState(true);
  const [lLowStock, setLLowStock] = useState(true);
  const [lFulfillment, setLFulfillment] = useState(true);
  const [lRetailers, setLRetailers] = useState(true);

  const regions = fulfillment ? fulfillment.map(f => f.region) : [];

  const fetchAll = useCallback(async () => {
    setLSummary(true); setLStock(true); setLProducts(true);
    setLLowStock(true); setLFulfillment(true); setLRetailers(true);
    const qs = `?period=${period}d`;
    const rqs = regionFilter !== 'all' ? `&region=${encodeURIComponent(regionFilter)}` : '';

    apiFetch(`/api/analytics/sm-summary${qs}`).then(d => { setSummary(d); setLSummary(false); });
    apiFetch(`/api/analytics/stock${qs}`).then(d => { setStock(d); setLStock(false); });
    apiFetch(`/api/analytics/products${qs}`).then(d => { setProducts(d); setLProducts(false); });
    apiFetch(`/api/analytics/low-stock${qs}${rqs}`).then(d => { setLowStock(d); setLLowStock(false); });
    apiFetch(`/api/analytics/fulfillment${qs}`).then(d => { setFulfillment(d); setLFulfillment(false); });
    apiFetch(`/api/analytics/top-retailers${qs}${rqs}`).then(d => { setTopRetailers(d); setLRetailers(false); });
  }, [period, regionFilter]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /* ── Chart data ── */

  const maxUnits = stock ? Math.max(...stock.map(d => d.totalUnits)) : 0;
  const thresholdVal = maxUnits > 0 ? Math.round(maxUnits * 0.9) : 0;

  const stockLineData = stock ? {
    labels: stock.map(d => d.day),
    datasets: [
      {
        label: 'Avg requests',
        data: stock.map(d => d.totalUnits),
        borderColor: '#3D2B1F',
        backgroundColor: 'rgba(61,43,31,0.08)',
        pointBackgroundColor: '#fff',
        pointBorderColor: '#3D2B1F',
        pointRadius: 5,
        pointHoverRadius: 7,
        tension: 0.4,
        fill: true,
      },
      {
        label: 'High demand threshold',
        data: stock.map(() => thresholdVal),
        borderColor: '#EF4444',
        borderDash: [8, 5],
        pointRadius: 0,
        borderWidth: 2,
        fill: false,
      },
    ],
  } : null;

  const top5Products = products ? products.slice(0, 5) : [];
  const productsBarData = {
    labels: top5Products.map(p => p.productName),
    datasets: [{
      label: 'Request count',
      data: top5Products.map(p => p.requestCount),
      backgroundColor: '#3B82F6',
      borderRadius: 4,
      barThickness: 22,
    }],
  };

  const fulfillmentBarData = fulfillment ? {
    labels: fulfillment.map(f => f.region),
    datasets: [{
      label: 'Fulfillment %',
      data: fulfillment.map(f => f.fulfillmentRate),
      backgroundColor: fulfillment.map(f =>
        f.fulfillmentRate >= 90 ? '#22C55E' : f.fulfillmentRate >= 70 ? '#F59E0B' : '#EF4444'
      ),
      borderRadius: 4,
      barThickness: 24,
    }],
  } : null;

  const retailerBarData = topRetailers ? {
    labels: topRetailers.map(r => r.retailerName),
    datasets: [{
      label: 'Orders placed',
      data: topRetailers.map(r => r.orderCount),
      backgroundColor: '#10B981',
      borderRadius: 6,
      barThickness: 36,
    }],
  } : null;

  const selectCls = 'w-full px-4 py-3 bg-[#F8F7F5] border border-[#E0DBD5] rounded-[14px] font-semibold text-[14px] text-[#3D2B1F] outline-none focus:ring-2 focus:ring-[#3D2B1F]/20 cursor-pointer';

  return (
    <StockManagerLayout>
      <div className="min-h-screen bg-nestle-gray p-6 lg:p-8 font-sans space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-[28px] font-black text-[#2C1810] tracking-tight">Stock Analytics</h1>
          <p className="text-[14px] text-gray-500 font-medium mt-1">
            Demand trends, fulfillment rates and low stock alerts
          </p>
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-[24px] border border-[#E0DBD5] shadow-sm p-5 flex flex-wrap gap-4">
          <div className="flex-1 min-w-[160px]">
            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Period</label>
            <select className={selectCls} value={period} onChange={e => setPeriod(e.target.value)}>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="all">All time</option>
            </select>
          </div>
          <div className="flex-1 min-w-[160px]">
            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Region</label>
            <select className={selectCls} value={regionFilter} onChange={e => setRegionFilter(e.target.value)}>
              <option value="all">All regions</option>
              {regions.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[160px]">
            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Product</label>
            <select className={selectCls} value={productFilter} onChange={e => setProductFilter(e.target.value)}>
              <option value="all">All products</option>
              {(products || []).map(p => (
                <option key={p.productId} value={p.productId}>{p.productName}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Metric Cards */}
        {lSummary ? <Spinner /> : summary ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <MetricCard label="Total Stock Requests" value={(summary.totalStockRequests ?? 0).toLocaleString()} sub="This period" accentColor="#3B82F6" />
            <MetricCard label="Peak Demand Day" value={summary.peakDemandDay ?? '--'} sub={`avg ${(summary.peakDemandAvg ?? 0).toLocaleString()} units`} accentColor="#F59E0B" />
            <MetricCard
              label="Fulfillment Rate"
              value={`${summary.fulfillmentRate ?? 0}%`}
              sub="Target: 90%"
              subColor={(summary.fulfillmentRate ?? 0) >= 90 ? '#22C55E' : '#F59E0B'}
              accentColor="#22C55E"
            />
            <MetricCard
              label="Low Stock Alerts"
              value={summary.lowStockAlertCount ?? 0}
              sub={(summary.lowStockAlertCount ?? 0) > 0 ? 'Requires attention' : 'All clear'}
              subColor={(summary.lowStockAlertCount ?? 0) > 0 ? '#EF4444' : '#22C55E'}
              accentColor="#EF4444"
            />
          </div>
        ) : <NoData />}

        {/* Chart: Stock requests trend */}
        <div className="bg-white rounded-[24px] border border-[#E0DBD5] shadow-sm p-6">
          <h2 className="text-[17px] font-black text-[#2C1810] mb-5">Avg Stock Requests by Day of Week</h2>
          {lStock ? <Spinner /> : stockLineData ? (
            <div className="h-[360px]">
              <Line aria-label="Avg stock requests by day of week Line Chart" data={stockLineData} options={{
                ...CHART_DEFAULTS,
                scales: { ...CHART_DEFAULTS.scales, y: { ...CHART_DEFAULTS.scales.y, ticks: { ...CHART_DEFAULTS.scales.y.ticks, callback: v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v } } },
              }} />
            </div>
          ) : <NoData />}
        </div>

        {/* Charts row: top products + low stock alerts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-[24px] border border-[#E0DBD5] shadow-sm p-6">
            <h2 className="text-[17px] font-black text-[#2C1810] mb-5">Top 5 Most Requested Products</h2>
            {lProducts ? <Spinner /> : top5Products.length > 0 ? (
              <div className="h-[300px]">
                <Bar aria-label="Top 5 most requested products Bar Chart" data={productsBarData} options={{ ...CHART_DEFAULTS, indexAxis: 'y' }} />
              </div>
            ) : <NoData />}
          </div>

          <div className="bg-white rounded-[24px] border border-[#E0DBD5] shadow-sm p-6">
            <h2 className="text-[17px] font-black text-[#2C1810] mb-4">Low Stock Alerts</h2>
            {lLowStock ? <Spinner /> : lowStock && lowStock.length > 0 ? (
              <div className="max-h-[300px] overflow-y-auto divide-y divide-[#E0DBD5]">
                {lowStock.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between py-3.5 px-1">
                    <span className="font-semibold text-[15px] text-[#2C1810]">{item.productName}</span>
                    <span className={`px-3 py-1 rounded-[6px] text-[12px] font-bold ${
                      item.severity === 'critical'
                        ? 'bg-red-100 text-red-700 border border-red-200'
                        : 'bg-amber-100 text-amber-700 border border-amber-200'
                    }`}>
                      {item.severity === 'critical' ? 'Critical' : 'Low'}
                    </span>
                  </div>
                ))}
              </div>
            ) : <NoData />}
          </div>
        </div>

        {/* Charts row: fulfillment by region + top retailers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-[24px] border border-[#E0DBD5] shadow-sm p-6">
            <h2 className="text-[17px] font-black text-[#2C1810] mb-5">Fulfillment Rate by Region</h2>
            {lFulfillment ? <Spinner /> : fulfillmentBarData ? (
              <div className="h-[300px]">
                <Bar aria-label="Fulfillment rate by region Bar Chart" data={fulfillmentBarData} options={{
                  ...CHART_DEFAULTS,
                  indexAxis: 'y',
                  scales: { ...CHART_DEFAULTS.scales, x: { ...CHART_DEFAULTS.scales.x, max: 100, ticks: { ...CHART_DEFAULTS.scales.x.ticks, callback: v => `${v}%` } } },
                }} />
              </div>
            ) : <NoData />}
          </div>

          <div className="bg-white rounded-[24px] border border-[#E0DBD5] shadow-sm p-6">
            <h2 className="text-[17px] font-black text-[#2C1810] mb-5">Top Retailers by Order Volume</h2>
            {lRetailers ? <Spinner /> : retailerBarData ? (
              <div className="h-[300px]">
                <Bar aria-label="Top retailers by order volume Bar Chart" data={retailerBarData} options={{
                  ...CHART_DEFAULTS,
                  scales: { ...CHART_DEFAULTS.scales, x: { ...CHART_DEFAULTS.scales.x, ticks: { ...CHART_DEFAULTS.scales.x.ticks, maxRotation: 45 } } },
                }} />
              </div>
            ) : <NoData />}
          </div>
        </div>

      </div>
    </StockManagerLayout>
  );
};

export default StockManagerInsightsDashboard;
