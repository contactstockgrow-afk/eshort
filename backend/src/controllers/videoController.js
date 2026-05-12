const { getFirestore } = require('../config/firebase');
const { success, paginated, error } = require('../utils/response');
const { logger } = require('../utils/logger');
const notificationService = require('../services/notificationService');

async function getVideos(req, res) {
  try {
    const db = getFirestore();
    const limit = parseInt(req.query.limit) || 20;
    const cursor = req.query.cursor;

    let query = db.collection('videos')
      .where('status', '==', 'active')
      .orderBy('createdAt', 'desc')
      .limit(limit + 1);

    if (cursor) {
      const cursorDoc = await db.collection('videos').doc(cursor).get();
      if (cursorDoc.exists) {
        query = query.startAfter(cursorDoc);
      }
    }

    const snapshot = await query.get();
    const videos = [];
    snapshot.forEach((doc) => videos.push({ id: doc.id, ...doc.data() }));

    const hasMore = videos.length > limit;
    if (hasMore) videos.pop();

    return paginated(res, videos, {
      hasMore,
      nextCursor: hasMore ? videos[videos.length - 1].id : null,
    });
  } catch (err) {
    logger.error('Get videos error:', err);
    return error(res, 'Failed to fetch videos');
  }
}

async function getTrending(req, res) {
  try {
    const db = getFirestore();
    const limit = parseInt(req.query.limit) || 20;

    const snapshot = await db.collection('videos')
      .where('status', '==', 'active')
      .orderBy('trendingScore', 'desc')
      .limit(limit)
      .get();

    const videos = [];
    snapshot.forEach((doc) => videos.push({ id: doc.id, ...doc.data() }));

    return success(res, videos);
  } catch (err) {
    logger.error('Get trending error:', err);
    return error(res, 'Failed to fetch trending videos');
  }
}

async function getVideo(req, res) {
  try {
    const db = getFirestore();
    const doc = await db.collection('videos').doc(req.params.videoId).get();

    if (!doc.exists) {
      return error(res, 'Video not found', 404);
    }

    return success(res, { id: doc.id, ...doc.data() });
  } catch (err) {
    logger.error('Get video error:', err);
    return error(res, 'Failed to fetch video');
  }
}

async function likeVideo(req, res) {
  try {
    const db = getFirestore();
    const { videoId } = req.params;
    const uid = req.user.uid;

    const likeRef = db.collection('likes').doc(`${uid}_${videoId}`);
    const likeDoc = await likeRef.get();

    if (likeDoc.exists) {
      return error(res, 'Already liked', 409);
    }

    const batch = db.batch();

    batch.set(likeRef, {
      userId: uid,
      videoId,
      createdAt: new Date().toISOString(),
    });

    const videoRef = db.collection('videos').doc(videoId);
    const admin = require('firebase-admin');
    batch.update(videoRef, {
      likesCount: admin.firestore.FieldValue.increment(1),
    });

    await batch.commit();

    const videoDoc = await videoRef.get();
    if (videoDoc.exists && videoDoc.data().userId !== uid) {
      await notificationService.sendNotification(videoDoc.data().userId, {
        type: 'like',
        fromUserId: uid,
        videoId,
        message: 'liked your video',
      });
    }

    return success(res, null, 'Video liked');
  } catch (err) {
    logger.error('Like video error:', err);
    return error(res, 'Failed to like video');
  }
}

async function unlikeVideo(req, res) {
  try {
    const db = getFirestore();
    const { videoId } = req.params;
    const uid = req.user.uid;

    const likeRef = db.collection('likes').doc(`${uid}_${videoId}`);
    const likeDoc = await likeRef.get();

    if (!likeDoc.exists) {
      return error(res, 'Not liked', 404);
    }

    const batch = db.batch();
    batch.delete(likeRef);

    const admin = require('firebase-admin');
    batch.update(db.collection('videos').doc(videoId), {
      likesCount: admin.firestore.FieldValue.increment(-1),
    });

    await batch.commit();
    return success(res, null, 'Video unliked');
  } catch (err) {
    logger.error('Unlike video error:', err);
    return error(res, 'Failed to unlike video');
  }
}

async function addComment(req, res) {
  try {
    const db = getFirestore();
    const { videoId } = req.params;
    const { text } = req.body;
    const uid = req.user.uid;

    if (!text || text.trim().length === 0) {
      return error(res, 'Comment text is required', 400);
    }

    const commentData = {
      videoId,
      userId: uid,
      text: text.trim(),
      likesCount: 0,
      createdAt: new Date().toISOString(),
    };

    const commentRef = await db.collection('comments').add(commentData);

    const admin = require('firebase-admin');
    await db.collection('videos').doc(videoId).update({
      commentsCount: admin.firestore.FieldValue.increment(1),
    });

    const videoDoc = await db.collection('videos').doc(videoId).get();
    if (videoDoc.exists && videoDoc.data().userId !== uid) {
      await notificationService.sendNotification(videoDoc.data().userId, {
        type: 'comment',
        fromUserId: uid,
        videoId,
        commentId: commentRef.id,
        message: 'commented on your video',
      });
    }

    return success(res, { id: commentRef.id, ...commentData }, 'Comment added', 201);
  } catch (err) {
    logger.error('Add comment error:', err);
    return error(res, 'Failed to add comment');
  }
}

