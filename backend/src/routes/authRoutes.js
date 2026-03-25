const express = require('express');
const router = express.Router();
const { registerUser, loginUser } = require('../controllers/authController');

router.post('/register', registerUser);
router.post('/login', loginUser);

// ─── TEMPORARY DEBUG — remove after production fix ────────────────────────────
// Hit: GET /api/auth/check-employees
// Returns every document in the ValidEmployee collection so you can see
// exactly what IDs are seeded (and their isUsed state) in production.
router.get('/check-employees', async (req, res) => {
  try {
    let ValidEmployee;
    try {
      ValidEmployee = require('../models/ValidEmployee');
    } catch (e) {
      return res.status(500).json({ success: false, message: 'ValidEmployee model not found', error: e.message });
    }
    const docs = await ValidEmployee.find({}).lean();
    res.json({
      success: true,
      count: docs.length,
      employees: docs,
      note: 'TEMP DEBUG ENDPOINT — remove from authRoutes.js after use',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
// ─────────────────────────────────────────────────────────────────────────────

module.exports = router;
