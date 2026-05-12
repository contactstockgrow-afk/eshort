const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { paginationRules, validate } = require('../middleware/validator');
const notificationController = require('../controllers/notificationController');

router.get('/', authenticate, paginationRules, validate, notificationController.getNotifications);

router.get('/unread-count', authenticate, notificationController.getUnreadCount);

router.put('/:notificationId/read', authenticate, notificationController.markAsRead);

router.put('/read-all', authenticate, notificationController.markAllAsRead);

router.delete('/:notificationId', authenticate, notificationController.deleteNotification);

router.put('/settings', authenticate, notificationController.updateSettings);

router.get('/settings', authenticate, notificationController.getSettings);

module.exports = router;
