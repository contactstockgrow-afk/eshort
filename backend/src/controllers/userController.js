const { getFirestore } = require('../config/firebase');
const { success, paginated, error } = require('../utils/response');
const { logger } = require('../utils/logger');
const notificationService = require('../services/notificationService');

async function getProfile(req, res) {
  try {
    const db = getFirestore();
    const doc = await db.collection('users').doc(req.params.userId).get();
    if (!doc.exists) return error(res, 'User not found', 404);

    const user = doc.data();
    delete user.driveTokens;
    delete user.fcmTokens;
    delete user.notificationSettings;

    if (req.user) {
      const followDoc = await db.collection('follows').doc(`${req.user.uid}_${req.params.userId}`).get();
      user.isFollowing = followDoc.exists;
      const friendDoc = await db.collection('friends').doc(
        [req.user.uid, req.params.userId].sort().join('_')
      ).get();
      user.isFriend = friendDoc.exists;
    }

    return success(res, { user });
  } catch (err) {
    logger.error('Get profile error:', err);
    return error(res, 'Failed to fetch profile');
  }
}

async function updateProfile(req, res) {
  try {
    const db = getFirestore();
    const updates = {};
    const allowed = ['displayName', 'bio', 'website', 'isPrivate'];
    for (const field of allowed) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }
    updates.updatedAt = new Date().toISOString();
    await db.collection('users').doc(req.user.uid).update(updates);
    return success(res, { updates }, 'Profile updated');
  } catch (err) {
    logger.error('Update profile error:', err);
    return error(res, 'Failed to update profile');
  }
}

