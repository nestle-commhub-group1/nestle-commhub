import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, TrendingUp, BarChart3, Star, Package } from 'lucide-react';
import PromotionManagerLayout from '../../components/layout/PromotionManagerLayout';
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
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

/* ═══════════════════════════════════════════════════════════════════════════
 *  Styles — dark dashboard theme matching the mockup screenshots
 * ═══════════════════════════════════════════════════════════════════════════ */

const COLORS = {
  bg: '#1a1f2e',
  card: '#232a3b',
  cardBorder: '#2e3650',
  text: '#e2e8f0',
  textDim: '#94a3b8',
  accent: '#3b82f6',
  green: '#22c55e',
  emerald: '#10b981',
  orange: '#f59e0b',
  red: '#ef4444',
  purple: '#a855f7',
  lime: '#84cc16',
  chartBars: ['#3b82f6', '#10b981', '#d97706', '#a855f7', '#84cc16', '#ef4444', '#06b6d4', '#f472b6', '#eab308', '#6366f1', '#14b8a6', '#e11d48'],
};

const styles = {
  page: {
    background: COLORS.bg,
    minHeight: '100vh',
    padding: '32px',
    color: COLORS.text,
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
  },
  header: {
    marginBottom: '8px',
    fontSize: '26px',
    fontWeight: '800',
    letterSpacing: '-0.02em',
  },
  badge: {
    display: 'inline-block',
    background: 'rgba(59,130,246,0.15)',
    color: '#60a5fa',
    fontWeight: 700,
    fontSize: '12px',
    padding: '4px 14px',
    borderRadius: '20px',
    marginBottom: '24px',
  },
  filterRow: {
    display: 'flex',
    gap: '16px',
    marginBottom: '24px',
    flexWrap: 'wrap',
  },
  filterGroup: { flex: '1', minWidth: '200px' },
  filterLabel: { fontSize: '12px', color: COLORS.textDim, fontWeight: 600, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' },
  select: {
    width: '100%',
    padding: '12px 16px',
    background: COLORS.card,
    border: `1px solid ${COLORS.cardBorder}`,
    borderRadius: '10px',
    color: COLORS.text,
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 16px center',
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '28px',
  },
  metricCard: {
    background: COLORS.card,
    border: `1px solid ${COLORS.cardBorder}`,
    borderRadius: '14px',
    padding: '20px 24px',
  },
  metricLabel: { fontSize: '13px', color: COLORS.textDim, fontWeight: 600, marginBottom: '6px' },
  metricValue: { fontSize: '32px', fontWeight: 800, lineHeight: 1.1, marginBottom: '4px' },
  metricSub: { fontSize: '12px', fontWeight: 600 },
  chartsGrid: { display: 'grid', gridTemplateColumns: '1fr', gap: '24px', marginBottom: '24px' },
  chartsRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginBottom: '24px' },
  chartCard: {
    background: COLORS.card,
    border: `1px solid ${COLORS.cardBorder}`,
    borderRadius: '16px',
    padding: '24px',
  },
  chartTitle: { fontSize: '16px', fontWeight: 700, marginBottom: '16px' },
  spinner: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px', color: COLORS.textDim },
  noData: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px', color: COLORS.textDim, fontWeight: 600, fontSize: '14px' },
};

/* ═══════════════════════════════════════════════════════════════════════════
 *  Helper: fetch wrapper
 * ═══════════════════════════════════════════════════════════════════════════ */

async function apiFetch(path) {
  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json.data ?? null;
}

/* ═══════════════════════════════════════════════════════════════════════════
 *  Chart defaults
 * ═══════════════════════════════════════════════════════════════════════════ */

