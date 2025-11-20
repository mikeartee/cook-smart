import {Router, Request, Response} from 'express';
import {body, validationResult} from 'express-validator';
import {UserModel} from '../models/User';
import {authenticateToken, AuthRequest} from '../middleware/auth';
import pool from '../config/database';
import EmailService from '../services/EmailService';

const router = Router();

// Generate 6-digit verification code
function generateResetToken(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Request password reset (unauthenticated)
router.post(
  '/forgot-password',
  [body('email').isEmail().normalizeEmail()],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          error: 'Validation failed',
          details: errors.array(),
        });
        return;
      }

      const {email} = req.body;

      // Find user by email
      const user = await UserModel.findByEmail(email);

      // Always return success (don't reveal if email exists)
      if (!user) {
        res.json({
          success: true,
          message:
            'If an account exists with this email, you will receive a password reset code.',
        });
        return;
      }

      // Generate reset token
      const resetToken = generateResetToken();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Store token in database
      await pool.query(
        `INSERT INTO password_reset_tokens (user_id, email, token, expires_at) 
         VALUES ($1, $2, $3, $4)`,
        [user.id, email, resetToken, expiresAt],
      );

      // Send email
      await EmailService.sendPasswordResetEmail(email, resetToken);

      res.json({
        success: true,
        message:
          'If an account exists with this email, you will receive a password reset code.',
      });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({
        error: 'Failed to process request',
        message: 'Unable to send reset code. Please try again.',
      });
    }
  },
);

// Verify reset token and set new password
router.post(
  '/reset-password',
  [
    body('email').isEmail().normalizeEmail(),
    body('token').isLength({min: 6, max: 6}),
    body('newPassword').isLength({min: 8}),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          error: 'Validation failed',
          details: errors.array(),
        });
        return;
      }

      const {email, token, newPassword} = req.body;

      // Find valid token
      const tokenResult = await pool.query(
        `SELECT * FROM password_reset_tokens 
         WHERE email = $1 AND token = $2 AND used = FALSE AND expires_at > NOW()
         ORDER BY created_at DESC LIMIT 1`,
        [email, token],
      );

      if (tokenResult.rows.length === 0) {
        res.status(400).json({
          error: 'Invalid or expired code',
          message: 'The verification code is invalid or has expired.',
        });
        return;
      }

      const resetRecord = tokenResult.rows[0];

      // Find user
      const user = await UserModel.findByEmail(email);
      if (!user) {
        res.status(404).json({error: 'User not found'});
        return;
      }

      // Update password
      await UserModel.updatePassword(user.id, newPassword);

      // Mark token as used
      await pool.query(
        'UPDATE password_reset_tokens SET used = TRUE WHERE id = $1',
        [resetRecord.id],
      );

      res.json({
        success: true,
        message:
          'Password reset successfully. You can now login with your new password.',
      });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({
        error: 'Failed to reset password',
        message: 'Unable to reset password. Please try again.',
      });
    }
  },
);

// Change password (authenticated user)
router.post(
  '/change-password',
  authenticateToken,
  [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    body('newPassword')
      .isLength({min: 8})
      .withMessage('New password must be at least 8 characters'),
  ],
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          error: 'Validation failed',
          details: errors.array(),
        });
        return;
      }

      const {currentPassword, newPassword} = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({error: 'Unauthorized'});
        return;
      }

      // Get user
      const user = await UserModel.findById(userId);
      if (!user) {
        res.status(404).json({error: 'User not found'});
        return;
      }

      // Verify current password
      const isValidPassword = await UserModel.verifyPassword(
        currentPassword,
        user.password_hash,
      );

      if (!isValidPassword) {
        res.status(401).json({
          error: 'Invalid password',
          message: 'Current password is incorrect',
        });
        return;
      }

      // Update password
      await UserModel.updatePassword(userId, newPassword);

      res.json({
        success: true,
        message: 'Password updated successfully',
      });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        error: 'Failed to change password',
        message: 'Unable to update password. Please try again.',
      });
    }
  },
);

export default router;
