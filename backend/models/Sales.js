const mongoose = require('mongoose');

const salesSchema = new mongoose.Schema({
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
  // Income = 12% of sales amount
  income: {
    type: Number
  },
  description: {
    type: String,
    default: ''
  },
  year: {
    type: Number
  },
  month: {
    type: Number
  }
}, { timestamps: true });

// Auto-calculate income (12%) and fill year/month
salesSchema.pre('save', function(next) {
  this.income = parseFloat((this.amount * 0.12).toFixed(2));
  const d = new Date(this.date);
  this.year = d.getFullYear();
  this.month = d.getMonth() + 1;
  next();
});

module.exports = mongoose.model('Sales', salesSchema);
