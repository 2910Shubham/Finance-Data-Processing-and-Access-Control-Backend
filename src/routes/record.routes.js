import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  getAllRecords,
  getRecord,
  createRecord,
  updateRecord,
  deleteRecord,
} from '../controllers/record.controller.js';
import verifyToken   from '../middlewares/verifyToken.js';
import requireRole   from '../middlewares/requireRole.js';
import validate      from '../middlewares/validate.js';

const router = Router();

const ALL_ROLES   = ['admin', 'analyst', 'viewer'];
const ADMIN_ONLY  = ['admin'];

// ─── Validation rules ─────────────────────────────────────────────────────────

const createValidation = [
  body('amount')
    .notEmpty().withMessage('Amount is required')
    .isFloat({ gt: 0 }).withMessage('Amount must be a number greater than zero'),

  body('type')
    .notEmpty().withMessage('Type is required')
    .isIn(['income', 'expense']).withMessage('Type must be income or expense'),

  body('category')
    .trim()
    .notEmpty().withMessage('Category is required'),

  body('date')
    .notEmpty().withMessage('Date is required')
    .isISO8601().withMessage('Date must be a valid date (YYYY-MM-DD)'),

  body('notes')
    .optional()
    .isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters'),
];

const updateValidation = [
  param('id')
    .notEmpty().withMessage('Record ID is required'),

  body('amount')
    .optional()
    .isFloat({ gt: 0 }).withMessage('Amount must be a number greater than zero'),

  body('type')
    .optional()
    .isIn(['income', 'expense']).withMessage('Type must be income or expense'),

  body('category')
    .optional()
    .trim()
    .notEmpty().withMessage('Category cannot be empty'),

  body('date')
    .optional()
    .isISO8601().withMessage('Date must be a valid date (YYYY-MM-DD)'),

  body('notes')
    .optional()
    .isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters'),
];

const listQueryValidation = [
  query('type')
    .optional()
    .isIn(['income', 'expense']).withMessage('Type must be income or expense'),

  query('from')
    .optional()
    .isISO8601().withMessage('from must be a valid date (YYYY-MM-DD)'),

  query('to')
    .optional()
    .isISO8601().withMessage('to must be a valid date (YYYY-MM-DD)'),

  query('page')
    .optional()
    .isInt({ gt: 0 }).withMessage('page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ gt: 0, max: 100 }).withMessage('limit must be between 1 and 100'),
];

// ─── Routes ───────────────────────────────────────────────────────────────────

router.get(
  '/',
  verifyToken,
  requireRole(ALL_ROLES),
  listQueryValidation,
  validate,
  getAllRecords
);

router.get(
  '/:id',
  verifyToken,
  requireRole(ALL_ROLES),
  getRecord
);

router.post(
  '/',
  verifyToken,
  requireRole(ADMIN_ONLY),
  createValidation,
  validate,
  createRecord
);

router.patch(
  '/:id',
  verifyToken,
  requireRole(ADMIN_ONLY),
  updateValidation,
  validate,
  updateRecord
);

router.delete(
  '/:id',
  verifyToken,
  requireRole(ADMIN_ONLY),
  deleteRecord
);

export default router;