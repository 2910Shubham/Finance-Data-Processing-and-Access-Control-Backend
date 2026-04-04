import request from 'supertest';
import app from '../src/app.js';

describe('Auth API', () => {
  const userData = {
    name: 'Test User',
    email: 'testuser@example.com',
    password: 'secret123',
    role: 'viewer',
  };

  it('should register a new user with valid data', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(userData);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      name: userData.name,
      email: userData.email,
      role: userData.role,
      isActive: true,
    });
    expect(res.body.data.password).toBeUndefined();
  });

  it('should return 400 when name is missing', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'no-name@example.com',
        password: 'secret123',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'name' }),
      ])
    );
  });

  it('should return 400 when email is invalid', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Invalid Email',
        email: 'not-an-email',
        password: 'secret123',
      });

    expect(res.status).toBe(400);
    expect(res.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'email' }),
      ])
    );
  });

  it('should return 409 for duplicate email', async () => {
    await request(app)
      .post('/api/auth/register')
      .send(userData);

    const res = await request(app)
      .post('/api/auth/register')
      .send(userData);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('should login successfully with correct credentials', async () => {
    await request(app).post('/api/auth/register').send(userData);

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: userData.email,
        password: userData.password,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeTruthy();
    expect(res.body.data.email).toBe(userData.email);
  });

  it('should return 401 for wrong password', async () => {
    await request(app).post('/api/auth/register').send(userData);

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: userData.email,
        password: 'wrongpassword',
      });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid email or password.');
  });

  it('should return 401 for non-existent email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'missing@example.com',
        password: 'doesntmatter',
      });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Invalid email or password.');
  });
});
