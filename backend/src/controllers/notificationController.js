const { getFirestore } = require('../config/firebase');
const { success, paginated, error } = require('../utils/response');
const { logger } = require('../utils/logger');

async function getNotifications(req, res) {
  try {
    const db = getFirestore();
    const limit = parseInt(req.query.limit) || 20;
    const cursor = req.query.cursor;

    let query = db.collection('notifications')
      .where('userId', '==', req.user.uid)
      .orderBy('createdAt', 'desc')
      .limit(limit + 1);

    if (cursor) {
      const cursorDoc = await db.collection('notifications').doc(cursor).get();
      if (cursorDoc.exists) query = query.startAfter(cursorDoc);
    }

    const snapshot = await query.get();
    const notifications = [];

    for (const doc of snapshot.docs) {
      const data = doc.data();
      if (data.fromUserId) {
        const userDoc = await db.collection('users').doc(data.fromUserId).get();
        if (userDoc.exists) {
          data.fromUser = {
            displayName: userDoc.data().displayName,
            username: userDoc.data().username,
            profilePictureUrl: userDoc.data().profilePictureUrl,
          };
        }
      }
      notifications.push({ id: doc.id, ...data });
    }

    const hasMore = notifications.length > limit;
    if (hasMore) notifications.pop();

    return paginated(res, notifications, {
      hasMore,
      nextCursor: hasMore ? notifications[notifications.length - 1].id : null,
    });
  } catch (err) {
    logger.error('Get notifications error:', err);
    return error(res, 'Failed to fetch notifications');
  }
}

async function getUnreadCount(req, res) {
  try {
    const db = getFirestore();
    const snapshot = await db.collection('notifications')
      .where('userId', '==', req.user.uid)
      .where('read', '==', false)
      .get();

    return success(res, { count: snapshot.size });
  } catch (err) {
    logger.error('Get unread count error:', err);
    return error(res, 'Failed to get unread count');
  }
}

async function markAsRead(req, res) {
  try {
    const db = getFirestore();
    await db.collection('notifications').doc(req.params.notificationId).update({
      read: true,
      readAt: new Date().toISOString(),
    });
    return success(res, null, 'Notification marked as read');
  } catch (err) {
    logger.error('Mark as read error:', err);
    return error(res, 'Failed to mark notification as read');
  }
}

async function markAllAsRead(req, res) {
  try {
    const db = getFirestore();
    const snapshot = await db.collection('notifications')
      .where('userId', '==', req.user.uid)
      .where('read', '==', false)
      .get();

    const batch = db.batch();
    snapshot.forEach((doc) => {
      batch.update(doc.ref, { read: true, readAt: new Date().toISOString() });
    });
    await batch.commit();

    return success(res, null, 'All notifications marked as read');
  } catch (err) {
    logger.error('Mark all as read error:', err);
    return error(res, 'Failed to mark all as read');
  }
}

async function deleteNotification(req, res) {
  try {
    const db = getFirestore();
    const doc = await db.collection('notifications').doc(req.params.notificationId).get();
    if (!doc.exists) return error(res, 'Notification not found', 404);
    if (doc.data().userId !== req.user.uid) return error(res, 'Unauthorized', 403);

    await db.collection('notifications').doc(req.params.notificationId).delete();
    return success(res, null, 'Notification deleted');
  } catch (err) {
    logger.error('Delete notification error:', err);
    return error(res, 'Failed to delete notification');
  }
}

async function updateSettings(req, res) {
  try {
    const db = getFirestore();
    const settings = req.body;
    const allowed = ['likes', 'comments', 'follows', 'friendRequests', 'mentions'];
    const updates = {};
    for (const key of allowed) {
      if (settings[key] !== undefined) updates[`notificationSettings.${key}`] = settings[key];
    }
    await db.collection('users').doc(req.user.uid).update(updates);
    return success(res, null, 'Settings updated');
  } catch (err) {
    logger.error('Update settings error:', err);
    return error(res, 'Failed to update settings');
  }
}

async function getSettings(req, res) {
  try {
    const db = getFirestore();
    const doc = await db.collection('users').doc(req.user.uid).get();
    return success(res, { settings: doc.data()?.notificationSettings || {} });
  } catch (err) {
    logger.error('Get settings error:', err);
    return error(res, 'Failed to get settings');
  }
}

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  updateSettings,
  getSettings,
};
