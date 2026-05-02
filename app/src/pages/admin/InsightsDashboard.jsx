import React, { useState, useEffect, useCallback } from 'react';
import { 
  Loader2, BarChart3, TrendingUp, Users, Package, 
  Calendar, MapPin, ChevronRight, Filter, RefreshCw, CheckCircle
} from 'lucide-react';
// import HeatMap from './HeatMap'; // Disabled temporarily due to missing leaflet dependencies
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
    const qs = `?period=${period}d${region !== 'all' ? `&region=${encodeURIComponent(region)}` : ''}`;
    apiFetch(`/api/analytics/summary${qs}`, 'summary').then(setSummary);
    apiFetch(`/api/analytics/promotions${qs}`, 'promos').then(setPromotions);
    apiFetch(`/api/analytics/stock${qs}`, 'stock').then(setStock);
    apiFetch(`/api/analytics/feedback${qs}`, 'feedback').then(setFeedback);
    apiFetch(`/api/analytics/fulfillment${qs}`, 'fulfillment').then(setFulfillment);
    apiFetch(`/api/analytics/products${qs}`, 'products').then(setProducts);
  }, [period, region]);

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
                <div className="h-[400px]"><Bar data={promosBarData} options={{...CHART_OPTIONS, indexAxis: 'y'}} /></div>
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
                      <div className="text-center">
                        <p className="text-[20px] font-black text-blue-600">{(m.b2b || 0).toLocaleString()}{m.unit}</p>
                        <p className="text-[9px] font-black text-blue-400 uppercase mt-1">B2B</p>
                      </div>
                      <div className="h-8 w-px bg-gray-200" />
                      <div className="text-center">
                        <p className="text-[20px] font-black text-purple-600">{(m.b2c || 0).toLocaleString()}{m.unit}</p>
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
                <div className="h-[400px]"><Line data={stockLineData} options={CHART_OPTIONS} /></div>
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
                  <Doughnut data={feedbackData} options={{...CHART_OPTIONS, cutout: '75%'}} />
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
                    <div className="h-[300px]"><Bar data={fulfillmentData} options={{...CHART_OPTIONS, scales: {y: {max: 100}}}} /></div>
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

          {activeTab === 'HeatMap' && (
            <div className="flex flex-col items-center justify-center h-[500px] text-center space-y-4">
              <div className="p-6 bg-amber-50 rounded-[24px] border border-amber-100">
                <p className="text-[14px] font-bold text-amber-800">Map Dependencies Missing</p>
                <p className="text-[12px] text-amber-600 mt-1 max-w-xs">
                  The Issue HeatMap requires leaflet dependencies. Please run <code>npm install</code> in your terminal to enable this feature.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InsightsDashboard;
