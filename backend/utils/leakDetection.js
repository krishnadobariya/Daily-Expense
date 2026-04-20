const Transaction = require('../models/Transaction');
const Insight = require('../models/Insight');

const analyzeLeaks = async (userId) => {
  try {
    const today = new Date();
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const prevLastWeek = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);

    // Get current week transactions
    const thisWeekDocs = await Transaction.find({
      userId,
      date: { $gte: lastWeek },
      type: 'expense'
    });

    const totalThisWeek = thisWeekDocs.reduce((sum, doc) => sum + doc.amount, 0);
    
    // 1. Category Threshold: > 30% of total
    const categoryTotals = {};
    thisWeekDocs.forEach(doc => {
      categoryTotals[doc.category] = (categoryTotals[doc.category] || 0) + doc.amount;
    });

    for (const [category, amount] of Object.entries(categoryTotals)) {
      if (amount > totalThisWeek * 0.3 && totalThisWeek > 0) {
        await Insight.findOneAndUpdate(
          { userId, category, type: 'leak' },
          { 
            message: `You spent ₹${amount} on ${category} this week, which is over 30% of your total spending!`,
            severity: 'medium'
          },
          { upsert: true }
        );
      }
    }

    // 2. Weekly Spike Detection
    const lastWeekDocs = await Transaction.find({
      userId,
      date: { $gte: prevLastWeek, $lt: lastWeek },
      type: 'expense'
    });

    const totalLastWeek = lastWeekDocs.reduce((sum, doc) => sum + doc.amount, 0);
    if (totalLastWeek > 0 && totalThisWeek > totalLastWeek * 1.4) {
      await Insight.findOneAndUpdate(
        { userId, type: 'spike' },
        { 
          message: `Your spending increased by ${Math.round(((totalThisWeek / totalLastWeek) - 1) * 100)}% compared to last week.`,
          severity: 'high'
        },
        { upsert: true }
      );
    }

  } catch (error) {
    console.error('Leak Detection Error:', error);
  }
};

module.exports = { analyzeLeaks };
