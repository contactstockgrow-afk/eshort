const express = require('express');
const router = express.Router();
const { authenticate, optionalAuth } = require('../middleware/auth');
const { paginationRules, validate } = require('../middleware/validator');
const feedController = require('../controllers/feedController');

router.get('/for-you', optionalAuth, paginationRules, validate, feedController.getForYouFeed);

router.get('/following', authenticate, paginationRules, validate, feedController.getFollowingFeed);

router.get('/friends', authenticate, paginationRules, validate, feedController.getFriendsFeed);

module.exports = router;
