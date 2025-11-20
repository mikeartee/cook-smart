import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import {errorMiddleware, notFoundHandler} from './middleware/errorMiddleware';
import {requestLogger} from './middleware/logger';
import AutoRepairSystem from './services/AutoRepairSystem';
import HealthMonitor from './services/HealthMonitor';
import SystemGuardian from './services/SystemGuardian';
import pool from './config/database';
import healthRoutes from './routes/health';

// Load environment variables
dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Initialize auto-repair system with database pool
if (pool) {
  AutoRepairSystem.setDatabasePool(pool);
}

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin:
      process.env.NODE_ENV === 'production'
        ? true // Allow all origins in production for mobile app
        : true, // Allow all origins in development for React Native
    credentials: true,
  }),
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Serve static files (favicon, etc.)
app.use(express.static('public'));

// Stripe webhook route (must be before body parser)
import stripeWebhookRoutes from './routes/stripeWebhook';
app.use('/api/webhooks/stripe', stripeWebhookRoutes);

// Body parsing middleware
app.use(express.json({limit: '10mb'}));
app.use(express.urlencoded({extended: true}));

// Logging
app.use(morgan('combined'));
app.use(requestLogger);

// Routes
app.use('/health', healthRoutes);

// API routes
import authRoutes from './routes/auth';
import passwordResetRoutes from './routes/passwordReset';
import ingredientRoutes from './routes/ingredients';
import barcodeRoutes from './routes/barcode';
import recipeRoutes from './routes/recipes';
import dietaryRoutes from './routes/dietary';
import shoppingRoutes from './routes/shopping';
import pointsRoutes from './routes/points';
import referralRoutes from './routes/referrals';
import paymentRoutes from './routes/payments';
import adminRoutes from './routes/admin';
import adminAuthRoutes from './routes/adminAuth';
import adminManagementRoutes from './routes/adminManagement';
import adminUsersRoutes from './routes/adminUsers';
import adminSubscriptionsRoutes from './routes/adminSubscriptions';
import adminAnalyticsRoutes from './routes/adminAnalytics';
import adminFeedbackRoutes from './routes/adminFeedback';
import adminErrorsRoutes from './routes/adminErrors';
import adminHealthRoutes from './routes/adminHealth';
import adminCacheRoutes from './routes/adminCache';
import adminCostsRoutes from './routes/adminCosts';
import adminReferralsRoutes from './routes/adminReferrals';
import feedbackRoutes from './routes/feedback';
import subscriptionPricingRoutes from './routes/subscriptionPricing';
import systemGuardianRoutes from './routes/systemGuardian';
import userRecipesRoutes from './routes/userRecipes';

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/password', passwordResetRoutes);
app.use('/api/v1/ingredients', ingredientRoutes);
app.use('/api/v1/barcode', barcodeRoutes);
app.use('/api/v1/recipes', recipeRoutes);
app.use('/api/v1/recipes/user', userRecipesRoutes);
app.use('/api/v1/dietary', dietaryRoutes);
app.use('/api/v1/shopping-list', shoppingRoutes);
app.use('/api/v1/points', pointsRoutes);
app.use('/api/v1/referrals', referralRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/admin/auth', adminAuthRoutes);
app.use('/api/v1/admin/management', adminManagementRoutes);
app.use('/api/v1/admin/users', adminUsersRoutes);
app.use('/api/v1/admin/subscriptions', adminSubscriptionsRoutes);
app.use('/api/v1/admin/analytics', adminAnalyticsRoutes);
app.use('/api/v1/admin/feedback', adminFeedbackRoutes);
app.use('/api/v1/admin/errors', adminErrorsRoutes);
app.use('/api/v1/admin/health', adminHealthRoutes);
app.use('/api/v1/admin/cache', adminCacheRoutes);
app.use('/api/v1/admin/costs', adminCostsRoutes);
app.use('/api/v1/admin/referrals', adminReferralsRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/feedback', feedbackRoutes);
app.use('/api/v1/subscriptions', subscriptionPricingRoutes);
app.use('/api/v1/system-guardian', systemGuardianRoutes);

app.get('/api/v1/test', (req, res) => {
  res.json({
    message: 'Cook Smart API Test Endpoint',
    beta: true,
    features: [
      'Recipe Generation',
      'Ingredient Management',
      'Barcode Scanning',
      'Nutrition Tracking',
    ],
  });
});

// Error handling - use new Discord notification middleware
app.use(notFoundHandler);
app.use(errorMiddleware);

// Start server - listen on all interfaces for mobile device access
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Cook Smart API running on port ${PORT}`);
  console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 Network access: http://0.0.0.0:${PORT}/health`);
  console.log(`🧪 Test endpoint: http://localhost:${PORT}/api/v1/test`);

  // Start health monitoring
  HealthMonitor.startDailyHealthSummary();

  // Start System Guardian (automated monitoring and repair)
  if (process.env.NODE_ENV === 'production') {
    SystemGuardian.startMonitoring();
    console.log('🛡️  System Guardian activated');
  } else {
    console.log('🛡️  System Guardian disabled in development mode');
  }
});

export default app;
