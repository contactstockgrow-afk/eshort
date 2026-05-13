const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authenticate } = require('../middleware/auth');
const { uploadLimiter } = require('../middleware/rateLimiter');
const { videoUploadRules, validate } = require('../middleware/validator');
const uploadController = require('../controllers/uploadController');

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: (parseInt(process.env.MAX_VIDEO_SIZE_MB) || 100) * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowedVideo = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
    const allowedImage = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const allowed = [...allowedVideo, ...allowedImage];

    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} not allowed`), false);
    }
  },
});

router.post(
  '/video',
  authenticate,
  uploadLimiter,
  upload.single('video'),
  videoUploadRules,
  validate,
  uploadController.uploadVideo
);

router.post(
  '/profile-picture',
  authenticate,
  upload.single('image'),
  uploadController.uploadProfilePicture
);

router.post(
  '/thumbnail',
  authenticate,
  upload.single('image'),
  uploadController.uploadThumbnail
);

router.post(
  '/image',
  authenticate,
  upload.single('image'),
  uploadController.uploadImage
);

router.get('/status/:uploadId', authenticate, uploadController.getUploadStatus);

router.post('/draft', authenticate, uploadController.saveDraft);

router.get('/drafts', authenticate, uploadController.getDrafts);

router.delete('/draft/:draftId', authenticate, uploadController.deleteDraft);

router.delete('/video/:videoId', authenticate, uploadController.deleteVideo);

module.exports = router;
