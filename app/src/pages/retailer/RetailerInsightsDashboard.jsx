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

/* ═══════════════════════════════════════════════════════════════════════════
 *  Theme — dark dashboard matching the rest of the analytics suite
 * ═══════════════════════════════════════════════════════════════════════════ */

const C = {
  bg: '#1a1f2e', card: '#232a3b', border: '#2e3650',
  text: '#e2e8f0', dim: '#94a3b8',
  accent: '#3b82f6', green: '#22c55e', emerald: '#10b981',
  amber: '#f59e0b', red: '#ef4444', purple: '#a855f7',
  teal: '#14b8a6', pink: '#ec4899',
};

const sty = {
  page: { background: C.bg, minHeight: '100vh', padding: '32px', color: C.text, fontFamily: "'Inter','Segoe UI',sans-serif" },
  h1: { fontSize: '26px', fontWeight: 800, marginBottom: '8px', letterSpacing: '-0.02em' },
  badge: { display: 'inline-block', background: 'rgba(16,185,129,0.15)', color: '#34d399', fontWeight: 700, fontSize: '12px', padding: '4px 14px', borderRadius: '20px', marginBottom: '24px' },
  filterRow: { display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' },
  filterGrp: { flex: 1, minWidth: '220px', maxWidth: '360px' },
  label: { fontSize: '12px', color: C.dim, fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' },
  select: {
    width: '100%', padding: '12px 16px', background: C.card, border: `1px solid ${C.border}`,
    borderRadius: '10px', color: C.text, fontSize: '14px', fontWeight: 600, cursor: 'pointer',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px center',
  },
  mg: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' },
  mc: { background: C.card, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '20px 24px' },
  ml: { fontSize: '13px', color: C.dim, fontWeight: 600, marginBottom: '6px' },
  mv: { fontSize: '32px', fontWeight: 800, lineHeight: 1.1, marginBottom: '4px' },
  ms: { fontSize: '12px', fontWeight: 600 },
  row: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginBottom: '24px' },
  full: { display: 'grid', gridTemplateColumns: '1fr', gap: '24px', marginBottom: '24px' },
  cc: { background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '24px' },
  ct: { fontSize: '16px', fontWeight: 700, marginBottom: '16px' },
  spin: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px', color: C.dim },
  noData: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px', color: C.dim, fontWeight: 600, fontSize: '14px' },
};

/* helpers */
async function apiFetch(path) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) return null;
  const json = await res.json();
  return json.data ?? null;
}

