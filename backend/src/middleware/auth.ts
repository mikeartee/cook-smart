import {Request, Response, NextFunction} from 'express';
import jwt from 'jsonwebtoken';
import {UserModel} from '../models/User';

export interface AuthRequest extends Request {
  user?: any;
}

export const generateToken = (userId: string): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined');
  }
  // 90 days for mobile app - users expect to stay logged in
  return jwt.sign({userId}, secret, {expiresIn: '90d'});
};

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    console.log('🔐 Auth check:', {
      path: req.path,
      hasAuthHeader: !!authHeader,
      hasToken: !!token,
      tokenPreview: token ? `${token.substring(0, 20)}...` : 'none',
    });

    if (!token) {
      console.log('❌ No token provided');
      res.status(401).json({
        error: 'Access token required',
        message: 'Please provide a valid authentication token',
      });
      return;
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.log('❌ JWT_SECRET not configured');
      res.status(500).json({error: 'Server configuration error'});
      return;
    }

    const decoded = jwt.verify(token, secret) as {userId: string};
    console.log('✅ Token decoded, userId:', decoded.userId);

    const user = await UserModel.findById(decoded.userId);

    if (!user) {
      console.log('❌ User not found for userId:', decoded.userId);
      res.status(401).json({
        error: 'Invalid token',
        message: 'User not found',
      });
      return;
    }

    console.log('✅ User authenticated:', user.email);
    req.user = user;
    next();
  } catch (error) {
    console.log('❌ Token verification error:', error);
    res.status(403).json({
      error: 'Invalid token',
      message: 'Token verification failed',
    });
  }
};

export const requireAgeVerification = (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void => {
  if (!req.user?.age_verified) {
    res.status(403).json({
      error: 'Age verification required',
      message: 'You must verify you are 13 years or older to use this service',
    });
    return;
  }
  next();
};
