import * as dashboardService from '../services/dashboard.service.js';

// ─── Summary ──────────────────────────────────────────────────────────────────

export const getSummary = async (req, res, next) => {
  try {
    const data = await dashboardService.getSummary();

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    return next(err);
  }
};

// ─── Category totals ──────────────────────────────────────────────────────────

export const getCategoryTotals = async (req, res, next) => {
  try {
    const data = await dashboardService.getCategoryTotals();

    return res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (err) {
    return next(err);
  }
};

// ─── Monthly trends ───────────────────────────────────────────────────────────

export const getMonthlyTrends = async (req, res, next) => {
  try {
    const { months } = req.query;
    const data = await dashboardService.getMonthlyTrends(months);

    return res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (err) {
    return next(err);
  }
};

// ─── Recent records ───────────────────────────────────────────────────────────

export const getRecentRecords = async (req, res, next) => {
  try {
    const { limit } = req.query;
    const data = await dashboardService.getRecentRecords(limit);

    return res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (err) {
    return next(err);
  }
};