async function getUserVideos(req, res) {
  try {
    const db = getFirestore();
    const limit = parseInt(req.query.limit) || 20;
    const cursor = req.query.cursor;

    let query = db.collection('videos')
      .where('userId', '==', req.params.userId)
      .where('status', '==', 'active')
      .orderBy('createdAt', 'desc')
      .limit(limit + 1);

    if (cursor) {
      const cursorDoc = await db.collection('videos').doc(cursor).get();
      if (cursorDoc.exists) query = query.startAfter(cursorDoc);
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
    logger.error('Get user videos error:', err);
    return error(res, 'Failed to fetch user videos');
  }
}

async function getFollowers(req, res) {
  try {
    const db = getFirestore();
    const limit = parseInt(req.query.limit) || 20;

    const snapshot = await db.collection('follows')
      .where('followingId', '==', req.params.userId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    const followerIds = [];
    snapshot.forEach((doc) => followerIds.push(doc.data().followerId));

    const followers = [];
    for (const id of followerIds) {
      const userDoc = await db.collection('users').doc(id).get();
      if (userDoc.exists) {
        const data = userDoc.data();
        followers.push({
          uid: data.uid,
          displayName: data.displayName,
          username: data.username,
          profilePictureUrl: data.profilePictureUrl,
          isVerified: data.isVerified,
        });
      }
    }

    return success(res, followers);
  } catch (err) {
    logger.error('Get followers error:', err);
    return error(res, 'Failed to fetch followers');
  }
}

async function getFollowing(req, res) {
  try {
    const db = getFirestore();
    const limit = parseInt(req.query.limit) || 20;

    const snapshot = await db.collection('follows')
      .where('followerId', '==', req.params.userId)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    const followingIds = [];
    snapshot.forEach((doc) => followingIds.push(doc.data().followingId));

    const following = [];
    for (const id of followingIds) {
      const userDoc = await db.collection('users').doc(id).get();
      if (userDoc.exists) {
        const data = userDoc.data();
        following.push({
          uid: data.uid,
          displayName: data.displayName,
          username: data.username,
          profilePictureUrl: data.profilePictureUrl,
          isVerified: data.isVerified,
        });
      }
    }

    return success(res, following);
  } catch (err) {
    logger.error('Get following error:', err);
    return error(res, 'Failed to fetch following');
  }
}

async function followUser(req, res) {
  try {
    const db = getFirestore();
    const admin = require('firebase-admin');
    const targetId = req.params.userId;
    const uid = req.user.uid;

    if (targetId === uid) return error(res, 'Cannot follow yourself', 400);

    const followRef = db.collection('follows').doc(`${uid}_${targetId}`);
    if ((await followRef.get()).exists) return error(res, 'Already following', 409);

    const batch = db.batch();
    batch.set(followRef, {
      followerId: uid,
      followingId: targetId,
      createdAt: new Date().toISOString(),
    });
    batch.update(db.collection('users').doc(uid), {
      followingCount: admin.firestore.FieldValue.increment(1),
    });
    batch.update(db.collection('users').doc(targetId), {
      followersCount: admin.firestore.FieldValue.increment(1),
    });
    await batch.commit();

    await notificationService.sendNotification(targetId, {
      type: 'follow',
      fromUserId: uid,
      message: 'started following you',
    });

    return success(res, null, 'User followed');
  } catch (err) {
    logger.error('Follow user error:', err);
    return error(res, 'Failed to follow user');
  }
}

async function unfollowUser(req, res) {
  try {
    const db = getFirestore();
    const admin = require('firebase-admin');
    const targetId = req.params.userId;
    const uid = req.user.uid;

    const followRef = db.collection('follows').doc(`${uid}_${targetId}`);
    if (!(await followRef.get()).exists) return error(res, 'Not following', 404);

    const batch = db.batch();
    batch.delete(followRef);
    batch.update(db.collection('users').doc(uid), {
      followingCount: admin.firestore.FieldValue.increment(-1),
    });
    batch.update(db.collection('users').doc(targetId), {
      followersCount: admin.firestore.FieldValue.increment(-1),
    });
    await batch.commit();

    return success(res, null, 'User unfollowed');
  } catch (err) {
    logger.error('Unfollow user error:', err);
    return error(res, 'Failed to unfollow user');
  }
}

async function blockUser(req, res) {
  try {
    const db = getFirestore();
    await db.collection('blocks').doc(`${req.user.uid}_${req.params.userId}`).set({
      blockerId: req.user.uid,
      blockedId: req.params.userId,
      createdAt: new Date().toISOString(),
    });
    return success(res, null, 'User blocked');
  } catch (err) {
    logger.error('Block user error:', err);
    return error(res, 'Failed to block user');
  }
}

async function unblockUser(req, res) {
  try {
    const db = getFirestore();
    await db.collection('blocks').doc(`${req.user.uid}_${req.params.userId}`).delete();
    return success(res, null, 'User unblocked');
  } catch (err) {
    logger.error('Unblock user error:', err);
    return error(res, 'Failed to unblock user');
  }
}

async function getSavedVideos(req, res) {
  try {
    const db = getFirestore();
    const limit = parseInt(req.query.limit) || 20;

    const snapshot = await db.collection('savedVideos')
      .where('userId', '==', req.user.uid)
      .orderBy('savedAt', 'desc')
      .limit(limit)
      .get();

    const videoIds = [];
    snapshot.forEach((doc) => videoIds.push(doc.data().videoId));

    const videos = [];
    for (const id of videoIds) {
      const videoDoc = await db.collection('videos').doc(id).get();
      if (videoDoc.exists) videos.push({ id: videoDoc.id, ...videoDoc.data() });
    }

    return success(res, videos);
  } catch (err) {
    logger.error('Get saved videos error:', err);
    return error(res, 'Failed to fetch saved videos');
  }
}

async function getLikedVideos(req, res) {
  try {
    const db = getFirestore();
    const limit = parseInt(req.query.limit) || 20;

    const snapshot = await db.collection('likes')
      .where('userId', '==', req.user.uid)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    const videoIds = [];
    snapshot.forEach((doc) => videoIds.push(doc.data().videoId));

    const videos = [];
    for (const id of videoIds) {
      const videoDoc = await db.collection('videos').doc(id).get();
      if (videoDoc.exists) videos.push({ id: videoDoc.id, ...videoDoc.data() });
    }

    return success(res, videos);
  } catch (err) {
    logger.error('Get liked videos error:', err);
    return error(res, 'Failed to fetch liked videos');
  }
}

module.exports = {
  getProfile,
  updateProfile,
  getUserVideos,
  getFollowers,
  getFollowing,
  followUser,
  unfollowUser,
  blockUser,
  unblockUser,
  getSavedVideos,
  getLikedVideos,
};
