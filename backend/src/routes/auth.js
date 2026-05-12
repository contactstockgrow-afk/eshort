const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const { body, validate } = require('../middleware/validator');
const authController = require('../controllers/authController');

router.post(
  '/register',
  authLimiter,
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('displayName').isLength({ min: 2, max: 50 }).withMessage('Display name must be 2-50 characters'),
    body('username').isAlphanumeric().isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 alphanumeric characters'),
  ],
  validate,
  authController.register
);

router.post('/google-signin', authLimiter, authController.googleSignIn);

router.get('/google/drive-auth-url', authenticate, authController.getDriveAuthUrl);

router.get('/google/callback', authController.handleDriveCallback);

router.get('/me', authenticate, authController.getCurrentUser);

router.put('/me', authenticate, authController.updateProfile);

router.post('/fcm-token', authenticate, authController.updateFcmToken);

router.post('/logout', authenticate, authController.logout);

module.exports = router;
