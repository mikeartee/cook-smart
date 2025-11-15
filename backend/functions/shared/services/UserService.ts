/**
 * User Service
 * Business logic for user profile management and GDPR operations
 */

import * as UserModel from '../models/User';
import { hashPassword, comparePassword } from '../utils/passwordUtils';
import { query } from '../db';

export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

/**
 * Get user profile by ID
 */
export const getProfile = async (userId: number) => {
  const user = await UserModel.findById(userId);

  if (!user) {
    throw new Error('User not found');
  }

  // Return user without password hash
  return {
    id: user.id,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    isCoFounder: user.is_co_founder,
    subscriptionStatus: user.subscription_status,
    subscriptionExpiresAt: user.subscription_expires_at,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
  };
};

/**
 * Update user profile
 */
export const updateProfile = async (
  userId: number,
  data: UpdateProfileData
) => {
  const updates: any = {};

  if (data.firstName !== undefined) {
    updates.first_name = data.firstName;
  }

  if (data.lastName !== undefined) {
    updates.last_name = data.lastName;
  }

  const user = await UserModel.update(userId, updates);

  if (!user) {
    throw new Error('User not found');
  }

  return {
    id: user.id,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    isCoFounder: user.is_co_founder,
    subscriptionStatus: user.subscription_status,
  };
};

/**
 * Change user password
 */
export const changePassword = async (
  userId: number,
  data: ChangePasswordData
) => {
  // Get user
  const user = await UserModel.findById(userId);

  if (!user) {
    throw new Error('User not found');
  }

  // Verify current password
  const isMatch = await comparePassword(data.currentPassword, user.password_hash);

  if (!isMatch) {
    throw new Error('Current password is incorrect');
  }

  // Validate new password
  if (data.newPassword.length < 8) {
    throw new Error('New password must be at least 8 characters');
  }

  // Hash new password
  const newPasswordHash = await hashPassword(data.newPassword);

  // Update password
  await UserModel.update(userId, { password_hash: newPasswordHash });

  return { message: 'Password updated successfully' };
};

/**
 * Export all user data (GDPR)
 */
export const exportUserData = async (userId: number) => {
  // Get user profile
  const user = await UserModel.findById(userId);

  if (!user) {
    throw new Error('User not found');
  }

  // Get user ingredients
  const ingredientsResult = await query(
    'SELECT * FROM user_ingredients WHERE user_id = $1',
    [userId]
  );

  // Get custom ingredients
  const customIngredientsResult = await query(
    'SELECT * FROM custom_ingredients WHERE user_id = $1',
    [userId]
  );

  // Get favorite recipes
  const recipesResult = await query(
    'SELECT * FROM user_recipes WHERE user_id = $1',
    [userId]
  );

  // Get shopping lists
  const shoppingResult = await query(
    'SELECT * FROM shopping_lists WHERE user_id = $1',
    [userId]
  );

  // Get points
  const pointsResult = await query(
    'SELECT * FROM user_points WHERE user_id = $1',
    [userId]
  );

  // Get referrals
  const referralsResult = await query(
    'SELECT * FROM referrals WHERE referrer_user_id = $1',
    [userId]
  );

  return {
    profile: {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      isCoFounder: user.is_co_founder,
      subscriptionStatus: user.subscription_status,
      createdAt: user.created_at,
    },
    ingredients: ingredientsResult.rows,
    customIngredients: customIngredientsResult.rows,
    favoriteRecipes: recipesResult.rows,
    shoppingLists: shoppingResult.rows,
    points: pointsResult.rows,
    referrals: referralsResult.rows,
  };
};

/**
 * Delete user account (GDPR)
 */
export const deleteAccount = async (userId: number) => {
  // Anonymize referrals (set referred_user_id to NULL instead of deleting)
  await query(
    'UPDATE referrals SET referred_user_id = NULL WHERE referred_user_id = $1',
    [userId]
  );

  // Delete user (cascades to related tables)
  const deleted = await UserModel.deleteUser(userId);

  if (!deleted) {
    throw new Error('User not found');
  }

  return { message: 'Account deleted successfully' };
};
