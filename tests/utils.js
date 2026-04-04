import jwt from 'jsonwebtoken';
import User from '../src/models/User.js';

export const createUserToken = async ({ name, email, password, role }) => {
  const user = await User.create({ name, email, password, role });
  const token = jwt.sign(
    { id: user._id.toString(), email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
  return { user, token };
};

export const signToken = ({ id, email, role, expiresIn = '1h' }) =>
  jwt.sign({ id, email, role }, process.env.JWT_SECRET, { expiresIn });
