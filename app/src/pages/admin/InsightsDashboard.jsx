import React, { useState, useEffect, useCallback } from 'react';
import { 
  Loader2, BarChart3, TrendingUp, Users, Package, 
  Calendar, MapPin, ChevronRight, Filter, RefreshCw, CheckCircle, Download, FileText
} from 'lucide-react';
import HeatmapDashboard from './HeatmapDashboard';
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
import { Bar, Line, Doughnut, Pie } from 'react-chartjs-2';

const NestleLogo = () => (
  <div className="flex items-center space-x-2">
    <div className="w-8 h-8 bg-[#3D2B1F] rounded-lg flex items-center justify-center">
      <span className="text-white font-black text-xl">N</span>
    </div>
    <span className="text-[#3D2B1F] font-black tracking-tighter text-xl">CommHub</span>
  </div>
);
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

const CHART_OPTIONS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'bottom',
      labels: {
        padding: 20,
        usePointStyle: true,
        font: { size: 11, weight: 'bold', family: 'Inter' },
        color: '#2C1810'
      }
    },
    tooltip: {
      backgroundColor: '#3D2B1F',
      titleFont: { size: 13, weight: 'bold' },
      bodyFont: { size: 12 },
      padding: 12,
      cornerRadius: 12,
      displayColors: false
    }
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { font: { size: 10, weight: '600' }, color: '#9CA3AF' }
    },
    y: {
      grid: { borderDash: [5, 5], color: '#E5E7EB' },
      ticks: { font: { size: 10, weight: '600' }, color: '#9CA3AF' }
    }
  }
};

