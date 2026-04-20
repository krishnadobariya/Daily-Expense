const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Family = require('../models/Family');
const User = require('../models/User');

// @route   POST /api/family/create
// @desc    Create a new family/group
router.post('/create', auth, async (req, res) => {
  try {
    const { name } = req.body;
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const family = new Family({
      name,
      admin: req.user.id,
      members: [req.user.id],
      inviteCode
    });
    
    await family.save();
    res.status(201).json(family);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/family/my-families
// @desc    Get all families the user belongs to
router.get('/my-families', auth, async (req, res) => {
  try {
    const families = await Family.find({ members: req.user.id }).populate('members', 'name email');
    res.json(families);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/family/join
// @desc    Join a family using an invite code
router.post('/join', auth, async (req, res) => {
  try {
    const { inviteCode } = req.body;
    const family = await Family.findOne({ inviteCode });
    
    if (!family) return res.status(404).json({ message: 'Invalid invite code' });
    if (family.members.includes(req.user.id)) return res.status(400).json({ message: 'Already a member' });
    
    family.members.push(req.user.id);
    await family.save();
    
    res.json(family);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/family/leave
// @desc    Leave a family
router.post('/leave/:id', auth, async (req, res) => {
  try {
    const family = await Family.findById(req.params.id);
    if (!family) return res.status(404).json({ message: 'Family not found' });
    
    family.members = family.members.filter(m => m.toString() !== req.user.id);
    
    if (family.members.length === 0) {
      await Family.findByIdAndDelete(req.params.id);
    } else if (family.admin.toString() === req.user.id) {
      family.admin = family.members[0];
      await family.save();
    } else {
      await family.save();
    }
    
    res.json({ message: 'Left family successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
