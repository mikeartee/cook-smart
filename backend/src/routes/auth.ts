import {Router, Request, Response} from 'express';
import {body, validationResult} from 'express-validator';
import {UserModel} from '../models/User';
import {
  generateToken,
  authenticateToken,
  AuthRequest,
} from '../middleware/auth';
// import ActivityTracker from '../services/ActivityTracker';

const router = Router();

// Register endpoint
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password')
      .isLength({min: 8})
      .withMessage('Password must be at least 8 characters'),
    body('age_verified')
      .isBoolean()
      .custom((value: boolean) => {
        if (!value) {
          throw new Error('You must verify you are 13 years or older');
        }
        return true;
      }),
    body('first_name').optional().trim().isLength({min: 1, max: 50}),
    body('last_name').optional().trim().isLength({min: 1, max: 50}),
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

      const {email, password, first_name, last_name} = req.body;

      // Check if user already exists
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        res.status(409).json({
          error: 'User already exists',
          message: 'An account with this email already exists',
        });
        return;
      }

      // Create user with UserModel (PostgreSQL)
      const user = await UserModel.create({
        email,
        password,
        first_name,
        last_name,
        age_verified: true,
      });

      const token = generateToken(user.id);

      // Track signup activity (async, non-blocking)
      // TODO: Re-enable when ActivityTracker is implemented
      // if (user.first_name && user.last_name) {
      //   ActivityTracker.trackSignup({
      //     id: user.id,
      //     first_name: user.first_name,
      //     last_name: user.last_name,
      //     email: user.email,
      //   }).catch(err => console.error('Failed to track signup:', err));
      // }

      let welcomeMessage = 'Account created successfully';
      let specialMessage = undefined;

      if (user.is_co_founder) {
        welcomeMessage = 'Welcome back, Co-Founder! 🎉';
        specialMessage =
          'Thank you for inspiring Cook Smart! You have lifetime access to all features.';
      } else if (user.is_special_user) {
        welcomeMessage = 'Welcome! 💐';
        specialMessage =
          'You have lifetime access to all features. Enjoy Cook Smart!';
      }

      res.status(201).json({
        message: welcomeMessage,
        token,
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          is_co_founder: user.is_co_founder,
          is_special_user: user.is_special_user,
          is_creator: user.is_creator,
          has_lifetime_subscription: user.has_lifetime_subscription,
          subscription_status: user.subscription_status,
          points: user.points,
        },
        ...(specialMessage && {
          special_message: specialMessage,
          lifetime_access: true,
        }),
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        error: 'Registration failed',
        message: 'Unable to create account. Please try again.',
      });
    }
  },
);

// Login endpoint
router.post(
  '/login',
  [body('email').isEmail().normalizeEmail(), body('password').notEmpty()],
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

      const {email, password} = req.body;

      // Find user in PostgreSQL database
      const user = await UserModel.findByEmail(email);
      if (!user) {
        res.status(401).json({
          error: 'Invalid credentials',
          message: 'Email or password is incorrect',
        });
        return;
      }

      // Verify password
      const isValidPassword = await UserModel.verifyPassword(
        password,
        user.password_hash,
      );
      if (!isValidPassword) {
        res.status(401).json({
          error: 'Invalid credentials',
          message: 'Email or password is incorrect',
        });
        return;
      }

      // Update last login
      await UserModel.updateLastLogin(user.id);

      const token = generateToken(user.id);

      res.json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          is_co_founder: user.is_co_founder,
          is_special_user: user.is_special_user,
          is_creator: user.is_creator,
          has_lifetime_subscription: user.has_lifetime_subscription,
          subscription_status: user.subscription_status,
          points: user.points,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        error: 'Login failed',
        message: 'Unable to log in. Please try again.',
      });
    }
  },
);

// Get current user profile
router.get(
  '/me',
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    res.json({
      user: {
        id: req.user.id,
        email: req.user.email,
        first_name: req.user.first_name,
        last_name: req.user.last_name,
        is_co_founder: req.user.is_co_founder,
        is_special_user: req.user.is_special_user,
        is_creator: req.user.is_creator,
        has_lifetime_subscription: req.user.has_lifetime_subscription,
        subscription_status: req.user.subscription_status,
        points: req.user.points,
        dietary_restrictions: req.user.dietary_restrictions,
        allergies: req.user.allergies,
        show_nutrition: req.user.show_nutrition,
        preferred_units: req.user.preferred_units,
      },
    });
  },
);

// GDPR Data Export
router.get(
  '/export-data',
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const userData = await UserModel.exportUserData(req.user.id);

      res.setHeader('Content-Type', 'application/json');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="cook-smart-data-${req.user.id}.json"`,
      );
      res.json(userData);
    } catch (error) {
      console.error('Data export error:', error);
      res.status(500).json({
        error: 'Export failed',
        message: 'Unable to export your data. Please try again.',
      });
    }
  },
);

// GDPR Data Deletion
router.delete(
  '/delete-account',
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      await UserModel.deleteUser(req.user.id);

      res.json({
        message: 'Account deleted successfully',
        note: 'All your data has been permanently removed from our systems',
      });
    } catch (error) {
      console.error('Account deletion error:', error);
      res.status(500).json({
        error: 'Deletion failed',
        message: 'Unable to delete account. Please contact support.',
      });
    }
  },
);

export default router;
