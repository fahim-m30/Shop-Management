const mongoose = require('mongoose');

const stockSchema = new mongoose.Schema({
  manager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  // Cash paid from counter drawer for this stock
  cashPaid: {
    type: Number,
    default: function() {
      return this.amount || 0;
    }
  },
  description: {
    type: String,
    default: ''
  },
  // Extracted year/month for easy querying
  year: {
    type: Number
  },
  month: {
    type: Number
  }
}, { timestamps: true });

// Auto-fill year, month, and default cashPaid before saving
stockSchema.pre('save', function(next) {
  const d = new Date(this.date);
  this.year = d.getFullYear();
  this.month = d.getMonth() + 1;
  if (this.cashPaid === undefined || this.cashPaid === null) {
    this.cashPaid = this.amount;
  }
  next();
});

module.exports = mongoose.model('Stock', stockSchema);
