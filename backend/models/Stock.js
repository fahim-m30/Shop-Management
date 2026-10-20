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

// Auto-fill year and month before saving
stockSchema.pre('save', function(next) {
  const d = new Date(this.date);
  this.year = d.getFullYear();
  this.month = d.getMonth() + 1;
  next();
});

module.exports = mongoose.model('Stock', stockSchema);
