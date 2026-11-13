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
    default: 0,
    min: 0
  },
  // Cash paid from counter drawer for this stock (optional, defaults to 0)
  cashPaid: {
    type: Number,
    default: 0
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

// Auto-fill year, month, and clean cashPaid before saving
stockSchema.pre('save', function(next) {
  const d = new Date(this.date);
  this.year = d.getFullYear();
  this.month = d.getMonth() + 1;
  if (this.cashPaid === undefined || this.cashPaid === null || isNaN(this.cashPaid)) {
    this.cashPaid = 0;
  }
  next();
});

module.exports = mongoose.model('Stock', stockSchema);
