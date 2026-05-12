const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { paginationRules, validate } = require('../middleware/validator');
const socialController = require('../controllers/socialController');

router.post('/friend-request/:userId', authenticate, socialController.sendFriendRequest);

router.post('/friend-request/:requestId/accept', authenticate, socialController.acceptFriendRequest);

router.post('/friend-request/:requestId/reject', authenticate, socialController.rejectFriendRequest);

router.delete('/friend-request/:requestId', authenticate, socialController.cancelFriendRequest);

router.get('/friend-requests/pending', authenticate, paginationRules, validate, socialController.getPendingRequests);

router.get('/friend-requests/sent', authenticate, paginationRules, validate, socialController.getSentRequests);

router.get('/friends', authenticate, paginationRules, validate, socialController.getFriends);

router.delete('/friends/:userId', authenticate, socialController.removeFriend);

module.exports = router;
