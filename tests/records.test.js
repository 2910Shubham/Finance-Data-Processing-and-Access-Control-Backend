import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import User from '../src/models/User.js';

const createToken = (user, role = user.role) => jwt.sign(
  { id: user._id.toString(), email: user.email, role },
  process.env.JWT_SECRET,
  { expiresIn: '1h' }
);

describe('Record routes', () => {
  let adminUser;
  let viewerUser;
  let adminToken;
  let viewerToken;

  beforeEach(async () => {
    adminUser = await User.create({
      name: 'Admin User',
      email: 'admin-records@example.com',
      password: 'admin123',
      role: 'admin',
    });

    viewerUser = await User.create({
      name: 'Viewer User',
      email: 'viewer-records@example.com',
      password: 'viewer123',
      role: 'viewer',
    });

    adminToken = createToken(adminUser);
    viewerToken = createToken(viewerUser);
  });

  it('should allow admin to create a valid record', async () => {
    const res = await request(app)
      .post('/api/records')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        amount: 1000,
        type: 'income',
        category: 'other_income',
        date: '2025-04-01',
        notes: 'Test income',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      amount: 1000,
      type: 'income',
      category: 'other_income',
    });
  });

  it('should return 400 when creating a record with negative amount', async () => {
    const res = await request(app)
      .post('/api/records')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        amount: -100,
        type: 'expense',
        category: 'rent',
        date: '2025-04-01',
      });

    expect(res.status).toBe(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'amount' }),
      ])
    );
  });

  it('should return 400 when creating a record with invalid type', async () => {
    const res = await request(app)
      .post('/api/records')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        amount: 100,
        type: 'invalid',
        category: 'rent',
        date: '2025-04-01',
      });

    expect(res.status).toBe(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'type' }),
      ])
    );
  });

  it('should return 403 when viewer attempts to create a record', async () => {
    const res = await request(app)
      .post('/api/records')
      .set('Authorization', `Bearer ${viewerToken}`)
      .send({
        amount: 500,
        type: 'expense',
        category: 'rent',
        date: '2025-04-01',
      });

    expect(res.status).toBe(403);
  });

  it('should exclude soft-deleted records from the record list', async () => {
    const createResponse = await request(app)
      .post('/api/records')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        amount: 500,
        type: 'expense',
        category: 'rent',
        date: '2025-04-01',
      });

    const recordId = createResponse.body.data._id;

    await request(app)
      .delete(`/api/records/${recordId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    const listRes = await request(app)
      .get('/api/records')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.records).toEqual([]);
  });

  it('should filter records by type', async () => {
    await request(app)
      .post('/api/records')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        amount: 500,
        type: 'expense',
        category: 'rent',
        date: '2025-04-01',
      });

    await request(app)
      .post('/api/records')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        amount: 800,
        type: 'income',
        category: 'other_income',
        date: '2025-04-01',
      });

    const res = await request(app)
      .get('/api/records')
      .query({ type: 'expense' })
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.records).toHaveLength(1);
    expect(res.body.records[0].type).toBe('expense');
  });

  it('should filter records by date range', async () => {
    await request(app)
      .post('/api/records')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        amount: 100,
        type: 'expense',
        category: 'rent',
        date: '2025-04-01',
      });

    await request(app)
      .post('/api/records')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        amount: 200,
        type: 'expense',
        category: 'rent',
        date: '2025-05-10',
      });

    const res = await request(app)
      .get('/api/records')
      .query({ from: '2025-04-01', to: '2025-04-30' })
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.records).toHaveLength(1);
    expect(res.body.records[0].date.startsWith('2025-04')).toBe(true);
  });

  it('should return 404 for a deleted record by id', async () => {
    const createResponse = await request(app)
      .post('/api/records')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        amount: 500,
        type: 'expense',
        category: 'rent',
        date: '2025-04-01',
      });

    const recordId = createResponse.body.data._id;

    await request(app)
      .delete(`/api/records/${recordId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    const res = await request(app)
      .get(`/api/records/${recordId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Record not found.');
  });
});
