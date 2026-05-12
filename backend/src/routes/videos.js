const express = require('express');
const router = express.Router();
const { authenticate, optionalAuth } = require('../middleware/auth');
const { paginationRules, validate, param } = require('../middleware/validator');
const videoController = require('../controllers/videoController');

router.get('/', optionalAuth, paginationRules, validate, videoController.getVideos);

router.get('/trending', optionalAuth, paginationRules, validate, videoController.getTrending);

router.get('/:videoId', optionalAuth, videoController.getVideo);

router.post('/:videoId/like', authenticate, videoController.likeVideo);

router.delete('/:videoId/like', authenticate, videoController.unlikeVideo);

router.post(
  '/:videoId/comment',
  authenticate,
  videoController.addComment
);

router.get('/:videoId/comments', optionalAuth, paginationRules, validate, videoController.getComments);

router.delete('/:videoId/comment/:commentId', authenticate, videoController.deleteComment);

router.post('/:videoId/share', authenticate, videoController.shareVideo);

router.post('/:videoId/view', optionalAuth, videoController.recordView);

router.delete('/:videoId', authenticate, videoController.deleteVideo);

router.post('/:videoId/save', authenticate, videoController.saveVideo);

router.delete('/:videoId/save', authenticate, videoController.unsaveVideo);

router.post('/:videoId/report', authenticate, videoController.reportVideo);

module.exports = router;
