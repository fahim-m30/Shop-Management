const Sales = require('../models/Sales');
const Stock = require('../models/Stock');

// @desc  Get dashboard summary (current month by default)
// @route GET /api/dashboard
const getDashboard = async (req, res) => {
  try {
    const now = new Date();
    const month = parseInt(req.query.month) || (now.getMonth() + 1);
    const year = parseInt(req.query.year) || now.getFullYear();

    const managerId = req.user.id;

    // --- Current Month Stats ---
    const monthlySales = await Sales.find({ manager: managerId, month, year });
    const monthlyStock = await Stock.find({ manager: managerId, month, year });

    const totalMonthlySales = monthlySales.reduce((sum, s) => sum + s.amount, 0);
    const totalMonthlyIncome = monthlySales.reduce((sum, s) => sum + s.income, 0);
    const totalMonthlyStock = monthlyStock.reduce((sum, s) => sum + s.amount, 0);

    // --- All Time Stats ---
    const allSales = await Sales.find({ manager: managerId });
    const allStock = await Stock.find({ manager: managerId });

    const totalAllTimeSales = allSales.reduce((sum, s) => sum + s.amount, 0);
    const totalAllTimeIncome = allSales.reduce((sum, s) => sum + s.income, 0);
    const totalAllTimeStock = allStock.reduce((sum, s) => sum + s.amount, 0);

    // --- Today's Stats ---
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todaySales = await Sales.find({
      manager: managerId,
      date: { $gte: todayStart, $lte: todayEnd }
    });
    const todayStock = await Stock.find({
      manager: managerId,
      date: { $gte: todayStart, $lte: todayEnd }
    });

    const totalTodaySales = todaySales.reduce((sum, s) => sum + s.amount, 0);
    const totalTodayIncome = todaySales.reduce((sum, s) => sum + s.income, 0);
    const totalTodayStock = todayStock.reduce((sum, s) => sum + s.amount, 0);

    // --- Last Active Day Stats (সর্বশেষ যে তারিখে লেনদেন হয়েছিল) ---
    const latestSale = await Sales.findOne({ manager: managerId }).sort({ date: -1 });
    const latestStock = await Stock.findOne({ manager: managerId }).sort({ date: -1 });

    let lastActiveDate = null;
    if (latestSale && latestStock) {
      lastActiveDate = new Date(latestSale.date) > new Date(latestStock.date) 
        ? new Date(latestSale.date) 
        : new Date(latestStock.date);
    } else if (latestSale) {
      lastActiveDate = new Date(latestSale.date);
    } else if (latestStock) {
      lastActiveDate = new Date(latestStock.date);
    }

    let lastDayStats = null;
    if (lastActiveDate) {
      const lStart = new Date(lastActiveDate);
      lStart.setHours(0, 0, 0, 0);
      const lEnd = new Date(lastActiveDate);
      lEnd.setHours(23, 59, 59, 999);

      const lSales = await Sales.find({
        manager: managerId,
        date: { $gte: lStart, $lte: lEnd }
      });
      const lStock = await Stock.find({
        manager: managerId,
        date: { $gte: lStart, $lte: lEnd }
      });

      lastDayStats = {
        date: lastActiveDate,
        totalSales: parseFloat(lSales.reduce((sum, s) => sum + s.amount, 0).toFixed(2)),
        totalIncome: parseFloat(lSales.reduce((sum, s) => sum + s.income, 0).toFixed(2)),
        totalStock: parseFloat(lStock.reduce((sum, s) => sum + s.amount, 0).toFixed(2))
      };
    }

    // --- Monthly breakdown for chart (last 6 months) ---
    const monthlyBreakdown = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(year, month - 1 - i, 1);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();

      const mSales = await Sales.find({ manager: managerId, month: m, year: y });
      const mStock = await Stock.find({ manager: managerId, month: m, year: y });

      monthlyBreakdown.push({
        label: `${y}-${String(m).padStart(2, '0')}`,
        month: m,
        year: y,
        totalSales: parseFloat(mSales.reduce((s, x) => s + x.amount, 0).toFixed(2)),
        totalIncome: parseFloat(mSales.reduce((s, x) => s + x.income, 0).toFixed(2)),
        totalStock: parseFloat(mStock.reduce((s, x) => s + x.amount, 0).toFixed(2))
      });
    }

    res.json({
      selectedMonth: { month, year },
      todayDate: now,
      today: {
        totalSales: parseFloat(totalTodaySales.toFixed(2)),
        totalIncome: parseFloat(totalTodayIncome.toFixed(2)),
        totalStock: parseFloat(totalTodayStock.toFixed(2))
      },
      lastDay: lastDayStats,
      monthly: {
        totalSales: parseFloat(totalMonthlySales.toFixed(2)),
        totalIncome: parseFloat(totalMonthlyIncome.toFixed(2)),
        totalStock: parseFloat(totalMonthlyStock.toFixed(2))
      },
      allTime: {
        totalSales: parseFloat(totalAllTimeSales.toFixed(2)),
        totalIncome: parseFloat(totalAllTimeIncome.toFixed(2)),
        totalStock: parseFloat(totalAllTimeStock.toFixed(2))
      },
      monthlyBreakdown
    });
  } catch (error) {
    res.status(500).json({ message: 'সার্ভার এরর', error: error.message });
  }
};

module.exports = { getDashboard };
