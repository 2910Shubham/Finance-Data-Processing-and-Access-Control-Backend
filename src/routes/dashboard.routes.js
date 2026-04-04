import { Router } from 'express';
import { query } from 'express-validator';
import {
  getSummary,
  getCategoryTotals,
  getMonthlyTrends,
  getRecentRecords,
} from '../controllers/dashboard.controller.js';
import verifyToken from '../middlewares/verifyToken.js';
import requireRole from '../middlewares/requireRole.js';
import validate    from '../middlewares/validate.js';

const router = Router();

const ALL_ROLES      = ['admin', 'analyst', 'viewer'];
const ANALYST_ADMIN  = ['admin', 'analyst'];

// ─── Validation ───────────────────────────────────────────────────────────────

const trendsValidation = [
  query('months')
    .optional()
    .isInt({ min: 1, max: 24 })
    .withMessage('months must be an integer between 1 and 24'),
];

const recentValidation = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('limit must be an integer between 1 and 50'),
];

// ─── Routes ───────────────────────────────────────────────────────────────────

router.get(
  '/summary',
  verifyToken,
  requireRole(ALL_ROLES),
  getSummary
);

router.get(
  '/categories',
  verifyToken,
  requireRole(ALL_ROLES),
  getCategoryTotals
);

router.get(
  '/trends',
  verifyToken,
  requireRole(ANALYST_ADMIN),
  trendsValidation,
  validate,
  getMonthlyTrends
);

router.get(
  '/recent',
  verifyToken,
  requireRole(ALL_ROLES),
  recentValidation,
  validate,
  getRecentRecords
);

export default router;