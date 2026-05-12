const { getFirestore } = require('../config/firebase');
const { success, paginated, error } = require('../utils/response');
const { logger } = require('../utils/logger');

async function getForYouFeed(req, res) {
  try {
    const db = getFirestore();
    const limit = parseInt(req.query.limit) || 10;
    const cursor = req.query.cursor;

    let query = db.collection('videos')
      .where('status', '==', 'active')
      .where('isPrivate', '==', false)
      .orderBy('trendingScore', 'desc')
      .orderBy('createdAt', 'desc')
      .limit(limit + 1);

    if (cursor) {
      const cursorDoc = await db.collection('videos').doc(cursor).get();
      if (cursorDoc.exists) query = query.startAfter(cursorDoc);
    }

    const snapshot = await query.get();
    const videos = [];

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const userDoc = await db.collection('users').doc(data.userId).get();
      videos.push({
        id: doc.id,
        ...data,
        user: userDoc.exists ? {
          uid: userDoc.data().uid,
          displayName: userDoc.data().displayName,
          username: userDoc.data().username,
          profilePictureUrl: userDoc.data().profilePictureUrl,
          isVerified: userDoc.data().isVerified,
        } : null,
        isLiked: false,
        isFollowing: false,
      });
    }

    if (req.user) {
      for (const video of videos) {
        const likeDoc = await db.collection('likes').doc(`${req.user.uid}_${video.id}`).get();
        video.isLiked = likeDoc.exists;
        if (video.user) {
          const followDoc = await db.collection('follows').doc(`${req.user.uid}_${video.user.uid}`).get();
          video.isFollowing = followDoc.exists;
        }
      }
    }

    const hasMore = videos.length > limit;
    if (hasMore) videos.pop();

    return paginated(res, videos, {
      hasMore,
      nextCursor: hasMore ? videos[videos.length - 1].id : null,
    });
  } catch (err) {
    logger.error('For You feed error:', err);
    return error(res, 'Failed to fetch feed');
  }
}

async function getFollowingFeed(req, res) {
  try {
    const db = getFirestore();
    const uid = req.user.uid;
    const limit = parseInt(req.query.limit) || 10;

    const followsSnapshot = await db.collection('follows')
      .where('followerId', '==', uid)
      .get();

    const followingIds = [];
    followsSnapshot.forEach((doc) => followingIds.push(doc.data().followingId));

    if (followingIds.length === 0) return success(res, []);

    const chunks = [];
    for (let i = 0; i < followingIds.length; i += 10) {
      chunks.push(followingIds.slice(i, i + 10));
    }

    const videos = [];
    for (const chunk of chunks) {
      const snapshot = await db.collection('videos')
        .where('userId', 'in', chunk)
        .where('status', '==', 'active')
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

      for (const doc of snapshot.docs) {
        const data = doc.data();
        const userDoc = await db.collection('users').doc(data.userId).get();
        videos.push({
          id: doc.id,
          ...data,
          user: userDoc.exists ? {
            uid: userDoc.data().uid,
            displayName: userDoc.data().displayName,
            username: userDoc.data().username,
            profilePictureUrl: userDoc.data().profilePictureUrl,
            isVerified: userDoc.data().isVerified,
          } : null,
        });
      }
    }

    videos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return success(res, videos.slice(0, limit));
  } catch (err) {
    logger.error('Following feed error:', err);
    return error(res, 'Failed to fetch following feed');
  }
}

async function getFriendsFeed(req, res) {
  try {
    const db = getFirestore();
    const uid = req.user.uid;
    const limit = parseInt(req.query.limit) || 10;

    const friendsSnapshot = await db.collection('friends')
      .where('users', 'array-contains', uid)
      .get();

    const friendIds = [];
    friendsSnapshot.forEach((doc) => {
      const friendId = doc.data().users.find((id) => id !== uid);
      friendIds.push(friendId);
    });

    if (friendIds.length === 0) return success(res, []);

    const chunks = [];
    for (let i = 0; i < friendIds.length; i += 10) {
      chunks.push(friendIds.slice(i, i + 10));
    }

    const videos = [];
    for (const chunk of chunks) {
      const snapshot = await db.collection('videos')
        .where('userId', 'in', chunk)
        .where('status', '==', 'active')
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

      for (const doc of snapshot.docs) {
        videos.push({ id: doc.id, ...doc.data() });
      }
    }

    videos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return success(res, videos.slice(0, limit));
  } catch (err) {
    logger.error('Friends feed error:', err);
    return error(res, 'Failed to fetch friends feed');
  }
}

module.exports = { getForYouFeed, getFollowingFeed, getFriendsFeed };
