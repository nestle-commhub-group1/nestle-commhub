/**
 * QuickOrderModal.jsx
 *
 * Modal for placing a Quick Order from the Smart Ordering page.
 *
 * Props:
 *   product     {object}   — recommendation object from /api/stock/smart-recommendations
 *   suggestion  {object}   — from /api/stock/order-suggestion/:id
 *   onClose     {fn}
 *   onSuccess   {fn(orderRef, productName)}
 */

import React, { useState } from 'react';
import { Zap, Package, AlertTriangle, ChevronUp, ChevronDown, X, Loader2 } from 'lucide-react';
import API_URL from '../config/api';

const RISK_CFG = {
  HIGH:   { cls: 'bg-red-100 text-red-700 border-red-200',     label: 'HIGH RISK'   },
  MEDIUM: { cls: 'bg-amber-100 text-amber-700 border-amber-200', label: 'MEDIUM RISK' },
  LOW:    { cls: 'bg-green-100 text-green-700 border-green-200', label: 'LOW RISK'    },
};

export default function QuickOrderModal({ product, suggestion, onClose, onSuccess }) {
  const [quantity, setQuantity]   = useState(suggestion?.recommendedOrder || product?.recommendedOrder || 100);
  const [loading,  setLoading]    = useState(false);
  const [error,    setError]      = useState('');

  const name          = product?.name || '';
  const currentStock  = product?.currentStock ?? 0;
  const confidence    = suggestion?.confidencePct ?? Math.round((product?.confidence || 0.8) * 100);
  const recQty        = suggestion?.recommendedOrder ?? product?.recommendedOrder ?? 100;
  const estDemand     = suggestion?.estimatedDemand ?? product?.estimatedDemand ?? 0;
  const risk          = (suggestion?.fulfillmentRisk || product?.fulfillmentRisk || 'LOW').toUpperCase();
  const riskCfg       = RISK_CFG[risk] || RISK_CFG.LOW;

  function adjustQty(delta) {
    setQuantity(prev => Math.max(1, prev + delta));
  }

  async function handlePlaceOrder() {
    if (quantity < 1) return setError('Quantity must be at least 1');
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const res   = await fetch(`${API_URL}/api/stock/quick-order`, {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          Authorization:   `Bearer ${token}`,
        },
        body: JSON.stringify({ productId: product.productId || product._id, quantity }),
      });
      const json = await res.json();

      if (!res.ok) throw new Error(json.message || 'Failed to place order');

      onSuccess?.(json.orderRef, name);
      onClose?.();
    } catch (err) {
      setError(err.message || 'Failed to place order');
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[28px] shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">

        {/* Header */}
        <div className="bg-[#3D2B1F] px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
                <Zap size={18} className="text-amber-400" />
              </div>
              <div>
                <p className="text-[11px] text-white/50 font-black uppercase tracking-widest">Quick Order</p>
                <h3 className="text-[17px] font-black text-white leading-tight truncate max-w-[250px]">{name}</h3>
              </div>
            </div>
            <button onClick={onClose} className="text-white/50 hover:text-white transition-colors p-1">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Recommended',    value: `${recQty.toLocaleString()} units`, accent: '#3B82F6' },
              { label: 'Confidence',     value: `${confidence}%`,                   accent: '#22C55E' },
              { label: 'Current Stock',  value: `${currentStock.toLocaleString()} units`, accent: '#8B5CF6' },
              { label: 'Proj. 4-wk Demand', value: `${estDemand.toLocaleString()} units`, accent: '#F59E0B' },
            ].map(s => (
              <div key={s.label} className="bg-[#FAFAF9] rounded-[14px] p-3.5 border border-[#F0EDE8]">
                <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: s.accent }}>
                  {s.label}
                </p>
                <p className="text-[16px] font-black text-[#2C1810]">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Risk badge */}
          <div className={`flex items-center space-x-2 px-4 py-2.5 rounded-[12px] border text-[13px] font-black ${riskCfg.cls}`}>
            <AlertTriangle size={14} />
            <span>Fulfillment Risk: {riskCfg.label}</span>
          </div>

          {/* Quantity stepper */}
          <div className="space-y-2">
            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
              Order Quantity
            </label>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => adjustQty(-50)}
                className="w-11 h-11 rounded-[12px] border border-[#E0DBD5] flex items-center justify-center hover:bg-gray-50 transition-colors"
              >
                <ChevronDown size={18} className="text-gray-500" />
              </button>

              <div className="relative flex-1">
                <Package size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-[#E0DBD5] rounded-[14px] text-[16px] font-black text-[#2C1810] outline-none focus:ring-2 focus:ring-[#3D2B1F]/20 focus:border-[#3D2B1F] transition-all text-center"
                />
              </div>

              <button
                onClick={() => adjustQty(+50)}
                className="w-11 h-11 rounded-[12px] border border-[#E0DBD5] flex items-center justify-center hover:bg-gray-50 transition-colors"
              >
                <ChevronUp size={18} className="text-gray-500" />
              </button>
            </div>

            {/* Reset to recommendation */}
            {quantity !== recQty && (
              <button
                onClick={() => setQuantity(recQty)}
                className="text-[11px] text-blue-600 font-bold hover:underline"
              >
                Reset to recommended ({recQty.toLocaleString()})
              </button>
            )}
          </div>

          {/* Error */}
          {error && (
            <p className="text-red-500 text-[13px] font-semibold bg-red-50 rounded-[10px] px-4 py-2">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex space-x-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-3.5 rounded-[16px] border border-gray-200 text-[14px] font-bold text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handlePlaceOrder}
              disabled={loading}
              className="flex-1 py-3.5 rounded-[16px] bg-[#3D2B1F] hover:bg-[#2C1810] text-white text-[14px] font-black transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <><Loader2 size={15} className="animate-spin" /><span>Placing…</span></>
              ) : (
                <><Zap size={15} /><span>Place Order</span></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
