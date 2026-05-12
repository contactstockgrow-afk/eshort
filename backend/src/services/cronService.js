const cron = require('node-cron');
const { getFirestore } = require('../config/firebase');
const { logger } = require('../utils/logger');

function startCronJobs() {
  cron.schedule('0 */6 * * *', updateTrendingScores);
  cron.schedule('0 0 * * *', cleanupOldData);
  cron.schedule('*/30 * * * *', updateHashtagCounts);

  logger.info('Cron jobs scheduled');
}

async function updateTrendingScores() {
  try {
    const db = getFirestore();
    const snapshot = await db.collection('videos')
      .where('status', '==', 'active')
      .get();

    const batch = db.batch();
    const now = Date.now();

    snapshot.forEach((doc) => {
      const data = doc.data();
      const ageHours = (now - new Date(data.createdAt).getTime()) / (1000 * 60 * 60);
      const decayFactor = Math.max(0.1, 1 - ageHours / 168);

      const score =
        (data.viewsCount || 0) * 1 +
        (data.likesCount || 0) * 3 +
        (data.commentsCount || 0) * 5 +
        (data.sharesCount || 0) * 7;

      const trendingScore = Math.round(score * decayFactor);
      batch.update(doc.ref, { trendingScore });
    });

    await batch.commit();
    logger.info('Trending scores updated');
  } catch (err) {
    logger.error('Update trending scores error:', err);
  }
}

async function cleanupOldData() {
  try {
    const db = getFirestore();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const oldNotifications = await db.collection('notifications')
      .where('read', '==', true)
      .where('createdAt', '<', thirtyDaysAgo.toISOString())
      .limit(500)
      .get();

    const batch = db.batch();
    oldNotifications.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();

    logger.info(`Cleaned up ${oldNotifications.size} old notifications`);
  } catch (err) {
    logger.error('Cleanup error:', err);
  }
}

async function updateHashtagCounts() {
  try {
    const db = getFirestore();
    const hashtags = await db.collection('hashtags').get();

    const batch = db.batch();
    for (const doc of hashtags.docs) {
      const tag = doc.data().tag;
      const videos = await db.collection('videos')
        .where('status', '==', 'active')
        .where('hashtags', 'array-contains', tag)
        .get();

      batch.update(doc.ref, { count: videos.size });
    }

    await batch.commit();
    logger.info('Hashtag counts updated');
  } catch (err) {
    logger.error('Update hashtag counts error:', err);
  }
}

module.exports = { startCronJobs };
