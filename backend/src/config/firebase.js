const admin = require('firebase-admin');
const { logger } = require('../utils/logger');

let db;
let auth;
let messaging;

function initializeFirebase() {
  try {
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    db = admin.firestore();
    auth = admin.auth();
    messaging = admin.messaging();

    db.settings({ ignoreUndefinedProperties: true });

    logger.info('Firebase Admin SDK initialized');
  } catch (error) {
    logger.error('Firebase initialization error:', error);
    throw error;
  }
}

function getFirestore() {
  if (!db) throw new Error('Firestore not initialized');
  return db;
}

function getAuth() {
  if (!auth) throw new Error('Firebase Auth not initialized');
  return auth;
}

function getMessaging() {
  if (!messaging) throw new Error('Firebase Messaging not initialized');
  return messaging;
}

module.exports = {
  initializeFirebase,
  getFirestore,
  getAuth,
  getMessaging,
  admin,
};
