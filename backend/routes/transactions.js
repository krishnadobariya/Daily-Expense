const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Transaction = require('../models/Transaction');
const Family = require('../models/Family');
const { analyzeLeaks } = require('../utils/leakDetection');
const multer = require('multer');
const Tesseract = require('tesseract.js');
const fs = require('fs');
const path = require('path');

// Multer Config
const upload = multer({ dest: 'uploads/' });

// @route   POST /api/transactions
// @desc    Add a transaction
router.post('/', auth, async (req, res) => {
  try {
    const { amount, category, type, note, date, familyId } = req.body;
    
    // If familyId is provided, verify membership
    if (familyId) {
      const family = await Family.findOne({ _id: familyId, members: req.user.id });
      if (!family) return res.status(403).json({ message: 'Not a member of this family' });
    }

    const transaction = new Transaction({
      userId: req.user.id,
      amount,
      category,
      type,
      note,
      date: date || new Date(),
      familyId: familyId || null
    });

    await transaction.save();

    // Real-time update
    if (familyId) {
      req.io.to(`family_${familyId}`).emit('new_transaction', {
        familyId,
        transaction,
        userName: req.user.name
      });
    }

    // Trigger leak detection in background
    analyzeLeaks(req.user.id);

    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/transactions
// @desc    Get all transactions (Personal + Families)
router.get('/', auth, async (req, res) => {
  try {
    // Find all families user belongs to
    const myFamilies = await Family.find({ members: req.user.id }).select('_id');
    const familyIds = myFamilies.map(f => f._id);

    // Query for personal OR family transactions
    const transactions = await Transaction.find({
      $or: [
        { userId: req.user.id },
        { familyId: { $in: familyIds } }
      ]
    }).sort({ date: -1 }).populate('userId', 'name');

    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/transactions/:id
// @desc    Delete a transaction
router.delete('/:id', auth, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });

    // Enforce Read-only after leaving rule
    if (transaction.familyId) {
      const family = await Family.findOne({ _id: transaction.familyId, members: req.user.id });
      if (!family) return res.status(403).json({ message: 'Read-only: You are no longer a member of this family' });
    }

    // Only creator can delete
    if (transaction.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the creator can delete this transaction' });
    }

    await Transaction.findByIdAndDelete(req.params.id);
    res.json({ message: 'Transaction removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/transactions/scan
// @desc    Scan receipt OCR
router.post('/scan', [auth, upload.single('receipt')], async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  try {
    const { path: filePath } = req.file;
    
    // Perform OCR
    const { data: { text } } = await Tesseract.recognize(filePath, 'eng');
    
    // Clean up file
    fs.unlinkSync(filePath);

    // Simple Parsing Logic
    const lines = text.split('\n');
    let amount = 0;
    let category = 'other';

    // Regex for amounts
    const amountRegex = /([0-9]+[\.,][0-9]{2})/g;
    const matches = text.match(amountRegex);
    
    if (matches) {
      const numbers = matches.map(m => parseFloat(m.replace(',', '.')));
      amount = Math.max(...numbers); // Usually the largest number is the total
    }

    // Keyword based category
    const textLower = text.toLowerCase();
    if (textLower.includes('food') || textLower.includes('restaurant') || textLower.includes('cafe') || textLower.includes('kitchen')) category = 'food';
    else if (textLower.includes('travel') || textLower.includes('taxi') || textLower.includes('fuel') || textLower.includes('uber')) category = 'travel';
    else if (textLower.includes('medical') || textLower.includes('pharmacy') || textLower.includes('health')) category = 'health';
    else if (textLower.includes('shopping') || textLower.includes('store') || textLower.includes('mart')) category = 'shopping';

    res.json({ amount, category, rawText: text });
  } catch (error) {
    console.error('OCR Error:', error);
    res.status(500).json({ message: 'Error processing receipt' });
  }
});

module.exports = router;
