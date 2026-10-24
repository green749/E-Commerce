import { query } from '../db/index.js';

export const tokenRepository = {
  /**
   * Save a newly issued refresh token hash
   * @param {Object} params
   * @param {string} params.userId
   * @param {string} params.tokenHash
   * @param {Date} params.expiresAt
   * @returns {Promise<Object>}
   */
  async create({ userId, tokenHash, expiresAt }) {
    const res = await query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)
       RETURNING id, user_id, token_hash, expires_at, revoked_at, created_at;`,
      [userId, tokenHash, expiresAt]
    );
    return res.rows[0];
  },

  /**
   * Find an active (non-revoked and unexpired) refresh token by its hash
   * @param {string} tokenHash
   * @returns {Promise<Object|null>}
   */
  async findActiveByHash(tokenHash) {
    const res = await query(
      `SELECT rt.id, rt.user_id, rt.token_hash, rt.expires_at, rt.revoked_at,
              u.id as user_pk, u.name, u.email, u.phone, u.role, u.is_active
       FROM refresh_tokens rt
       JOIN users u ON u.id = rt.user_id
       WHERE rt.token_hash = $1
         AND rt.revoked_at IS NULL
         AND rt.expires_at > CURRENT_TIMESTAMP
         AND u.deleted_at IS NULL
         AND u.is_active = true;`,
      [tokenHash]
    );
    return res.rows[0] || null;
  },

  /**
   * Revoke a refresh token by its hash
   * @param {string} tokenHash
   * @returns {Promise<boolean>}
   */
  async revokeByHash(tokenHash) {
    const res = await query(
      `UPDATE refresh_tokens
       SET revoked_at = CURRENT_TIMESTAMP
       WHERE token_hash = $1 AND revoked_at IS NULL;`,
      [tokenHash]
    );
    return res.rowCount > 0;
  },

  /**
   * Revoke all active refresh tokens for a user (e.g. on password reset)
   * @param {string} userId
   * @returns {Promise<number>}
   */
  async revokeAllForUser(userId) {
    const res = await query(
      `UPDATE refresh_tokens
       SET revoked_at = CURRENT_TIMESTAMP
       WHERE user_id = $1 AND revoked_at IS NULL;`,
      [userId]
    );
    return res.rowCount;
  },
};
