const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  category: {
    type: String,
    required: true,
    enum: ['food', 'travel', 'shopping', 'bills', 'entertainment', 'health', 'income', 'other'],
  },
  type: {
    type: String,
    required: true,
    enum: ['expense', 'income'],
  },
  date: {
    type: Date,
    default: Date.now,
  },
  note: {
    type: String,
  },
  familyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Family',
  },
}, { timestamps: true });

module.exports = mongoose.model('Transaction', transactionSchema);
