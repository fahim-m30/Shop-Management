const Sales = require('../models/Sales');
const Stock = require('../models/Stock');

// Helper to get today's business date range for retail shops in Bangladesh (Asia/Dhaka)
// In Bangladesh shops, closing happens late night (12 AM - 5 AM).
// Transactions entered between 00:00 and 04:59 belong to the active business day that just ended.
// From 05:00 AM onwards, the new business calendar day begins.
const getBangladeshTodayRange = () => {
  const now = new Date();
  const dhakaFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Dhaka',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    hour12: false
  });
  const parts = dhakaFormatter.formatToParts(now);
  let y = parseInt(parts.find(p => p.type === 'year').value);
  let m = parseInt(parts.find(p => p.type === 'month').value) - 1;
  let d = parseInt(parts.find(p => p.type === 'day').value);
  const hour = parseInt(parts.find(p => p.type === 'hour').value);

  // Late night retail business logic: 00:00 - 04:59 belongs to previous calendar day
  if (hour < 5) {
    const prev = new Date(Date.UTC(y, m, d - 1));
    y = prev.getUTCFullYear();
    m = prev.getUTCMonth();
    d = prev.getUTCDate();
  }

  // HTML <input type="date"> saves as UTC midnight (YYYY-MM-DDT00:00:00.000Z).
  // So start and end match from 00:00:00 to 23:59:59 UTC on that business date.
  const start = new Date(Date.UTC(y, m, d, 0, 0, 0, 0));
  const end = new Date(Date.UTC(y, m, d, 23, 59, 59, 999));

  return { start, end };
};

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
    const totalMonthlyCashStock = monthlyStock.reduce((sum, s) => sum + (Number(s.cashPaid) || 0), 0);
    const totalMonthlyOwnStock = monthlyStock.reduce((sum, s) => sum + (s.ownAmount !== undefined ? Number(s.ownAmount) : Math.max(0, s.amount - (Number(s.cashPaid) || 0))), 0);

    // --- All Time Stats ---
    const allSales = await Sales.find({ manager: managerId });
    const allStock = await Stock.find({ manager: managerId });

    const totalAllTimeSales = allSales.reduce((sum, s) => sum + s.amount, 0);
    const totalAllTimeIncome = allSales.reduce((sum, s) => sum + s.income, 0);
    const totalAllTimeStock = allStock.reduce((sum, s) => sum + s.amount, 0);
    const totalAllTimeCashStock = allStock.reduce((sum, s) => sum + (Number(s.cashPaid) || 0), 0);
    const totalAllTimeOwnStock = allStock.reduce((sum, s) => sum + (s.ownAmount !== undefined ? Number(s.ownAmount) : Math.max(0, s.amount - (Number(s.cashPaid) || 0))), 0);

    // --- Today's Stats (Accurate to Bangladesh Time) ---
    const { start: todayStart, end: todayEnd } = getBangladeshTodayRange();

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
    // Cash given from drawer for stock purchases today (জমানো টাকা)
    const totalTodayCashStock = todayStock.reduce((sum, s) => sum + (Number(s.cashPaid) || 0), 0);
    // Own pocket money for stock purchases today (নিজের টাকা)
    const totalTodayOwnStock = todayStock.reduce((sum, s) => sum + (s.ownAmount !== undefined ? Number(s.ownAmount) : Math.max(0, s.amount - (Number(s.cashPaid) || 0))), 0);
    // Daily Cash in Hand = Today's Sales - Today's Cash spent on Stock
    const todayRemainingCash = totalTodaySales - totalTodayCashStock;

    // --- Last Active Day Stats (সর্বশেষ যে তারিখে লেনদেন হয়েছিল) ---
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

      const lSalesTotal = lSales.reduce((sum, s) => sum + s.amount, 0);
      const lStockTotal = lStock.reduce((sum, s) => sum + s.amount, 0);
      const lCashStock = lStock.reduce((sum, s) => sum + (Number(s.cashPaid) || 0), 0);
      const lOwnStock = lStock.reduce((sum, s) => sum + (s.ownAmount !== undefined ? Number(s.ownAmount) : Math.max(0, s.amount - (Number(s.cashPaid) || 0))), 0);

      lastDayStats = {
        date: lastActiveDate,
        totalSales: parseFloat(lSalesTotal.toFixed(2)),
        totalIncome: parseFloat(lSales.reduce((sum, s) => sum + s.income, 0).toFixed(2)),
        totalStock: parseFloat(lStockTotal.toFixed(2)),
        totalCashStock: parseFloat(lCashStock.toFixed(2)),
        totalOwnStock: parseFloat(lOwnStock.toFixed(2)),
        remainingCash: parseFloat((lSalesTotal - lCashStock).toFixed(2))
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
        totalStock: parseFloat(totalTodayStock.toFixed(2)),
        totalCashStock: parseFloat(totalTodayCashStock.toFixed(2)),
        totalOwnStock: parseFloat(totalTodayOwnStock.toFixed(2)),
        remainingCash: parseFloat(todayRemainingCash.toFixed(2))
      },
      lastDay: lastDayStats,
      monthly: {
        totalSales: parseFloat(totalMonthlySales.toFixed(2)),
        totalIncome: parseFloat(totalMonthlyIncome.toFixed(2)),
        totalStock: parseFloat(totalMonthlyStock.toFixed(2)),
        totalCashStock: parseFloat(totalMonthlyCashStock.toFixed(2)),
        totalOwnStock: parseFloat(totalMonthlyOwnStock.toFixed(2))
      },
      allTime: {
        totalSales: parseFloat(totalAllTimeSales.toFixed(2)),
        totalIncome: parseFloat(totalAllTimeIncome.toFixed(2)),
        totalStock: parseFloat(totalAllTimeStock.toFixed(2)),
        totalCashStock: parseFloat(totalAllTimeCashStock.toFixed(2)),
        totalOwnStock: parseFloat(totalAllTimeOwnStock.toFixed(2))
      },
      monthlyBreakdown
    });
  } catch (error) {
    res.status(500).json({ message: 'সার্ভার এরর', error: error.message });
  }
};

module.exports = { getDashboard };
