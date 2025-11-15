/**
 * Authentication Service
 * Business logic for user registration and login
 */

import * as UserModel from '../models/User';
import { hashPassword, comparePassword } from '../utils/passwordUtils';
import { generateToken } from '../utils/jwtUtils';

const CO_FOUNDER_EMAIL = 'brianaolszewski1@gmail.com';

export interface RegisterData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: number;
    email: string;
    firstName?: string;
    lastName?: string;
    isCoFounder: boolean;
    subscriptionStatus: string;
  };
  token: string;
}

/**
 * Validate email format
 */
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Register a new user
 */
export const register = async (data: RegisterData): Promise<AuthResponse> => {
  // Validate email format
  if (!isValidEmail(data.email)) {
    throw new Error('Invalid email format');
  }

  // Validate password length
  if (data.password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }

  // Check if email already exists
  const existingUser = await UserModel.findByEmail(data.email);
  if (existingUser) {
    throw new Error('Email already registered');
  }

  // Detect Co-Founder
  const isCoFounder = data.email.toLowerCase() === CO_FOUNDER_EMAIL.toLowerCase();

  // Hash password
  const password_hash = await hashPassword(data.password);

  // Create user
  const user = await UserModel.create({
    email: data.email,
    password_hash,
    first_name: data.firstName,
    last_name: data.lastName,
    is_co_founder: isCoFounder,
    subscription_status: isCoFounder ? 'lifetime' : 'free',
  });

  // Generate JWT token
  const token = generateToken({
    userId: user.id,
    email: user.email,
    isCoFounder: user.is_co_founder,
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      isCoFounder: user.is_co_founder,
      subscriptionStatus: user.subscription_status,
    },
    token,
  };
};

/**
 * Login a user
 */
export const login = async (data: LoginData): Promise<AuthResponse> => {
  // Find user by email
  const user = await UserModel.findByEmail(data.email);
  if (!user) {
    throw new Error('Invalid email or password');
  }

  // Compare password
  const isMatch = await comparePassword(data.password, user.password_hash);
  if (!isMatch) {
    throw new Error('Invalid email or password');
  }

  // Generate JWT token
  const token = generateToken({
    userId: user.id,
    email: user.email,
    isCoFounder: user.is_co_founder,
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      isCoFounder: user.is_co_founder,
      subscriptionStatus: user.subscription_status,
    },
    token,
  };
};
