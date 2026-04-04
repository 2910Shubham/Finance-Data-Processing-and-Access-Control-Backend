import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import User from '../src/models/User.js';

const createToken = (user, role = user.role) => jwt.sign(
  { id: user._id.toString(), email: user.email, role },
  process.env.JWT_SECRET,
  { expiresIn: '1h' }
);

describe('User management routes', () => {
  let adminUser;
  let viewerUser;
  let adminToken;
  let viewerToken;

  beforeEach(async () => {
    adminUser = await User.create({
      name: 'Admin User',
      email: 'admin-users@example.com',
      password: 'admin123',
      role: 'admin',
    });

    viewerUser = await User.create({
      name: 'Viewer User',
      email: 'viewer-users@example.com',
      password: 'viewer123',
      role: 'viewer',
    });

    adminToken = createToken(adminUser);
    viewerToken = createToken(viewerUser);
  });

  it('should allow admin to list users', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('should deny viewer access to user list', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${viewerToken}`);

    expect(res.status).toBe(403);
  });

  it('should allow admin to change a user role', async () => {
    const targetUser = await User.create({
      name: 'Change Role User',
      email: 'role-change@example.com',
      password: 'password123',
      role: 'viewer',
    });

    const res = await request(app)
      .patch(`/api/users/${targetUser._id}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'analyst' });

    expect(res.status).toBe(200);
    expect(res.body.data.role).toBe('analyst');
  });

  it('should allow admin to deactivate a user', async () => {
    const targetUser = await User.create({
      name: 'Deactivate User',
      email: 'deactivate@example.com',
      password: 'password123',
      role: 'viewer',
    });

    const res = await request(app)
      .patch(`/api/users/${targetUser._id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ isActive: false });

    expect(res.status).toBe(200);
    expect(res.body.data.isActive).toBe(false);
  });
});
