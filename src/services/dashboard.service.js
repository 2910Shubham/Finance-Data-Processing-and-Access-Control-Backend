import FinancialRecord from '../models/FinancialRecord.js';

// ─── Summary ──────────────────────────────────────────────────────────────────
// Total income, total expenses, net balance, record count

export const getSummary = async () => {
  const result = await FinancialRecord.aggregate([
    { $match: { deletedAt: null } },
    {
      $group: {
        _id:   '$type',
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
  ]);

  // aggregate returns only types that exist — default both to 0
  const summary = { income: 0, expense: 0, incomeCount: 0, expenseCount: 0 };

  result.forEach(({ _id, total, count }) => {
    if (_id === 'income') {
      summary.income      = total;
      summary.incomeCount = count;
    }
    if (_id === 'expense') {
      summary.expense      = total;
      summary.expenseCount = count;
    }
  });

  return {
    totalIncome:   summary.income,
    totalExpenses: summary.expense,
    netBalance:    summary.income - summary.expense,
    recordCount:   summary.incomeCount + summary.expenseCount,
  };
};

// ─── Category totals ──────────────────────────────────────────────────────────
// Total amount per category, split by type

export const getCategoryTotals = async () => {
  const result = await FinancialRecord.aggregate([
    { $match: { deletedAt: null } },
    {
      $group: {
        _id:   { category: '$category', type: '$type' },
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: '$_id.category',
        breakdown: {
          $push: {
            type:  '$_id.type',
            total: '$total',
            count: '$count',
          },
        },
        categoryTotal: { $sum: '$total' },
      },
    },
    { $sort: { categoryTotal: -1 } }, // highest spend first
  ]);

  // reshape for clean API response
  return result.map(({ _id, breakdown, categoryTotal }) => ({
    category:      _id,
    total:         categoryTotal,
    breakdown:     breakdown.reduce((acc, { type, total, count }) => {
      acc[type] = { total, count };
      return acc;
    }, {}),
  }));
};

// ─── Monthly trends ───────────────────────────────────────────────────────────
// Income vs expense per month for the last N months

export const getMonthlyTrends = async (months = 6) => {
  const monthsNum = Math.min(24, Math.max(1, parseInt(months))); // clamp 1–24
  const since     = new Date();
  since.setMonth(since.getMonth() - monthsNum);
  since.setDate(1);
  since.setHours(0, 0, 0, 0);

  const result = await FinancialRecord.aggregate([
    {
      $match: {
        deletedAt: null,
        date:      { $gte: since },
      },
    },
    {
      $group: {
        _id: {
          year:  { $year:  '$date' },
          month: { $month: '$date' },
          type:  '$type',
        },
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    {
      $group: {
        _id: {
          year:  '$_id.year',
          month: '$_id.month',
        },
        entries: {
          $push: {
            type:  '$_id.type',
            total: '$total',
            count: '$count',
          },
        },
      },
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1 },
    },
  ]);

  // build a clean month-keyed structure, filling gaps with zeroes
  const monthMap = buildMonthMap(monthsNum);

  result.forEach(({ _id, entries }) => {
    const key = `${_id.year}-${String(_id.month).padStart(2, '0')}`;
    if (monthMap[key]) {
      entries.forEach(({ type, total, count }) => {
        if (type === 'income')  {
          monthMap[key].income        = total;
          monthMap[key].incomeCount   = count;
        }
        if (type === 'expense') {
          monthMap[key].expense       = total;
          monthMap[key].expenseCount  = count;
        }
      });
      monthMap[key].net = monthMap[key].income - monthMap[key].expense;
    }
  });

  return Object.values(monthMap);
};

// builds an ordered map of the last N months all pre-filled with zeroes
// so months with no records still appear in the response
const buildMonthMap = (months) => {
  const map  = {};
  const now  = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const d     = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year  = d.getFullYear();
    const month = d.getMonth() + 1;
    const key   = `${year}-${String(month).padStart(2, '0')}`;
    const label = d.toLocaleString('default', { month: 'short', year: 'numeric' });

    map[key] = {
      month:        key,
      label,
      income:       0,
      expense:      0,
      net:          0,
      incomeCount:  0,
      expenseCount: 0,
    };
  }

  return map;
};

// ─── Recent records ───────────────────────────────────────────────────────────
// Last N active records sorted by date descending

export const getRecentRecords = async (limit = 5) => {
  const limitNum = Math.min(50, Math.max(1, parseInt(limit))); // clamp 1–50

  return FinancialRecord.find({ deletedAt: null })
    .populate('createdBy', 'name email')
    .sort({ date: -1 })
    .limit(limitNum);
};