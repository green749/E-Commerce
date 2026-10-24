import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { userRepository } from '../repositories/user.repository.js';
import { tokenRepository } from '../repositories/token.repository.js';
import { emailService } from './email.service.js';
import {
  UnauthorizedError,
  ConflictError,
  NotFoundError,
  BadRequestError,
} from '../utils/errors.js';

const ACCESS_TOKEN_EXPIRES_IN = env.JWT_ACCESS_EXPIRES_IN || '15m';
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export const authService = {
  /**
   * Helper to generate JWT access token
   * @param {Object} user
   * @returns {string}
   */
  generateAccessToken(user) {
    return jwt.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        jti: crypto.randomUUID(),
      },
      env.JWT_ACCESS_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
    );
  },

  /**
   * Helper to generate and store a hashed refresh token
   * @param {string} userId
   * @returns {Promise<string>} raw unhashed refresh token
   */
  async createRefreshToken(userId) {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

    await tokenRepository.create({
      userId,
      tokenHash,
      expiresAt,
    });

    return rawToken;
  },

  /**
   * Register a new user
   * @param {Object} data
   * @returns {Promise<{ user: Object, accessToken: string, refreshToken: string }>}
   */
  async register({ name, email, password, phone }) {
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new ConflictError('An account with this email already exists');
    }

    const password_hash = await bcrypt.hash(password, 10);
    const user = await userRepository.create({
      name,
      email,
      phone,
      password_hash,
      role: 'customer',
    });

    const accessToken = this.generateAccessToken(user);
    const refreshToken = await this.createRefreshToken(user.id);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        created_at: user.created_at,
      },
      accessToken,
      refreshToken,
    };
  },

  /**
   * Authenticate user with credentials
   * @param {Object} credentials
   * @returns {Promise<{ user: Object, accessToken: string, refreshToken: string }>}
   */
  async login({ email, password }) {
    const user = await userRepository.findByEmail(email);

    // Generic error for non-existent user or invalid password to prevent user enumeration
    if (!user) {
      throw new UnauthorizedError('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    if (!user.is_active) {
      throw new UnauthorizedError(
        'Account has been deactivated. Please contact support.',
        'ACCOUNT_DEACTIVATED'
      );
    }

    const accessToken = this.generateAccessToken(user);
    const refreshToken = await this.createRefreshToken(user.id);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        created_at: user.created_at,
      },
      accessToken,
      refreshToken,
    };
  },

  /**
   * Rotate refresh token and issue new access token
   * @param {string} rawToken
   * @returns {Promise<{ user: Object, accessToken: string, refreshToken: string }>}
   */
  async refresh(rawToken) {
    if (!rawToken) {
      throw new UnauthorizedError('Refresh token is required', 'REFRESH_TOKEN_REQUIRED');
    }

    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const tokenRecord = await tokenRepository.findActiveByHash(tokenHash);

    if (!tokenRecord) {
      throw new UnauthorizedError('Invalid or expired refresh token', 'REFRESH_TOKEN_INVALID');
    }

    // Token rotation: Revoke current token
    await tokenRepository.revokeByHash(tokenHash);

    // Issue brand new refresh token and access token
    const user = {
      id: tokenRecord.user_pk,
      name: tokenRecord.name,
      email: tokenRecord.email,
      phone: tokenRecord.phone,
      role: tokenRecord.role,
    };

    const newAccessToken = this.generateAccessToken(user);
    const newRefreshToken = await this.createRefreshToken(user.id);

    return {
      user,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  },

  /**
   * Logout user by revoking refresh token
   * @param {string} rawToken
   * @returns {Promise<boolean>}
   */
  async logout(rawToken) {
    if (rawToken) {
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      await tokenRepository.revokeByHash(tokenHash);
    }
    return true;
  },

  /**
   * Generate time-limited reset token and notify via email service
   * @param {string} email
   * @returns {Promise<{ message: string }>}
   */
  async forgotPassword(email) {
    const user = await userRepository.findByEmail(email);

    // Always return generic confirmation to protect against account enumeration
    if (user) {
      // Encode user ID, purpose, and a fragment of current password hash
      // If the password changes, this token is automatically invalidated
      const resetToken = jwt.sign(
        {
          sub: user.id,
          email: user.email,
          purpose: 'password_reset',
          pv: user.password_hash.slice(-8),
        },
        env.JWT_ACCESS_SECRET,
        { expiresIn: '1h' }
      );

      const frontendUrl = env.CORS_ORIGIN || 'http://localhost:5173';
      const resetUrl = `${frontendUrl}/reset-password?token=${encodeURIComponent(resetToken)}`;

      await emailService.sendPasswordResetEmail({
        to: user.email,
        name: user.name,
        token: resetToken,
        resetUrl,
      });
    }

    return {
      message: 'If an account with that email exists, password reset instructions have been sent.',
    };
  },

  /**
   * Reset user password using verified reset token
   * @param {Object} data
   * @returns {Promise<{ message: string }>}
   */
  async resetPassword({ token, password }) {
    let payload;
    try {
      payload = jwt.verify(token, env.JWT_ACCESS_SECRET);
    } catch {
      throw new BadRequestError('Invalid or expired password reset token', 'RESET_TOKEN_INVALID');
    }

    if (payload.purpose !== 'password_reset' || !payload.sub) {
      throw new BadRequestError('Invalid reset token purpose', 'RESET_TOKEN_INVALID');
    }

    const user = await userRepository.findByIdWithPassword(payload.sub);
    if (!user || user.password_hash.slice(-8) !== payload.pv) {
      throw new BadRequestError(
        'Password reset link has expired or has already been used',
        'RESET_TOKEN_STALE'
      );
    }

    const newHash = await bcrypt.hash(password, 10);
    await userRepository.updatePassword(user.id, newHash);

    // Security best practice: invalidate all existing refresh sessions
    await tokenRepository.revokeAllForUser(user.id);

    return {
      message: 'Password has been reset successfully. Please log in with your new password.',
    };
  },

  /**
   * Get authenticated user profile
   * @param {string} userId
   * @returns {Promise<Object>}
   */
  async getProfile(userId) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User profile not found');
    }
    return user;
  },

  /**
   * Update user profile
   * @param {string} userId
   * @param {Object} updates
   * @returns {Promise<Object>}
   */
  async updateProfile(userId, updates) {
    const updated = await userRepository.update(userId, updates);
    if (!updated) {
      throw new NotFoundError('User not found');
    }
    return updated;
  },

  /**
   * Change user password with current password verification
   * @param {string} userId
   * @param {Object} data
   * @returns {Promise<{ message: string }>}
   */
  async changePassword(userId, { currentPassword, password }) {
    const user = await userRepository.findByIdWithPassword(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      throw new BadRequestError('Current password is incorrect', 'INVALID_CURRENT_PASSWORD');
    }
    const newHash = await bcrypt.hash(password, 10);
    await userRepository.updatePassword(userId, newHash);
    return { message: 'Password updated successfully' };
  },
};
