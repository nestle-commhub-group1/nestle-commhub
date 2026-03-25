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
// ─── TEMPORARY SEED — remove after production fix ─────────────────────────────
// Hit: POST /api/auth/run-seed
// Wipes and re-seeds the production ValidEmployee collection
router.post('/run-seed', async (req, res) => {
  try {
    let ValidEmployee;
    try {
      ValidEmployee = require('../models/ValidEmployee');
    } catch (e) {
      return res.status(500).json({ success: false, message: 'ValidEmployee model not found', error: e.message });
    }

    const EMPLOYEES = [
      { employeeId: "NES-DEV-999", role: "hq_admin" },
      { employeeId: "NES-DEV-888", role: "sales_staff" },
      { employeeId: "NES-DEV-777", role: "distributor" },
      { employeeId: "NES001",      role: "hq_admin" },
      { employeeId: "NES002",      role: "sales_staff" },
      { employeeId: "NES004",      role: "distributor" },
      { employeeId: "NES100",      role: "hq_admin" },
      { employeeId: "NES111",      role: "hq_admin" },
      { employeeId: "NES200",      role: "sales_staff" },
      { employeeId: "NES400",      role: "distributor" },
      { employeeId: "NES123456",   role: "sales_staff" }
    ];

    // Wipe old data
    await ValidEmployee.deleteMany({});
    console.log("🗑️ Production ValidEmployee collection cleared.");

    // Insert new data
    const result = await ValidEmployee.insertMany(EMPLOYEES);
    console.log(`✅ Production ValidEmployee re-seeded with ${result.length} records.`);

    res.json({
      success: true,
      message: "Production database re-seeded successfully.",
      count: result.length,
      employees: result.map(e => e.employeeId),
      note: 'TEMP SEED ENDPOINT — REMOVE from authRoutes.js after use'
    });
  } catch (err) {
    console.error("❌ Seed endpoint error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});
// ─────────────────────────────────────────────────────────────────────────────

module.exports = router;
