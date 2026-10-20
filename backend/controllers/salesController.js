const Sales = require('../models/Sales');

// @desc  Add daily sales entry
// @route POST /api/sales
const addSales = async (req, res) => {
  try {
    const { amount, date, description } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'সঠিক পরিমাণ দিন।' });
    }

    const sale = await Sales.create({
      manager: req.user.id,
      amount,
      date: date || new Date(),
      description
    });

    res.status(201).json({
      message: 'বিক্রয়ের তথ্য সেভ হয়েছে!',
      sale,
      incomeMessage: `আজকের আয় (১২%): ৳${sale.income}`
    });
  } catch (error) {
    res.status(500).json({ message: 'সার্ভার এরর', error: error.message });
  }
};

// @desc  Get all sales (with optional month/year filter)
// @route GET /api/sales
const getSales = async (req, res) => {
  try {
    const { month, year } = req.query;
    const filter = { manager: req.user.id };

    if (month) filter.month = parseInt(month);
    if (year) filter.year = parseInt(year);

    const sales = await Sales.find(filter).sort({ date: -1 });

    const totalSales = sales.reduce((sum, s) => sum + s.amount, 0);
    const totalIncome = sales.reduce((sum, s) => sum + s.income, 0);

    res.json({
      sales,
      totalSales: parseFloat(totalSales.toFixed(2)),
      totalIncome: parseFloat(totalIncome.toFixed(2))
    });
  } catch (error) {
    res.status(500).json({ message: 'সার্ভার এরর', error: error.message });
  }
};

// @desc  Delete a sales entry
// @route DELETE /api/sales/:id
const deleteSales = async (req, res) => {
  try {
    const sale = await Sales.findOne({ _id: req.params.id, manager: req.user.id });
    if (!sale) return res.status(404).json({ message: 'এন্ট্রি পাওয়া যায়নি।' });

    await sale.deleteOne();
    res.json({ message: 'এন্ট্রি মুছে ফেলা হয়েছে।' });
  } catch (error) {
    res.status(500).json({ message: 'সার্ভার এরর', error: error.message });
  }
};

module.exports = { addSales, getSales, deleteSales };