const CHART_DEFAULTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { labels: { color: COLORS.textDim, font: { size: 12, weight: 600 }, padding: 16 } },
  },
  scales: {
    x: { ticks: { color: COLORS.textDim, font: { size: 11 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
    y: { ticks: { color: COLORS.textDim, font: { size: 11 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
  },
};

/* ═══════════════════════════════════════════════════════════════════════════
 *  Spinner + NoData
 * ═══════════════════════════════════════════════════════════════════════════ */

const Spinner = () => (
  <div style={styles.spinner}>
    <Loader2 size={28} style={{ animation: 'spin 1s linear infinite' }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

const NoData = () => <div style={styles.noData}>No data available</div>;

/* ═══════════════════════════════════════════════════════════════════════════
 *  COMPONENT
 * ═══════════════════════════════════════════════════════════════════════════ */

const PMInsightsDashboard = () => {
  const { user } = useAuth();

  /* ── Filters ────────────────────────────────────────────────────────── */
  const [period, setPeriod] = useState('30');
  const [promoFilter, setPromoFilter] = useState('all');

  /* ── Data buckets ───────────────────────────────────────────────────── */
  const [summary, setSummary] = useState(null);
  const [promotions, setPromotions] = useState(null);
  const [conversions, setConversions] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [stock, setStock] = useState(null);

  /* ── Loading flags ──────────────────────────────────────────────────── */
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingPromotions, setLoadingPromotions] = useState(true);
  const [loadingConversions, setLoadingConversions] = useState(true);
  const [loadingFeedback, setLoadingFeedback] = useState(true);
  const [loadingStock, setLoadingStock] = useState(true);

  /* ── Fetch all data ─────────────────────────────────────────────────── */
  const fetchAll = useCallback(async () => {
    setLoadingSummary(true);
    setLoadingPromotions(true);
    setLoadingConversions(true);
    setLoadingFeedback(true);
    setLoadingStock(true);

    const qs = `?period=${period}d`;

    apiFetch(`/api/analytics/summary${qs}`).then((d) => { setSummary(d); setLoadingSummary(false); });
    apiFetch(`/api/analytics/promotions`).then((d) => { setPromotions(d); setLoadingPromotions(false); });
    apiFetch(`/api/analytics/conversions${qs}`).then((d) => { setConversions(d); setLoadingConversions(false); });
    apiFetch(`/api/analytics/feedback`).then((d) => { setFeedback(d); setLoadingFeedback(false); });
    apiFetch(`/api/analytics/stock${qs}`).then((d) => { setStock(d); setLoadingStock(false); });
  }, [period]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  /* ── Filtered promotions ────────────────────────────────────────────── */
  const filteredPromos = promotions
    ? promoFilter === 'all'
      ? promotions
      : promotions.filter((p) => p.promotionId === promoFilter)
    : [];

  /* ═══════════════════════════════════════════════════════════════════════
   *  CHART DATA BUILDERS
   * ═══════════════════════════════════════════════════════════════════════ */

  // 1. Vertical bar — units sold per campaign
  const unitsSoldChartData = {
    labels: filteredPromos.map((p) => p.title),
    datasets: [
      {
        label: 'Units Sold',
        data: filteredPromos.map((p) => p.totalUnitsSold),
        backgroundColor: filteredPromos.map((_, i) => COLORS.chartBars[i % COLORS.chartBars.length]),
        borderRadius: 6,
        barThickness: 48,
      },
    ],
  };

  // 2. Horizontal bar — conversion rate per promotion
  const conversionLabels = conversions ? conversions.map((c) => c.promotionName) : [];
  const conversionChartData = {
    labels: conversionLabels,
    datasets: [
      {
        label: 'Conversion %',
        data: conversions ? conversions.map((c) => c.conversionRate) : [],
        backgroundColor: COLORS.accent,
        borderRadius: 4,
        barThickness: 20,
      },
    ],
  };
  const conversionOpts = {
    ...CHART_DEFAULTS,
    indexAxis: 'y',
    scales: {
      ...CHART_DEFAULTS.scales,
      x: { ...CHART_DEFAULTS.scales.x, max: 100, ticks: { ...CHART_DEFAULTS.scales.x.ticks, callback: (v) => `${v}%` } },
    },
  };

  // 3. Doughnut — feedback sentiment
  const doughnutData = feedback
    ? {
        labels: [`Positive ${feedback.positivePct}%`, `Neutral ${feedback.neutralPct}%`, `Negative ${feedback.negativePct}%`],
        datasets: [
          {
            data: [feedback.positive, feedback.neutral, feedback.negative],
            backgroundColor: [COLORS.green, COLORS.orange, COLORS.red],
            borderColor: COLORS.card,
            borderWidth: 3,
            cutout: '60%',
          },
        ],
      }
    : null;
  const doughnutOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { color: COLORS.textDim, font: { size: 12, weight: 600 }, padding: 14 } },
    },
  };

  // 4. Line chart — stock request trend
  const stockChartData = stock
    ? {
        labels: stock.map((s) => s.day),
        datasets: [
          {
            label: 'Requests',
            data: stock.map((s) => s.totalUnits),
            borderColor: COLORS.accent,
            backgroundColor: 'rgba(59,130,246,0.10)',
            pointBackgroundColor: '#fff',
            pointBorderColor: COLORS.accent,
            pointRadius: 5,
            pointHoverRadius: 7,
            tension: 0.4,
            fill: true,
          },
        ],
      }
    : null;

  // 5. Stacked bar — fulfilled vs rejected per promotion
  const fulfillmentChartData = conversions
    ? {
        labels: conversions.map((c) => c.promotionName),
        datasets: [
          {
            label: 'Fulfilled',
            data: conversions.map((c) => c.fulfillmentRate),
            backgroundColor: COLORS.emerald,
            borderRadius: 3,
          },
          {
            label: 'Rejected',
            data: conversions.map((c) => parseFloat((100 - c.fulfillmentRate).toFixed(1))),
            backgroundColor: COLORS.red,
            borderRadius: 3,
          },
        ],
      }
    : null;
  const fulfillmentOpts = {
    ...CHART_DEFAULTS,
    scales: {
      ...CHART_DEFAULTS.scales,
      x: { ...CHART_DEFAULTS.scales.x, stacked: true, ticks: { ...CHART_DEFAULTS.scales.x.ticks, maxRotation: 45 } },
      y: { ...CHART_DEFAULTS.scales.y, stacked: true, max: 100, ticks: { ...CHART_DEFAULTS.scales.y.ticks, callback: (v) => `${v}%` } },
    },
  };

  /* ═══════════════════════════════════════════════════════════════════════
   *  RENDER
   * ═══════════════════════════════════════════════════════════════════════ */

  return (
    <PromotionManagerLayout>
      <div style={styles.page}>
        {/* Header */}
        <h1 style={styles.header}>PM Dashboard:</h1>
        <div style={styles.badge}>Product Manager view</div>

        {/* Filter bar */}
        <div style={styles.filterRow}>
          <div style={styles.filterGroup}>
            <div style={styles.filterLabel}>Period:</div>
            <select style={styles.select} value={period} onChange={(e) => setPeriod(e.target.value)}>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="all">All time</option>
            </select>
          </div>
          <div style={styles.filterGroup}>
            <div style={styles.filterLabel}>Promotion:</div>
            <select style={styles.select} value={promoFilter} onChange={(e) => setPromoFilter(e.target.value)}>
              <option value="all">All promotions</option>
              {(promotions || []).map((p) => (
                <option key={p.promotionId} value={p.promotionId}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Metric cards */}
        {loadingSummary ? (
          <Spinner />
        ) : summary ? (
          <div style={styles.metricsGrid}>
            <div data-testid="metric-card" style={styles.metricCard}>
              <div style={styles.metricLabel}>Active promotions</div>
              <div style={styles.metricValue}>{summary.activePromotions}</div>
              <div style={{ ...styles.metricSub, color: COLORS.textDim }}>{summary.endingSoon} ending this week</div>
            </div>
            <div data-testid="metric-card" style={styles.metricCard}>
              <div style={styles.metricLabel}>Total units sold</div>
              <div style={styles.metricValue}>{summary.totalUnitsSold?.toLocaleString()}</div>
              <div style={{ ...styles.metricSub, color: COLORS.textDim }}>via promotions</div>
            </div>
            <div data-testid="metric-card" style={styles.metricCard}>
              <div style={styles.metricLabel}>Avg conversion rate</div>
              <div style={styles.metricValue}>{summary.avgConversionRate}%</div>
              <div style={{ ...styles.metricSub, color: COLORS.green }}>{summary.conversionDelta} vs last period</div>
            </div>
            <div data-testid="metric-card" style={styles.metricCard}>
              <div style={styles.metricLabel}>Avg feedback rating</div>
              <div style={styles.metricValue}>{summary.avgFeedbackRating} / 10</div>
              <div style={{ ...styles.metricSub, color: COLORS.textDim }}>{summary.totalReviews} total reviews</div>
            </div>
          </div>
        ) : (
          <NoData />
        )}

        {/* Chart 1: Promotion performance — units sold (full width) */}
        <div style={styles.chartsGrid}>
          <div style={styles.chartCard}>
            <div style={styles.chartTitle}>Promotion performance — units sold per campaign</div>
            {loadingPromotions ? (
              <Spinner />
            ) : filteredPromos.length > 0 ? (
              <div style={{ height: '320px' }}>
                <Bar
                  aria-label="Promotion performance — units sold per campaign Bar Chart"
                  data={unitsSoldChartData}
                  options={{
                    ...CHART_DEFAULTS,
                    plugins: {
                      ...CHART_DEFAULTS.plugins,
                      legend: {
                        position: 'top',
                        labels: {
                          color: COLORS.textDim,
                          font: { size: 12, weight: 600 },
                          padding: 14,
                          generateLabels: () =>
                            filteredPromos.map((p, i) => ({
                              text: `${p.title} ${p.totalUnitsSold}`,
                              fillStyle: COLORS.chartBars[i % COLORS.chartBars.length],
                              strokeStyle: 'transparent',
                            })),
                        },
                      },
                    },
                  }}
                />
              </div>
            ) : (
              <NoData />
            )}
          </div>
        </div>

        {/* Row: Conversion rate + Feedback sentiment */}
        <div style={styles.chartsRow}>
          <div style={styles.chartCard}>
            <div style={styles.chartTitle}>Conversion rate by promotion</div>
            {loadingConversions ? (
              <Spinner />
            ) : conversions && conversions.length > 0 ? (
              <div style={{ height: '300px' }}>
                <Bar aria-label="Conversion rate by promotion Bar Chart" data={conversionChartData} options={conversionOpts} />
              </div>
            ) : (
              <NoData />
            )}
          </div>

          <div style={styles.chartCard}>
            <div style={styles.chartTitle}>Feedback sentiment — all promotions</div>
            {loadingFeedback ? (
              <Spinner />
            ) : doughnutData ? (
              <div style={{ height: '300px' }}>
                <Doughnut aria-label="Feedback sentiment — all promotions Doughnut Chart" data={doughnutData} options={doughnutOpts} />
              </div>
            ) : (
              <NoData />
            )}
          </div>
        </div>

        {/* Row: Stock trend + Fulfillment stacked */}
        <div style={styles.chartsRow}>
          <div style={styles.chartCard}>
            <div style={styles.chartTitle}>Stock request trend — promoted products</div>
            {loadingStock ? (
              <Spinner />
            ) : stockChartData ? (
              <div style={{ height: '300px' }}>
                <Line aria-label="Stock request trend Line Chart" data={stockChartData} options={CHART_DEFAULTS} />
              </div>
            ) : (
              <NoData />
            )}
          </div>

          <div style={styles.chartCard}>
            <div style={styles.chartTitle}>Order fulfillment rate by promotion</div>
            {loadingConversions ? (
              <Spinner />
            ) : fulfillmentChartData ? (
              <div style={{ height: '300px' }}>
                <Bar aria-label="Order fulfillment rate by promotion Bar Chart" data={fulfillmentChartData} options={fulfillmentOpts} />
              </div>
            ) : (
              <NoData />
            )}
          </div>
        </div>
      </div>
    </PromotionManagerLayout>
  );
};

export default PMInsightsDashboard;
