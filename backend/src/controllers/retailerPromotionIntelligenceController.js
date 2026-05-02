/**
 * retailerPromotionIntelligenceController.js
 *
 * Smart Promotions feature for the Retailer role.
 *
 * Key responsibilities:
 * - Return a retailer's favourite past promotions (based on ratings they gave)
 * - Allow toggle of "Notify me when this returns" per promotion
 * - Expose current promotions similar to favourites (by category / discount range)
 * - Auto-enable notification for any promotion rated >= 4.0 (out of 10)
 */

const Promotion                   = require('../models/Promotion');
const RetailerPromotionPreference = require('../models/RetailerPromotionPreference');
const Notification                = require('../models/Notification');

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function toStars(rating) {
  return rating != null ? parseFloat((rating / 2).toFixed(1)) : null;
}

async function upsertPreference(retailerId, promotionId, fields = {}) {
  const existing = await RetailerPromotionPreference.findOne({ retailerId, promotionId });
  if (!existing) {
    return RetailerPromotionPreference.create({ retailerId, promotionId, ...fields });
  }
  if (fields.rating != null && fields.rating >= 4.0 && !existing.notifyManuallySet) {
    fields.notifyOnRerun = true;
  }
  Object.assign(existing, fields, { updatedAt: new Date() });
  return existing.save();
}

/* ─── getRetailerTopPromotions ────────────────────────────────────────────── */

