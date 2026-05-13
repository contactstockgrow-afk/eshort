const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authenticateApiKey } = require('../middleware/apiKey');
const { uploadFileToDrive, getDriveService, getFolderIds } = require('../config/drive');
const { getFirestore } = require('../config/firebase');
const { success, error } = require('../utils/response');
const { logger } = require('../utils/logger');
const { Readable } = require('stream');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 100 * 1024 * 1024 } });

router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'eShort External API', version: '1.0.0' });
});

router.get('/videos', authenticateApiKey, async (req, res) => {
  try {
    const db = getFirestore();
    const { limit = 20, cursor } = req.query;
    let query = db.collection('videos')
      .where('status', '==', 'active')
      .where('isPrivate', '==', false)
      .orderBy('createdAt', 'desc')
      .limit(parseInt(limit));
    if (cursor) {
      const cursorDoc = await db.collection('videos').doc(cursor).get();
      if (cursorDoc.exists) query = query.startAfter(cursorDoc);
    }
    const snapshot = await query.get();
    const videos = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return success(res, videos);
  } catch (err) {
    logger.error('External API videos error:', err);
    return error(res, 'Failed to fetch videos');
  }
});

router.post('/upload/video', authenticateApiKey, upload.single('video'), async (req, res) => {
  try {
    if (!req.apiKeyPermissions.includes('write')) {
      return error(res, 'API key does not have write permission', 403);
    }
    if (!req.file) return error(res, 'No video file provided', 400);

    const db = getFirestore();
    const fileStream = Readable.from(req.file.buffer);
    const metadata = {
      name: `ext_${Date.now()}_${req.file.originalname}`,
      mimeType: req.file.mimetype,
    };

    const driveResult = await uploadFileToDrive(fileStream, metadata, 'videos');

    const videoData = {
      userId: req.apiKeyOwner,
      source: 'external_api',
      apiKeyId: req.apiKeyId,
      videoUrl: `https://drive.google.com/file/d/${driveResult.fileId}/view`,
      videoDirectUrl: `https://drive.google.com/uc?id=${driveResult.fileId}&export=download`,
      thumbnailUrl: '',
      caption: req.body.caption || '',
      hashtags: req.body.hashtags ? req.body.hashtags.split(',').map((h) => h.trim().toLowerCase()) : [],
      isPrivate: false,
      viewsCount: 0,
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      duration: 0,
      status: 'active',
      driveFileId: driveResult.fileId,
      createdAt: new Date().toISOString(),
    };

    const docRef = await db.collection('videos').add(videoData);
    logger.info(`External video uploaded: ${docRef.id} via API key ${req.apiKeyId}`);

    return success(res, { videoId: docRef.id, driveFileId: driveResult.fileId, videoUrl: videoData.videoUrl }, 'Video uploaded via API', 201);
  } catch (err) {
    logger.error('External API upload error:', err);
    return error(res, 'Video upload failed');
  }
});

router.post('/upload/image', authenticateApiKey, upload.single('image'), async (req, res) => {
  try {
    if (!req.apiKeyPermissions.includes('write')) {
      return error(res, 'API key does not have write permission', 403);
    }
    if (!req.file) return error(res, 'No image file provided', 400);

    const fileStream = Readable.from(req.file.buffer);
    const metadata = {
      name: `ext_${Date.now()}_${req.file.originalname}`,
      mimeType: req.file.mimetype,
    };

    const driveResult = await uploadFileToDrive(fileStream, metadata, 'images');
    logger.info(`External image uploaded: ${driveResult.fileId} via API key ${req.apiKeyId}`);

    return success(res, {
      driveFileId: driveResult.fileId,
      imageUrl: `https://drive.google.com/uc?id=${driveResult.fileId}&export=download`,
    }, 'Image uploaded via API', 201);
  } catch (err) {
    logger.error('External API image upload error:', err);
    return error(res, 'Image upload failed');
  }
});

router.get('/storage/info', authenticateApiKey, async (req, res) => {
  try {
    const folderIds = getFolderIds();
    return success(res, {
      folders: Object.keys(folderIds),
      driveConnected: true,
    });
  } catch (err) {
    logger.error('External API storage info error:', err);
    return error(res, 'Failed to get storage info');
  }
});

module.exports = router;
