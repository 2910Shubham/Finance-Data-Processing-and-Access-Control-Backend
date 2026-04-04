import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import User from '../src/models/User.js';
import FinancialRecord from '../src/models/FinancialRecord.js';

const createToken = (user, role = user.role) => jwt.sign(
  { id: user._id.toString(), email: user.email, role },
  process.env.JWT_SECRET,
  { expiresIn: '1h' }
);

describe('Dashboard routes', () => {
  let adminUser;
  let analystUser;
  let viewerUser;
  let adminToken;
  let analystToken;
  let viewerToken;

  beforeEach(async () => {
    adminUser = await User.create({
      name: 'Admin Dashboard',
      email: 'admin-dashboard@example.com',
      password: 'admin123',
      role: 'admin',
    });

    analystUser = await User.create({
      name: 'Analyst Dashboard',
      email: 'analyst-dashboard@example.com',
      password: 'analyst123',
      role: 'analyst',
    });

    viewerUser = await User.create({
      name: 'Viewer Dashboard',
      email: 'viewer-dashboard@example.com',
      password: 'viewer123',
      role: 'viewer',
    });

    adminToken = createToken(adminUser);
    analystToken = createToken(analystUser);
    viewerToken = createToken(viewerUser);
  });

  it('should return zero totals when no records exist', async () => {
    const res = await request(app)
      .get('/api/dashboard/summary')
      .set('Authorization', `Bearer ${viewerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({
      totalIncome: 0,
      totalExpenses: 0,
      netBalance: 0,
      recordCount: 0,
    });
  });

  it('should return correct summary with mixed records', async () => {
    await FinancialRecord.create([
      {
        amount: 1000,
        type: 'income',
        category: 'other_income',
        date: new Date(),
        createdBy: adminUser._id,
      },
      {
        amount: 400,
        type: 'expense',
        category: 'rent',
        date: new Date(),
        createdBy: adminUser._id,
      },
    ]);

    const res = await request(app)
      .get('/api/dashboard/summary')
      .set('Authorization', `Bearer ${viewerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({
      totalIncome: 1000,
      totalExpenses: 400,
      netBalance: 600,
      recordCount: 2,
    });
  });

  it('should group category totals correctly', async () => {
    await FinancialRecord.create([
      {
        amount: 1000,
        type: 'income',
        category: 'other_income',
        date: new Date(),
        createdBy: adminUser._id,
      },
      {
        amount: 450,
        type: 'expense',
        category: 'rent',
        date: new Date(),
        createdBy: adminUser._id,
      },
    ]);

    const res = await request(app)
      .get('/api/dashboard/categories')
      .set('Authorization', `Bearer ${viewerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          category: 'other_income',
          total: 1000,
          breakdown: { income: { total: 1000, count: 1 } },
        }),
        expect.objectContaining({
          category: 'rent',
          total: 450,
          breakdown: { expense: { total: 450, count: 1 } },
        }),
      ])
    );
  });

  it('should allow analyst to get monthly trends', async () => {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 5);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 5);

    await FinancialRecord.create([
      {
        amount: 500,
        type: 'income',
        category: 'other_income',
        date: thisMonth,
        createdBy: adminUser._id,
      },
      {
        amount: 200,
        type: 'expense',
        category: 'rent',
        date: lastMonth,
        createdBy: adminUser._id,
      },
    ]);

    const res = await request(app)
      .get('/api/dashboard/trends')
      .query({ months: 2 })
      .set('Authorization', `Bearer ${analystToken}`);

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(2);
    expect(res.body.data[res.body.data.length - 1]).toHaveProperty('label');
  });

  it('should return 403 for viewer on trends route', async () => {
    const res = await request(app)
      .get('/api/dashboard/trends')
      .query({ months: 2 })
      .set('Authorization', `Bearer ${viewerToken}`);

    expect(res.status).toBe(403);
  });
});
