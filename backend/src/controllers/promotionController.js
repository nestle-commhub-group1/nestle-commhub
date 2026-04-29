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
      .populate('participatingRetailers.retailerId', 'fullName email businessName')
      .populate('salesData.retailerId', 'fullName email businessName')
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
      .populate('participatingRetailers.assignedDistributor', 'fullName email')
      .populate('salesData.retailerId', 'fullName email businessName');

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

    const isCompleted = new Date(promotion.endDate) < new Date();

    if (isCompleted) {
      promotion.participatingRetailers[participantIndex].rating = rating;
      promotion.participatingRetailers[participantIndex].ratingDate = new Date();
      if (feedback) promotion.participatingRetailers[participantIndex].feedback = feedback;
    } else {
      // Store as mid-promotion feedback
      if (!promotion.participatingRetailers[participantIndex].midPromotionFeedbacks) {
        promotion.participatingRetailers[participantIndex].midPromotionFeedbacks = [];
      }
      promotion.participatingRetailers[participantIndex].midPromotionFeedbacks.push({
        rating,
        feedback,
        submittedAt: new Date()
      });
    }

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

/**
 * POST /api/promotions/:id/attachments
 * Add attachment to promotion (Promotion Manager only)
 */
const addPromotionAttachment = async (req, res) => {
  try {
    if (req.user.role !== 'promotion_manager') {
      return res.status(403).json({ error: 'Only Promotion Managers can add attachments' });
    }

    const { filename, base64Data, type } = req.body;
    if (!filename || !base64Data) {
      return res.status(400).json({ error: 'filename and base64Data required' });
    }

    const promotion = await Promotion.findById(req.params.id);
    if (!promotion) {
      return res.status(404).json({ error: 'Promotion not found' });
    }

    promotion.attachments.push({
      filename,
      url: base64Data,
      uploadedAt: new Date(),
      type: type || 'document'
    });

    await promotion.save();

    res.status(200).json({
      success: true,
      message: 'Attachment added successfully',
      promotion
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * POST /api/promotions/:id/sales-report
 * Retailer submits units sold performance
 */
const submitSalesReport = async (req, res) => {
  try {
    if (req.user.role !== 'retailer') {
      return res.status(403).json({ error: 'Only retailers can submit sales reports' });
    }

    const { unitsSold } = req.body;
    if (unitsSold === undefined) {
      return res.status(400).json({ error: 'unitsSold required' });
    }

    const promotion = await Promotion.findById(req.params.id);
    if (!promotion) {
      return res.status(404).json({ error: 'Promotion not found' });
    }

    // Calculate reward tier based on tiered config
    let rewardTier, rewardAmount;
    if (unitsSold <= promotion.rewards.tier1.maxUnits) {
      rewardTier = 'tier1';
      rewardAmount = promotion.rewards.tier1.rewardAmount;
    } else if (unitsSold <= promotion.rewards.tier2.maxUnits) {
      rewardTier = 'tier2';
      rewardAmount = promotion.rewards.tier2.rewardAmount;
    } else {
      rewardTier = 'tier3';
      rewardAmount = promotion.rewards.tier3.rewardAmount;
    }

    // Upsert sales entry for this retailer
    const existingSale = promotion.salesData.find(
      s => s.retailerId.toString() === req.user._id.toString()
    );

    if (existingSale) {
      existingSale.unitsSold = unitsSold;
      existingSale.submittedAt = new Date();
      existingSale.rewardTier = rewardTier;
      existingSale.rewardAmount = unitsSold; // NEW: 1:1 reward ratio as requested
    } else {
      promotion.salesData.push({
        retailerId: req.user._id,
        unitsSold,
        submittedAt: new Date(),
        rewardTier,
        rewardAmount: unitsSold, // NEW: 1:1 reward ratio as requested
        rewardIssuedAt: null // Explicitly null until PM approves
      });
    }

    await promotion.save();

    // Notify PM of performance
    await Notification.create({
      userId: promotion.createdBy,
      type: 'sales_report',
      message: `Retailer reported ${unitsSold} units for promotion: ${promotion.title}. Tier: ${rewardTier}.`,
      relatedPromotion: promotion._id
    });

    res.status(200).json({
      success: true,
      message: 'Sales report submitted successfully',
      rewardTier,
      rewardAmount,
      promotion
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * POST /api/promotions/send-sales-reminders
 * Automated job logic to notify retailers of ending campaigns
 */
const sendSalesReminders = async (req, res) => {
  try {
    // Check for promotions ending within 48 hours
    const endingSoon = await Promotion.find({
      endDate: { $lte: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) },
      status: 'active'
    });

    for (const promo of endingSoon) {
      for (const participant of promo.participatingRetailers) {
        if (participant.optedIn) {
          await Notification.create({
            userId: participant.retailerId,
            type: 'sales_reminder',
            message: `Current promotion "${promo.title}" ends in 2 days. Don't forget to submit your final sales figures to claim rewards!`,
            relatedPromotion: promo._id
          });
        }
      }
    }

    res.status(200).json({
      success: true,
      message: `Sent reminders for ${endingSoon.length} campaigns`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * POST /api/promotions/:id/approve-reward
 * Promotion Manager approves and issues credits to retailer
 */
const approveReward = async (req, res) => {
  try {
    if (req.user.role !== 'promotion_manager') {
      return res.status(403).json({ error: 'Only Promotion Managers can approve rewards' });
    }

    const { retailerId } = req.body;
    if (!retailerId) {
      return res.status(400).json({ error: 'retailerId required' });
    }

    const promotion = await Promotion.findById(req.params.id);
    if (!promotion) {
      return res.status(404).json({ error: 'Promotion not found' });
    }

    const salesEntry = promotion.salesData.find(
      s => (s.retailerId._id || s.retailerId).toString() === retailerId
    );

    if (!salesEntry) {
      return res.status(404).json({ error: 'No sales report found for this retailer' });
    }

    if (salesEntry.rewardIssuedAt) {
      return res.status(400).json({ error: 'Reward already issued' });
    }

    // 1. Mark as issued in promotion
    salesEntry.rewardIssuedAt = new Date();

    // 2. Add credits to retailer user account
    const retailer = await User.findById(retailerId);
    if (!retailer) {
        return res.status(404).json({ error: 'Retailer not found' });
    }
    
    retailer.credits = (retailer.credits || 0) + (salesEntry.rewardAmount || 0);
    await retailer.save();

    await promotion.save();

    // 3. Notify retailer
    await Notification.create({
      userId: retailerId,
      type: 'reward_issued',
      message: `Your reward of ${salesEntry.rewardAmount} loyalty points for promotion "${promotion.title}" has been approved and added to your wallet!`,
      relatedPromotion: promotion._id
    });

    res.status(200).json({
      success: true,
      message: 'Reward approved and loyalty points issued successfully',
      credits: retailer.credits
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * DELETE /api/promotions/:id
 * Delete promotion (Promotion Manager only)
 */
const deletePromotion = async (req, res) => {
  try {
    const promotion = await Promotion.findById(req.params.id);
    if (!promotion) {
      return res.status(404).json({ error: 'Promotion not found' });
    }

    // Only the creator can delete
    if (promotion.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Only the promotion creator can delete it' });
    }

    await Promotion.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Promotion deleted successfully'
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
  deletePromotion,
  retailerOptInPromotion,
  assignDistributorToRetailer,
  ratePromotion,
  getRetailerPromotions,
  addPromotionAttachment,
  submitSalesReport,
  sendSalesReminders,
  approveReward
};
