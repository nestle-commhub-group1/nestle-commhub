/**
 * DemandForecastChart.jsx
 *
 * 4-week demand forecast chart using Chart.js (canvas-based).
 * Falls back gracefully when chart.js is not loaded or data is empty.
 *
 * Props:
 *   weeks         {Array}   — [{ week, predicted }]
 *   trend         {string}  — 'INCREASING' | 'DECREASING' | 'STABLE'
 *   confidence    {number}  — 0-1
 *   peakDemandDay {string}  — 'MONDAY' etc.
 *   productName   {string}
 *   currentStock  {number}
 *   loading       {bool}
 */

import React, { useEffect, useRef } from 'react';
import { TrendingUp, TrendingDown, Minus, Loader2 } from 'lucide-react';

const TREND_CFG = {
  INCREASING: { color: '#22C55E', icon: TrendingUp,   label: 'Growing Demand' },
  DECREASING: { color: '#EF4444', icon: TrendingDown, label: 'Declining Demand' },
  STABLE:     { color: '#3B82F6', icon: Minus,         label: 'Stable Demand' },
};

export default function DemandForecastChart({
  weeks         = [],
  trend         = 'STABLE',
  confidence    = 0.8,
  peakDemandDay = 'MONDAY',
  productName   = '',
  currentStock  = 0,
  loading       = false,
}) {
  const canvasRef = useRef(null);
  const chartRef  = useRef(null);

  const cfg = TREND_CFG[trend] || TREND_CFG.STABLE;
  const TrendIcon = cfg.icon;

  useEffect(() => {
    if (!weeks.length || loading) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Destroy previous chart instance
    if (chartRef.current) {
      chartRef.current.destroy();
      chartRef.current = null;
    }

    // Lazy-load Chart.js from the module (it's already installed)
    import('chart.js/auto').then(({ default: Chart }) => {
      const ctx = canvas.getContext('2d');
      const labels = weeks.map(w => `Week ${w.week}`);
      const data   = weeks.map(w => w.predicted);

      // Add current stock as a baseline reference
      const stockLine = weeks.map(() => currentStock);

      chartRef.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label:           'Predicted Demand (units)',
              data,
              borderColor:     cfg.color,
              backgroundColor: cfg.color + '22', // 14% alpha
              borderWidth:     3,
              pointRadius:     6,
              pointBackgroundColor: cfg.color,
              pointBorderColor: '#fff',
              pointBorderWidth: 2,
              fill:            true,
              tension:         0.35,
            },
            {
              label:           'Current Stock',
              data:            stockLine,
              borderColor:     '#94A3B8',
              borderWidth:     2,
              borderDash:      [6, 4],
              pointRadius:     0,
              fill:            false,
              tension:         0,
            },
          ],
        },
        options: {
          responsive:          true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
              labels:   { font: { family: "'Inter', sans-serif", weight: 'bold', size: 12 }, color: '#374151' },
            },
            tooltip: {
              callbacks: {
                label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y.toLocaleString()} units`,
              },
            },
          },
          scales: {
            x: {
              grid:  { color: '#F1F5F9' },
              ticks: { font: { weight: '700', size: 12 }, color: '#6B7280' },
            },
            y: {
              grid:  { color: '#F1F5F9' },
              ticks: {
                font:     { weight: '700', size: 12 },
                color:    '#6B7280',
                callback: v => v.toLocaleString(),
              },
              beginAtZero: false,
            },
          },
        },
      });
    }).catch(e => console.error('[DemandForecastChart] Chart.js load error:', e));

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [weeks, trend, currentStock, loading]);

  return (
    <div className="bg-white rounded-[20px] border border-[#E0DBD5] shadow-sm p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-[16px] font-black text-[#2C1810] flex items-center space-x-2">
            <span>📈</span>
            <span>4-Week Demand Forecast</span>
            {productName && (
              <span className="text-[13px] text-gray-400 font-semibold">— {productName}</span>
            )}
          </h3>
          <p className="text-[12px] text-gray-400 mt-0.5 font-medium">
            Based on historical order data and seasonal trends
          </p>
        </div>

        {/* Trend badge */}
        <div
          className="flex items-center space-x-2 px-3 py-1.5 rounded-full text-[12px] font-black border"
          style={{ color: cfg.color, borderColor: cfg.color + '44', background: cfg.color + '11' }}
        >
          <TrendIcon size={14} />
          <span>{cfg.label}</span>
        </div>
      </div>

      {/* Meta badges */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: 'Confidence',     value: `${Math.round(confidence * 100)}%`,     color: '#3B82F6' },
          { label: 'Peak Demand',    value: peakDemandDay.charAt(0) + peakDemandDay.slice(1).toLowerCase(), color: '#F59E0B' },
          { label: 'Current Stock',  value: `${currentStock.toLocaleString()} units`, color: '#8B5CF6' },
        ].map(b => (
          <div
            key={b.label}
            className="flex items-center space-x-1.5 px-3 py-1 rounded-full border text-[11px] font-black"
            style={{ borderColor: b.color + '44', background: b.color + '11', color: b.color }}
          >
            <span>{b.label}:</span>
            <span>{b.value}</span>
          </div>
        ))}
      </div>

      {/* Chart area */}
      {loading ? (
        <div className="flex items-center justify-center h-48 text-gray-400">
          <Loader2 size={22} className="animate-spin" />
        </div>
      ) : weeks.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-gray-400 flex-col space-y-2">
          <span className="text-3xl">📊</span>
          <p className="text-[13px] font-semibold">No forecast data available</p>
          <p className="text-[11px]">Select a product to view its demand forecast</p>
        </div>
      ) : (
        <div className="relative h-56">
          <canvas ref={canvasRef} />
        </div>
      )}

      {/* Week-by-week summary row */}
      {!loading && weeks.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {weeks.map((w, i) => {
            const prev    = i > 0 ? weeks[i - 1].predicted : w.predicted;
            const delta   = i > 0 ? Math.round(((w.predicted - prev) / prev) * 100) : 0;
            const isUp    = delta > 0;
            return (
              <div key={w.week} className="bg-[#FAFAF9] rounded-[12px] p-3 text-center border border-[#F0EDE8]">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                  Week {w.week}
                </p>
                <p className="text-[15px] font-black text-[#2C1810]">
                  {w.predicted.toLocaleString()}
                </p>
                {i > 0 && (
                  <p className={`text-[10px] font-black mt-0.5 ${isUp ? 'text-green-600' : 'text-red-500'}`}>
                    {isUp ? '↑' : '↓'} {Math.abs(delta)}%
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
