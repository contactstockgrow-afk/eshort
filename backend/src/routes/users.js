const express = require('express');
const router = express.Router();
const { authenticate, optionalAuth } = require('../middleware/auth');
const { profileUpdateRules, paginationRules, validate } = require('../middleware/validator');
const userController = require('../controllers/userController');

router.get('/:userId', optionalAuth, userController.getProfile);

router.put('/profile', authenticate, profileUpdateRules, validate, userController.updateProfile);

router.get('/:userId/videos', optionalAuth, paginationRules, validate, userController.getUserVideos);

router.get('/:userId/followers', paginationRules, validate, userController.getFollowers);

router.get('/:userId/following', paginationRules, validate, userController.getFollowing);

router.post('/:userId/follow', authenticate, userController.followUser);

router.delete('/:userId/follow', authenticate, userController.unfollowUser);

router.post('/:userId/block', authenticate, userController.blockUser);

router.delete('/:userId/block', authenticate, userController.unblockUser);

router.get('/me/saved', authenticate, paginationRules, validate, userController.getSavedVideos);

router.get('/me/liked', authenticate, paginationRules, validate, userController.getLikedVideos);

module.exports = router;
