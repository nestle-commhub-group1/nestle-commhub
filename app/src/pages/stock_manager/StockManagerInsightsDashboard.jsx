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
import { Bar, Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  BarElement,
  LineElement,
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  Filler
);

/* ═══════════════════════════════════════════════════════════════════════════
 *  Theme (dark, matching stock manager dashboard mockup)
 * ═══════════════════════════════════════════════════════════════════════════ */

const C = {
  bg: '#1a1f2e',
  card: '#232a3b',
  border: '#2e3650',
  text: '#e2e8f0',
  dim: '#94a3b8',
  accent: '#3b82f6',
  green: '#22c55e',
  emerald: '#10b981',
  amber: '#f59e0b',
  red: '#ef4444',
  teal: '#14b8a6',
};

const s = {
  page: { background: C.bg, minHeight: '100vh', padding: '32px', color: C.text, fontFamily: "'Inter','Segoe UI',sans-serif" },
  h1: { fontSize: '26px', fontWeight: 800, marginBottom: '8px', letterSpacing: '-0.02em' },
  badge: { display: 'inline-block', background: 'rgba(234,179,8,0.15)', color: '#eab308', fontWeight: 700, fontSize: '12px', padding: '4px 14px', borderRadius: '20px', marginBottom: '24px' },
  filterRow: { display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' },
  filterGrp: { flex: 1, minWidth: '180px' },
  label: { fontSize: '12px', color: C.dim, fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' },
  select: {
    width: '100%', padding: '12px 16px', background: C.card, border: `1px solid ${C.border}`, borderRadius: '10px',
    color: C.text, fontSize: '14px', fontWeight: 600, cursor: 'pointer', appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px center',
  },
  metricsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' },
  mc: { background: C.card, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '20px 24px' },
  ml: { fontSize: '13px', color: C.dim, fontWeight: 600, marginBottom: '6px' },
  mv: { fontSize: '32px', fontWeight: 800, lineHeight: 1.1, marginBottom: '4px' },
  ms: { fontSize: '12px', fontWeight: 600 },
  chartRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginBottom: '24px' },
  chartFull: { display: 'grid', gridTemplateColumns: '1fr', gap: '24px', marginBottom: '24px' },
  cc: { background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '24px' },
  ct: { fontSize: '16px', fontWeight: 700, marginBottom: '16px' },
  spin: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px', color: C.dim },
  noData: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px', color: C.dim, fontWeight: 600, fontSize: '14px' },
};

/* ═══════════════════════════════════════════════════════════════════════════ */

async function apiFetch(path) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) return null;
  const json = await res.json();
  return json.data ?? null;
}