const CHART_DEFAULTS = {
  responsive: true, maintainAspectRatio: false,
  plugins: { legend: { labels: { color: C.dim, font: { size: 12, weight: 600 }, padding: 14 } } },
  scales: {
    x: { ticks: { color: C.dim, font: { size: 11 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
    y: { ticks: { color: C.dim, font: { size: 11 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
  },
};

const Spinner = () => (
  <div style={sty.spin}>
    <Loader2 size={28} style={{ animation: 'spin 1s linear infinite' }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);
const NoData = () => <div style={sty.noData}>No data available</div>;

/* ═══════════════════════════════════════════════════════════════════════════
 *  PROGRESS BAR COMPONENT (for performance vs national avg)
 * ═══════════════════════════════════════════════════════════════════════════ */

const ProgressComparison = ({ label, myValue, avgValue, myLabel, avgLabel, max, suffix = '' }) => {
  const clamp = (v) => Math.min(Math.max(v, 0), max);
  const myPct = (clamp(myValue) / max) * 100;
  const avgPct = (clamp(avgValue) / max) * 100;

  return (
    <div style={{ marginBottom: '22px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ fontWeight: 700, fontSize: '14px', color: C.text }}>{label}</span>
      </div>
      {/* My value */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
        <span style={{ width: '90px', fontSize: '12px', color: C.dim, fontWeight: 600, flexShrink: 0 }}>{myLabel}</span>
        <div style={{ flex: 1, height: '12px', background: 'rgba(255,255,255,0.06)', borderRadius: '6px', overflow: 'hidden' }}>
          <div style={{ width: `${myPct}%`, height: '100%', background: C.emerald, borderRadius: '6px', transition: 'width 0.6s ease' }} />
        </div>
        <span style={{ width: '70px', fontSize: '13px', fontWeight: 700, color: C.emerald, textAlign: 'right' }}>
          {myValue}{suffix}
        </span>
      </div>
      {/* National avg */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ width: '90px', fontSize: '12px', color: C.dim, fontWeight: 600, flexShrink: 0 }}>{avgLabel}</span>
        <div style={{ flex: 1, height: '12px', background: 'rgba(255,255,255,0.06)', borderRadius: '6px', overflow: 'hidden' }}>
          <div style={{ width: `${avgPct}%`, height: '100%', background: C.amber, borderRadius: '6px', transition: 'width 0.6s ease' }} />
        </div>
        <span style={{ width: '70px', fontSize: '13px', fontWeight: 700, color: C.amber, textAlign: 'right' }}>
          {avgValue}{suffix}
        </span>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════════════════
 *  COMPONENT
 * ═══════════════════════════════════════════════════════════════════════════ */

const RetailerInsightsDashboard = () => {
  const { user } = useAuth();

  const [period, setPeriod] = useState('30');

  /* Data */
  const [perf, setPerf] = useState(null);
  const [orders, setOrders] = useState(null);
  const [products, setProducts] = useState(null);
  const [feedback, setFeedback] = useState(null);

  /* Loading */
  const [lPerf, setLPerf] = useState(true);
  const [lOrders, setLOrders] = useState(true);
  const [lProducts, setLProducts] = useState(true);
  const [lFeedback, setLFeedback] = useState(true);

  const fetchAll = useCallback(async () => {
    setLPerf(true); setLOrders(true); setLProducts(true); setLFeedback(true);
    const qs = `?period=${period}d`;

    apiFetch(`/api/analytics/my-performance${qs}`).then((d) => { setPerf(d); setLPerf(false); });
    apiFetch(`/api/analytics/my-orders${qs}`).then((d) => { setOrders(d); setLOrders(false); });
    apiFetch(`/api/analytics/my-products${qs}`).then((d) => { setProducts(d); setLProducts(false); });
    apiFetch(`/api/analytics/my-feedback`).then((d) => { setFeedback(d); setLFeedback(false); });
  }, [period]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /* ── Chart 1: Multi-line — ordered vs fulfilled vs rejected by week ── */
  const ordersLineData = orders && orders.length > 0 ? {
    labels: orders.map((w) => w.week),
    datasets: [
      {
        label: 'Ordered',
        data: orders.map((w) => w.ordered),
        borderColor: C.accent,
        backgroundColor: 'rgba(59,130,246,0.08)',
        pointBackgroundColor: '#fff',
        pointBorderColor: C.accent,
        pointRadius: 4,
        tension: 0.35,
        fill: true,
      },
      {
        label: 'Fulfilled',
        data: orders.map((w) => w.fulfilled),
        borderColor: C.emerald,
        pointBackgroundColor: '#fff',
        pointBorderColor: C.emerald,
        pointRadius: 4,
        tension: 0.35,
      },
      {
        label: 'Rejected',
        data: orders.map((w) => w.rejected),
        borderColor: C.red,
        pointBackgroundColor: '#fff',
        pointBorderColor: C.red,
        pointRadius: 4,
        tension: 0.35,
      },
    ],
  } : null;

  /* ── Chart 2: Horizontal bar — top 5 products ── */
  const top5 = products ? products.slice(0, 5) : [];
  const productsBarData = {
    labels: top5.map((p) => p.productName),
    datasets: [{
      label: 'Units ordered',
      data: top5.map((p) => p.unitCount),
      backgroundColor: C.accent,
      borderRadius: 4,
      barThickness: 22,
    }],
  };
  const productsBarOpts = { ...CHART_DEFAULTS, indexAxis: 'y' };

  /* ── Chart 3: Doughnut — my feedback sentiment ── */
  const doughnutData = feedback && feedback.total > 0 ? {
    labels: [`Positive ${feedback.positivePct}%`, `Neutral ${feedback.neutralPct}%`, `Negative ${feedback.negativePct}%`],
    datasets: [{
      data: [feedback.positive, feedback.neutral, feedback.negative],
      backgroundColor: [C.green, C.amber, C.red],
      borderColor: C.card,
      borderWidth: 3,
      cutout: '60%',
    }],
  } : null;
  const doughnutOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'top', labels: { color: C.dim, font: { size: 12, weight: 600 }, padding: 14 } } },
  };

  /* Derived metric cards */
  const totalOrdered = orders ? orders.reduce((s, w) => s + w.ordered, 0) : 0;

  /* ═══════════════════════════════════════════════════════════════════════
   *  RENDER
   * ═══════════════════════════════════════════════════════════════════════ */
  return (
    <RetailerLayout>
      <div style={sty.page}>
        <h1 style={sty.h1}>Your Performance:</h1>
        <div style={sty.badge}>Retailer view</div>

        {/* Filter bar — period only */}
        <div style={sty.filterRow}>
          <div style={sty.filterGrp}>
            <div style={sty.label}>Period:</div>
            <select style={sty.select} value={period} onChange={(e) => setPeriod(e.target.value)}>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="all">All time</option>
            </select>
          </div>
        </div>

        {/* Metric cards */}
        {lPerf ? <Spinner /> : perf ? (
          <div style={sty.mg}>
            <div data-testid="metric-card" style={sty.mc}>
              <div style={sty.ml}>My orders placed</div>
              <div style={sty.mv}>{perf.myOrderVolume?.toLocaleString()}</div>
              <div style={{ ...sty.ms, color: C.dim }}>This period</div>
            </div>
            <div data-testid="metric-card" style={sty.mc}>
              <div style={sty.ml}>My fulfillment rate</div>
              <div style={sty.mv}>{perf.myFulfillmentRate}%</div>
              <div style={{
                ...sty.ms,
                color: perf.myOrderVolumePercentile >= 75 ? C.green : perf.myOrderVolumePercentile >= 50 ? C.amber : C.red,
              }}>
                Top {100 - perf.myOrderVolumePercentile}% of retailers
              </div>
            </div>
            <div data-testid="metric-card" style={sty.mc}>
              <div style={sty.ml}>My feedback score</div>
              <div style={sty.mv}>{perf.myFeedbackScore} / 10</div>
              <div style={{
                ...sty.ms,
                color: perf.myFeedbackScore >= 7 ? C.green : perf.myFeedbackScore >= 4 ? C.amber : C.red,
              }}>
                {perf.myFeedbackScore >= 7 ? 'Excellent' : perf.myFeedbackScore >= 4 ? 'Average' : 'Needs improvement'}
              </div>
            </div>
            <div data-testid="metric-card" style={sty.mc}>
              <div style={sty.ml}>My avg order value</div>
              <div style={sty.mv}>Rs {perf.myAvgOrderValue?.toLocaleString()}</div>
              <div style={{ ...sty.ms, color: C.dim }}>
                National avg: Rs {perf.nationalAvgOrderValue?.toLocaleString()}
              </div>
            </div>
          </div>
        ) : <NoData />}

        {/* Chart 1: Orders timeline (full width) */}
        <div style={sty.full}>
          <div style={sty.cc}>
            <div style={sty.ct}>Order history — ordered vs fulfilled vs rejected</div>
            {lOrders ? <Spinner /> : ordersLineData ? (
              <div style={{ height: '320px' }}>
                <Line aria-label="Order history — ordered vs fulfilled vs rejected Line Chart" data={ordersLineData} options={CHART_DEFAULTS} />
              </div>
            ) : <NoData />}
          </div>
        </div>

        {/* Row: Top products + Feedback sentiment */}
        <div style={sty.row}>
          <div style={sty.cc}>
            <div style={sty.ct}>My top 5 products</div>
            {lProducts ? <Spinner /> : top5.length > 0 ? (
              <div style={{ height: '280px' }}>
                <Bar aria-label="My top 5 products Bar Chart" data={productsBarData} options={productsBarOpts} />
              </div>
            ) : <NoData />}
          </div>

          <div style={sty.cc}>
            <div style={sty.ct}>My feedback sentiment</div>
            {lFeedback ? <Spinner /> : doughnutData ? (
              <div style={{ height: '280px' }}>
                <Doughnut aria-label="My feedback sentiment Doughnut Chart" data={doughnutData} options={doughnutOpts} />
              </div>
            ) : <NoData />}
          </div>
        </div>

        {/* Performance vs National Average — styled progress bars */}
        <div style={sty.full}>
          <div style={sty.cc}>
            <div style={sty.ct}>Performance vs national average</div>
            {lPerf ? <Spinner /> : perf ? (
              <div style={{ maxWidth: '700px' }}>
                <ProgressComparison
                  label="Fulfillment rate"
                  myValue={perf.myFulfillmentRate}
                  avgValue={perf.nationalAvgFulfillmentRate}
                  myLabel="You"
                  avgLabel="Avg"
                  max={100}
                  suffix="%"
                />
                <ProgressComparison
                  label="Feedback score"
                  myValue={perf.myFeedbackScore}
                  avgValue={perf.nationalAvgFeedbackScore}
                  myLabel="You"
                  avgLabel="Avg"
                  max={10}
                  suffix="/10"
                />
                <ProgressComparison
                  label="Order volume percentile"
                  myValue={perf.myOrderVolumePercentile}
                  avgValue={50}
                  myLabel="You"
                  avgLabel="Median"
                  max={100}
                  suffix="%"
                />
                <ProgressComparison
                  label="Average order value"
                  myValue={perf.myAvgOrderValue}
                  avgValue={perf.nationalAvgOrderValue}
                  myLabel="You"
                  avgLabel="Avg"
                  max={Math.max(perf.myAvgOrderValue, perf.nationalAvgOrderValue, 1) * 1.2}
                  suffix=""
                />
              </div>
            ) : <NoData />}
          </div>
        </div>
      </div>
    </RetailerLayout>
  );
};

export default RetailerInsightsDashboard;
