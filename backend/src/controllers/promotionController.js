const Promotion = require('../models/Promotion');
const User = require('../models/User');
const Notification = require('../models/Notification');

/**
 * POST /api/promotions
 * Create a new promotion (Promotion Manager only)
 */
const createPromotion = async (req, res) => {
  try {
    // Only promotion_manager role can create
    if (req.user.role !== 'promotion_manager') {
      return res.status(403).json({ error: 'Only Promotion Managers can create promotions' });
    }

    const { title, description, category, startDate, endDate, discount } = req.body;

    if (!title || !description || !startDate || !endDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const newPromotion = new Promotion({
      title,
      description,
      category,
      startDate,
      endDate,
      discount,
      createdBy: req.user._id,
      participatingRetailers: []
    });

    await newPromotion.save();
    await newPromotion.populate('createdBy', 'fullName email');

    // Notify all retailers of new promotion
    const retailers = await User.find({ role: 'retailer' });
    for (const retailer of retailers) {
      await Notification.create({
        userId: retailer._id,
        type: 'promotion',
        message: `New promotion available: ${title}`,
        relatedPromotion: newPromotion._id
      });
    }

    res.status(201).json({
      success: true,
      message: 'Promotion created successfully',
      promotion: newPromotion
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/promotions
 * Get all active promotions
 */
const getAllPromotions = async (req, res) => {
  try {
    const promotions = await Promotion.find({ status: 'active' })
      .populate('createdBy', 'fullName email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      promotions
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/promotions/:id
 * Get single promotion details
 */
const getPromotionById = async (req, res) => {
  try {
    const promotion = await Promotion.findById(req.params.id)
      .populate('createdBy', 'fullName email')
      .populate('participatingRetailers.retailerId', 'fullName email businessName')
      .populate('participatingRetailers.assignedDistributor', 'fullName email');

    if (!promotion) {
      return res.status(404).json({ error: 'Promotion not found' });
    }

    res.status(200).json({
      success: true,
      promotion
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * PUT /api/promotions/:id
 * Update promotion (Promotion Manager only)
 */
const updatePromotion = async (req, res) => {
  try {
    const promotion = await Promotion.findById(req.params.id);
    
    if (!promotion) {
      return res.status(404).json({ error: 'Promotion not found' });
    }

    // Only the creator can update
    if (promotion.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Only the promotion creator can update it' });
    }

    const { title, description, category, startDate, endDate, discount, status } = req.body;

    if (title) promotion.title = title;
    if (description) promotion.description = description;
    if (category) promotion.category = category;
    if (startDate) promotion.startDate = startDate;
    if (endDate) promotion.endDate = endDate;
    if (discount !== undefined) promotion.discount = discount;
    if (status) promotion.status = status;

    promotion.updatedAt = new Date();
    await promotion.save();

    res.status(200).json({
      success: true,
      message: 'Promotion updated successfully',
      promotion
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * POST /api/promotions/:id/opt-in
 * Retailer opts into a promotion
 */
const retailerOptInPromotion = async (req, res) => {
  try {
    if (req.user.role !== 'retailer') {
      return res.status(403).json({ error: 'Only retailers can opt into promotions' });
    }

    const promotion = await Promotion.findById(req.params.id);
    if (!promotion) {
      return res.status(404).json({ error: 'Promotion not found' });
    }

    // Check if retailer already opted in
    const alreadyOptedIn = promotion.participatingRetailers.find(
      r => r.retailerId.toString() === req.user._id.toString()
    );

    if (alreadyOptedIn && alreadyOptedIn.optedIn) {
      return res.status(400).json({ error: 'Already opted into this promotion' });
    }

    if (!alreadyOptedIn) {
      promotion.participatingRetailers.push({
        retailerId: req.user._id,
        optedIn: true,
        optedInDate: new Date()
      });
    } else {
      alreadyOptedIn.optedIn = true;
      alreadyOptedIn.optedInDate = new Date();
    }

    await promotion.save();

    // Notify promotion manager
    await Notification.create({
      userId: promotion.createdBy,
      type: 'promotion_optin',
      message: `Retailer has opted into promotion: ${promotion.title}`,
      relatedPromotion: promotion._id
    });

    res.status(200).json({
      success: true,
      message: 'Successfully opted into promotion',
      promotion
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * POST /api/promotions/:id/assign-distributor
 * Promotion Manager assigns distributor to retailer
 */
const assignDistributorToRetailer = async (req, res) => {
  try {
    if (req.user.role !== 'promotion_manager') {
      return res.status(403).json({ error: 'Only Promotion Managers can assign distributors' });
    }

    const { retailerId, distributorId } = req.body;
    if (!retailerId || !distributorId) {
      return res.status(400).json({ error: 'retailerId and distributorId required' });
    }

    const promotion = await Promotion.findById(req.params.id);
    if (!promotion) {
      return res.status(404).json({ error: 'Promotion not found' });
    }

    const participantIndex = promotion.participatingRetailers.findIndex(
      r => r.retailerId.toString() === retailerId
    );

    if (participantIndex === -1) {
      return res.status(404).json({ error: 'Retailer not found in this promotion' });
    }

    promotion.participatingRetailers[participantIndex].assignedDistributor = distributorId;
    await promotion.save();

    // Notify retailer and distributor
    await Notification.create({
      userId: retailerId,
      type: 'promo_material_assigned',
      message: `A distributor has been assigned to deliver promotional materials for: ${promotion.title}`,
      relatedPromotion: promotion._id
    });

    await Notification.create({
      userId: distributorId,
      type: 'promo_delivery',
      message: `You have been assigned to deliver materials for promotion: ${promotion.title}`,
      relatedPromotion: promotion._id
    });

    res.status(200).json({
      success: true,
      message: 'Distributor assigned successfully',
      promotion
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * POST /api/promotions/:id/rate
 * Retailer rates a promotion
 */
const ratePromotion = async (req, res) => {
  try {
    if (req.user.role !== 'retailer') {
      return res.status(403).json({ error: 'Only retailers can rate promotions' });
    }

    const { rating, feedback } = req.body;
    if (rating === undefined || rating < 0 || rating > 10) {
      return res.status(400).json({ error: 'Rating must be between 0 and 10' });
    }

    const promotion = await Promotion.findById(req.params.id);
    if (!promotion) {
      return res.status(404).json({ error: 'Promotion not found' });
    }

    const participantIndex = promotion.participatingRetailers.findIndex(
      r => r.retailerId.toString() === req.user._id.toString()
    );

    if (participantIndex === -1) {
      return res.status(400).json({ error: 'You have not opted into this promotion' });
    }

    promotion.participatingRetailers[participantIndex].rating = rating;
    promotion.participatingRetailers[participantIndex].ratingDate = new Date();
    if (feedback) promotion.participatingRetailers[participantIndex].feedback = feedback;

    await promotion.save();

    // Notify promotion manager of rating
    await Notification.create({
      userId: promotion.createdBy,
      type: 'promotion_rating',
      message: `Promotion "${promotion.title}" rated ${rating}/10 by a retailer`,
      relatedPromotion: promotion._id
    });

    res.status(200).json({
      success: true,
      message: 'Rating submitted successfully',
      promotion
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * GET /api/promotions/retailer/my-promotions
 * Get retailer's opted-in promotions
 */
const getRetailerPromotions = async (req, res) => {
  try {
    if (req.user.role !== 'retailer') {
      return res.status(403).json({ error: 'Only retailers can view their promotions' });
    }

    const promotions = await Promotion.find({
      'participatingRetailers.retailerId': req.user._id,
      'participatingRetailers.optedIn': true
    }).populate('createdBy', 'fullName email');

    res.status(200).json({
      success: true,
      promotions
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createPromotion,
  getAllPromotions,
  getPromotionById,
  updatePromotion,
  retailerOptInPromotion,
  assignDistributorToRetailer,
  ratePromotion,
  getRetailerPromotions
};
