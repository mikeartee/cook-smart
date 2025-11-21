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
  return jwt.sign({userId}, secret, {expiresIn: '7d'});
};

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      res.status(401).json({
        error: 'Access token required',
        message: 'Please provide a valid authentication token',
      });
      return;
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      res.status(500).json({error: 'Server configuration error'});
      return;
    }

    const decoded = jwt.verify(token, secret) as {userId: string};
    const user = await UserModel.findById(decoded.userId);

    if (!user) {
      res.status(401).json({
        error: 'Invalid token',
        message: 'User not found',
      });
      return;
    }

    req.user = user;
    next();
  } catch (_error) {
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
