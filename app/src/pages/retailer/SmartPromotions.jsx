/**
 * SmartPromotions.jsx
 *
 * Retailer "My Smart Promotions" page.
 *
 * Layout:
 *   ┌──────────────────────────────────────────────┐
 *   │  🔔 PAST FAVORITES (with notify toggles)     │
 *   ├──────────────────────────────────────────────┤
 *   │  🎁 SIMILAR CURRENT PROMOTIONS               │
 *   └──────────────────────────────────────────────┘
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate }        from 'react-router-dom';
import { Loader2, Bell, RefreshCw, Sparkles, Tag } from 'lucide-react';
import RetailerLayout         from '../../components/layout/RetailerLayout';
import RetailerPromotionCard  from '../../components/RetailerPromotionCard';
import API_URL from '../../config/api';

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

const Spinner = () => (
  <div className="flex justify-center items-center min-h-[180px] text-gray-400">
    <Loader2 size={24} className="animate-spin" />
  </div>
);

function SectionHeader({ icon, label, sub }) {
  return (
    <div className="flex items-center space-x-3 mb-4">
      <div className="w-8 h-8 rounded-full bg-[#3D2B1F]/10 flex items-center justify-center text-base">
        {icon}
      </div>
      <div>
        <h2 className="text-[15px] font-black text-[#2C1810] uppercase tracking-widest">{label}</h2>
        {sub && <p className="text-[12px] text-gray-400 font-medium">{sub}</p>}
      </div>
    </div>
  );
}

/* ─── SmartPromotions ────────────────────────────────────────────────────── */