const CHART_DEFAULTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { labels: { color: C.dim, font: { size: 12, weight: 600 }, padding: 14 } } },
  scales: {
    x: { ticks: { color: C.dim, font: { size: 11 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
    y: { ticks: { color: C.dim, font: { size: 11 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
  },
};

const Spinner = () => (
  <div style={s.spin}>
    <Loader2 size={28} style={{ animation: 'spin 1s linear infinite' }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);
const NoData = () => <div style={s.noData}>No data available</div>;

/* ═══════════════════════════════════════════════════════════════════════════
 *  COMPONENT
 * ═══════════════════════════════════════════════════════════════════════════ */

const StockManagerInsightsDashboard = () => {
  const { user } = useAuth();

  /* Filters */
  const [period, setPeriod] = useState('7');
  const [regionFilter, setRegionFilter] = useState('all');
  const [productFilter, setProductFilter] = useState('all');

  /* Data */
  const [summary, setSummary] = useState(null);
  const [stock, setStock] = useState(null);
  const [products, setProducts] = useState(null);
  const [lowStock, setLowStock] = useState(null);
  const [fulfillment, setFulfillment] = useState(null);
  const [topRetailers, setTopRetailers] = useState(null);

  /* Loading */
  const [lSummary, setLSummary] = useState(true);
  const [lStock, setLStock] = useState(true);
  const [lProducts, setLProducts] = useState(true);
  const [lLowStock, setLLowStock] = useState(true);
  const [lFulfillment, setLFulfillment] = useState(true);
  const [lRetailers, setLRetailers] = useState(true);

  /* Regions (derived from fulfillment data) */
  const regions = fulfillment ? fulfillment.map((f) => f.region) : [];

  /* Fetch */
  const fetchAll = useCallback(async () => {
    setLSummary(true); setLStock(true); setLProducts(true);
    setLLowStock(true); setLFulfillment(true); setLRetailers(true);
    const qs = `?period=${period}d`;
    const rqs = regionFilter !== 'all' ? `&region=${encodeURIComponent(regionFilter)}` : '';

    apiFetch(`/api/analytics/sm-summary${qs}`).then((d) => { setSummary(d); setLSummary(false); });
    apiFetch(`/api/analytics/stock${qs}`).then((d) => { setStock(d); setLStock(false); });
    apiFetch(`/api/analytics/products${qs}`).then((d) => { setProducts(d); setLProducts(false); });
    apiFetch(`/api/analytics/low-stock${qs}${rqs}`).then((d) => { setLowStock(d); setLLowStock(false); });
    apiFetch(`/api/analytics/fulfillment${qs}`).then((d) => { setFulfillment(d); setLFulfillment(false); });
    apiFetch(`/api/analytics/top-retailers${qs}${rqs}`).then((d) => { setTopRetailers(d); setLRetailers(false); });
  }, [period, regionFilter]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /* ── Chart 1: Line — avg stock requests by day of week with threshold ── */
  const maxUnits = stock ? Math.max(...stock.map((d) => d.totalUnits)) : 0;
  const thresholdVal = maxUnits > 0 ? Math.round(maxUnits * 0.9) : 0; // 90th-percentile line

  const stockLineData = stock ? {
    labels: stock.map((d) => d.day),
    datasets: [
      {
        label: 'Avg requests',
        data: stock.map((d) => d.totalUnits),
        borderColor: C.accent,
        backgroundColor: 'rgba(59,130,246,0.08)',
        pointBackgroundColor: '#fff',
        pointBorderColor: C.accent,
        pointRadius: 5,
        pointHoverRadius: 7,
        tension: 0.4,
        fill: true,
      },
      {
        label: 'High demand threshold',
        data: stock.map(() => thresholdVal),
        borderColor: C.red,
        borderDash: [8, 5],
        pointRadius: 0,
        borderWidth: 2,
        fill: false,
      },
    ],
  } : null;

  const stockLineOpts = {
    ...CHART_DEFAULTS,
    scales: {
      ...CHART_DEFAULTS.scales,
      y: {
        ...CHART_DEFAULTS.scales.y,
        ticks: {
          ...CHART_DEFAULTS.scales.y.ticks,
          callback: (v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v,
        },
      },
    },
  };

  /* ── Chart 2: Horizontal bar — top 5 products ── */
  const top5Products = products ? products.slice(0, 5) : [];
  const productsBarData = {
    labels: top5Products.map((p) => p.productName),
    datasets: [{
      label: 'Request count',
      data: top5Products.map((p) => p.requestCount),
      backgroundColor: C.accent,
      borderRadius: 4,
      barThickness: 22,
    }],
  };
  const productsBarOpts = { ...CHART_DEFAULTS, indexAxis: 'y' };

  /* ── Chart 4: Horizontal bar — fulfillment by region ── */
  const fulfillmentBarData = fulfillment ? {
    labels: fulfillment.map((f) => f.region),
    datasets: [{
      label: 'Fulfillment %',
      data: fulfillment.map((f) => f.fulfillmentRate),
      backgroundColor: fulfillment.map((f) =>
        f.fulfillmentRate >= 90 ? C.emerald
          : f.fulfillmentRate >= 70 ? C.amber
          : C.red
      ),
      borderRadius: 4,
      barThickness: 24,
    }],
  } : null;
  const fulfillmentBarOpts = {
    ...CHART_DEFAULTS,
    indexAxis: 'y',
    scales: {
      ...CHART_DEFAULTS.scales,
      x: { ...CHART_DEFAULTS.scales.x, max: 100, ticks: { ...CHART_DEFAULTS.scales.x.ticks, callback: (v) => `${v}%` } },
    },
  };

  /* ── Chart 5: Vertical bar — top retailers ── */
  const retailerBarData = topRetailers ? {
    labels: topRetailers.map((r) => r.retailerName),
    datasets: [{
      label: 'Orders placed',
      data: topRetailers.map((r) => r.orderCount),
      backgroundColor: C.emerald,
      borderRadius: 6,
      barThickness: 36,
    }],
  } : null;
  const retailerBarOpts = {
    ...CHART_DEFAULTS,
    scales: {
      ...CHART_DEFAULTS.scales,
      x: { ...CHART_DEFAULTS.scales.x, ticks: { ...CHART_DEFAULTS.scales.x.ticks, maxRotation: 45 } },
    },
  };

  /* ═══════════════════════════════════════════════════════════════════════
   *  RENDER
   * ═══════════════════════════════════════════════════════════════════════ */
  return (
    <StockManagerLayout>
      <div style={s.page}>
        <h1 style={s.h1}>Stock Manager Dashboard:</h1>
        <div style={s.badge}>Stock Manager view</div>

        {/* Filter bar */}
        <div style={s.filterRow}>
          <div style={s.filterGrp}>
            <div style={s.label}>Period:</div>
            <select style={s.select} value={period} onChange={(e) => setPeriod(e.target.value)}>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="all">All time</option>
            </select>
          </div>
          <div style={s.filterGrp}>
            <div style={s.label}>Region:</div>
            <select style={s.select} value={regionFilter} onChange={(e) => setRegionFilter(e.target.value)}>
              <option value="all">All regions</option>
              {regions.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div style={s.filterGrp}>
            <div style={s.label}>Product:</div>
            <select style={s.select} value={productFilter} onChange={(e) => setProductFilter(e.target.value)}>
              <option value="all">All products</option>
              {(products || []).map((p) => (
                <option key={p.productId} value={p.productId}>{p.productName}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Metric cards */}
        {lSummary ? <Spinner /> : summary ? (
          <div style={s.metricsGrid}>
            <div data-testid="metric-card" style={s.mc}>
              <div style={s.ml}>Total stock requests</div>
              <div style={s.mv}>{summary.totalStockRequests?.toLocaleString()}</div>
              <div style={{ ...s.ms, color: C.dim }}>This period</div>
            </div>
            <div data-testid="metric-card" style={s.mc}>
              <div style={s.ml}>Peak demand day</div>
              <div style={s.mv}>{summary.peakDemandDay}</div>
              <div style={{ ...s.ms, color: C.dim }}>avg {summary.peakDemandAvg?.toLocaleString()} units</div>
            </div>
            <div data-testid="metric-card" style={s.mc}>
              <div style={s.ml}>Fulfillment rate</div>
              <div style={s.mv}>{summary.fulfillmentRate}%</div>
              <div style={{ ...s.ms, color: summary.fulfillmentRate >= 90 ? C.green : C.amber }}>
                Target: 90%
              </div>
            </div>
            <div data-testid="metric-card" style={s.mc}>
              <div style={s.ml}>Low stock alerts</div>
              <div style={s.mv}>{summary.lowStockAlertCount}</div>
              <div style={{ ...s.ms, color: summary.lowStockAlertCount > 0 ? C.red : C.green }}>
                {summary.lowStockAlertCount > 0 ? 'Requires attention' : 'All clear'}
              </div>
            </div>
          </div>
        ) : <NoData />}

        {/* Chart 1: Stock requests by day of week (full width) */}
        <div style={s.chartFull}>
          <div style={s.cc}>
            <div style={s.ct}>Avg stock requests by day of week</div>
            {lStock ? <Spinner /> : stockLineData ? (
              <div style={{ height: '320px' }}>
                <Line aria-label="Avg stock requests by day of week Line Chart" data={stockLineData} options={stockLineOpts} />
              </div>
            ) : <NoData />}
          </div>
        </div>

        {/* Row: Top products + Low stock alerts */}
        <div style={s.chartRow}>
          <div style={s.cc}>
            <div style={s.ct}>Top 5 most requested products</div>
            {lProducts ? <Spinner /> : top5Products.length > 0 ? (
              <div style={{ height: '280px' }}>
                <Bar aria-label="Top 5 most requested products Bar Chart" data={productsBarData} options={productsBarOpts} />
              </div>
            ) : <NoData />}
          </div>

          <div style={s.cc}>
            <div style={{ ...s.ct, marginBottom: '12px' }}>Low stock alerts</div>
            {lLowStock ? <Spinner /> : lowStock && lowStock.length > 0 ? (
              <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                {lowStock.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '14px 16px',
                      borderBottom: idx < lowStock.length - 1 ? `1px solid ${C.border}` : 'none',
                    }}
                  >
                    <span style={{ fontWeight: 600, fontSize: '15px' }}>{item.productName}</span>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '3px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 700,
                        textTransform: 'capitalize',
                        background: item.severity === 'critical' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)',
                        color: item.severity === 'critical' ? C.red : C.amber,
                      }}
                    >
                      {item.severity === 'critical' ? 'Critical' : 'Low'}
                    </span>
                  </div>
                ))}
              </div>
            ) : <NoData />}
          </div>
        </div>

        {/* Row: Fulfillment by region + Top retailers */}
        <div style={s.chartRow}>
          <div style={s.cc}>
            <div style={s.ct}>Fulfillment rate by region</div>
            {lFulfillment ? <Spinner /> : fulfillmentBarData ? (
              <div style={{ height: '280px' }}>
                <Bar aria-label="Fulfillment rate by region Bar Chart" data={fulfillmentBarData} options={fulfillmentBarOpts} />
              </div>
            ) : <NoData />}
          </div>

          <div style={s.cc}>
            <div style={s.ct}>Top retailers by order volume</div>
            {lRetailers ? <Spinner /> : retailerBarData ? (
              <div style={{ height: '280px' }}>
                <Bar aria-label="Top retailers by order volume Bar Chart" data={retailerBarData} options={retailerBarOpts} />
              </div>
            ) : <NoData />}
          </div>
        </div>
      </div>
    </StockManagerLayout>
  );
};

export default StockManagerInsightsDashboard;