const getRetailerTopPromotions = async (req, res) => {
  try {
    if (req.user?.role !== 'retailer') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const retailerId = req.user._id;

    const promotions = await Promotion.find({
      'participatingRetailers.retailerId': retailerId,
    })
      .select('title description category discount startDate endDate status participatingRetailers salesData sourcePromotionId')
      .lean();

    if (promotions.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    const promoIds = promotions.map(p => p._id);
    const prefs    = await RetailerPromotionPreference.find({ retailerId, promotionId: { $in: promoIds } }).lean();
    const prefMap  = {};
    prefs.forEach(p => { prefMap[p.promotionId.toString()] = p; });

    const enriched = [];

    for (const promo of promotions) {
      const myRecord = promo.participatingRetailers.find(
        r => r.retailerId.toString() === retailerId.toString()
      );
      if (!myRecord) continue;

      const rating       = myRecord.rating ?? null;
      const unitsOrdered = (promo.salesData || []).find(
        s => s.retailerId.toString() === retailerId.toString()
      )?.unitsSold || 0;

      const pref = prefMap[promo._id.toString()];

      if (rating != null && rating >= 4.0 && !pref?.notifyManuallySet) {
        upsertPreference(retailerId, promo._id, {
          rating, feedback: myRecord.feedback || '', unitsOrdered,
          lastOrderDate: myRecord.optedInDate, notifyOnRerun: true,
        }).catch(() => {});
      } else if (!pref) {
        upsertPreference(retailerId, promo._id, {
          rating, feedback: myRecord.feedback || '', unitsOrdered,
          lastOrderDate: myRecord.optedInDate,
        }).catch(() => {});
      }

      enriched.push({
        promotionId:   promo._id,
        title:         promo.title,
        description:   promo.description,
        category:      promo.category,
        discount:      promo.discount || 0,
        startDate:     promo.startDate,
        endDate:       promo.endDate,
        status:        promo.status,
        rating,
        stars:         toStars(rating),
        feedback:      myRecord.feedback || '',
        unitsOrdered,
        notifyOnRerun: pref?.notifyOnRerun ?? (rating != null && rating >= 4.0),
        lastOrderDate: myRecord.optedInDate,
      });
    }

    enriched.sort((a, b) => {
      if (a.rating == null && b.rating == null) return 0;
      if (a.rating == null) return 1;
      if (b.rating == null) return -1;
      return b.rating - a.rating;
    });

    return res.status(200).json({ success: true, data: enriched });
  } catch (error) {
    console.error('[RetailerPromoIntel] getRetailerTopPromotions error:', error);
    return res.status(500).json({ message: 'Failed to fetch favourite promotions' });
  }
};

/* ─── toggleNotification ──────────────────────────────────────────────────── */

const toggleNotification = async (req, res) => {
  try {
    if (req.user?.role !== 'retailer') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const retailerId  = req.user._id;
    const promotionId = req.params.id;
    const enabled     = req.body.enabled === true || req.body.enabled === 'true';

    const promo = await Promotion.findById(promotionId);
    if (!promo) {
      return res.status(404).json({ message: 'Promotion not found' });
    }

    let pref = await RetailerPromotionPreference.findOne({ retailerId, promotionId });
    if (!pref) {
      pref = await RetailerPromotionPreference.create({
        retailerId, promotionId,
        notifyOnRerun: enabled, notifyManuallySet: true, updatedAt: new Date(),
      });
    } else {
      pref.notifyOnRerun     = enabled;
      pref.notifyManuallySet = true;
      pref.updatedAt         = new Date();
      await pref.save();
    }

    const message = enabled
      ? `You'll be notified when "${promo.title}" is re-run.`
      : `Notifications for "${promo.title}" have been disabled.`;

    return res.status(200).json({ success: true, promotionId, notifyEnabled: enabled, message });
  } catch (error) {
    console.error('[RetailerPromoIntel] toggleNotification error:', error);
    return res.status(500).json({ message: 'Failed to update notification preference' });
  }
};

/* ─── getNotificationStatus ───────────────────────────────────────────────── */

const getNotificationStatus = async (req, res) => {
  try {
    if (req.user?.role !== 'retailer') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const prefs = await RetailerPromotionPreference.find({ retailerId: req.user._id })
      .populate('promotionId', 'title discount category')
      .lean();
    return res.status(200).json({ success: true, data: prefs });
  } catch (error) {
    console.error('[RetailerPromoIntel] getNotificationStatus error:', error);
    return res.status(500).json({ message: 'Failed to fetch notification status' });
  }
};

/* ─── getSimilarCurrentPromotions ─────────────────────────────────────────── */

const getSimilarCurrentPromotions = async (req, res) => {
  try {
    if (req.user?.role !== 'retailer') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const retailerId = req.user._id;

    const topPromos = await Promotion.find({
      participatingRetailers: {
        $elemMatch: { retailerId, rating: { $gte: 4 } },
      },
    }).select('category discount').lean();

    if (topPromos.length === 0) {
      const active = await Promotion.find({ status: 'active' })
        .select('title description category discount startDate endDate')
        .limit(5).lean();
      return res.status(200).json({ success: true, data: active, basedOn: [] });
    }

    const favCategories = [...new Set(topPromos.map(p => p.category).filter(Boolean))];
    const favDiscounts  = topPromos.map(p => p.discount || 0).filter(d => d > 0);
    const minDiscount   = favDiscounts.length > 0 ? Math.min(...favDiscounts) - 5 : 0;
    const maxDiscount   = favDiscounts.length > 0 ? Math.max(...favDiscounts) + 5 : 100;

    const similar = await Promotion.find({
      status: 'active',
      $or: [
        { category: { $in: favCategories } },
        { discount: { $gte: minDiscount, $lte: maxDiscount } },
      ],
      'participatingRetailers.retailerId': { $ne: retailerId },
    })
      .select('title description category discount startDate endDate participatingRetailers sourcePromotionId')
      .limit(5).lean();

    const tagged = similar.map(p => ({
      ...p,
      similarTo:    favCategories.includes(p.category) ? topPromos.find(f => f.category === p.category) : null,
      optedInCount: p.participatingRetailers?.length || 0,
    }));

    return res.status(200).json({ success: true, data: tagged, basedOn: favCategories });
  } catch (error) {
    console.error('[RetailerPromoIntel] getSimilarCurrentPromotions error:', error);
    return res.status(500).json({ message: 'Failed to fetch similar promotions' });
  }
};

/* ─── notifyRetailersOfRerun ──────────────────────────────────────────────── */

const notifyRetailersOfRerun = async (newPromotionId, sourcePromotionId) => {
  try {
    const [source] = await Promise.all([
      Promotion.findById(sourcePromotionId).select('title discount').lean(),
    ]);
    if (!source) return;

    const prefs = await RetailerPromotionPreference.find({
      promotionId: sourcePromotionId, notifyOnRerun: true,
    }).select('retailerId rating unitsOrdered').lean();

    if (prefs.length === 0) return;

    const notifDocs = prefs.map(pref => ({
      userId:          pref.retailerId,
      type:            'promotion',
      message:         `🎉 Your favourite promotion is back! "${source.title}" is running again` +
                       (source.discount ? ` — ${source.discount}% off.` : '.') +
                       (pref.unitsOrdered ? ` You ordered ${pref.unitsOrdered} units last time.` : ''),
      relatedPromotion: newPromotionId,
    }));

    await Notification.insertMany(notifDocs);
    console.log(`[RetailerPromoIntel] Rerun notifications sent to ${prefs.length} retailer(s)`);
  } catch (error) {
    console.error('[RetailerPromoIntel] notifyRetailersOfRerun error:', error.message);
  }
};

module.exports = {
  getRetailerTopPromotions,
  toggleNotification,
  getNotificationStatus,
  getSimilarCurrentPromotions,
  notifyRetailersOfRerun,
};
