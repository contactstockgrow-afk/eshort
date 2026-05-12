const express = require('express');
const router = express.Router();
const { optionalAuth } = require('../middleware/auth');
const { searchLimiter } = require('../middleware/rateLimiter');
const { searchRules, validate } = require('../middleware/validator');
const searchController = require('../controllers/searchController');

router.get('/', optionalAuth, searchLimiter, searchRules, validate, searchController.search);

router.get('/suggestions', optionalAuth, searchLimiter, searchController.getSuggestions);

router.get('/trending', optionalAuth, searchController.getTrending);

router.get('/hashtags/:tag', optionalAuth, searchController.getHashtagVideos);

router.get('/discover', optionalAuth, searchController.getDiscoverContent);

module.exports = router;
