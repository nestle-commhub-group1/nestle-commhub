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
import { Zap, RefreshCw, TrendingUp, AlertTriangle, Star, Loader2 } from 'lucide-react';
import StockManagerLayout    from '../../components/layout/StockManagerLayout';
import DemandForecastChart   from '../../components/DemandForecastChart';
import QuickOrderModal       from '../../components/QuickOrderModal';
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
  const [selectedProduct, setSelectedProduct] = useState(null);  // for chart
  const [forecast,        setForecast]        = useState(null);
  const [suggestion,      setSuggestion]      = useState(null);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [quickOrderProd,  setQuickOrderProd]  = useState(null);  // open modal
  const [toast,           setToast]           = useState('');
  const [howLoading,      setHowLoading]      = useState({});

  const token   = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  /* ── Fetch top demand products ── */
  const fetchRecommendations = useCallback(async () => {
    setRecLoading(true);
    try {
      const res  = await fetch(`${API_URL}/api/stock/smart-recommendations`, { headers });
      const json = await res.json();
      const data = (json.data || []).filter(p => p.demandScore >= 0); // show all, sorted
      setRecommendations(data);

      // Auto-select the top product for forecast
      if (data.length > 0 && !selectedProduct) {
        loadForecast(data[0]);
      }
    } catch {
      setRecommendations([]);
    } finally {
      setRecLoading(false);
    }
  }, []);

  /* ── Load forecast for a product ── */
  const loadForecast = useCallback(async (product) => {
    setSelectedProduct(product);
    setForecastLoading(true);
    try {
      const [forecastRes, suggestionRes] = await Promise.all([
        fetch(`${API_URL}/api/stock/predict-demand/${product.productId}`, { headers }),
        fetch(`${API_URL}/api/stock/order-suggestion/${product.productId}`, { headers }),
      ]);
      const [fc, sg] = await Promise.all([forecastRes.json(), suggestionRes.json()]);
      setForecast(fc);
      setSuggestion(sg);
    } catch {
      setForecast(null);
      setSuggestion(null);
    } finally {
      setForecastLoading(false);
    }
  }, []);

  useEffect(() => { fetchRecommendations(); }, [fetchRecommendations]);

  /* ── Quick order success ── */
  function handleOrderSuccess(orderRef, productName) {
    showToast(`✅ Order #${orderRef} placed for ${productName}`);
    fetchRecommendations(); // refresh stock levels
  }

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  }

  /* ── Toggle HOW status ── */
  const toggleHOW = async (product) => {
    const isCurrentlyHOW = product.howStatus?.isHOW;
    const endpoint = isCurrentlyHOW ? 'unmark-as-how' : 'mark-as-how';
    
    setHowLoading(prev => ({ ...prev, [product.productId]: true }));
    try {
      const res = await fetch(`${API_URL}/api/stock/${endpoint}`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.productId })
      });
      const data = await res.json();
      if (data.success) {
        showToast(isCurrentlyHOW ? `Removed ⭐ ${product.name} from HOW` : `Marked ⭐ ${product.name} as HOW`);
        fetchRecommendations();
      }
    } catch {
      showToast("Failed to update HOW status");
    } finally {
      setHowLoading(prev => ({ ...prev, [product.productId]: false }));
    }
  };

  /* ── Smart insight cards (derived from top recommendations) ── */
  const insights = [];
  if (recommendations.length > 0) {
    const critStock = recommendations.find(r => r.fulfillmentRisk === 'HIGH');
    if (critStock) {
      insights.push({
        icon: '🚨', title: 'Critical Stock Alert', color: '#EF4444',
        body:  `${critStock.name} at ${critStock.currentStock} units — demand is ${critStock.avgRequestsPerWeek.toFixed(0)}/week.`,
        cta:   `Order ${critStock.recommendedOrder.toLocaleString()} units immediately`,
      });
    }

    const growing = recommendations.find(r => r.growthTrend > 0.2);
    if (growing) {
      insights.push({
        icon: '📈', title: 'Seasonal Trend', color: '#F59E0B',
        body:  `${growing.name} demand is growing ${(growing.growthTrend * 100).toFixed(0)}% vs prior period.`,
        cta:   `Consider increasing base stock by ${Math.round(growing.growthTrend * 50)}%`,
      });
    }

    const opportunity = recommendations.find(r => r.demandScore >= 7 && r.fulfillmentRate < 0.9);
    if (opportunity) {
      insights.push({
        icon: '🎯', title: 'Fulfillment Opportunity', color: '#22C55E',
        body:  `${opportunity.name}: ${opportunity.demandScore.toFixed(1)}/10 demand, only ${Math.round(opportunity.fulfillmentRate * 100)}% fulfillment.`,
        cta:   `Add ${opportunity.recommendedOrder.toLocaleString()} units to reach 95%+`,
      });
    }

    // Pad to 3 cards if needed
    if (insights.length === 0) {
      insights.push({
        icon: '✅', title: 'Stock Health', color: '#22C55E',
        body: 'All products are within acceptable stock levels.',
        cta: 'Keep monitoring weekly trends.',
      });
    }
  }

  /* ── Seasonal forecast for selected product ── */
  const seasons = forecast ? [
    { name: 'Summer',  key: 'SUMMER',  emoji: '☀️',  mult: 1.4 },
    { name: 'Monsoon', key: 'MONSOON', emoji: '🌧️', mult: 0.8 },
    { name: 'Winter',  key: 'WINTER',  emoji: '❄️',  mult: 1.1 },
    { name: 'Spring',  key: 'SPRING',  emoji: '🌸',  mult: 1.0 },
  ] : [];

  /* ─────────────────────────────────────────────────────────────────────── */

  return (
    <StockManagerLayout>
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#2C1810] text-white px-5 py-3 rounded-[14px] shadow-xl text-[13px] font-bold whitespace-nowrap">
          {toast}
        </div>
      )}

      {/* Quick Order Modal */}
      {quickOrderProd && (
        <QuickOrderModal
          product={quickOrderProd}
          suggestion={quickOrderProd._id === selectedProduct?.productId?.toString() ? suggestion : null}
          onClose={() => setQuickOrderProd(null)}
          onSuccess={handleOrderSuccess}
        />
      )}

      <div className="space-y-8 pb-12">

        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-[26px] font-black text-[#2C1810] flex items-center space-x-2">
              <Zap size={24} className="text-amber-500" />
              <span>Smart Stock Management</span>
            </h1>
            <p className="text-[13px] text-gray-500 mt-1 font-medium">
              Predictive demand analytics and one-click ordering
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

        {/* ── Smart Insight Cards ── */}
        {insights.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {insights.map((c, i) => <InsightCard key={i} {...c} />)}
          </div>
        )}

        {/* ── Section 1: Top Demand Products ── */}
        <section>
          <div className="flex items-center space-x-2 mb-4">
            <span className="text-xl">🚀</span>
            <h2 className="text-[16px] font-black text-[#2C1810] uppercase tracking-widest">
              Top Demand Products
            </h2>
            {!recLoading && (
              <span className="bg-gray-100 text-gray-500 text-[11px] font-black px-2 py-0.5 rounded-full">
                {recommendations.length} products
              </span>
            )}
          </div>

          <div className="bg-white rounded-[20px] border border-[#E0DBD5] shadow-sm overflow-hidden">
            {recLoading ? (
              <div className="flex justify-center items-center min-h-[200px] text-gray-400">
                <Loader2 size={24} className="animate-spin" />
              </div>
            ) : recommendations.length === 0 ? (
              <div className="py-16 text-center space-y-2">
                <p className="text-4xl">📦</p>
                <p className="text-[15px] font-black text-gray-400">No products found</p>
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#F8F7F5]">
                      <tr>
                        {['#','Product','Category','Stock','Demand Score','Avg/Week','Risk','Forecast','Order'].map(h => (
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
                          className={`hover:bg-[#FAFAF9] transition-colors cursor-pointer ${
                            selectedProduct?.productId?.toString() === p.productId?.toString() ? 'bg-amber-50/50' : ''
                          }`}
                          onClick={() => loadForecast(p)}
                        >
                          <td className="px-4 py-3.5 text-[13px] font-black text-gray-400 w-8">{idx + 1}</td>

                          <td className="px-4 py-3.5">
                            <p className="font-black text-[14px] text-[#2C1810] max-w-[160px] truncate">{p.name}</p>
                            <p className="text-[11px] text-gray-400 mt-0.5">{p.reason}</p>
                          </td>

                          <td className="px-4 py-3.5 text-[12px] font-semibold text-gray-500 capitalize">
                            {p.category}
                          </td>

                          <td className="px-4 py-3.5">
                            <p className="font-black text-[14px] text-[#2C1810]">
                              {p.currentStock.toLocaleString()}
                            </p>
                            <p className="text-[10px] text-gray-400">units</p>
                          </td>

                          <td className="px-4 py-3.5">
                            <ScoreBadge score={p.demandScore} />
                          </td>

                          <td className="px-4 py-3.5 text-[13px] font-black text-[#2C1810]">
                            {p.avgRequestsPerWeek.toFixed(0)}
                          </td>

                          <td className="px-4 py-3.5">
                            <RiskBadge risk={p.fulfillmentRisk} />
                          </td>

                          <td className="px-4 py-3.5">
                            <div className="flex items-center space-x-1 text-[11px] font-bold text-gray-500">
                              <TrendingUp size={12} className={
                                p.growthTrend > 0.05 ? 'text-green-500' : 'text-gray-400'
                              } />
                              <span>
                                {p.growthTrend > 0.05  ? `↑ ${(p.growthTrend*100).toFixed(0)}%` :
                                 p.growthTrend < -0.05 ? `↓ ${(Math.abs(p.growthTrend)*100).toFixed(0)}%` :
                                 'Stable'}
                              </span>
                            </div>
                          </td>

                          <td className="px-4 py-3.5 space-x-2 flex items-center" onClick={e => e.stopPropagation()}>
                            <button
                              onClick={() => setQuickOrderProd(p)}
                              className="flex items-center space-x-1.5 px-3 py-2 bg-[#3D2B1F] hover:bg-[#2C1810] text-white text-[11px] font-black rounded-[10px] transition-colors whitespace-nowrap"
                            >
                              <Zap size={11} />
                              <span>Quick Order</span>
                            </button>

                            <button
                              onClick={() => toggleHOW(p)}
                              disabled={howLoading[p.productId]}
                              className={`p-2 rounded-[10px] border transition-all ${
                                p.howStatus?.isHOW 
                                  ? 'bg-amber-100 border-amber-200 text-amber-600' 
                                  : 'bg-white border-[#E0DBD5] text-gray-400 hover:text-amber-500'
                              }`}
                              title={p.howStatus?.isHOW ? 'Remove from HOW' : 'Mark as HOW'}
                            >
                              {howLoading[p.productId] ? <Loader2 size={14} className="animate-spin" /> : <Star size={14} fill={p.howStatus?.isHOW ? 'currentColor' : 'none'} />}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="lg:hidden divide-y divide-[#F0EDE8]">
                  {recommendations.map((p, idx) => (
                    <div
                      key={p.productId}
                      className="p-4 space-y-3"
                      onClick={() => loadForecast(p)}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-black text-[14px] text-[#2C1810]">{p.name}</p>
                          <p className="text-[11px] text-gray-400">{p.reason}</p>
                        </div>
                        <ScoreBadge score={p.demandScore} />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { l: 'Stock',    v: p.currentStock.toLocaleString() },
                          { l: 'Avg/Wk',  v: p.avgRequestsPerWeek.toFixed(0) },
                          { l: 'Rec.Qty', v: p.recommendedOrder.toLocaleString() },
                        ].map(m => (
                          <div key={m.l} className="bg-[#FAFAF9] rounded-[10px] p-2 text-center border border-[#F0EDE8]">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{m.l}</p>
                            <p className="text-[13px] font-black text-[#2C1810]">{m.v}</p>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); setQuickOrderProd(p); }}
                        className="w-full flex items-center justify-center space-x-2 py-2.5 bg-[#3D2B1F] hover:bg-[#2C1810] text-white text-[13px] font-black rounded-[12px] transition-colors"
                      >
                        <Zap size={14} />
                        <span>Quick Order</span>
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
