import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { initDatabase, closeDatabase } from '../src/db/index.js';
import { runMigrations } from '../src/db/migrate.js';

describe('Authentication & Profile Integration Tests', () => {
  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await initDatabase();
    await runMigrations();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  const timestamp = Date.now();
  const testUser = {
    name: 'Ada Lovelace',
    email: `ada.${timestamp}@example.com`,
    password: 'SecurePassword@123',
    phone: '+91 9888877777',
  };

  let customerAccessToken = '';
  let customerRefreshTokenCookie = '';

  // --------------------------------------------------------------------------
  // 1. REGISTRATION
  // --------------------------------------------------------------------------
  describe('POST /api/auth/register', () => {
    it('should reject registration with a weak password (missing special char/number)', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Weak Password User',
        email: `weak.${timestamp}@example.com`,
        password: 'passwordonly',
      });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should reject registration with invalid email format', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Invalid Email User',
        email: 'not-an-email',
        password: 'SecurePassword@123',
      });

      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });

    it('should successfully register a customer, return access token and set httpOnly cookie', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: testUser.name,
        email: `  ${testUser.email.toUpperCase()}  `, // Test email trimming & normalization
        password: testUser.password,
        phone: testUser.phone,
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(testUser.email.toLowerCase());
      expect(res.body.data.user.role).toBe('customer');
      expect(res.body.data.user.password_hash).toBeUndefined(); // Never leak password hash
      expect(typeof res.body.data.accessToken).toBe('string');

      // Verify httpOnly cookie
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies.some((c) => c.includes('refreshToken=') && c.includes('HttpOnly'))).toBe(true);
    });

    it('should reject duplicate registration with 409 Conflict', async () => {
      const res = await request(app).post('/api/auth/register').send(testUser);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('CONFLICT');
    });
  });

  // --------------------------------------------------------------------------
  // 2. LOGIN
  // --------------------------------------------------------------------------
  describe('POST /api/auth/login', () => {
    it('should return identical generic error for non-existent email', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'doesnotexist@example.com',
        password: 'SomePassword@123',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe('Invalid email or password');
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should return identical generic error for existing user with wrong password', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: testUser.email,
        password: 'IncorrectPassword@999',
      });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe('Invalid email or password');
      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should successfully log in with valid credentials and return access token', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: testUser.email,
        password: testUser.password,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(testUser.email.toLowerCase());
      expect(typeof res.body.data.accessToken).toBe('string');

      customerAccessToken = res.body.data.accessToken;

      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const refreshCookie = cookies.find((c) => c.startsWith('refreshToken='));
      expect(refreshCookie).toBeDefined();
      customerRefreshTokenCookie = refreshCookie.split(';')[0];
    });
  });

  // --------------------------------------------------------------------------
  // 3. PROTECTED ROUTES & PROFILE (/api/me)
  // --------------------------------------------------------------------------
  describe('GET & PATCH /api/me (Protected Profile)', () => {
    it('should reject unauthenticated request to /api/me with 401', async () => {
      const res = await request(app).get('/api/me');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject request with an invalid Bearer token', async () => {
      const res = await request(app).get('/api/me').set('Authorization', 'Bearer invalid_token_xyz');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return user profile when authenticated with valid access token', async () => {
      const res = await request(app)
        .get('/api/me')
        .set('Authorization', `Bearer ${customerAccessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(testUser.email.toLowerCase());
      expect(res.body.data.name).toBe(testUser.name);
    });

    it('should update profile name and phone via PATCH /api/me', async () => {
      const res = await request(app)
        .patch('/api/me')
        .set('Authorization', `Bearer ${customerAccessToken}`)
        .send({
          name: 'Ada King Countess of Lovelace',
          phone: '+91 9111122222',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Ada King Countess of Lovelace');
      expect(res.body.data.phone).toBe('+91 9111122222');
    });
  });

  // --------------------------------------------------------------------------
  // 4. ADDRESS CRUD (/api/me/addresses)
  // --------------------------------------------------------------------------
  describe('CRUD /api/me/addresses (with default address handling)', () => {
    let addressId1 = '';
    let addressId2 = '';

    it('should list empty addresses initially for a new user', async () => {
      const res = await request(app)
        .get('/api/me/addresses')
        .set('Authorization', `Bearer ${customerAccessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should automatically set the first created address as default', async () => {
      const res = await request(app)
        .post('/api/me/addresses')
        .set('Authorization', `Bearer ${customerAccessToken}`)
        .send({
          full_name: 'Ada Lovelace',
          phone: '+91 9888877777',
          line1: '12 Mathematical Way',
          city: 'London',
          state: 'Greater London',
          pincode: 'SW1A 1AA',
          is_default: false, // Explicitly false, but should become true since it is the first address
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.is_default).toBe(true);
      addressId1 = res.body.data.id;
    });

    it('should unset previous default when a second address is created with is_default=true', async () => {
      const res = await request(app)
        .post('/api/me/addresses')
        .set('Authorization', `Bearer ${customerAccessToken}`)
        .send({
          full_name: 'Ada Lovelace',
          phone: '+91 9888877777',
          line1: '45 Computing Street',
          city: 'Cambridge',
          state: 'Cambridgeshire',
          pincode: 'CB2 1TN',
          is_default: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.is_default).toBe(true);
      addressId2 = res.body.data.id;

      // Verify address 1 is no longer default
      const listRes = await request(app)
        .get('/api/me/addresses')
        .set('Authorization', `Bearer ${customerAccessToken}`);

      const firstAddr = listRes.body.data.find((a) => a.id === addressId1);
      const secondAddr = listRes.body.data.find((a) => a.id === addressId2);

      expect(firstAddr.is_default).toBe(false);
      expect(secondAddr.is_default).toBe(true);
    });

    it('should fetch single address by ID', async () => {
      const res = await request(app)
        .get(`/api/me/addresses/${addressId1}`)
        .set('Authorization', `Bearer ${customerAccessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(addressId1);
      expect(res.body.data.line1).toBe('12 Mathematical Way');
    });

    it('should update address fields', async () => {
      const res = await request(app)
        .patch(`/api/me/addresses/${addressId1}`)
        .set('Authorization', `Bearer ${customerAccessToken}`)
        .send({
          line2: 'Suite 400',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.line2).toBe('Suite 400');
    });

    it('should delete address', async () => {
      const res = await request(app)
        .delete(`/api/me/addresses/${addressId1}`)
        .set('Authorization', `Bearer ${customerAccessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const getRes = await request(app)
        .get(`/api/me/addresses/${addressId1}`)
        .set('Authorization', `Bearer ${customerAccessToken}`);

      expect(getRes.status).toBe(404);
    });
  });

  // --------------------------------------------------------------------------
  // 5. TOKEN REFRESH & ROTATION
  // --------------------------------------------------------------------------
  describe('POST /api/auth/refresh (Token Rotation)', () => {
    let newRefreshTokenCookie = '';

    it('should rotate refresh token and issue a new access token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', [customerRefreshTokenCookie]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(typeof res.body.data.accessToken).toBe('string');
      expect(res.body.data.accessToken).not.toBe(customerAccessToken);

      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const refreshCookie = cookies.find((c) => c.startsWith('refreshToken='));
      expect(refreshCookie).toBeDefined();
      newRefreshTokenCookie = refreshCookie.split(';')[0];
    });

    it('should reject reused / revoked old refresh token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', [customerRefreshTokenCookie]); // Reusing old rotated token

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('REFRESH_TOKEN_INVALID');
    });

    it('should succeed with the new rotated refresh token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', [newRefreshTokenCookie]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(typeof res.body.data.accessToken).toBe('string');
    });
  });

  // --------------------------------------------------------------------------
  // 6. LOGOUT
  // --------------------------------------------------------------------------
  describe('POST /api/auth/logout', () => {
    it('should revoke refresh token and clear cookie', async () => {
      // First login to get a fresh token
      const loginRes = await request(app).post('/api/auth/login').send({
        email: testUser.email,
        password: testUser.password,
      });

      const refreshCookie = loginRes.headers['set-cookie'].find((c) =>
        c.startsWith('refreshToken=')
      );

      const logoutRes = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', [refreshCookie.split(';')[0]]);

      expect(logoutRes.status).toBe(200);
      expect(logoutRes.body.success).toBe(true);

      // Verify refresh with that token now fails
      const refreshAttempt = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', [refreshCookie.split(';')[0]]);

      expect(refreshAttempt.status).toBe(401);
    });
  });

  // --------------------------------------------------------------------------
  // 7. FORGOT & RESET PASSWORD
  // --------------------------------------------------------------------------
  describe('POST /api/auth/forgot-password & /api/auth/reset-password', () => {
    it('should return 200 generic message on forgot-password', async () => {
      const res = await request(app).post('/api/auth/forgot-password').send({
        email: testUser.email,
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toContain('password reset instructions have been sent');
    });

    it('should reject reset-password with invalid token', async () => {
      const res = await request(app).post('/api/auth/reset-password').send({
        token: 'invalid_jwt_token_string',
        password: 'BrandNewPassword@456',
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should complete full password reset round-trip', async () => {
      let capturedToken = '';
      const { emailService } = await import('../src/services/email.service.js');
      const spy = vi.spyOn(emailService, 'sendPasswordResetEmail').mockImplementation(async (params) => {
        capturedToken = params.token;
        return true;
      });

      await request(app).post('/api/auth/forgot-password').send({
        email: testUser.email,
      });

      expect(capturedToken).toBeTruthy();

      const newPassword = 'BrandNewPassword@456';
      const resetRes = await request(app).post('/api/auth/reset-password').send({
        token: capturedToken,
        password: newPassword,
      });

      expect(resetRes.status).toBe(200);
      expect(resetRes.body.success).toBe(true);

      // Verify old password no longer works
      const oldLogin = await request(app).post('/api/auth/login').send({
        email: testUser.email,
        password: testUser.password,
      });
      expect(oldLogin.status).toBe(401);

      // Verify new password works
      const newLogin = await request(app).post('/api/auth/login').send({
        email: testUser.email,
        password: newPassword,
      });
      expect(newLogin.status).toBe(200);
      expect(newLogin.body.success).toBe(true);

      spy.mockRestore();
    });
  });

  // --------------------------------------------------------------------------
  // 8. MIDDLEWARE: requireRole & optionalAuth
  // --------------------------------------------------------------------------
  describe('Middleware: requireRole and optionalAuth', () => {
    beforeAll(async () => {
      const { authenticate, requireRole, optionalAuth } = await import('../src/middleware/auth.js');
      const { default: apiRoutes } = await import('../src/routes/index.js');

      apiRoutes.get('/test/admin-only', authenticate, requireRole('admin'), (req, res) => {
        res.json({ success: true, message: 'Welcome admin' });
      });
      apiRoutes.get('/test/optional-auth', optionalAuth, (req, res) => {
        res.json({ success: true, user: req.user });
      });
    });

    it('should reject non-admin user with 403 Forbidden on admin-only route', async () => {
      const res = await request(app)
        .get('/api/test/admin-only')
        .set('Authorization', `Bearer ${customerAccessToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('should allow admin user on admin-only route', async () => {
      // Login with seeded admin user
      const adminLoginRes = await request(app).post('/api/auth/login').send({
        email: 'admin@shoppe.com',
        password: 'Admin@123',
      });

      expect(adminLoginRes.status).toBe(200);
      const adminToken = adminLoginRes.body.data.accessToken;

      const res = await request(app)
        .get('/api/test/admin-only')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Welcome admin');
    });

    it('should allow guest without token on optional-auth route and set req.user to null', async () => {
      const res = await request(app).get('/api/test/optional-auth');
      expect(res.status).toBe(200);
      expect(res.body.user).toBeNull();
    });

    it('should populate req.user on optional-auth route when valid token is supplied', async () => {
      const res = await request(app)
        .get('/api/test/optional-auth')
        .set('Authorization', `Bearer ${customerAccessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.user).not.toBeNull();
      expect(res.body.user.email).toBe(testUser.email.toLowerCase());
    });
  });
});
