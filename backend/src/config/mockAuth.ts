/**
 * Mock Authentication for Local Testing
 * Use when database is not available
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'test_secret';

// Mock user for testing
const mockUser = {
  id: '1',
  email: 'test@test.com',
  password_hash: bcrypt.hashSync('test123', 10),
  first_name: 'Test',
  last_name: 'User',
  created_at: new Date(),
};

export const mockAuthService = {
  async login(email: string, password: string) {
    if (email === mockUser.email) {
      const isValid = await bcrypt.compare(password, mockUser.password_hash);
      if (isValid) {
        const token = jwt.sign(
          { userId: mockUser.id, email: mockUser.email },
          JWT_SECRET,
          { expiresIn: '7d' }
        );
        
        return {
          token,
          user: {
            id: mockUser.id,
            email: mockUser.email,
            firstName: mockUser.first_name,
            lastName: mockUser.last_name,
          },
        };
      }
    }
    throw new Error('Invalid credentials');
  },
  
  async register(email: string, password: string, firstName: string, lastName: string) {
    const token = jwt.sign(
      { userId: '2', email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    return {
      token,
      user: {
        id: '2',
        email,
        firstName,
        lastName,
      },
    };
  },
};
