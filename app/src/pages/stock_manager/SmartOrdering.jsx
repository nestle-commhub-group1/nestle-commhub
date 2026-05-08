/**
 * SmartOrdering.jsx
 *
 * Smart Stock Management page for Stock Manager.
 *
 * Layout:
 *   ┌─────────────────────────────────────┐
 *   │ Smart Insight Cards (3)             │
 *   ├─────────────────────────────────────┤
 *   │ 🚀 Top Demand Products Table        │
 *   │    with Quick Order + HOW buttons   │
 *   ├─────────────────────────────────────┤
 *   │ 📈 4-Week Demand Forecast Chart     │
 *   ├─────────────────────────────────────┤
 *   │ 🎯 Seasonal Forecast Cards          │
 *   └─────────────────────────────────────┘
 */

import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, TrendingUp, AlertTriangle, Flame, Loader2 } from 'lucide-react';
import StockManagerLayout    from '../../components/layout/StockManagerLayout';
import DemandForecastChart   from '../../components/DemandForecastChart';
import API_URL from '../../config/api';

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function ScoreBadge({ score }) {
  const cfg =
    score >= 8 ? { cls: 'bg-green-100 text-green-700 border-green-200',  label: 'Excellent' } :
    score >= 6 ? { cls: 'bg-blue-100 text-blue-700 border-blue-200',     label: 'Good'      } :
    score >= 4 ? { cls: 'bg-amber-100 text-amber-700 border-amber-200',  label: 'Fair'      } :
                 { cls: 'bg-gray-100 text-gray-500 border-gray-200',     label: 'Low'       };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${cfg.cls}`}>
      {score?.toFixed(1)} — {cfg.label}
    </span>
  );
}

function RiskBadge({ risk }) {
  const map = {
    HIGH:   'bg-red-100 text-red-700',
    MEDIUM: 'bg-amber-100 text-amber-700',
    LOW:    'bg-green-100 text-green-700',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${map[risk] || map.LOW}`}>
      {risk}
    </span>
  );
}

function InsightCard({ icon, title, color, body, cta }) {
  return (
    <div
      className="bg-white rounded-[18px] border shadow-sm p-5 space-y-2 hover:shadow-md transition-shadow"
      style={{ borderLeft: `3px solid ${color}` }}
    >
      <div className="flex items-center space-x-2">
        <span className="text-xl">{icon}</span>
        <p className="text-[12px] font-black text-gray-400 uppercase tracking-widest">{title}</p>
      </div>
      <p className="text-[13px] text-[#2C1810] font-semibold leading-relaxed">{body}</p>
      {cta && <p className="text-[12px] font-black italic" style={{ color }}>{cta}</p>}
    </div>
  );
}

/* ─── SmartOrdering ─────────────────────────────────────────────────────── */

