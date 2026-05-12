const { getFirestore } = require('../config/firebase');
const { success, error } = require('../utils/response');
const { logger } = require('../utils/logger');

async function getDashboard(req, res) {
  try {
    const db = getFirestore();

    const [usersSnap, videosSnap, reportsSnap] = await Promise.all([
      db.collection('users').get(),
      db.collection('videos').where('status', '==', 'active').get(),
      db.collection('reports').where('status', '==', 'pending').get(),
    ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const newUsersToday = usersSnap.docs.filter(
      (doc) => new Date(doc.data().createdAt) >= today
    ).length;

    return success(res, {
      totalUsers: usersSnap.size,
      totalVideos: videosSnap.size,
      pendingReports: reportsSnap.size,
      newUsersToday,
    });
  } catch (err) {
    logger.error('Dashboard error:', err);
    return error(res, 'Failed to fetch dashboard');
  }
}

async function getUsers(req, res) {
  try {
    const db = getFirestore();
    const limit = parseInt(req.query.limit) || 50;
    const snapshot = await db.collection('users')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    const users = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      delete data.driveTokens;
      delete data.fcmTokens;
      users.push(data);
    });

    return success(res, users);
  } catch (err) {
    logger.error('Get users error:', err);
    return error(res, 'Failed to fetch users');
  }
}

async function updateUserRole(req, res) {
  try {
    const db = getFirestore();
    const { role } = req.body;
    if (!['user', 'moderator', 'admin'].includes(role)) {
      return error(res, 'Invalid role', 400);
    }
    await db.collection('users').doc(req.params.userId).update({ role });
    return success(res, null, 'Role updated');
  } catch (err) {
    logger.error('Update role error:', err);
    return error(res, 'Failed to update role');
  }
}

async function banUser(req, res) {
  try {
    const db = getFirestore();
    await db.collection('users').doc(req.params.userId).update({
      isBanned: true,
      bannedAt: new Date().toISOString(),
      bannedBy: req.user.uid,
      banReason: req.body.reason || 'Violation of terms',
    });
    return success(res, null, 'User banned');
  } catch (err) {
    logger.error('Ban user error:', err);
    return error(res, 'Failed to ban user');
  }
}

async function unbanUser(req, res) {
  try {
    const db = getFirestore();
    await db.collection('users').doc(req.params.userId).update({
      isBanned: false,
      unbannedAt: new Date().toISOString(),
    });
    return success(res, null, 'User unbanned');
  } catch (err) {
    logger.error('Unban user error:', err);
    return error(res, 'Failed to unban user');
  }
}

async function getVideos(req, res) {
  try {
    const db = getFirestore();
    const limit = parseInt(req.query.limit) || 50;
    const status = req.query.status || 'active';

    const snapshot = await db.collection('videos')
      .where('status', '==', status)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    const videos = [];
    snapshot.forEach((doc) => videos.push({ id: doc.id, ...doc.data() }));
    return success(res, videos);
  } catch (err) {
    logger.error('Admin get videos error:', err);
    return error(res, 'Failed to fetch videos');
  }
}

async function removeVideo(req, res) {
  try {
    const db = getFirestore();
    await db.collection('videos').doc(req.params.videoId).update({
      status: 'removed',
      removedBy: req.user.uid,
      removedAt: new Date().toISOString(),
      removeReason: req.body.reason || 'Content violation',
    });
    return success(res, null, 'Video removed');
  } catch (err) {
    logger.error('Remove video error:', err);
    return error(res, 'Failed to remove video');
  }
}

async function getReports(req, res) {
  try {
    const db = getFirestore();
    const status = req.query.status || 'pending';
    const snapshot = await db.collection('reports')
      .where('status', '==', status)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    const reports = [];
    snapshot.forEach((doc) => reports.push({ id: doc.id, ...doc.data() }));
    return success(res, reports);
  } catch (err) {
    logger.error('Get reports error:', err);
    return error(res, 'Failed to fetch reports');
  }
}

async function resolveReport(req, res) {
  try {
    const db = getFirestore();
    const { action, note } = req.body;

    await db.collection('reports').doc(req.params.reportId).update({
      status: 'resolved',
      resolution: action || 'reviewed',
      resolvedBy: req.user.uid,
      resolvedAt: new Date().toISOString(),
      note: note || '',
    });

    return success(res, null, 'Report resolved');
  } catch (err) {
    logger.error('Resolve report error:', err);
    return error(res, 'Failed to resolve report');
  }
}

async function getAnalytics(req, res) {
  try {
    const db = getFirestore();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [users, videos, views] = await Promise.all([
      db.collection('users').where('createdAt', '>=', thirtyDaysAgo.toISOString()).get(),
      db.collection('videos').where('createdAt', '>=', thirtyDaysAgo.toISOString()).get(),
      db.collection('videoViews').where('viewedAt', '>=', thirtyDaysAgo.toISOString()).get(),
    ]);

    return success(res, {
      last30Days: {
        newUsers: users.size,
        newVideos: videos.size,
        totalViews: views.size,
      },
    });
  } catch (err) {
    logger.error('Analytics error:', err);
    return error(res, 'Failed to fetch analytics');
  }
}

async function getUploadActivity(req, res) {
  try {
    const db = getFirestore();
    const snapshot = await db.collection('uploads')
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    const uploads = [];
    snapshot.forEach((doc) => uploads.push({ id: doc.id, ...doc.data() }));
    return success(res, uploads);
  } catch (err) {
    logger.error('Upload activity error:', err);
    return error(res, 'Failed to fetch upload activity');
  }
}

module.exports = {
  getDashboard,
  getUsers,
  updateUserRole,
  banUser,
  unbanUser,
  getVideos,
  removeVideo,
  getReports,
  resolveReport,
  getAnalytics,
  getUploadActivity,
};