async function getComments(req, res) {
  try {
    const db = getFirestore();
    const { videoId } = req.params;
    const limit = parseInt(req.query.limit) || 20;
    const cursor = req.query.cursor;

    let query = db.collection('comments')
      .where('videoId', '==', videoId)
      .orderBy('createdAt', 'desc')
      .limit(limit + 1);

    if (cursor) {
      const cursorDoc = await db.collection('comments').doc(cursor).get();
      if (cursorDoc.exists) query = query.startAfter(cursorDoc);
    }

    const snapshot = await query.get();
    const comments = [];
    snapshot.forEach((doc) => comments.push({ id: doc.id, ...doc.data() }));

    const hasMore = comments.length > limit;
    if (hasMore) comments.pop();

    return paginated(res, comments, {
      hasMore,
      nextCursor: hasMore ? comments[comments.length - 1].id : null,
    });
  } catch (err) {
    logger.error('Get comments error:', err);
    return error(res, 'Failed to fetch comments');
  }
}

async function deleteComment(req, res) {
  try {
    const db = getFirestore();
    const { videoId, commentId } = req.params;

    const commentDoc = await db.collection('comments').doc(commentId).get();
    if (!commentDoc.exists) return error(res, 'Comment not found', 404);
    if (commentDoc.data().userId !== req.user.uid) return error(res, 'Unauthorized', 403);

    const admin = require('firebase-admin');
    const batch = db.batch();
    batch.delete(db.collection('comments').doc(commentId));
    batch.update(db.collection('videos').doc(videoId), {
      commentsCount: admin.firestore.FieldValue.increment(-1),
    });
    await batch.commit();

    return success(res, null, 'Comment deleted');
  } catch (err) {
    logger.error('Delete comment error:', err);
    return error(res, 'Failed to delete comment');
  }
}

async function shareVideo(req, res) {
  try {
    const db = getFirestore();
    const admin = require('firebase-admin');
    await db.collection('videos').doc(req.params.videoId).update({
      sharesCount: admin.firestore.FieldValue.increment(1),
    });
    return success(res, null, 'Share recorded');
  } catch (err) {
    logger.error('Share video error:', err);
    return error(res, 'Failed to record share');
  }
}

async function recordView(req, res) {
  try {
    const db = getFirestore();
    const admin = require('firebase-admin');
    const { videoId } = req.params;
    const { watchDuration } = req.body;

    await db.collection('videos').doc(videoId).update({
      viewsCount: admin.firestore.FieldValue.increment(1),
    });

    if (req.user) {
      await db.collection('videoViews').add({
        userId: req.user.uid,
        videoId,
        watchDuration: watchDuration || 0,
        viewedAt: new Date().toISOString(),
      });
    }

    return success(res, null, 'View recorded');
  } catch (err) {
    logger.error('Record view error:', err);
    return error(res, 'Failed to record view');
  }
}

async function deleteVideo(req, res) {
  try {
    const db = getFirestore();
    const { videoId } = req.params;

    const videoDoc = await db.collection('videos').doc(videoId).get();
    if (!videoDoc.exists) return error(res, 'Video not found', 404);
    if (videoDoc.data().userId !== req.user.uid) return error(res, 'Unauthorized', 403);

    await db.collection('videos').doc(videoId).update({
      status: 'deleted',
      deletedAt: new Date().toISOString(),
    });

    const admin = require('firebase-admin');
    await db.collection('users').doc(req.user.uid).update({
      videosCount: admin.firestore.FieldValue.increment(-1),
    });

    return success(res, null, 'Video deleted');
  } catch (err) {
    logger.error('Delete video error:', err);
    return error(res, 'Failed to delete video');
  }
}

async function saveVideo(req, res) {
  try {
    const db = getFirestore();
    const { videoId } = req.params;
    await db.collection('savedVideos').doc(`${req.user.uid}_${videoId}`).set({
      userId: req.user.uid,
      videoId,
      savedAt: new Date().toISOString(),
    });
    return success(res, null, 'Video saved');
  } catch (err) {
    logger.error('Save video error:', err);
    return error(res, 'Failed to save video');
  }
}

async function unsaveVideo(req, res) {
  try {
    const db = getFirestore();
    await db.collection('savedVideos').doc(`${req.user.uid}_${req.params.videoId}`).delete();
    return success(res, null, 'Video unsaved');
  } catch (err) {
    logger.error('Unsave video error:', err);
    return error(res, 'Failed to unsave video');
  }
}

async function reportVideo(req, res) {
  try {
    const db = getFirestore();
    const { videoId } = req.params;
    const { reason, description } = req.body;

    await db.collection('reports').add({
      reporterId: req.user.uid,
      targetId: videoId,
      targetType: 'video',
      reason,
      description: description || '',
      status: 'pending',
      createdAt: new Date().toISOString(),
    });

    return success(res, null, 'Report submitted', 201);
  } catch (err) {
    logger.error('Report video error:', err);
    return error(res, 'Failed to submit report');
  }
}

module.exports = {
  getVideos,
  getTrending,
  getVideo,
  likeVideo,
  unlikeVideo,
  addComment,
  getComments,
  deleteComment,
  shareVideo,
  recordView,
  deleteVideo,
  saveVideo,
  unsaveVideo,
  reportVideo,
};
