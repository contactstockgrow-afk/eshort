const { getFirestore } = require('../config/firebase');
const { uploadFileToDrive } = require('../config/drive');
const { google } = require('googleapis');
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

async function getUserDriveAuth(uid) {
  const db = getFirestore();
  const userDoc = await db.collection('users').doc(uid).get();
  const userData = userDoc.data();

  if (!userData.driveConnected || !userData.driveTokens) {
    throw new Error('Google Drive not connected');
  }

  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  oAuth2Client.setCredentials(userData.driveTokens);

  oAuth2Client.on('tokens', async (tokens) => {
    if (tokens.refresh_token) {
      await db.collection('users').doc(uid).update({
        'driveTokens.refresh_token': tokens.refresh_token,
        'driveTokens.access_token': tokens.access_token,
      });
    }
  });

  return { auth: oAuth2Client, folders: userData.driveFolders };
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

    const { auth, folders } = await getUserDriveAuth(uid);

    const fileName = `${uploadId}_${Date.now()}.${req.file.mimetype.split('/')[1]}`;
    const fileStream = bufferToStream(req.file.buffer);

    const driveFile = await uploadFileToDrive(auth, fileStream, {
      name: fileName,
      mimeType: req.file.mimetype,
    }, folders.videos);

    await db.collection('uploads').doc(uploadId).update({ progress: 80 });

    const { caption, hashtags, isPrivate } = req.body;
    const parsedHashtags = hashtags
      ? (typeof hashtags === 'string' ? hashtags.split(',').map(t => t.trim()).filter(Boolean) : hashtags)
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
      for (const tag of parsedHashtags) {
        const tagRef = db.collection('hashtags').doc(tag.toLowerCase());
        const tagDoc = await tagRef.get();
        if (tagDoc.exists) {
          await tagRef.update({
            count: admin.firestore.FieldValue.increment(1),
            lastUsed: new Date().toISOString(),
          });
        } else {
          await tagRef.set({
            tag: tag.toLowerCase(),
            count: 1,
            createdAt: new Date().toISOString(),
            lastUsed: new Date().toISOString(),
          });
        }
      }
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
    if (err.message === 'Google Drive not connected') {
      return error(res, 'Please connect Google Drive first', 400);
    }
    return error(res, 'Failed to upload video');
  }
}

async function uploadProfilePicture(req, res) {
  try {
    if (!req.file) return error(res, 'No image file provided', 400);

    const uid = req.user.uid;
    const { auth, folders } = await getUserDriveAuth(uid);

    const fileName = `profile_${uid}_${Date.now()}.${req.file.mimetype.split('/')[1]}`;
    const fileStream = bufferToStream(req.file.buffer);

    const driveFile = await uploadFileToDrive(auth, fileStream, {
      name: fileName,
      mimeType: req.file.mimetype,
    }, folders.profilepictures);

    const db = getFirestore();
    await db.collection('users').doc(uid).update({
      profilePictureUrl: driveFile.directLink,
      profilePictureDriveId: driveFile.fileId,
      updatedAt: new Date().toISOString(),
    });

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
    const { auth, folders } = await getUserDriveAuth(uid);

    const fileName = `thumb_${videoId}_${Date.now()}.${req.file.mimetype.split('/')[1]}`;
    const fileStream = bufferToStream(req.file.buffer);

    const driveFile = await uploadFileToDrive(auth, fileStream, {
      name: fileName,
      mimeType: req.file.mimetype,
    }, folders.thumbnails);

    if (videoId) {
      const db = getFirestore();
      await db.collection('videos').doc(videoId).update({
        thumbnailUrl: driveFile.directLink,
        thumbnailDriveId: driveFile.fileId,
      });
    }

    return success(res, { thumbnailUrl: driveFile.directLink }, 'Thumbnail uploaded');
  } catch (err) {
    logger.error('Upload thumbnail error:', err);
    return error(res, 'Failed to upload thumbnail');
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

module.exports = {
  uploadVideo,
  uploadProfilePicture,
  uploadThumbnail,
  getUploadStatus,
  saveDraft,
  getDrafts,
  deleteDraft,
};
