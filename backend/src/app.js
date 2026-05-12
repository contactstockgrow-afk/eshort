const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const { apiLimiter } = require('./middleware/rateLimiter');

const authRoutes = require('./routes/auth');
const videoRoutes = require('./routes/videos');
const userRoutes = require('./routes/users');
const socialRoutes = require('./routes/social');
const uploadRoutes = require('./routes/upload');
const searchRoutes = require('./routes/search');
const notificationRoutes = require('./routes/notifications');
const adminRoutes = require('./routes/admin');
const feedRoutes = require('./routes/feed');

const app = express();

app.use(helmet());
app.use(cors());
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api/', apiLimiter);

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'eShort API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/users', userRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/feed', feedRoutes);

app.use((err, req, res, _next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  if (process.env.NODE_ENV !== 'test') {
    console.error(`[Error] ${statusCode}: ${message}`, err.stack);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: { message: `Route ${req.originalUrl} not found` },
  });
});

module.exports = app;
