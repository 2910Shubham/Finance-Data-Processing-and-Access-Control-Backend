import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';

describe('Middleware and role enforcement', () => {
  const secret = process.env.JWT_SECRET;
  const adminToken = jwt.sign({ id: '64f3a2b1c9e4d800123abc01', email: 'admin@example.com', role: 'admin' }, secret, { expiresIn: '1h' });
  const analystToken = jwt.sign({ id: '64f3a2b1c9e4d800123abc02', email: 'analyst@example.com', role: 'analyst' }, secret, { expiresIn: '1h' });
  const viewerToken = jwt.sign({ id: '64f3a2b1c9e4d800123abc03', email: 'viewer@example.com', role: 'viewer' }, secret, { expiresIn: '1h' });
  const expiredToken = jwt.sign({ id: '64f3a2b1c9e4d800123abc04', email: 'expired@example.com', role: 'admin' }, secret, { expiresIn: '-1s' });

  it('should return 401 when token is missing', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Access denied. No token provided.');
  });

  it('should return 401 for malformed token', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', 'Bearer malformed.token');

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid token. Please log in again.');
  });

  it('should return 401 for expired token', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${expiredToken}`);

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Token has expired. Please log in again.');
  });

  it('should return 403 for viewer on admin-only route', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${viewerToken}`);

    expect(res.status).toBe(403);
  });

  it('should return 403 for analyst on admin-only route', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${analystToken}`);

    expect(res.status).toBe(403);
  });

  it('should allow admin on admin-only route', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
