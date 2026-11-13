const Stock = require('../models/Stock');

// @desc  Add stock entry
// @route POST /api/stock
const addStock = async (req, res) => {
  try {
    const { amount, cashPaid, date, description } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'সঠিক পরিমাণ দিন।' });
    }

    // Cash paid is completely optional: if omitted, blank, or NaN, default to 0
    const finalCashPaid = (cashPaid !== undefined && cashPaid !== null && cashPaid !== '' && !isNaN(cashPaid)) 
      ? Math.max(0, Number(cashPaid)) 
      : 0;

    const stock = await Stock.create({
      manager: req.user.id,
      amount: Number(amount),
      cashPaid: finalCashPaid,
      date: date || new Date(),
      description
    });

    res.status(201).json({ message: 'মাল ঢোকার তথ্য সফলভাবে সেভ হয়েছে!', stock });
  } catch (error) {
    res.status(500).json({ message: 'সার্ভার এরর', error: error.message });
  }
};

// @desc  Get all stock entries (with optional month/year filter)
// @route GET /api/stock
const getStock = async (req, res) => {
  try {
    const { month, year } = req.query;
    const filter = { manager: req.user.id };

    if (month) filter.month = parseInt(month);
    if (year) filter.year = parseInt(year);

    const stocks = await Stock.find(filter).sort({ date: -1 });

    const totalAmount = stocks.reduce((sum, s) => sum + s.amount, 0);
    const totalCashPaid = stocks.reduce((sum, s) => sum + (Number(s.cashPaid) || 0), 0);

    res.json({ stocks, totalAmount, totalCashPaid });
  } catch (error) {
    res.status(500).json({ message: 'সার্ভার এরর', error: error.message });
  }
};

// @desc  Delete a stock entry
// @route DELETE /api/stock/:id
const deleteStock = async (req, res) => {
  try {
    const stock = await Stock.findOne({ _id: req.params.id, manager: req.user.id });
    if (!stock) return res.status(404).json({ message: 'এন্ট্রি পাওয়া যায়নি।' });

    await stock.deleteOne();
    res.json({ message: 'এন্ট্রি মুছে ফেলা হয়েছে।' });
  } catch (error) {
    res.status(500).json({ message: 'সার্ভার এরর', error: error.message });
  }
};

module.exports = { addStock, getStock, deleteStock };
