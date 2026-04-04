import mongoose from 'mongoose';
import User from '../models/User.js';
import verifyToken from '../middlewares/verifyToken.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// ─── Get all users ────────────────────────────────────────────────────────────

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch users.',
    });
  }
};

// ─── Create user (admin creates with explicit role) ───────────────────────────

export const createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    const user = await User.create({ name, email, password, role });

    return res.status(201).json({
      success: true,
      message: `User created successfully with role: ${user.role}.`,
      data: user, // toJSON() strips password automatically
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Failed to create user.',
    });
  }
};

// ─── Update role ──────────────────────────────────────────────────────────────

export const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID.',
      });
    }

    // prevent admin from demoting themselves
    if (req.user.id === id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot change your own role.',
      });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    return res.status(200).json({
      success: true,
      message: `Role updated to "${role}" for ${user.name}.`,
      data: user,
    });
  } catch (err) {
    // runValidators will throw if role value is not in the enum
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Failed to update role.',
    });
  }
};

// ─── Update status (activate / deactivate) ────────────────────────────────────

export const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user ID.',
      });
    }

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isActive must be a boolean (true or false).',
      });
    }

    // prevent admin from deactivating themselves
    if (req.user.id === id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot change your own account status.',
      });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { isActive },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    const statusLabel = isActive ? 'activated' : 'deactivated';

    return res.status(200).json({
      success: true,
      message: `Account ${statusLabel} for ${user.name}.`,
      data: user,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update account status.',
    });
  }
};