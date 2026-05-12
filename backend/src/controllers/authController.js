const { getFirestore, getAuth } = require('../config/firebase');
const { getFolderIds } = require('../config/drive');
const { success, error } = require('../utils/response');
const { logger } = require('../utils/logger');

async function register(req, res) {
  try {
    const { email, displayName, username, idToken } = req.body;
    const db = getFirestore();

    const decodedToken = await getAuth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const existingUser = await db.collection('users')
      .where('username', '==', username.toLowerCase())
      .get();

    if (!existingUser.empty) {
      return error(res, 'Username already taken', 409);
    }

    const userData = {
      uid,
      email,
      displayName,
      username: username.toLowerCase(),
      bio: '',
      profilePictureUrl: '',
      followersCount: 0,
      followingCount: 0,
      videosCount: 0,
      likesCount: 0,
      friendsCount: 0,
      role: 'user',
      isVerified: false,
      isBanned: false,
      isPrivate: false,
      driveConnected: true,
      driveFolders: getFolderIds(),
      fcmTokens: [],
      notificationSettings: {
        likes: true,
        comments: true,
        follows: true,
        friendRequests: true,
        mentions: true,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.collection('users').doc(uid).set(userData);

    logger.info(`User registered: ${uid}`);
    return success(res, { user: userData }, 'Registration successful', 201);
  } catch (err) {
    logger.error('Registration error:', err);
    return error(res, 'Registration failed');
  }
}

async function googleSignIn(req, res) {
  try {
    const { idToken } = req.body;
    const db = getFirestore();

    const decodedToken = await getAuth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const userDoc = await db.collection('users').doc(uid).get();

    if (userDoc.exists) {
      const userData = userDoc.data();
      if (userData.isBanned) {
        return error(res, 'Account has been suspended', 403);
      }
      await db.collection('users').doc(uid).update({
        lastLoginAt: new Date().toISOString(),
        driveConnected: true,
        driveFolders: getFolderIds(),
      });
      return success(res, { user: userData, isNewUser: false });
    }

    return success(res, { isNewUser: true, uid, email: decodedToken.email });
  } catch (err) {
    logger.error('Google sign-in error:', err);
    return error(res, 'Sign-in failed');
  }
}

async function getCurrentUser(req, res) {
  try {
    const db = getFirestore();
    const userDoc = await db.collection('users').doc(req.user.uid).get();

    if (!userDoc.exists) {
      return error(res, 'User not found', 404);
    }

    const userData = userDoc.data();
    delete userData.fcmTokens;

    return success(res, { user: userData });
  } catch (err) {
    logger.error('Get current user error:', err);
    return error(res, 'Failed to get user data');
  }
}

async function updateProfile(req, res) {
  try {
    const db = getFirestore();
    const updates = {};
    const allowed = ['displayName', 'bio', 'website', 'isPrivate'];

    for (const field of allowed) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    updates.updatedAt = new Date().toISOString();
    await db.collection('users').doc(req.user.uid).update(updates);

    return success(res, { updates }, 'Profile updated');
  } catch (err) {
    logger.error('Update profile error:', err);
    return error(res, 'Failed to update profile');
  }
}

async function updateFcmToken(req, res) {
  try {
    const { token } = req.body;
    const db = getFirestore();

    const userRef = db.collection('users').doc(req.user.uid);
    const userDoc = await userRef.get();
    const tokens = userDoc.data()?.fcmTokens || [];

    if (!tokens.includes(token)) {
      tokens.push(token);
      if (tokens.length > 5) tokens.shift();
      await userRef.update({ fcmTokens: tokens });
    }

    return success(res, null, 'FCM token updated');
  } catch (err) {
    logger.error('FCM token update error:', err);
    return error(res, 'Failed to update FCM token');
  }
}

async function logout(req, res) {
  try {
    const { fcmToken } = req.body;
    if (fcmToken) {
      const db = getFirestore();
      const userRef = db.collection('users').doc(req.user.uid);
      const userDoc = await userRef.get();
      const tokens = (userDoc.data()?.fcmTokens || []).filter((t) => t !== fcmToken);
      await userRef.update({ fcmTokens: tokens });
    }
    return success(res, null, 'Logged out successfully');
  } catch (err) {
    logger.error('Logout error:', err);
    return error(res, 'Logout failed');
  }
}

module.exports = {
  register,
  googleSignIn,
  getCurrentUser,
  updateProfile,
  updateFcmToken,
  logout,
};
