import { Router } from 'express';
import { body, param } from 'express-validator';
import {
  getAllUsers,
  createUser,
  updateRole,
  updateStatus,
} from '../controllers/user.controller.js';
import verifyToken from '../middlewares/verifyToken.js';
import requireRole from '../middlewares/requireRole.js';
import validate from '../middlewares/validate.js';

const router = Router();

// ─── Validation rules ─────────────────────────────────────────────────────────

const createUserValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),

  body('role')
    .notEmpty().withMessage('Role is required')
    .isIn(['admin', 'analyst', 'viewer']).withMessage('Role must be admin, analyst, or viewer'),
];

const updateRoleValidation = [
  param('id')
    .notEmpty().withMessage('User ID is required'),

  body('role')
    .notEmpty().withMessage('Role is required')
    .isIn(['admin', 'analyst', 'viewer']).withMessage('Role must be admin, analyst, or viewer'),
];

const updateStatusValidation = [
  param('id')
    .notEmpty().withMessage('User ID is required'),

  body('isActive')
    .notEmpty().withMessage('isActive is required')
    .isBoolean().withMessage('isActive must be true or false'),
];

// ─── Routes — all admin only ──────────────────────────────────────────────────

router.get(
  '/',
  verifyToken,
  requireRole(['admin']),
  getAllUsers
);

router.post(
  '/',
  verifyToken,
  requireRole(['admin']),
  createUserValidation,
  validate,
  createUser
);

router.patch(
  '/:id/role',
  verifyToken,
  requireRole(['admin']),
  updateRoleValidation,
  validate,
  updateRole
);

router.patch(
  '/:id/status',
  verifyToken,
  requireRole(['admin']),
  updateStatusValidation,
  validate,
  updateStatus
);

export default router;