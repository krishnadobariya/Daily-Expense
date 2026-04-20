const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Insight = require('../models/Insight');

// @route   GET /api/insights
// @desc    Get all insights for user
router.get('/', auth, async (req, res) => {
  try {
    const insights = await Insight.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(insights);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
