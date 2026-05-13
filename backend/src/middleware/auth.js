const { getAuth } = require('../config/firebase');
const { getFirestore } = require('../config/firebase');
const { logger } = require('../utils/logger');

function extractToken(req) {
  const firebaseHeader = req.headers['x-firebase-token'];
  if (firebaseHeader) return firebaseHeader;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split('Bearer ')[1];
  }
  return null;
}

async function authenticate(req, res, next) {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({
        success: false,
        error: { message: 'No authentication token provided' },
      });
    }
    const decodedToken = await getAuth().verifyIdToken(token);

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified,
    };

    next();
  } catch (error) {
    logger.error('Authentication error:', error.message);
    return res.status(401).json({
      success: false,
      error: { message: 'Invalid or expired authentication token' },
    });
  }
}

async function optionalAuth(req, res, next) {
  try {
    const token = extractToken(req);
    if (token) {
      const decodedToken = await getAuth().verifyIdToken(token);
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
      };
    }
  } catch {
    // Continue without auth
  }
  next();
}

async function adminOnly(req, res, next) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { message: 'Authentication required' },
      });
    }

    const db = getFirestore();
    const userDoc = await db.collection('users').doc(req.user.uid).get();

    if (!userDoc.exists || userDoc.data().role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: { message: 'Admin access required' },
      });
    }

    req.user.role = 'admin';
    next();
  } catch (error) {
    logger.error('Admin check error:', error.message);
    return res.status(500).json({
      success: false,
      error: { message: 'Authorization check failed' },
    });
  }
}

module.exports = { authenticate, optionalAuth, adminOnly };
