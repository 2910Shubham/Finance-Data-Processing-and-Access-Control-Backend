import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// ─── Register ────────────────────────────────────────────────────────────────

export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // check for duplicate email before attempting to save
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }

    const user = await User.create({ name, email, password, role });

    // toJSON() on the model strips the password field automatically
    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      data: user,
    });
  } catch (err) {
    console.error('Register error:', err);
    // Mongoose duplicate key fallback (race condition safety net)
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists.',
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.',
    });
  }
};

// ─── Login ───────────────────────────────────────────────────────────────────

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // password is select:false on the schema — must opt back in explicitly
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Contact an administrator.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    // strip password before sending user object back
    user.password = undefined;

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      data: user,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.',
    });
  }
};