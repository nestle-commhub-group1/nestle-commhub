import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Download, FileText } from 'lucide-react';
import StockManagerLayout from '../../components/layout/StockManagerLayout';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
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
    className="bg-white rounded-[20px] p-6 shadow-sm border border-[#E0DBD5] group hover:shadow-md transition-all"
    style={{ borderLeft: `4px solid ${accentColor}` }}
  >
    <p className="text-[13px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</p>
    <p className="text-[32px] font-extrabold text-[#2C1810] leading-none">{value}</p>
    <p className="text-[12px] mt-2 font-medium" style={{ color: subColor }}>{sub}</p>
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

async function apiFetch(path) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) return null;
  const json = await res.json();
  return json.data ?? null;
}

const StockManagerInsightsDashboard = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

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

  // Chart Refs for capture
  const stockChartRef = React.useRef(null);
  const productsChartRef = React.useRef(null);
  const fulfillmentChartRef = React.useRef(null);

  // PDF Engine Refs
  const pdfStockRef = React.useRef(null);
  const pdfProductsRef = React.useRef(null);
  const pdfFulfillmentRef = React.useRef(null);

  const regions = fulfillment ? fulfillment.map(f => f.region) : [];
  const isDark = theme === 'dark';
  const chartText = isDark ? '#e1d3c6' : '#6B7280';
  const chartMuted = isDark ? '#c4b4a6' : '#9CA3AF';
  const chartGrid = isDark ? 'rgba(255, 248, 239, 0.12)' : 'rgba(0,0,0,0.04)';
  const chartBrown = isDark ? '#d9a679' : '#3D2B1F';
  const chartFill = isDark ? 'rgba(217, 166, 121, 0.22)' : 'rgba(61,43,31,0.08)';
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
      x: { ...CHART_DEFAULTS.scales.x, ticks: { ...CHART_DEFAULTS.scales.x.ticks, color: chartMuted }, grid: { color: chartGrid } },
      y: { ...CHART_DEFAULTS.scales.y, ticks: { ...CHART_DEFAULTS.scales.y.ticks, color: chartMuted }, grid: { color: chartGrid } },
    },
  };

  const fetchAll = useCallback(async () => {
    setLSummary(true); setLStock(true); setLProducts(true);
    setLLowStock(true); setLFulfillment(true); setLRetailers(true);

    const baseQs = `?period=${period}d`;
    const regionQs = regionFilter !== 'all' ? `&region=${encodeURIComponent(regionFilter)}` : '';
    const productQs = productFilter !== 'all' ? `&productId=${productFilter}` : '';
    
    const fullQs = `${baseQs}${regionQs}${productQs}`;

    apiFetch(`/api/analytics/sm-summary${fullQs}`).then(d => { setSummary(d); setLSummary(false); });
    apiFetch(`/api/analytics/stock${fullQs}`).then(d => { setStock(d); setLStock(false); });
    apiFetch(`/api/analytics/products${fullQs}`).then(d => { setProducts(d); setLProducts(false); });
    apiFetch(`/api/analytics/low-stock${fullQs}`).then(d => { setLowStock(d); setLLowStock(false); });
    apiFetch(`/api/analytics/fulfillment${fullQs}`).then(d => { setFulfillment(d); setLFulfillment(false); });
    apiFetch(`/api/analytics/top-retailers${fullQs}`).then(d => { setTopRetailers(d); setLRetailers(false); });
  }, [period, regionFilter, productFilter]);

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
        borderColor: chartBrown,
        backgroundColor: chartFill,
        pointBackgroundColor: '#fff',
        pointBorderColor: chartBrown,
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



  const exportPDF = () => {
    if (!summary) return;

    const stockImg = pdfStockRef.current?.toBase64Image();
    const productsImg = pdfProductsRef.current?.toBase64Image();
    const fulfillmentImg = pdfFulfillmentRef.current?.toBase64Image();

    const printWindow = window.open('', '_blank');
    const html = `
      <html>
        <head>
          <title>Supply Chain Reliability Report - ${new Date().toLocaleDateString()}</title>
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
              <h1 class="text-4xl font-black uppercase tracking-tight">Supply Chain Reliability</h1>
              <p class="text-gray-500 font-bold mt-2 italic">Stock Manager Operational Report</p>
            </div>
            <div class="text-right">
              <p class="text-sm font-black text-gray-400 uppercase tracking-widest">Report Scope</p>
              <p class="text-xl font-black mt-1">${regionFilter === 'all' ? 'National Overview' : regionFilter + ' Province'}</p>
              <p class="text-sm font-bold text-gray-500">Last ${period} Days</p>
              <p class="text-xs text-gray-400 mt-4 italic">Generated on ${new Date().toLocaleString()}</p>
            </div>
          </div>

          <div class="grid grid-cols-4 gap-6 mb-12">
            <div class="bg-[#F8F7F5] p-6 rounded-3xl border border-[#F0EDE8]">
              <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Total Requests</p>
              <p class="text-3xl font-black text-blue-600">${(summary.totalStockRequests || 0).toLocaleString()}</p>
            </div>
            <div class="bg-[#F8F7F5] p-6 rounded-3xl border border-[#F0EDE8]">
              <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Peak Demand</p>
              <p class="text-xl font-black">${summary.peakDemandDay || '--'}</p>
              <p class="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">${(summary.peakDemandAvg || 0).toLocaleString()} units avg</p>
            </div>
            <div class="bg-[#F8F7F5] p-6 rounded-3xl border border-[#F0EDE8]">
              <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Fulfillment</p>
              <p class="text-3xl font-black text-green-600">${summary.fulfillmentRate || 0}%</p>
            </div>
            <div class="bg-[#F8F7F5] p-6 rounded-3xl border border-[#F0EDE8]">
              <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Low Stock Alerts</p>
              <p class="text-3xl font-black ${summary.lowStockAlertCount > 0 ? 'text-red-600' : 'text-green-600'}">${summary.lowStockAlertCount || 0}</p>
            </div>
          </div>

          <div class="space-y-12">
            <div>
              <h3 class="text-lg font-black uppercase tracking-widest text-gray-400 mb-4 text-center">Avg Weekly Demand Trend</h3>
              ${stockImg ? `<img src="${stockImg}" class="w-full h-80 object-contain rounded-2xl border border-gray-100 p-4" />` : ''}
            </div>

            <div class="grid grid-cols-2 gap-12 pt-8">
              <div class="space-y-4">
                <h3 class="text-lg font-black uppercase tracking-widest text-gray-400">Regional Fulfillment Matrix</h3>
                ${fulfillmentImg ? `<img src="${fulfillmentImg}" class="w-full rounded-2xl border border-gray-100 p-4" />` : ''}
              </div>
              <div class="space-y-4">
                <h3 class="text-lg font-black uppercase tracking-widest text-gray-400">Inventory Allocation (Top 5)</h3>
                ${productsImg ? `<img src="${productsImg}" class="w-full rounded-2xl border border-gray-100 p-4" />` : ''}
              </div>
            </div>
          </div>

          <div class="page-break"></div>

          <div class="mt-12 space-y-8">
            <h3 class="text-lg font-black uppercase tracking-widest text-gray-400 mb-6 underline">Critical Low Stock Alerts</h3>
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="bg-[#F8F7F5]">
                  <th class="p-4 text-xs font-black uppercase tracking-widest text-gray-400 border-b border-[#F0EDE8]">Product Name</th>
                  <th class="p-4 text-xs font-black uppercase tracking-widest text-gray-400 border-b border-[#F0EDE8]">Severity Level</th>
                  <th class="p-4 text-xs font-black uppercase tracking-widest text-gray-400 border-b border-[#F0EDE8]">Recommended Action</th>
                </tr>
              </thead>
              <tbody>
                ${lowStock?.map(s => `
                  <tr>
                    <td class="p-4 font-bold border-b border-[#F8F7F5]">${s.productName}</td>
                    <td class="p-4 border-b border-[#F8F7F5] uppercase text-[10px] font-black">
                      <span class="${s.severity === 'critical' ? 'text-red-600 bg-red-50' : 'text-amber-600 bg-amber-50'} px-2 py-1 rounded">
                        ${s.severity}
                      </span>
                    </td>
                    <td class="p-4 italic text-sm text-gray-500 border-b border-[#F8F7F5]">Reorder immediately to avoid stock-out</td>
                  </tr>
                `).join('') || '<tr><td colspan="3" class="p-4 text-center italic text-gray-400">No active alerts</td></tr>'}
              </tbody>
            </table>
          </div>

          <div class="mt-24 pt-8 border-t border-[#F0EDE8] text-center text-xs text-gray-400 font-bold uppercase tracking-widest">
            Nestle CommHub Supply Chain Intelligence • Internal Distribution Only
          </div>

          <script>window.onload = () => { setTimeout(() => window.print(), 1200); };</script>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  const selectCls = 'w-full px-4 py-3 bg-[#F8F7F5] border border-[#E0DBD5] rounded-[14px] font-semibold text-[14px] text-[#3D2B1F] outline-none focus:ring-2 focus:ring-[#3D2B1F]/20 cursor-pointer';

  return (
    <StockManagerLayout>
      <div className="min-h-screen bg-nestle-gray p-6 lg:p-8 font-sans space-y-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-[28px] font-black text-[#2C1810] tracking-tight">Stock Analytics</h1>
            <p className="text-[14px] text-gray-500 font-medium mt-1">
              Demand trends, fulfillment rates and low stock alerts
            </p>
          </div>
          <button 
            onClick={exportPDF}
            className="flex items-center space-x-2 px-6 py-3 bg-[#3D2B1F] text-white rounded-[16px] hover:bg-[#2C1810] transition-all shadow-md hover:shadow-lg active:scale-95"
          >
            <Download size={16} className="text-white/80" />
            <span className="text-[12px] font-black uppercase tracking-wider">Export Reliability Report</span>
          </button>
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
              <Line ref={stockChartRef} aria-label="Avg stock requests by day of week Line Chart" data={stockLineData} options={{
                ...themedChartOptions,
                scales: { ...themedChartOptions.scales, y: { ...themedChartOptions.scales.y, ticks: { ...themedChartOptions.scales.y.ticks, callback: v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v } } },
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
                <Bar ref={productsChartRef} aria-label="Top 5 most requested products Bar Chart" data={productsBarData} options={{ ...themedChartOptions, indexAxis: 'y' }} />
              </div>
            ) : <NoData />}
          </div>

          <div className="bg-white rounded-[24px] border border-[#E0DBD5] shadow-sm p-6">
            <h2 className="text-[17px] font-black text-[#2C1810] mb-4">Low Stock Alerts</h2>
            {lLowStock ? <Spinner /> : lowStock && lowStock.length > 0 ? (
              <div className="max-h-[300px] overflow-y-auto divide-y divide-[#E0DBD5]">
                {lowStock.map((item, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => navigate(`/stock-manager/inventory?edit=${item.productId}`)}
                    className="flex items-center justify-between py-3.5 px-2 hover:bg-red-50/50 cursor-pointer rounded-xl transition-all group"
                  >
                    <span className="font-semibold text-[15px] text-[#2C1810] group-hover:text-red-600 transition-colors">{item.productName}</span>
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
                <Bar ref={fulfillmentChartRef} aria-label="Fulfillment rate by region Bar Chart" data={fulfillmentBarData} options={{
                  ...themedChartOptions,
                  indexAxis: 'y',
                  scales: { ...themedChartOptions.scales, x: { ...themedChartOptions.scales.x, max: 100, ticks: { ...themedChartOptions.scales.x.ticks, callback: v => `${v}%` } } },
                }} />
              </div>
            ) : <NoData />}
          </div>

          <div className="bg-white rounded-[24px] border border-[#E0DBD5] shadow-sm p-6">
            <h2 className="text-[17px] font-black text-[#2C1810] mb-5">Top Retailers by Order Volume</h2>
            {lRetailers ? <Spinner /> : retailerBarData ? (
              <div className="h-[300px]">
                <Bar aria-label="Top retailers by order volume Bar Chart" data={retailerBarData} options={{
                  ...themedChartOptions,
                  scales: { ...themedChartOptions.scales, x: { ...themedChartOptions.scales.x, ticks: { ...themedChartOptions.scales.x.ticks, maxRotation: 45 } } },
                }} />
              </div>
            ) : <NoData />}
          </div>
        </div>

        {/* Hidden Report Engine */}
        <div className="fixed -left-[9999px] top-0 opacity-0 pointer-events-none" aria-hidden="true">
          {stockLineData && <div className="w-[800px] h-[400px]"><Line ref={pdfStockRef} data={stockLineData} options={{...CHART_DEFAULTS, animation: false}} /></div>}
          {productsBarData && <div className="w-[800px] h-[400px]"><Bar ref={pdfProductsRef} data={productsBarData} options={{...CHART_DEFAULTS, animation: false, indexAxis: 'y'}} /></div>}
          {fulfillmentBarData && <div className="w-[800px] h-[400px]"><Bar ref={pdfFulfillmentRef} data={fulfillmentBarData} options={{...CHART_DEFAULTS, animation: false, indexAxis: 'y', scales: {x: {max: 100}}}} /></div>}
        </div>

      </div>
    </StockManagerLayout>
  );
};

export default StockManagerInsightsDashboard;
