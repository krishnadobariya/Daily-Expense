const mongoose = require('mongoose');

const insightSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'low',
  },
  category: {
    type: String, // Which category this insight is about
  },
  type: {
    type: String, // 'leak' or 'budget' or 'streak'
  }
}, { timestamps: true });

module.exports = mongoose.model('Insight', insightSchema);
