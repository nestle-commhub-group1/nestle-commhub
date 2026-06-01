/**
 * RetailerPromotionCard.jsx
 *
 * Card component for the Retailer Smart Promotions page.
 * Displays a favourite promotion with rating, stats, and
 * a "Notify on Rerun" toggle button.
 *
 * Props:
 *   promo          {object}   — enriched favourite promotion data
 *   onToggleNotify {fn}       — called with (promotionId, newEnabled)
 *   busy           {boolean}  — disables toggle while API call is in flight
 *   variant        {string}   — 'favorite' | 'similar'
 *   onOptIn        {fn}       — for 'similar' variant, navigate to promo wall
 */

import React from 'react';
import { Bell, BellOff, Tag, Package, Calendar, ChevronRight } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function formatDate(dateStr, locale = 'en-GB') {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString(locale, {
    month: 'short', year: 'numeric',
  });
}

function StarRow({ stars, maxStars = 5 }) {
  const filled = Math.round(stars || 0);
  return (
    <div className="flex items-center space-x-0.5">
      {Array.from({ length: maxStars }, (_, i) => (
        <span key={i} className={`text-[14px] ${i < filled ? 'text-amber-400' : 'text-gray-200'}`}>
          ★
        </span>
      ))}
    </div>
  );
}

function CategoryPill({ category }) {
  const map = {
    seasonal:   'bg-blue-100 text-blue-700',
    discount:   'bg-green-100 text-green-700',
    bundled:    'bg-purple-100 text-purple-700',
    flash_sale: 'bg-red-100 text-red-700',
    other:      'bg-gray-100 text-gray-600',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${map[category] || map.other}`}>
      {(category || 'Other').replace('_', ' ')}
    </span>
  );
}

/* ─── RetailerPromotionCard ──────────────────────────────────────────────── */

export default function RetailerPromotionCard({
  promo,
  onToggleNotify,
  busy     = false,
  variant  = 'favorite',
  onOptIn,
}) {
  const { language, t } = useLanguage();
  const isFavorite = variant === 'favorite';
  const locale = language === 'si' ? 'si-LK' : language === 'ta' ? 'ta-LK' : 'en-GB';

  return (
    <div className={`bg-white rounded-[20px] border shadow-sm overflow-hidden hover:shadow-md transition-shadow ${
      isFavorite ? 'border-[#E0DBD5]' : 'border-blue-200'
    }`}>
      {/* Top accent bar */}
      <div className={`h-1 ${isFavorite ? 'bg-gradient-to-r from-amber-400 to-amber-300' : 'bg-gradient-to-r from-blue-400 to-blue-300'}`} />

      <div className="p-5 space-y-4 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Category + discount */}
            <div className="flex items-center flex-wrap gap-2 mb-3 min-h-[24px]">
              <CategoryPill category={promo.category} />
              {promo.discount > 0 && (
                <span className="flex items-center space-x-1 text-[11px] font-black text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                  <Tag size={10} />
                  <span>{promo.discount}% {t('OFF')}</span>
                </span>
              )}
            </div>

            {!isFavorite && (
              <p className="mb-3 text-[11px] text-gray-400 font-bold italic leading-none">
                {t('Similar to your past favourites')}
              </p>
            )}

            <h3 className="font-black text-[15px] text-[#2C1810] leading-tight line-clamp-2 min-h-[38px]">
              {promo.title || promo.name}
            </h3>

            {promo.description && (
              <p className="text-[12px] text-gray-500 mt-2 line-clamp-2 min-h-[40px]">{promo.description}</p>
            )}
          </div>

          {/* Star rating (favorites only) */}
          {isFavorite && promo.stars != null && (
            <div className="flex-shrink-0 text-right">
              <StarRow stars={promo.stars} />
              <p className="text-[11px] text-gray-400 mt-0.5 font-semibold">{promo.stars} / 5</p>
            </div>
          )}
        </div>

        {/* ── Stats grid ── */}
        <div className={`grid gap-2 ${isFavorite ? 'grid-cols-3' : 'grid-cols-2'} ${isFavorite ? '' : 'mt-auto'}`}>
          {isFavorite && (
            <div className="bg-[#FAFAF9] rounded-[10px] p-2.5 text-center border border-[#F0EDE8]">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">
                {t('Your Orders')}
              </p>
              <div className="flex items-center justify-center space-x-1">
                <Package size={11} className="text-[#3D2B1F]" />
                <p className="text-[13px] font-black text-[#2C1810]">
                  {promo.unitsOrdered?.toLocaleString() || '—'}
                </p>
              </div>
            </div>
          )}

          <div className="bg-[#FAFAF9] rounded-[10px] p-2.5 text-center border border-[#F0EDE8]">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">
              {isFavorite ? t('Last Ran') : t('Starts')}
            </p>
            <div className="flex items-center justify-center space-x-1">
              <Calendar size={11} className="text-[#3D2B1F]" />
              <p className="text-[12px] font-bold text-[#2C1810]">
                {isFavorite
                  ? formatDate(promo.lastOrderDate || promo.startDate, locale)
                  : formatDate(promo.startDate, locale)}
              </p>
            </div>
          </div>

          <div className="bg-[#FAFAF9] rounded-[10px] p-2.5 text-center border border-[#F0EDE8]">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">
              {t('Ends')}
            </p>
            <div className="flex items-center justify-center space-x-1">
              <Calendar size={11} className="text-gray-400" />
              <p className="text-[12px] font-bold text-[#2C1810]">
                {formatDate(promo.endDate, locale)}
              </p>
            </div>
          </div>
        </div>

        {/* ── Feedback snippet (favorites) ── */}
        {isFavorite && promo.feedback && (
          <div className="bg-amber-50 border border-amber-100 rounded-[10px] px-3 py-2">
            <p className="text-[11px] text-amber-700 italic">"{promo.feedback}"</p>
          </div>
        )}

        {/* ── Action area ── */}
        {isFavorite ? (
          /* Notify toggle */
          <div className="space-y-2">
            <button
              disabled={busy}
              onClick={() => onToggleNotify?.(promo.promotionId, !promo.notifyOnRerun)}
              className={`w-full flex items-center justify-center space-x-2 py-2.5 rounded-[12px] text-[13px] font-black transition-colors border ${
                promo.notifyOnRerun
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                  : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
              } disabled:opacity-50`}
            >
              {promo.notifyOnRerun ? (
                <><Bell size={14} className="text-emerald-600" /><span>{t('Notifying on Rerun')} ✓</span></>
              ) : (
                <><BellOff size={14} /><span>{t('Enable Rerun Notifications')}</span></>
              )}
            </button>

            {promo.notifyOnRerun && (
              <p className="text-[11px] text-emerald-600 text-center font-medium">
                ✅ {t("You'll be notified when this promotion returns")}
              </p>
            )}
          </div>
        ) : (
          /* Similar promo: opt-in / view */
          <div className="flex space-x-2">
            <button
              onClick={() => onOptIn?.(promo._id)}
              className="flex-1 flex items-center justify-center space-x-1.5 py-3 rounded-[12px] bg-[#3D2B1F] hover:bg-[#2C1810] text-white text-[12px] font-black transition-colors"
            >
              <span>{t('View & Opt In')}</span>
              <ChevronRight size={13} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
