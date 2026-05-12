const { getFirestore } = require('../config/firebase');
const { success, paginated, error } = require('../utils/response');
const { logger } = require('../utils/logger');
const notificationService = require('../services/notificationService');

async function sendFriendRequest(req, res) {
  try {
    const db = getFirestore();
    const uid = req.user.uid;
    const targetId = req.params.userId;

    if (uid === targetId) return error(res, 'Cannot send friend request to yourself', 400);

    const existingDoc = await db.collection('friendRequests')
      .where('fromUserId', '==', uid)
      .where('toUserId', '==', targetId)
      .where('status', '==', 'pending')
      .get();

    if (!existingDoc.empty) return error(res, 'Friend request already sent', 409);

    const friendId = [uid, targetId].sort().join('_');
    const friendDoc = await db.collection('friends').doc(friendId).get();
    if (friendDoc.exists) return error(res, 'Already friends', 409);

    const requestData = {
      fromUserId: uid,
      toUserId: targetId,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    const ref = await db.collection('friendRequests').add(requestData);

    await notificationService.sendNotification(targetId, {
      type: 'friend_request',
      fromUserId: uid,
      requestId: ref.id,
      message: 'sent you a friend request',
    });

    return success(res, { id: ref.id, ...requestData }, 'Friend request sent', 201);
  } catch (err) {
    logger.error('Send friend request error:', err);
    return error(res, 'Failed to send friend request');
  }
}

async function acceptFriendRequest(req, res) {
  try {
    const db = getFirestore();
    const admin = require('firebase-admin');
    const { requestId } = req.params;

    const requestDoc = await db.collection('friendRequests').doc(requestId).get();
    if (!requestDoc.exists) return error(res, 'Request not found', 404);

    const request = requestDoc.data();
    if (request.toUserId !== req.user.uid) return error(res, 'Unauthorized', 403);
    if (request.status !== 'pending') return error(res, 'Request already handled', 400);

    const friendId = [request.fromUserId, request.toUserId].sort().join('_');

    const batch = db.batch();
    batch.update(db.collection('friendRequests').doc(requestId), {
      status: 'accepted',
      respondedAt: new Date().toISOString(),
    });
    batch.set(db.collection('friends').doc(friendId), {
      users: [request.fromUserId, request.toUserId],
      createdAt: new Date().toISOString(),
    });
    batch.update(db.collection('users').doc(request.fromUserId), {
      friendsCount: admin.firestore.FieldValue.increment(1),
    });
    batch.update(db.collection('users').doc(request.toUserId), {
      friendsCount: admin.firestore.FieldValue.increment(1),
    });
    await batch.commit();

    await notificationService.sendNotification(request.fromUserId, {
      type: 'friend_request_accepted',
      fromUserId: req.user.uid,
      message: 'accepted your friend request',
    });

    return success(res, null, 'Friend request accepted');
  } catch (err) {
    logger.error('Accept friend request error:', err);
    return error(res, 'Failed to accept friend request');
  }
}

async function rejectFriendRequest(req, res) {
  try {
    const db = getFirestore();
    const { requestId } = req.params;

    const requestDoc = await db.collection('friendRequests').doc(requestId).get();
    if (!requestDoc.exists) return error(res, 'Request not found', 404);
    if (requestDoc.data().toUserId !== req.user.uid) return error(res, 'Unauthorized', 403);

    await db.collection('friendRequests').doc(requestId).update({
      status: 'rejected',
      respondedAt: new Date().toISOString(),
    });

    return success(res, null, 'Friend request rejected');
  } catch (err) {
    logger.error('Reject friend request error:', err);
    return error(res, 'Failed to reject friend request');
  }
}

async function cancelFriendRequest(req, res) {
  try {
    const db = getFirestore();
    const { requestId } = req.params;

    const requestDoc = await db.collection('friendRequests').doc(requestId).get();
    if (!requestDoc.exists) return error(res, 'Request not found', 404);
    if (requestDoc.data().fromUserId !== req.user.uid) return error(res, 'Unauthorized', 403);

    await db.collection('friendRequests').doc(requestId).delete();
    return success(res, null, 'Friend request cancelled');
  } catch (err) {
    logger.error('Cancel friend request error:', err);
    return error(res, 'Failed to cancel friend request');
  }
}

async function getPendingRequests(req, res) {
  try {
    const db = getFirestore();
    const snapshot = await db.collection('friendRequests')
      .where('toUserId', '==', req.user.uid)
      .where('status', '==', 'pending')
      .orderBy('createdAt', 'desc')
      .get();

    const requests = [];
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const userDoc = await db.collection('users').doc(data.fromUserId).get();
      requests.push({
        id: doc.id,
        ...data,
        fromUser: userDoc.exists ? {
          uid: userDoc.data().uid,
          displayName: userDoc.data().displayName,
          username: userDoc.data().username,
          profilePictureUrl: userDoc.data().profilePictureUrl,
        } : null,
      });
    }

    return success(res, requests);
  } catch (err) {
    logger.error('Get pending requests error:', err);
    return error(res, 'Failed to fetch pending requests');
  }
}

async function getSentRequests(req, res) {
  try {
    const db = getFirestore();
    const snapshot = await db.collection('friendRequests')
      .where('fromUserId', '==', req.user.uid)
      .where('status', '==', 'pending')
      .orderBy('createdAt', 'desc')
      .get();

    const requests = [];
    snapshot.forEach((doc) => requests.push({ id: doc.id, ...doc.data() }));
    return success(res, requests);
  } catch (err) {
    logger.error('Get sent requests error:', err);
    return error(res, 'Failed to fetch sent requests');
  }
}

async function getFriends(req, res) {
  try {
    const db = getFirestore();
    const uid = req.user.uid;

    const snapshot = await db.collection('friends')
      .where('users', 'array-contains', uid)
      .orderBy('createdAt', 'desc')
      .get();

    const friends = [];
    for (const doc of snapshot.docs) {
      const friendUid = doc.data().users.find((id) => id !== uid);
      const userDoc = await db.collection('users').doc(friendUid).get();
      if (userDoc.exists) {
        friends.push({
          uid: userDoc.data().uid,
          displayName: userDoc.data().displayName,
          username: userDoc.data().username,
          profilePictureUrl: userDoc.data().profilePictureUrl,
          isVerified: userDoc.data().isVerified,
        });
      }
    }

    return success(res, friends);
  } catch (err) {
    logger.error('Get friends error:', err);
    return error(res, 'Failed to fetch friends');
  }
}

async function removeFriend(req, res) {
  try {
    const db = getFirestore();
    const admin = require('firebase-admin');
    const uid = req.user.uid;
    const friendUid = req.params.userId;

    const friendId = [uid, friendUid].sort().join('_');
    const friendDoc = await db.collection('friends').doc(friendId).get();
    if (!friendDoc.exists) return error(res, 'Not friends', 404);

    const batch = db.batch();
    batch.delete(db.collection('friends').doc(friendId));
    batch.update(db.collection('users').doc(uid), {
      friendsCount: admin.firestore.FieldValue.increment(-1),
    });
    batch.update(db.collection('users').doc(friendUid), {
      friendsCount: admin.firestore.FieldValue.increment(-1),
    });
    await batch.commit();

    return success(res, null, 'Friend removed');
  } catch (err) {
    logger.error('Remove friend error:', err);
    return error(res, 'Failed to remove friend');
  }
}

module.exports = {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  cancelFriendRequest,
  getPendingRequests,
  getSentRequests,
  getFriends,
  removeFriend,
};