export default function SmartOrdering() {
  const [recommendations, setRecommendations] = useState([]);
  const [recLoading,      setRecLoading]      = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [forecast,        setForecast]        = useState(null);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [toast,           setToast]           = useState('');
  const [howLoading,      setHowLoading]      = useState({});

  const token   = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  /* ── Fetch top demand products ── */
  const fetchRecommendations = useCallback(async () => {
    setRecLoading(true);
    try {
      const res  = await fetch(`${API_URL}/api/stock/smart-recommendations?t=${Date.now()}`, { headers, cache: 'no-store' });
      const json = await res.json();
      const data = (json.data || []).filter(p => p.demandScore >= 0);
      setRecommendations(data);

      if (data.length > 0 && !selectedProduct) {
        loadForecast(data[0]);
      }
    } catch {
      setRecommendations([]);
    } finally {
      setRecLoading(false);
    }
  }, [selectedProduct]);

  /* ── Load forecast for a product ── */
  const loadForecast = useCallback(async (product) => {
    setSelectedProduct(product);
    setForecastLoading(true);
    try {
      const forecastRes = await fetch(`${API_URL}/api/stock/predict-demand/${product.productId}`, { headers });
      const fc = await forecastRes.json();
      setForecast(fc);
    } catch {
      setForecast(null);
    } finally {
      setForecastLoading(false);
    }
  }, []);

  useEffect(() => { fetchRecommendations(); }, [fetchRecommendations]);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  }

  /* ── Toggle HOW status ── */
  const toggleHOW = async (product) => {
    const isCurrentlyHOW = !!(product.howStatus?.isHOW);
    const endpoint = isCurrentlyHOW ? 'unmark-as-how' : 'mark-as-how';
    
    setHowLoading(prev => ({ ...prev, [product.productId]: true }));
    try {
      const res = await fetch(`${API_URL}/api/stock/${endpoint}`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.productId }),
        cache: 'no-store'
      });
      const data = await res.json();
      if (data.success) {
        showToast(isCurrentlyHOW ? `Stopped promotion for ${product.name}` : `Promoted ${product.name} to Retailers!`);
        fetchRecommendations();
      }
    } catch {
      showToast("Failed to update status");
    } finally {
      setHowLoading(prev => ({ ...prev, [product.productId]: false }));
    }
  };

  const insights = [];
  if (recommendations.length > 0) {
    const critStock = recommendations.find(r => r.fulfillmentRisk === 'HIGH');
    if (critStock) {
      insights.push({
        icon: '🚨', title: 'Critical Stock Alert', color: '#EF4444',
        body:  `${critStock.name} at ${critStock.currentStock} units.`,
        cta:   `Check replenishment levels`,
      });
    }

    const growing = recommendations.find(r => r.growthTrend > 0.2);
    if (growing) {
      insights.push({
        icon: '📈', title: 'Seasonal Trend', color: '#F59E0B',
        body:  `${growing.name} demand is growing ${(growing.growthTrend * 100).toFixed(0)}% vs prior period.`,
      });
    }

    if (insights.length === 0) {
      insights.push({
        icon: '✅', title: 'Stock Health', color: '#22C55E',
        body: 'All products are within acceptable stock levels.',
      });
    }
  }

  const seasons = forecast ? [
    { name: 'Summer',  key: 'SUMMER',  emoji: '☀️',  mult: 1.4 },
    { name: 'Monsoon', key: 'MONSOON', emoji: '🌧️', mult: 0.8 },
    { name: 'Winter',  key: 'WINTER',  emoji: '❄️',  mult: 1.1 },
    { name: 'Spring',  key: 'SPRING',  emoji: '🌸',  mult: 1.0 },
  ] : [];

  return (
    <StockManagerLayout>
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#2C1810] text-white px-5 py-3 rounded-[14px] shadow-xl text-[13px] font-bold whitespace-nowrap">
          {toast}
        </div>
      )}

      <div className="space-y-8 pb-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-[26px] font-black text-[#2C1810] flex items-center space-x-2">
              <span>Smart Stock Management</span>
            </h1>
            <p className="text-[13px] text-gray-500 mt-1 font-medium">
              Predictive demand analytics and item promotion
            </p>
          </div>
          <button
            onClick={fetchRecommendations}
            disabled={recLoading}
            className="flex items-center space-x-2 px-4 py-2.5 bg-white border border-[#E0DBD5] rounded-[12px] text-[13px] font-bold text-[#3D2B1F] hover:bg-[#F8F7F5] transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={recLoading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>

        {insights.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {insights.map((c, i) => <InsightCard key={i} {...c} />)}
          </div>
        )}

        <section>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <span className="text-xl">🚀</span>
              <h2 className="text-[16px] font-black text-[#2C1810] uppercase tracking-widest">
                Top Demand Products
              </h2>
            </div>
          </div>

          <div className="bg-white rounded-[20px] border border-[#E0DBD5] shadow-sm overflow-hidden">
            {recLoading ? (
              <div className="flex justify-center items-center min-h-[200px] text-gray-400">
                <Loader2 size={24} className="animate-spin" />
              </div>
            ) : (
              <>
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#F8F7F5]">
                      <tr>
                        {['#', 'Product', 'Category', 'Stock', 'Demand Score', 'Avg/Week', 'Risk', 'Actions'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0EDE8]">
                      {recommendations.map((p, idx) => (
                        <tr
                          key={p.productId}
                          className={`hover:bg-[#FAFAF9] transition-colors ${selectedProduct?.productId?.toString() === p.productId?.toString() ? 'bg-amber-50/50' : ''}`}
                          onClick={() => loadForecast(p)}
                        >
                          <td className="px-4 py-3.5 text-[13px] font-black text-gray-400">{idx + 1}</td>
                          <td className="px-4 py-3.5"><p className="font-black text-[14px] text-[#2C1810]">{p.name}</p></td>
                          <td className="px-4 py-3.5 text-[12px] font-semibold text-gray-500 capitalize">{p.category}</td>
                          <td className="px-4 py-3.5 font-black text-[14px]">{p.currentStock.toLocaleString()}</td>
                          <td className="px-4 py-3.5"><ScoreBadge score={p.demandScore} /></td>
                          <td className="px-4 py-3.5 text-[13px] font-black text-[#2C1810]">{p.avgRequestsPerWeek.toFixed(0)}</td>
                          <td className="px-4 py-3.5"><RiskBadge risk={p.fulfillmentRisk} /></td>
                          <td className="px-4 py-3.5">
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleHOW(p); }}
                              disabled={howLoading[p.productId]}
                              className={`p-2.5 rounded-[12px] border transition-all shadow-sm flex items-center justify-center ${
                                (p.howStatus ?? { isHOW: false }).isHOW
                                  ? 'bg-orange-600 border-orange-700 text-white' 
                                  : 'bg-white border-[#E0DBD5] text-gray-500 hover:text-orange-600 hover:border-orange-200'
                              }`}
                              title={(p.howStatus ?? { isHOW: false }).isHOW ? 'Remove Promotion' : 'Promote to Retailers'}
                            >
                              {howLoading[p.productId] ? <Loader2 size={16} className="animate-spin" /> : <Flame size={16} fill={(p.howStatus ?? { isHOW: false }).isHOW ? 'currentColor' : 'none'} />}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="lg:hidden divide-y divide-[#F0EDE8]">
                  {recommendations.map((p) => (
                    <div key={p.productId} className="p-4 space-y-3" onClick={() => loadForecast(p)}>
                      <p className="font-black text-[14px]">{p.name}</p>
                      <button
                        onClick={e => { e.stopPropagation(); toggleHOW(p); }}
                        disabled={howLoading[p.productId]}
                        className={`w-full flex items-center justify-center space-x-2 py-3 rounded-[14px] text-[13px] font-black transition-all border shadow-sm ${
                          (p.howStatus ?? { isHOW: false }).isHOW
                            ? 'bg-orange-600 border-orange-700 text-white' 
                            : 'bg-white border-[#E0DBD5] text-gray-500'
                        }`}
                      >
                        {howLoading[p.productId] ? <Loader2 size={16} className="animate-spin" /> : <Flame size={16} />}
                        <span>{(p.howStatus ?? { isHOW: false }).isHOW ? 'Stop Promotion' : 'Promote as Hot Item'}</span>
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {!recLoading && selectedProduct && (
            <p className="text-[12px] text-gray-400 font-medium mt-2 text-center">
              Tap a row to load its forecast chart below
            </p>
          )}
        </section>

        {/* ── Section 2: 4-Week Demand Forecast ── */}
        <section>
          <DemandForecastChart
            weeks={forecast?.weeks || []}
            trend={forecast?.trend || 'STABLE'}
            confidence={forecast?.confidence || 0.8}
            peakDemandDay={forecast?.peakDemandDay || selectedProduct?.peakDemandDay || 'MONDAY'}
            productName={selectedProduct?.name || ''}
            currentStock={selectedProduct?.currentStock || 0}
            loading={forecastLoading}
          />
        </section>

        {/* ── Section 3: Seasonal Forecast ── */}
        {selectedProduct && !forecastLoading && (
          <section>
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-xl">🎯</span>
              <h2 className="text-[16px] font-black text-[#2C1810] uppercase tracking-widest">
                Seasonal Forecast — {selectedProduct.name}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {seasons.map(s => {
                const baseWeekly = selectedProduct.avgRequestsPerWeek || 0;
                const predicted  = Math.round(baseWeekly * s.mult);
                const deltaPct   = Math.round((s.mult - 1) * 100);
                const isUp       = deltaPct >= 0;
                return (
                  <div
                    key={s.key}
                    className={`bg-white rounded-[18px] border shadow-sm p-5 ${
                      forecast?.currentSeason === s.key ? 'border-[#3D2B1F] ring-2 ring-[#3D2B1F]/10' : 'border-[#E0DBD5]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-xl">{s.emoji}</span>
                        <p className="text-[12px] font-black text-gray-500 uppercase tracking-widest">{s.name}</p>
                      </div>
                      {forecast?.currentSeason === s.key && (
                        <span className="text-[9px] font-black text-[#3D2B1F] bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                          NOW
                        </span>
                      )}
                    </div>

                    <p className="text-[22px] font-black text-[#2C1810]">
                      {predicted.toLocaleString()} <span className="text-[13px] text-gray-400 font-semibold">/ week</span>
                    </p>

                    <p className={`text-[12px] font-black mt-1 ${isUp ? 'text-green-600' : 'text-red-500'}`}>
                      {isUp ? '↑' : '↓'} {Math.abs(deltaPct)}% vs average
                    </p>

                    <p className="text-[11px] text-gray-400 mt-2 font-medium">
                      {isUp
                        ? `Recommend +${Math.round(s.mult * 50)}% base stock`
                        : `Reduce orders by ~${Math.abs(deltaPct)}%`}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

      </div>
    </StockManagerLayout>
  );
}