export default function SmartPromotions() {
  const navigate = useNavigate();

  const [favorites,    setFavorites]    = useState([]);
  const [similar,      setSimilar]      = useState([]);
  const [favLoading,   setFavLoading]   = useState(true);
  const [simLoading,   setSimLoading]   = useState(true);
  const [toggleBusy,   setToggleBusy]   = useState({});  // { [promotionId]: bool }
  const [toast,        setToast]        = useState('');

  const token   = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  /* ── Fetch favourites ── */
  const fetchFavorites = useCallback(async () => {
    setFavLoading(true);
    try {
      const res  = await fetch(`${API_URL}/api/retailer-promo-intel/favorites`, { headers });
      const json = await res.json();
      setFavorites(json.data || []);
    } catch {
      setFavorites([]);
    } finally {
      setFavLoading(false);
    }
  }, []);

  /* ── Fetch similar current promotions ── */
  const fetchSimilar = useCallback(async () => {
    setSimLoading(true);
    try {
      const res  = await fetch(`${API_URL}/api/retailer-promo-intel/similar`, { headers });
      const json = await res.json();
      setSimilar(json.data || []);
    } catch {
      setSimilar([]);
    } finally {
      setSimLoading(false);
    }
  }, []);

  useEffect(() => { fetchFavorites(); }, [fetchFavorites]);
  useEffect(() => { fetchSimilar();   }, [fetchSimilar]);

  /* ── Toggle notify ── */
  async function handleToggleNotify(promotionId, enabled) {
    setToggleBusy(prev => ({ ...prev, [promotionId]: true }));
    try {
      const res  = await fetch(
        `${API_URL}/api/retailer-promo-intel/${promotionId}/notify-toggle`,
        {
          method:  'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body:    JSON.stringify({ enabled }),
        }
      );
      const json = await res.json();

      if (json.success) {
        // Optimistic update
        setFavorites(prev =>
          prev.map(p =>
            p.promotionId?.toString() === promotionId?.toString()
              ? { ...p, notifyOnRerun: enabled }
              : p
          )
        );
        showToast(json.message || (enabled ? '🔔 Notifications enabled' : '🔕 Notifications disabled'));
      } else {
        showToast('Failed to update notification preference');
      }
    } catch {
      showToast('Network error — please try again');
    } finally {
      setToggleBusy(prev => ({ ...prev, [promotionId]: false }));
    }
  }

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  }

  const notifyCount = favorites.filter(p => p.notifyOnRerun).length;

  /* ─────────────────────────────────────────────────────────────────────── */

  return (
    <RetailerLayout>
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#2C1810] text-white px-5 py-3 rounded-[14px] shadow-xl text-[13px] font-bold animate-fade-in whitespace-nowrap">
          {toast}
        </div>
      )}

      <div className="space-y-8 pb-12">

        {/* ── Page Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <div>
            <h1 className="text-[26px] font-black text-[#2C1810] tracking-tight flex items-center space-x-2">
              <Sparkles size={24} className="text-amber-500" />
              <span>My Smart Promotions</span>
            </h1>
            <p className="text-[13px] text-gray-500 font-medium mt-1">
              Your past favourites and personalised recommendations
            </p>
          </div>
          <button
            onClick={() => { fetchFavorites(); fetchSimilar(); }}
            disabled={favLoading || simLoading}
            className="flex items-center space-x-2 px-4 py-2.5 bg-white border border-[#E0DBD5] rounded-[12px] text-[13px] font-bold text-[#3D2B1F] hover:bg-[#F8F7F5] transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={(favLoading || simLoading) ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>

        {/* ── Summary strip ── */}
        {!favLoading && favorites.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              {
                label:  'Past Favourites',
                value:  favorites.length,
                accent: '#F59E0B',
                icon:   '⭐',
              },
              {
                label:  'Notify Enabled',
                value:  notifyCount,
                accent: '#22C55E',
                icon:   '🔔',
              },
              {
                label:  'Similar Available',
                value:  similar.length,
                accent: '#3B82F6',
                icon:   '🎁',
              },
            ].map(c => (
              <div
                key={c.label}
                className="bg-white rounded-[16px] border border-[#E0DBD5] p-4 shadow-sm"
                style={{ borderLeft: `3px solid ${c.accent}` }}
              >
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-base">{c.icon}</span>
                  <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">{c.label}</p>
                </div>
                <p className="text-[24px] font-black text-[#2C1810]">{c.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Section 1: Past Favourites ── */}
        <section>
          <SectionHeader
            icon="🔔"
            label="Past Favourites"
            sub="Toggle notifications to be alerted when these promotions return"
          />

          {favLoading ? (
            <Spinner />
          ) : favorites.length === 0 ? (
            <div className="bg-white rounded-[20px] border border-dashed border-[#E0DBD5] py-14 text-center space-y-3">
              <p className="text-4xl">⭐</p>
              <p className="text-[16px] font-black text-gray-400">No favourites yet</p>
              <p className="text-[13px] text-gray-400 max-w-sm mx-auto">
                Opt into promotions and leave a rating — your highly-rated campaigns will appear here.
              </p>
              <button
                onClick={() => navigate('/retailer/promotions')}
                className="mt-2 inline-flex items-center space-x-2 px-5 py-2.5 bg-[#3D2B1F] hover:bg-[#2C1810] text-white rounded-[12px] text-[13px] font-black transition-colors"
              >
                <Tag size={14} />
                <span>Browse Promotions</span>
              </button>
            </div>
          ) : (
            <>
              {/* Notify-all banner */}
              <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-[14px] px-4 py-3 mb-4">
                <div className="flex items-center space-x-2">
                  <Bell size={15} className="text-amber-600" />
                  <p className="text-[13px] font-bold text-amber-800">
                    {notifyCount} of {favorites.length} promotions have rerun notifications on
                  </p>
                </div>
                {notifyCount < favorites.length && (
                  <button
                    onClick={async () => {
                      for (const p of favorites.filter(f => !f.notifyOnRerun)) {
                        await handleToggleNotify(p.promotionId, true);
                      }
                    }}
                    className="text-[12px] font-black text-amber-700 hover:text-amber-900 transition-colors underline underline-offset-2"
                  >
                    Enable All
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {favorites.map(promo => (
                  <RetailerPromotionCard
                    key={promo.promotionId}
                    promo={promo}
                    variant="favorite"
                    busy={!!toggleBusy[promo.promotionId]}
                    onToggleNotify={handleToggleNotify}
                  />
                ))}
              </div>
            </>
          )}
        </section>

        {/* ── Divider ── */}
        <div className="flex items-center space-x-3">
          <div className="flex-1 h-px bg-[#E0DBD5]" />
          <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest px-2">Based on your taste</span>
          <div className="flex-1 h-px bg-[#E0DBD5]" />
        </div>

        {/* ── Section 2: Similar Current Promotions ── */}
        <section>
          <SectionHeader
            icon="🎁"
            label="Similar Current Promotions"
            sub="Active promotions matched to your past favourites"
          />

          {simLoading ? (
            <Spinner />
          ) : similar.length === 0 ? (
            <div className="bg-white rounded-[20px] border border-dashed border-blue-200 py-12 text-center space-y-2">
              <p className="text-3xl">🎁</p>
              <p className="text-[15px] font-black text-gray-400">No similar promotions running right now</p>
              <p className="text-[12px] text-gray-400">
                Check back soon — we'll match new promotions to your history.
              </p>
              <button
                onClick={() => navigate('/retailer/promotions')}
                className="mt-3 inline-flex items-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-[12px] text-[13px] font-black transition-colors"
              >
                <Tag size={14} />
                <span>Browse All Promotions</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {similar.map(promo => (
                <RetailerPromotionCard
                  key={promo._id}
                  promo={promo}
                  variant="similar"
                  onOptIn={() => navigate('/retailer/promotions')}
                />
              ))}
            </div>
          )}
        </section>

      </div>
    </RetailerLayout>
  );
}
