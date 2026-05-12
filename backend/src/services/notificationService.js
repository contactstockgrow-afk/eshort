const { getFirestore, getMessaging } = require('../config/firebase');
const { logger } = require('../utils/logger');

async function sendNotification(userId, notificationData) {
  try {
    const db = getFirestore();

    const notif = {
      userId,
      type: notificationData.type,
      fromUserId: notificationData.fromUserId || null,
      videoId: notificationData.videoId || null,
      commentId: notificationData.commentId || null,
      requestId: notificationData.requestId || null,
      message: notificationData.message,
      read: false,
      createdAt: new Date().toISOString(),
    };

    await db.collection('notifications').add(notif);

    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) return;

    const userData = userDoc.data();

    const settingKey = getSettingKey(notificationData.type);
    if (settingKey && userData.notificationSettings && !userData.notificationSettings[settingKey]) {
      return;
    }

    const fcmTokens = userData.fcmTokens || [];
    if (fcmTokens.length === 0) return;

    let fromUserName = '';
    if (notificationData.fromUserId) {
      const fromUserDoc = await db.collection('users').doc(notificationData.fromUserId).get();
      if (fromUserDoc.exists) {
        fromUserName = fromUserDoc.data().displayName || fromUserDoc.data().username;
      }
    }

    const messaging = getMessaging();
    const message = {
      notification: {
        title: 'eShort',
        body: `${fromUserName} ${notificationData.message}`,
      },
      data: {
        type: notificationData.type,
        ...(notificationData.videoId && { videoId: notificationData.videoId }),
        ...(notificationData.fromUserId && { fromUserId: notificationData.fromUserId }),
      },
    };

    for (const token of fcmTokens) {
      try {
        await messaging.send({ ...message, token });
      } catch (err) {
        if (err.code === 'messaging/registration-token-not-registered') {
          const updatedTokens = fcmTokens.filter((t) => t !== token);
          await db.collection('users').doc(userId).update({ fcmTokens: updatedTokens });
        }
      }
    }
  } catch (err) {
    logger.error('Send notification error:', err);
  }
}

function getSettingKey(type) {
  const mapping = {
    like: 'likes',
    comment: 'comments',
    follow: 'follows',
    friend_request: 'friendRequests',
    friend_request_accepted: 'friendRequests',
    mention: 'mentions',
  };
  return mapping[type] || null;
}

module.exports = { sendNotification };