const MetricCard = ({ title, value, sub, icon: Icon, color }) => (
  <div className="bg-white p-6 rounded-[24px] border border-[#E0DBD5] shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
    <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-[0.03] transition-transform group-hover:scale-110`} style={{ backgroundColor: color }}></div>
    <div className="flex items-center space-x-3 mb-4">
      <div className="p-2.5 rounded-[12px]" style={{ backgroundColor: `${color}15`, color: color }}>
        <Icon size={18} />
      </div>
      <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">{title}</p>
    </div>
    <div className="flex items-baseline space-x-2">
      <h3 className="text-[28px] font-black text-[#2C1810]">{value}</h3>
      {sub && <span className="text-[12px] font-bold text-gray-400">{sub}</span>}
    </div>
  </div>
);

const InsightsDashboard = () => {
  const [period, setPeriod] = useState('30');
  const [region, setRegion] = useState('all');
  const [activeTab, setActiveTab] = useState('Promotions');

  const [summary, setSummary] = useState(null);
  const [promotions, setPromotions] = useState(null);
  const [stock, setStock] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [fulfillment, setFulfillment] = useState(null);
  const [products, setProducts] = useState(null);

  const [loadState, setLoadState] = useState({
    summary: true, promos: true, stock: true, feedback: true, fulfillment: true, products: true
  });

  const promosChartRef = React.useRef(null);
  const stockChartRef = React.useRef(null);
  const feedbackChartRef = React.useRef(null);
  const fulfillmentChartRef = React.useRef(null);

  // Dedicated refs for PDF export (to ensure we capture charts even if not on active tab)
  const pdfPromosRef = React.useRef(null);
  const pdfStockRef = React.useRef(null);
  const pdfFeedbackRef = React.useRef(null);
  const pdfFulfillmentRef = React.useRef(null);

  const apiFetch = async (path, key) => {
    setLoadState(prev => ({ ...prev, [key]: true }));
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}${path}`, { headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      setLoadState(prev => ({ ...prev, [key]: false }));
      return json.data || null;
    } catch (e) {
      setLoadState(prev => ({ ...prev, [key]: false }));
      return null;
    }
  };

  const fetchAll = useCallback(async () => {
    const qs = `?period=${period === 'all' ? 'all' : period + 'd'}${region !== 'all' ? `&region=${encodeURIComponent(region)}` : ''}`;
    apiFetch(`/api/analytics/summary${qs}`, 'summary').then(setSummary);
    apiFetch(`/api/analytics/promotions${qs}`, 'promos').then(setPromotions);
    apiFetch(`/api/analytics/stock${qs}`, 'stock').then(setStock);
    apiFetch(`/api/analytics/feedback${qs}`, 'feedback').then(setFeedback);
    apiFetch(`/api/analytics/fulfillment${qs}`, 'fulfillment').then(setFulfillment);
    apiFetch(`/api/analytics/products${qs}`, 'products').then(setProducts);
  }, [period, region]);

  const downloadReport = () => {
    if (!summary) return;
    const rows = [];
    rows.push(['Nestle CommHub - HQ Business Insights Report']);
    rows.push([`Generated At: ${new Date().toLocaleString()}`]);
    rows.push([`Region Scope: ${region === 'all' ? 'All Regions' : region}`]);
    rows.push([`Time Period: Last ${period} Days`]);
    rows.push([]);
    rows.push(['SUMMARY KEY PERFORMANCE INDICATORS']);
    rows.push(['Metric', 'Value', 'Context']);
    rows.push(['Total Orders', summary.totalOrders || 0, 'Volume of sales orders']);
    rows.push(['Fulfillment Rate', `${summary.avgFulfillmentRate || 0}%`, 'Efficiency of delivery']);
    rows.push(['Feedback Score', `${summary.avgFeedbackRating || 0}/10`, 'Retailer satisfaction']);
    rows.push(['Promotion Revenue (Units)', summary.totalPromoUnitsSold || 0, 'Impact of active campaigns']);
    rows.push([]);
    if (promotions && promotions.length > 0) {
      rows.push(['PROMOTIONAL PERFORMANCE BREAKDOWN']);
      rows.push(['Promotion Title', 'Units Sold']);
      promotions.forEach(p => { rows.push([p.title, p.totalUnitsSold]); });
      rows.push([]);
    }
    if (fulfillment && fulfillment.length > 0) {
      rows.push(['REGIONAL FULFILLMENT MATRIX']);
      rows.push(['Region', 'Fulfillment Rate %']);
      fulfillment.forEach(f => { rows.push([f.region, `${f.fulfillmentRate}%`]); });
    }
    const csvContent = rows.map(r => r.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Nestle_Report_${region}_${period}d.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportPDF = () => {
    if (!summary) return;

    // Use dedicated PDF refs which are always mounted (hidden)
    const promoImg = pdfPromosRef.current?.toBase64Image();
    const stockImg = pdfStockRef.current?.toBase64Image();
    const feedbackImg = pdfFeedbackRef.current?.toBase64Image();
    const fulfillmentImg = pdfFulfillmentRef.current?.toBase64Image();

    const printWindow = window.open('', '_blank');
    const html = `
      <html>
        <head>
          <title>Nestle CommHub Report - ${region} - ${period}d</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
            body { font-family: 'Inter', sans-serif; background: white; color: #3D2B1F; }
            @media print {
              .no-print { display: none; }
              body { padding: 0; margin: 0; }
              .page-break { page-break-after: always; }
            }
          </style>
        </head>
        <body class="p-12">
          <div class="flex justify-between items-start border-b-2 border-[#F0EDE8] pb-8 mb-8">
            <div>
              <div class="flex items-center space-x-2 mb-4">
                <div class="w-10 h-10 bg-[#3D2B1F] rounded-xl flex items-center justify-center text-white font-black text-2xl">N</div>
                <div class="text-3xl font-black tracking-tighter">CommHub</div>
              </div>
              <h1 class="text-4xl font-black uppercase tracking-tight">Analytical Insights</h1>
              <p class="text-gray-500 font-bold mt-2">Executive Summary Report</p>
            </div>
            <div class="text-right">
              <p class="text-sm font-black text-gray-400 uppercase tracking-widest">Report Context</p>
              <p class="text-xl font-black mt-1">${region === 'all' ? 'National Scope' : region + ' Province'}</p>
              <p class="text-sm font-bold text-gray-500">Last ${period} Days Period</p>
              <p class="text-xs text-gray-400 mt-4 italic">Generated on ${new Date().toLocaleString()}</p>
            </div>
          </div>

          <div class="grid grid-cols-4 gap-6 mb-12">
            <div class="bg-[#F8F7F5] p-6 rounded-3xl border border-[#F0EDE8]">
              <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Total Orders</p>
              <p class="text-3xl font-black">${summary.totalOrders || 0}</p>
            </div>
            <div class="bg-[#F8F7F5] p-6 rounded-3xl border border-[#F0EDE8]">
              <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Fulfillment</p>
              <p class="text-3xl font-black text-green-600">${summary.avgFulfillmentRate || 0}%</p>
            </div>
            <div class="bg-[#F8F7F5] p-6 rounded-3xl border border-[#F0EDE8]">
              <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Retailer Sat.</p>
              <p class="text-3xl font-black text-purple-600">${summary.avgFeedbackRating || 0}/10</p>
            </div>
            <div class="bg-[#F8F7F5] p-6 rounded-3xl border border-[#F0EDE8]">
              <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Promo Revenue</p>
              <p class="text-3xl font-black text-blue-600">${summary.totalPromoUnitsSold || 0}u</p>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-12 mb-12">
            <div class="space-y-4">
              <h3 class="text-lg font-black uppercase tracking-widest text-gray-400">Promotional Performance</h3>
              ${promoImg ? `<img src="${promoImg}" class="w-full rounded-2xl border border-gray-100 p-4" />` : '<div class="h-48 bg-gray-50 flex items-center justify-center italic text-gray-400">Chart not available</div>'}
            </div>
            <div class="space-y-4">
              <h3 class="text-lg font-black uppercase tracking-widest text-gray-400">Feedback Sentiment</h3>
              ${feedbackImg ? `<img src="${feedbackImg}" class="w-48 mx-auto" />` : '<div class="h-48 bg-gray-50 flex items-center justify-center italic text-gray-400">Chart not available</div>'}
              <div class="grid grid-cols-3 gap-2 text-center mt-4">
                <div class="p-2 bg-green-50 rounded-xl"><p class="text-[10px] font-bold text-green-600">Positive</p><p class="font-black">${feedback?.positive || 0}</p></div>
                <div class="p-2 bg-amber-50 rounded-xl"><p class="text-[10px] font-bold text-amber-600">Neutral</p><p class="font-black">${feedback?.neutral || 0}</p></div>
                <div class="p-2 bg-red-50 rounded-xl"><p class="text-[10px] font-bold text-red-600">Negative</p><p class="font-black">${feedback?.negative || 0}</p></div>
              </div>
            </div>
          </div>

          <div class="page-break"></div>

          <div class="mt-12 space-y-8">
            <div>
              <h3 class="text-lg font-black uppercase tracking-widest text-gray-400 mb-6">Regional Performance Matrix</h3>
              <table class="w-full text-left border-collapse">
                <thead>
                  <tr class="bg-[#F8F7F5]">
                    <th class="p-4 text-xs font-black uppercase tracking-widest text-gray-400 border-b border-[#F0EDE8]">Province</th>
                    <th class="p-4 text-xs font-black uppercase tracking-widest text-gray-400 border-b border-[#F0EDE8]">Total Orders</th>
                    <th class="p-4 text-xs font-black uppercase tracking-widest text-gray-400 border-b border-[#F0EDE8]">Fulfilled</th>
                    <th class="p-4 text-xs font-black uppercase tracking-widest text-gray-400 border-b border-[#F0EDE8]">Rate %</th>
                  </tr>
                </thead>
                <tbody>
                  ${fulfillment?.map(f => `
                    <tr>
                      <td class="p-4 font-bold border-b border-[#F8F7F5]">${f.region}</td>
                      <td class="p-4 border-b border-[#F8F7F5]">${f.totalOrders}</td>
                      <td class="p-4 border-b border-[#F8F7F5]">${f.fulfilledOrders}</td>
                      <td class="p-4 font-black text-blue-600 border-b border-[#F8F7F5]">${f.fulfillmentRate}%</td>
                    </tr>
                  `).join('') || ''}
                </tbody>
              </table>
            </div>

            <div>
              <h3 class="text-lg font-black uppercase tracking-widest text-gray-400 mb-6">Demand Trend Analysis</h3>
              ${stockImg ? `<img src="${stockImg}" class="w-full h-64 object-contain rounded-2xl border border-gray-100 p-4" />` : '<div class="h-48 bg-gray-50 flex items-center justify-center italic text-gray-400">Chart not available</div>'}
            </div>
          </div>

          <div class="mt-24 pt-8 border-t border-[#F0EDE8] flex justify-between items-center text-xs text-gray-400 font-bold uppercase tracking-widest">
            <div>Internal Document - Nestle CommHub Confidential</div>
            <div>Page 1 of 1</div>
          </div>

          <script>
            window.onload = () => {
              setTimeout(() => {
                window.print();
                // window.close();
              }, 1000);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const promosBarData = promotions ? {
    labels: promotions.map(p => p.title),
    datasets: [{
      label: 'Units Sold',
      data: promotions.map(p => p.totalUnitsSold),
      backgroundColor: '#3D2B1F',
      borderRadius: 8,
      barThickness: 20
    }]
  } : null;

  const stockLineData = stock ? {
    labels: stock.map(s => s.day),
    datasets: [{
      label: 'Avg Requests',
      data: stock.map(s => s.totalUnits),
      borderColor: '#8B5E3C',
      backgroundColor: 'rgba(139, 94, 60, 0.1)',
      fill: true,
      tension: 0.4,
      pointRadius: 4,
      pointBackgroundColor: '#fff',
      pointBorderWidth: 2
    }]
  } : null;

  const feedbackData = feedback && feedback.total > 0 ? {
    labels: ['Positive', 'Neutral', 'Negative'],
    datasets: [{
      data: [feedback.positive, feedback.neutral, feedback.negative],
      backgroundColor: ['#22C55E', '#F59E0B', '#EF4444'],
      hoverOffset: 10,
      borderRadius: 5
    }]
  } : null;

  const fulfillmentData = fulfillment ? {
    labels: fulfillment.map(f => f.region),
    datasets: [{
      label: 'Fulfillment Rate %',
      data: fulfillment.map(f => f.fulfillmentRate),
      backgroundColor: fulfillment.map(f => f.fulfillmentRate >= 90 ? '#22C55E' : f.fulfillmentRate >= 70 ? '#F59E0B' : '#EF4444'),
      borderRadius: 6
    }]
  } : null;

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="mb-2">
            <NestleLogo />
          </div>
          <h1 className="text-[28px] font-black text-[#2C1810] tracking-tight">HQ Business Insights</h1>
          <p className="text-[14px] text-gray-500 font-medium mt-1">Cross-regional performance and operational analytics</p>
        </div>
        <div className="flex items-center space-x-3 bg-white p-1.5 rounded-[16px] border border-[#E0DBD5] shadow-sm">
          <div className="flex items-center space-x-2 px-3 py-1.5 border-r border-gray-100">
            <Calendar size={14} className="text-gray-400" />
            <select 
              value={period} onChange={(e) => setPeriod(e.target.value)}
              className="text-[13px] font-bold bg-transparent outline-none cursor-pointer text-[#2C1810]"
            >
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>
          <div className="flex items-center space-x-2 px-3 py-1.5">
            <MapPin size={14} className="text-gray-400" />
            <select 
              value={region} onChange={(e) => setRegion(e.target.value)}
              className="text-[13px] font-bold bg-transparent outline-none cursor-pointer text-[#2C1810]"
            >
              <option value="all">All Regions</option>
              {['Western', 'Central', 'Northern', 'Eastern', 'Southern'].map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <button 
            onClick={downloadReport} 
            title="Download CSV"
            className="p-2 hover:bg-gray-50 rounded-[10px] transition-colors text-gray-400 hover:text-[#3D2B1F]"
          >
            <FileText size={18} />
          </button>
          <button 
            onClick={exportPDF} 
            title="Export PDF Report"
            className="flex items-center space-x-2 px-4 py-2 bg-[#3D2B1F] text-white rounded-[12px] hover:bg-[#2C1810] transition-all shadow-md hover:shadow-lg active:scale-95"
          >
            <Download size={14} className="text-white/80" />
            <span className="text-[11px] font-black uppercase tracking-wider">Export PDF</span>
          </button>
          <button onClick={fetchAll} className="p-2 hover:bg-gray-50 rounded-[10px] transition-colors text-gray-400 hover:text-[#3D2B1F]">
            <RefreshCw size={16} className={Object.values(loadState).some(v => v) ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard 
          title="Total Orders" 
          value={summary?.totalOrders?.toLocaleString() || '0'} 
          icon={Package} 
          color="#3B82F6" 
        />
        <MetricCard 
          title="Fulfillment Rate" 
          value={`${summary?.avgFulfillmentRate || 0}%`} 
          sub="Average"
          icon={CheckCircle} 
          color="#22C55E" 
        />
        <MetricCard 
          title="Feedback Score" 
          value={summary?.avgFeedbackRating || '0.0'} 
          sub="/ 10"
          icon={Users} 
          color="#8B5CF6" 
        />
        <MetricCard 
          title="Promo Success" 
          value={summary?.totalPromoUnitsSold?.toLocaleString() || '0'} 
          sub="Units"
          icon={TrendingUp} 
          color="#F59E0B" 
        />
      </div>

      {/* Main Analysis Section */}
      <div className="bg-white rounded-[32px] border border-[#E0DBD5] shadow-sm overflow-hidden">
        <div className="flex overflow-x-auto border-b border-[#F0EDE8] bg-[#F8F7F5] px-4">
          {['Promotions', 'B2B vs B2C', 'Stock', 'Feedback', 'Fulfillment', 'HeatMap'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-8 py-5 text-[12px] font-black uppercase tracking-[0.1em] transition-all relative whitespace-nowrap ${
                activeTab === tab ? 'text-[#3D2B1F]' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {tab}
              {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#3D2B1F] rounded-t-full"></div>}
            </button>
          ))}
        </div>

        <div className="p-8 min-h-[500px]">
          {activeTab === 'Promotions' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-[18px] font-black text-[#2C1810]">Promotional Performance</h3>
                <span className="text-[11px] font-black bg-blue-50 text-blue-600 px-3 py-1 rounded-full uppercase">Units Sold</span>
              </div>
              {loadState.promos ? (
                <div className="h-[400px] flex items-center justify-center"><Loader2 size={30} className="animate-spin text-gray-300" /></div>
              ) : promosBarData ? (
                <div className="h-[400px]"><Bar ref={promosChartRef} data={promosBarData} options={{...CHART_OPTIONS, indexAxis: 'y'}} /></div>
              ) : <div className="h-[400px] flex items-center justify-center text-gray-400 font-bold italic">No promotion data for this period</div>}
            </div>
          )}

          {activeTab === 'B2B vs B2C' && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="text-[18px] font-black text-[#2C1810]">B2B vs B2C Comparison</h3>
                <div className="flex space-x-2">
                  <span className="flex items-center space-x-1 text-[10px] font-black uppercase text-blue-600">
                    <div className="w-2 h-2 rounded-full bg-blue-500" /> <span>B2B Retailer</span>
                  </span>
                  <span className="flex items-center space-x-1 text-[10px] font-black uppercase text-purple-600">
                    <div className="w-2 h-2 rounded-full bg-purple-500" /> <span>B2C Customer</span>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { label: 'Active Campaigns', b2b: summary?.b2bStats?.count, b2c: summary?.b2cStats?.count, unit: '' },
                  { label: 'Total Opt-ins / Activations', b2b: summary?.b2bStats?.totalOptIns, b2c: summary?.b2cStats?.totalActivations, unit: '' },
                  { label: 'Revenue Impact (Units)', b2b: summary?.b2bStats?.totalUnits, b2c: summary?.b2cStats?.totalUnits, unit: 'u' },
                ].map(m => (
                  <div key={m.label} className="bg-[#F8F7F5] rounded-[20px] border border-[#F0EDE8] p-5">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 text-center">{m.label}</p>
                    <div className="flex items-center justify-around">
                      <div className="text-center w-1/2 px-1">
                        <p className="text-[16px] font-black text-blue-600 break-all">{(m.b2b || 0).toLocaleString()}{m.unit}</p>
                        <p className="text-[9px] font-black text-blue-400 uppercase mt-1">B2B</p>
                      </div>
                      <div className="h-8 w-px bg-gray-200" />
                      <div className="text-center w-1/2 px-1">
                        <p className="text-[16px] font-black text-purple-600 break-all">{(m.b2c || 0).toLocaleString()}{m.unit}</p>
                        <p className="text-[9px] font-black text-purple-400 uppercase mt-1">B2C</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-[24px] border border-[#F0EDE8] p-6 h-[350px]">
                  <h4 className="text-[13px] font-black text-gray-400 uppercase tracking-widest mb-4">Volume Distribution</h4>
                  <Bar 
                    data={{
                      labels: ['B2B (Retailer)', 'B2C (Customer)'],
                      datasets: [{
                        label: 'Units Sold',
                        data: [summary?.b2bStats?.totalUnits || 0, summary?.b2cStats?.totalUnits || 0],
                        backgroundColor: ['#3B82F6', '#A855F7'],
                        borderRadius: 12,
                        barThickness: 40
                      }]
                    }} 
                    options={CHART_OPTIONS} 
                  />
                </div>
                <div className="bg-white rounded-[24px] border border-[#F0EDE8] p-6 h-[350px]">
                  <h4 className="text-[13px] font-black text-gray-400 uppercase tracking-widest mb-4">Engagement Distribution</h4>
                  <Doughnut 
                    data={{
                      labels: ['B2B Opt-ins', 'B2C Activations'],
                      datasets: [{
                        data: [summary?.b2bStats?.totalOptIns || 0, summary?.b2cStats?.totalActivations || 0],
                        backgroundColor: ['#60A5FA', '#C084FC'],
                        hoverOffset: 15,
                        borderRadius: 8
                      }]
                    }} 
                    options={{...CHART_OPTIONS, cutout: '70%'}} 
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'Stock' && (
            <div className="space-y-6">
              <h3 className="text-[18px] font-black text-[#2C1810]">Inventory Request Trends</h3>
              {loadState.stock ? (
                <div className="h-[400px] flex items-center justify-center"><Loader2 size={30} className="animate-spin text-gray-300" /></div>
              ) : stockLineData ? (
                <div className="h-[400px]"><Line ref={stockChartRef} data={stockLineData} options={CHART_OPTIONS} /></div>
              ) : <div className="h-[400px] flex items-center justify-center text-gray-400 font-bold italic">No trend data available</div>}
            </div>
          )}

          {activeTab === 'Feedback' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <h3 className="text-[18px] font-black text-[#2C1810]">Retailer Sentiment</h3>
                <p className="text-[14px] text-gray-500 leading-relaxed">
                  Based on post-promotion surveys and support ticket sentiment analysis across the selected region.
                </p>
                <div className="space-y-4">
                  {feedback && [
                    { label: 'Positive', value: feedback.positive, color: 'bg-green-500' },
                    { label: 'Neutral', value: feedback.neutral, color: 'bg-amber-500' },
                    { label: 'Negative', value: feedback.negative, color: 'bg-red-500' }
                  ].map(f => (
                    <div key={f.label} className="space-y-1.5">
                      <div className="flex justify-between text-[11px] font-black uppercase tracking-wider">
                        <span className="text-gray-500">{f.label}</span>
                        <span className="text-[#2C1810]">{f.value}</span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full ${f.color}`} style={{ width: `${(f.value/Math.max(feedback.total,1))*100}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="h-[350px]">
                {loadState.feedback ? (
                  <div className="h-full flex items-center justify-center"><Loader2 size={30} className="animate-spin text-gray-300" /></div>
                ) : feedbackData ? (
                  <Doughnut ref={feedbackChartRef} data={feedbackData} options={{...CHART_OPTIONS, cutout: '75%'}} />
                ) : <div className="h-full flex items-center justify-center text-gray-400 font-bold italic">No feedback data</div>}
              </div>
            </div>
          )}

          {activeTab === 'Fulfillment' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <h3 className="text-[18px] font-black text-[#2C1810]">Regional Efficiency</h3>
                  {loadState.fulfillment ? (
                    <div className="h-[300px] flex items-center justify-center"><Loader2 size={30} className="animate-spin text-gray-300" /></div>
                  ) : fulfillmentData ? (
                    <div className="h-[300px]"><Bar ref={fulfillmentChartRef} data={fulfillmentData} options={{...CHART_OPTIONS, scales: {y: {max: 100}}}} /></div>
                  ) : <div className="h-[300px] flex items-center justify-center text-gray-400 font-bold italic">No fulfillment data</div>}
                </div>
                <div className="bg-[#F8F7F5] rounded-[24px] p-6 border border-[#F0EDE8]">
                  <h4 className="text-[13px] font-black text-gray-400 uppercase tracking-widest mb-6">Top Performing Products</h4>
                  <div className="space-y-4">
                    {products?.slice(0, 5).map((p, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-[16px] border border-gray-100 shadow-sm">
                        <div className="flex items-center space-x-3">
                          <span className="w-6 h-6 rounded-full bg-[#3D2B1F] text-white flex items-center justify-center text-[10px] font-black">{idx + 1}</span>
                          <span className="text-[14px] font-bold text-[#2C1810]">{p.productName}</span>
                        </div>
                        <span className="text-[13px] font-black text-[#8B5E3C]">{p.requestCount.toLocaleString()} units</span>
                      </div>
                    ))}
                    {(!products || products.length === 0) && !loadState.products && (
                      <div className="py-20 text-center text-gray-400 italic text-sm">No product data available</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'HeatMap' && <HeatmapDashboard embedded={true} />}
        </div>
      </div>
      {/* Hidden Report Engine (for PDF Export) */}
      <div className="fixed -left-[9999px] top-0 opacity-0 pointer-events-none" aria-hidden="true">
        {promosBarData && <div className="w-[800px] h-[400px]"><Bar ref={pdfPromosRef} data={promosBarData} options={{...CHART_OPTIONS, animation: false}} /></div>}
        {stockLineData && <div className="w-[800px] h-[400px]"><Line ref={pdfStockRef} data={stockLineData} options={{...CHART_OPTIONS, animation: false}} /></div>}
        {feedbackData && <div className="w-[400px] h-[400px]"><Doughnut ref={pdfFeedbackRef} data={feedbackData} options={{...CHART_OPTIONS, animation: false}} /></div>}
        {fulfillmentData && <div className="w-[800px] h-[400px]"><Bar ref={pdfFulfillmentRef} data={fulfillmentData} options={{...CHART_OPTIONS, animation: false}} /></div>}
      </div>
    </div>
  );
};

export default InsightsDashboard;
