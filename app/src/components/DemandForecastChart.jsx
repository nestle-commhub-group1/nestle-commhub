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
  rationale     = '',
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
      const labels = weeks.map(w => w.label);
      const unitsData = weeks.map(w => w.predictedUnits);
      const valueData = weeks.map(w => w.predictedValueLKR);

      chartRef.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label:           'Predicted Units',
              data:            unitsData,
              borderColor:     cfg.color,
              backgroundColor: cfg.color + '22',
              borderWidth:     3,
              pointRadius:     6,
              pointBackgroundColor: cfg.color,
              pointBorderColor: '#fff',
              pointBorderWidth: 2,
              fill:            true,
              tension:         0.35,
              yAxisID:         'y',
            },
            {
              label:           'Current Stock',
              data:            weeks.map(() => currentStock),
              borderColor:     '#94A3B8',
              borderWidth:     2,
              borderDash:      [6, 4],
              pointRadius:     0,
              fill:            false,
              tension:         0,
              yAxisID:         'y',
            },
          ],
        },
        options: {
          responsive:          true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
              labels:   { font: { family: "'Inter', sans-serif", weight: 'bold', size: 11 }, color: '#374151' },
            },
            tooltip: {
              backgroundColor: '#1E293B',
              padding: 12,
              cornerRadius: 12,
              callbacks: {
                label: (ctx) => {
                  const w = weeks[ctx.dataIndex];
                  if (ctx.dataset.label === 'Predicted Units') {
                    return [
                      ` Predicted Demand: ${w.predictedUnits.toLocaleString()} units`,
                      ` Estimated Value: LKR ${w.predictedValueLKR.toLocaleString()}`
                    ];
                  }
                  return ` ${ctx.dataset.label}: ${ctx.parsed.y.toLocaleString()} units`;
                }
              }
            },
          },
          scales: {
            x: {
              grid:  { display: false },
              ticks: { font: { weight: '700', size: 11 }, color: '#6B7280' },
            },
            y: {
              grid:  { color: '#F1F5F9' },
              ticks: {
                font:     { weight: '700', size: 11 },
                color:    '#6B7280',
                callback: v => v.toLocaleString(),
              },
              beginAtZero: true,
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
    <div className="bg-white rounded-[20px] border border-[#E0DBD5] shadow-sm p-6 space-y-5 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-[16px] font-black text-[#2C1810] flex items-center space-x-2">
            <TrendingUp size={20} className="text-orange-600" />
            <span>4-Week Demand Forecast</span>
            {productName && (
              <span className="text-[13px] text-gray-400 font-semibold">— {productName}</span>
            )}
          </h3>
          <p className="text-[12px] text-gray-400 mt-0.5 font-medium">
            Projected volume and market value based on current trends
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

      {/* Rationale Alert */}
      {rationale && (
        <div className="bg-[#FAFAF9] border border-[#F0EDE8] p-3 rounded-xl flex items-start space-x-3">
          <div className="p-1.5 bg-white rounded-lg border border-[#E0DBD5] mt-0.5 shrink-0">
             <TrendingUp size={14} className="text-[#8B5E3C]" />
          </div>
          <p className="text-[12px] text-[#4A3728] font-bold leading-relaxed">
            {rationale}
          </p>
        </div>
      )}

      {/* Meta badges */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: 'Confidence',     value: `${Math.round(confidence * 100)}%`,     color: '#3B82F6' },
          { label: 'Peak Day',       value: peakDemandDay.charAt(0) + peakDemandDay.slice(1).toLowerCase(), color: '#F59E0B' },
          { label: 'Current Stock',  value: `${currentStock.toLocaleString()} units`, color: '#8B5CF6' },
        ].map(b => (
          <div
            key={b.label}
            className="flex items-center space-x-1.5 px-3 py-1 rounded-full border text-[11px] font-black shadow-sm"
            style={{ borderColor: b.color + '22', background: b.color + '08', color: b.color }}
          >
            <span className="opacity-60">{b.label}:</span>
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
        </div>
      ) : (
        <div className="relative h-60">
          <canvas ref={canvasRef} />
        </div>
      )}

      {/* Week-by-week summary row */}
      {!loading && weeks.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {weeks.map((w, i) => {
            const prev    = i > 0 ? weeks[i - 1].predictedUnits : w.predictedUnits;
            const delta   = i > 0 ? Math.round(((w.predictedUnits - prev) / prev) * 100) : 0;
            const isUp    = delta > 0;
            return (
              <div key={w.week} className="bg-[#FAFAF9] rounded-[16px] p-4 border border-[#F0EDE8] hover:border-orange-200 transition-colors group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-8 h-8 bg-orange-100 rounded-bl-full opacity-0 group-hover:opacity-40 transition-opacity"></div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">
                  {w.label.split(' - ')[0]}
                </p>
                <div className="space-y-0.5">
                  <p className="text-[18px] font-black text-[#2C1810]">
                    {w.predictedUnits.toLocaleString()} <span className="text-[10px] font-bold text-gray-400">units</span>
                  </p>
                  <p className="text-[11px] font-black text-orange-700">
                    LKR {w.predictedValueLKR.toLocaleString()}
                  </p>
                </div>
                {i > 0 && (
                  <div className={`inline-flex items-center mt-2 px-2 py-0.5 rounded-md text-[10px] font-black ${isUp ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                    {isUp ? '↑' : '↓'} {Math.abs(delta)}%
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
