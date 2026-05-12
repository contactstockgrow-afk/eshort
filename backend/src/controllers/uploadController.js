const { getFirestore } = require('../config/firebase');
const { uploadFileToDrive, deleteFileFromDrive } = require('../config/drive');
const { v4: uuidv4 } = require('uuid');
const { Readable } = require('stream');
const { success, error } = require('../utils/response');
const { logger } = require('../utils/logger');

function bufferToStream(buffer) {
  const readable = new Readable();
  readable.push(buffer);
  readable.push(null);
  return readable;
}

async function uploadVideo(req, res) {
  try {
    if (!req.file) return error(res, 'No video file provided', 400);

    const uid = req.user.uid;
    const uploadId = uuidv4();
    const db = getFirestore();

    await db.collection('uploads').doc(uploadId).set({
      userId: uid,
      status: 'processing',
      progress: 0,
      createdAt: new Date().toISOString(),
    });

    const fileName = `${uploadId}_${Date.now()}.${req.file.mimetype.split('/')[1] || 'mp4'}`;
    const fileStream = bufferToStream(req.file.buffer);

    const driveFile = await uploadFileToDrive(fileStream, {
      name: fileName,
      mimeType: req.file.mimetype,
    }, 'videos');

    await db.collection('uploads').doc(uploadId).update({ progress: 80 });

    const { caption, hashtags, isPrivate } = req.body;
    const parsedHashtags = hashtags
      ? (typeof hashtags === 'string' ? hashtags.split(',').map(t => t.trim().replace(/^#/, '')).filter(Boolean) : hashtags)
      : [];

    const videoData = {
      userId: uid,
      videoUrl: driveFile.streamLink,
      videoDirectUrl: driveFile.directLink,
      driveFileId: driveFile.fileId,
      thumbnailUrl: '',
      caption: caption || '',
      hashtags: parsedHashtags,
      isPrivate: isPrivate === 'true' || isPrivate === true,
      viewsCount: 0,
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      trendingScore: 0,
      duration: 0,
      fileSize: parseInt(driveFile.size) || 0,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const videoRef = await db.collection('videos').add(videoData);

    const admin = require('firebase-admin');
    await db.collection('users').doc(uid).update({
      videosCount: admin.firestore.FieldValue.increment(1),
    });

    if (parsedHashtags.length > 0) {
      const batch = db.batch();
      for (const tag of parsedHashtags) {
        const tagRef = db.collection('hashtags').doc(tag.toLowerCase());
        batch.set(tagRef, {
          tag: tag.toLowerCase(),
          count: admin.firestore.FieldValue.increment(1),
          lastUsed: new Date().toISOString(),
        }, { merge: true });
      }
      await batch.commit();
    }

    await db.collection('uploads').doc(uploadId).update({
      status: 'completed',
      progress: 100,
      videoId: videoRef.id,
    });

    logger.info(`Video uploaded: ${videoRef.id} by user ${uid}`);
    return success(res, { videoId: videoRef.id, uploadId, ...videoData }, 'Video uploaded', 201);
  } catch (err) {
    logger.error('Upload video error:', err);
    return error(res, 'Failed to upload video');
  }
}

async function uploadProfilePicture(req, res) {
  try {
    if (!req.file) return error(res, 'No image file provided', 400);

    const uid = req.user.uid;
    const fileName = `profile_${uid}_${Date.now()}.${req.file.mimetype.split('/')[1] || 'jpg'}`;
    const fileStream = bufferToStream(req.file.buffer);

    const driveFile = await uploadFileToDrive(fileStream, {
      name: fileName,
      mimeType: req.file.mimetype,
    }, 'profilepictures');

    const db = getFirestore();
    const userDoc = await db.collection('users').doc(uid).get();
    const oldDriveId = userDoc.data()?.profilePictureDriveId;

    await db.collection('users').doc(uid).update({
      profilePictureUrl: driveFile.directLink,
      profilePictureDriveId: driveFile.fileId,
      updatedAt: new Date().toISOString(),
    });

    if (oldDriveId) {
      try { await deleteFileFromDrive(oldDriveId); } catch (_) {}
    }

    return success(res, { profilePictureUrl: driveFile.directLink }, 'Profile picture updated');
  } catch (err) {
    logger.error('Upload profile picture error:', err);
    return error(res, 'Failed to upload profile picture');
  }
}

async function uploadThumbnail(req, res) {
  try {
    if (!req.file) return error(res, 'No image file provided', 400);

    const uid = req.user.uid;
    const { videoId } = req.body;

    const fileName = `thumb_${videoId || uid}_${Date.now()}.${req.file.mimetype.split('/')[1] || 'jpg'}`;
    const fileStream = bufferToStream(req.file.buffer);

    const driveFile = await uploadFileToDrive(fileStream, {
      name: fileName,
      mimeType: req.file.mimetype,
    }, 'thumbnails');

    if (videoId) {
      const db = getFirestore();
      await db.collection('videos').doc(videoId).update({
        thumbnailUrl: driveFile.directLink,
        thumbnailDriveId: driveFile.fileId,
      });
    }

    return success(res, { thumbnailUrl: driveFile.directLink, fileId: driveFile.fileId }, 'Thumbnail uploaded');
  } catch (err) {
    logger.error('Upload thumbnail error:', err);
    return error(res, 'Failed to upload thumbnail');
  }
}

async function uploadImage(req, res) {
  try {
    if (!req.file) return error(res, 'No image file provided', 400);

    const fileName = `img_${req.user.uid}_${Date.now()}.${req.file.mimetype.split('/')[1] || 'jpg'}`;
    const fileStream = bufferToStream(req.file.buffer);

    const driveFile = await uploadFileToDrive(fileStream, {
      name: fileName,
      mimeType: req.file.mimetype,
    }, 'images');

    return success(res, { imageUrl: driveFile.directLink, fileId: driveFile.fileId }, 'Image uploaded');
  } catch (err) {
    logger.error('Upload image error:', err);
    return error(res, 'Failed to upload image');
  }
}

async function getUploadStatus(req, res) {
  try {
    const db = getFirestore();
    const doc = await db.collection('uploads').doc(req.params.uploadId).get();
    if (!doc.exists) return error(res, 'Upload not found', 404);
    if (doc.data().userId !== req.user.uid) return error(res, 'Unauthorized', 403);
    return success(res, doc.data());
  } catch (err) {
    logger.error('Get upload status error:', err);
    return error(res, 'Failed to get upload status');
  }
}

async function saveDraft(req, res) {
  try {
    const db = getFirestore();
    const { caption, hashtags, thumbnailUrl } = req.body;

    const draft = {
      userId: req.user.uid,
      caption: caption || '',
      hashtags: hashtags || [],
      thumbnailUrl: thumbnailUrl || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const ref = await db.collection('drafts').add(draft);
    return success(res, { id: ref.id, ...draft }, 'Draft saved', 201);
  } catch (err) {
    logger.error('Save draft error:', err);
    return error(res, 'Failed to save draft');
  }
}

async function getDrafts(req, res) {
  try {
    const db = getFirestore();
    const snapshot = await db.collection('drafts')
      .where('userId', '==', req.user.uid)
      .orderBy('updatedAt', 'desc')
      .get();

    const drafts = [];
    snapshot.forEach((doc) => drafts.push({ id: doc.id, ...doc.data() }));
    return success(res, drafts);
  } catch (err) {
    logger.error('Get drafts error:', err);
    return error(res, 'Failed to fetch drafts');
  }
}

async function deleteDraft(req, res) {
  try {
    const db = getFirestore();
    const doc = await db.collection('drafts').doc(req.params.draftId).get();
    if (!doc.exists) return error(res, 'Draft not found', 404);
    if (doc.data().userId !== req.user.uid) return error(res, 'Unauthorized', 403);
    await db.collection('drafts').doc(req.params.draftId).delete();
    return success(res, null, 'Draft deleted');
  } catch (err) {
    logger.error('Delete draft error:', err);
    return error(res, 'Failed to delete draft');
  }
}

async function deleteVideo(req, res) {
  try {
    const db = getFirestore();
    const admin = require('firebase-admin');
    const { videoId } = req.params;

    const videoDoc = await db.collection('videos').doc(videoId).get();
    if (!videoDoc.exists) return error(res, 'Video not found', 404);
    if (videoDoc.data().userId !== req.user.uid) return error(res, 'Unauthorized', 403);

    const data = videoDoc.data();

    if (data.driveFileId) {
      try { await deleteFileFromDrive(data.driveFileId); } catch (_) {}
    }
    if (data.thumbnailDriveId) {
      try { await deleteFileFromDrive(data.thumbnailDriveId); } catch (_) {}
    }

    await db.collection('videos').doc(videoId).update({ status: 'deleted' });
    await db.collection('users').doc(req.user.uid).update({
      videosCount: admin.firestore.FieldValue.increment(-1),
    });

    return success(res, null, 'Video deleted');
  } catch (err) {
    logger.error('Delete video error:', err);
    return error(res, 'Failed to delete video');
  }
}

module.exports = {
  uploadVideo,
  uploadProfilePicture,
  uploadThumbnail,
  uploadImage,
  getUploadStatus,
  saveDraft,
  getDrafts,
  deleteDraft,
  deleteVideo,
};
