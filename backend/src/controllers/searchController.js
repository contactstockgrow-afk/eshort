const { getFirestore } = require('../config/firebase');
const { success, error } = require('../utils/response');
const { logger } = require('../utils/logger');

async function search(req, res) {
  try {
    const db = getFirestore();
    const { q, type = 'all', limit = 20 } = req.query;
    const searchTerm = q.toLowerCase();
    const results = {};

    if (type === 'all' || type === 'users') {
      const usersSnapshot = await db.collection('users')
        .where('username', '>=', searchTerm)
        .where('username', '<=', searchTerm + '\uf8ff')
        .limit(parseInt(limit))
        .get();

      results.users = [];
      usersSnapshot.forEach((doc) => {
        const data = doc.data();
        results.users.push({
          uid: data.uid,
          displayName: data.displayName,
          username: data.username,
          profilePictureUrl: data.profilePictureUrl,
          followersCount: data.followersCount,
          isVerified: data.isVerified,
        });
      });
    }

    if (type === 'all' || type === 'videos') {
      const videosSnapshot = await db.collection('videos')
        .where('status', '==', 'active')
        .orderBy('likesCount', 'desc')
        .limit(parseInt(limit))
        .get();

      results.videos = [];
      videosSnapshot.forEach((doc) => {
        const data = doc.data();
        if (
          data.caption?.toLowerCase().includes(searchTerm) ||
          data.hashtags?.some((h) => h.toLowerCase().includes(searchTerm))
        ) {
          results.videos.push({ id: doc.id, ...data });
        }
      });
    }

    if (type === 'all' || type === 'hashtags') {
      const hashtagsSnapshot = await db.collection('hashtags')
        .where('tag', '>=', searchTerm)
        .where('tag', '<=', searchTerm + '\uf8ff')
        .orderBy('tag')
        .orderBy('count', 'desc')
        .limit(parseInt(limit))
        .get();

      results.hashtags = [];
      hashtagsSnapshot.forEach((doc) => {
        results.hashtags.push({ id: doc.id, ...doc.data() });
      });
    }

    return success(res, results);
  } catch (err) {
    logger.error('Search error:', err);
    return error(res, 'Search failed');
  }
}

async function getSuggestions(req, res) {
  try {
    const db = getFirestore();
    const { q } = req.query;
    if (!q || q.length < 2) return success(res, []);

    const searchTerm = q.toLowerCase();
    const suggestions = [];

    const usersSnap = await db.collection('users')
      .where('username', '>=', searchTerm)
      .where('username', '<=', searchTerm + '\uf8ff')
      .limit(5)
      .get();

    usersSnap.forEach((doc) => {
      suggestions.push({ type: 'user', value: doc.data().username, displayName: doc.data().displayName });
    });

    const tagsSnap = await db.collection('hashtags')
      .where('tag', '>=', searchTerm)
      .where('tag', '<=', searchTerm + '\uf8ff')
      .orderBy('tag')
      .orderBy('count', 'desc')
      .limit(5)
      .get();

    tagsSnap.forEach((doc) => {
      suggestions.push({ type: 'hashtag', value: doc.data().tag, count: doc.data().count });
    });

    return success(res, suggestions);
  } catch (err) {
    logger.error('Suggestions error:', err);
    return error(res, 'Failed to fetch suggestions');
  }
}

async function getTrending(req, res) {
  try {
    const db = getFirestore();

    const trendingTags = await db.collection('hashtags')
      .orderBy('count', 'desc')
      .limit(20)
      .get();

    const tags = [];
    trendingTags.forEach((doc) => tags.push({ id: doc.id, ...doc.data() }));

    const suggestedUsers = await db.collection('users')
      .where('isVerified', '==', true)
      .orderBy('followersCount', 'desc')
      .limit(10)
      .get();

    const creators = [];
    suggestedUsers.forEach((doc) => {
      const data = doc.data();
      creators.push({
        uid: data.uid,
        displayName: data.displayName,
        username: data.username,
        profilePictureUrl: data.profilePictureUrl,
        followersCount: data.followersCount,
        isVerified: data.isVerified,
      });
    });

    return success(res, { trendingHashtags: tags, suggestedCreators: creators });
  } catch (err) {
    logger.error('Get trending error:', err);
    return error(res, 'Failed to fetch trending');
  }
}

async function getHashtagVideos(req, res) {
  try {
    const db = getFirestore();
    const tag = req.params.tag.toLowerCase();
    const limit = parseInt(req.query.limit) || 20;

    const snapshot = await db.collection('videos')
      .where('status', '==', 'active')
      .where('hashtags', 'array-contains', tag)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    const videos = [];
    snapshot.forEach((doc) => videos.push({ id: doc.id, ...doc.data() }));

    return success(res, videos);
  } catch (err) {
    logger.error('Get hashtag videos error:', err);
    return error(res, 'Failed to fetch hashtag videos');
  }
}

async function getDiscoverContent(req, res) {
  try {
    const db = getFirestore();

    const trendingVideos = await db.collection('videos')
      .where('status', '==', 'active')
      .orderBy('trendingScore', 'desc')
      .limit(10)
      .get();

    const videos = [];
    trendingVideos.forEach((doc) => videos.push({ id: doc.id, ...doc.data() }));

    const categories = ['comedy', 'music', 'dance', 'food', 'sports', 'tech', 'fashion', 'travel'];

    return success(res, { trendingVideos: videos, categories });
  } catch (err) {
    logger.error('Get discover error:', err);
    return error(res, 'Failed to fetch discover content');
  }
}

module.exports = { search, getSuggestions, getTrending, getHashtagVideos, getDiscoverContent };
