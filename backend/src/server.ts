import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { errorHandler, notFound } from './middleware/errorHandler';
import { errorMiddleware, notFoundHandler } from './middleware/errorMiddleware';
import { requestLogger } from './middleware/logger';
import AutoRepairSystem from './services/AutoRepairSystem';
import HealthMonitor from './services/HealthMonitor';
import pool from './config/database';
import healthRoutes from './routes/health';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize auto-repair system with database pool
if (pool) {
  AutoRepairSystem.setDatabasePool(pool);
}

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://cooksmartapp.com'] // Update with actual domain
    : ['http://localhost:3000', 'http://localhost:19006'], // React Native Metro
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(morgan('combined'));
app.use(requestLogger);

// Routes
app.use('/health', healthRoutes);

// API routes
import authRoutes from './routes/auth';
import ingredientRoutes from './routes/ingredients';
import barcodeRoutes from './routes/barcode';
import recipeRoutes from './routes/recipes';
import dietaryRoutes from './routes/dietary';
import shoppingRoutes from './routes/shopping';
import pointsRoutes from './routes/points';
import referralRoutes from './routes/referrals';
import paymentRoutes from './routes/payments';
import adminRoutes from './routes/admin';
import feedbackRoutes from './routes/feedback';

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/ingredients', ingredientRoutes);
app.use('/api/v1/barcode', barcodeRoutes);
app.use('/api/v1/recipes', recipeRoutes);
app.use('/api/v1/dietary', dietaryRoutes);
app.use('/api/v1/shopping-list', shoppingRoutes);
app.use('/api/v1/points', pointsRoutes);
app.use('/api/v1/referrals', referralRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/feedback', feedbackRoutes);

app.get('/api/v1/test', (req, res) => {
  res.json({
    message: 'Cook Smart API Test Endpoint',
    beta: true,
    features: [
      'Recipe Generation',
      'Ingredient Management', 
      'Barcode Scanning',
      'Nutrition Tracking'
    ]
  });
});

// Error handling - use new Discord notification middleware
app.use(notFoundHandler);
app.use(errorMiddleware);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Cook Smart API running on port ${PORT}`);
  console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`🧪 Test endpoint: http://localhost:${PORT}/api/v1/test`);
  
  // Start health monitoring
  HealthMonitor.startDailyHealthSummary();
});

export default app;
