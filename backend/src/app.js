const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const { env } = require('./config/env');

const authMiddleware = require('./middlewares/authMiddleware');
const roleMiddleware = require('./middlewares/roleMiddleware');
const adminRateLimit = require('./middlewares/adminRateLimit');
const errorHandler = require('./middlewares/errorHandler');

const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const adminRoutes = require('./routes/adminRoutes');
const seedDefaultContent = require('./utils/seedDefaultContent');
const ensureResumeIndexes = require('./utils/ensureResumeIndexes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.resolve('uploads')));

// Database Connection
const connectDB = async () => {
  try {
    await mongoose.connect(env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    await ensureResumeIndexes();
    await seedDefaultContent();

    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

connectDB();

// Root route
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Backend is running successfully waiting for frontend.'
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'backend',
    message: 'Backend is running successfully waiting for frontend.'
  });
});

// API v1 base route
app.get('/api/v1', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Placement Tracker API v1 running'
  });
});

// API v1 health check endpoint (not protected)
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'API health check passed',
    timestamp: new Date()
  });
});

// Routes
app.use('/api/v1/auth', authRoutes);

// Protected routes - require authentication
app.use('/api/v1', authMiddleware);
app.use('/api/v1', studentRoutes);

// Admin routes - require admin role
app.use('/api/v1/admin', adminRateLimit, authMiddleware, roleMiddleware(['admin']), adminRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    errorCode: 'NOT_FOUND'
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

module.exports = app;
