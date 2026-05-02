/**
 * promotionIntelligenceController.js
 *
 * PM Smart Promotion Builder — Copy from Past Winners
 */
const Promotion = require('../models/Promotion');
const Notification = require('../models/Notification');

/**
 * GET /api/promotions/top-performers
 */
const getTopPerformingPromotions = async (req, res) => {
  try {
    const promotions = await Promotion.find({ status: 'ended' }).lean();
    
    const scored = promotions.map(p => {
      const optIns = p.participatingRetailers?.length || 0;
      const totalUnits = (p.salesData || []).reduce((s, d) => s + (d.unitsSold || 0), 0);
      const totalRevenue = totalUnits * (p.discount ? (1 - p.discount/100) : 1); // rough estimate
      const avgRating = p.participatingRetailers?.reduce((s, r) => s + (r.rating || 0), 0) / Math.max(optIns, 1);
      
      // Score 0-10
      const score = (
        (Math.min(optIns / 50, 1) * 3) + 
        (Math.min(totalUnits / 1000, 1) * 4) + 
        (Math.min(avgRating / 10, 1) * 3)
      ).toFixed(1);

      return {
        ...p,
        performanceScore: parseFloat(score),
        optIns,
        totalUnits,
        avgRating: parseFloat(avgRating.toFixed(1))
      };
    });

    scored.sort((a, b) => b.performanceScore - a.performanceScore);
    res.status(200).json({ success: true, data: scored.slice(0, 10) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * POST /api/promotions/duplicate
 * Body: { sourcePromotionId, startDate, endDate }
 */
const duplicatePromotion = async (req, res) => {
  try {
    const { sourcePromotionId, startDate, endDate } = req.body;
    const source = await Promotion.findById(sourcePromotionId);
    if (!source) return res.status(404).json({ message: 'Source promotion not found' });

    const newPromo = new Promotion({
      title: `${source.title} (Re-run)`,
      description: source.description,
      category: source.category,
      discount: source.discount,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      promotionType: source.promotionType,
      b2bConfig: source.b2bConfig,
      b2cConfig: source.b2cConfig,
      status: 'active',
      sourcePromotionId: source._id
    });

    await newPromo.save();

    // Notify retailers who opted in before
    const { notifyRetailersOfRerun } = require('./retailerPromotionIntelligenceController');
    await notifyRetailersOfRerun(newPromo._id, source._id);

    res.status(201).json({ success: true, data: newPromo });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getTopPerformingPromotions,
  duplicatePromotion
};
