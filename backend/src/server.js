require('dotenv').config();
const app = require('./app');
const { logger } = require('./utils/logger');
const { initializeFirebase } = require('./config/firebase');
const { initializeDriveService } = require('./config/drive');
const { startCronJobs } = require('./services/cronService');

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    initializeFirebase();
    logger.info('Firebase initialized successfully');

    await initializeDriveService();
    logger.info('Google Drive service initialized');

    startCronJobs();
    logger.info('Cron jobs started');

    app.listen(PORT, () => {
      logger.info(`eShort API server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
