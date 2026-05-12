const express = require('express');
const router = express.Router();
const { authenticate, adminOnly } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

router.use(authenticate, adminOnly);

router.get('/dashboard', adminController.getDashboard);

router.get('/users', adminController.getUsers);
router.put('/users/:userId/role', adminController.updateUserRole);
router.put('/users/:userId/ban', adminController.banUser);
router.put('/users/:userId/unban', adminController.unbanUser);

router.get('/videos', adminController.getVideos);
router.delete('/videos/:videoId', adminController.removeVideo);

router.get('/reports', adminController.getReports);
router.put('/reports/:reportId/resolve', adminController.resolveReport);

router.get('/analytics', adminController.getAnalytics);

router.get('/uploads', adminController.getUploadActivity);

module.exports = router;
