import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { config } from './config';
import { errorHandler } from './middleware/errorHandler';

import healthRoutes from './routes/health';
import authRoutes from './routes/auth';
import restaurantRoutes from './routes/restaurants';
import cartRoutes from './routes/cart';
import addressRoutes from './routes/addresses';
import orderRoutes from './routes/orders';
import favoriteRoutes from './routes/favorites';
import reviewRoutes from './routes/reviews';

const app = express();

// Security and middleware
app.use(helmet());
app.use(
  cors({
    origin: config.corsOrigin === '*' ? true : config.corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (config.nodeEnv !== 'test') {
  app.use(morgan('combined'));
}

// Rate limiter for API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
});

app.use('/api/', apiLimiter);

// Root informative endpoint
app.get('/', (_req, res) => {
  res.json({
    service: 'Somi Go Production API',
    status: 'running',
    version: '1.0.0',
    endpoints: {
      health: '/api/v1/health',
      restaurants: '/api/v1/restaurants',
      orders: '/api/v1/orders'
    }
  });
});

// API v1 routes
app.use('/api/v1', healthRoutes);
app.use('/api/v1', authRoutes);
app.use('/api/v1/restaurants', restaurantRoutes);
app.use('/api/v1/cart', cartRoutes);
app.use('/api/v1/addresses', addressRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/favorites', favoriteRoutes);
app.use('/api/v1', reviewRoutes);

// Error handling middleware
app.use(errorHandler);

export default app;
