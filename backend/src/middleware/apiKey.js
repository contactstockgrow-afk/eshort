const { getFirestore } = require('../config/firebase');
const { logger } = require('../utils/logger');
const crypto = require('crypto');

function generateApiKey() {
  return 'eshort_' + crypto.randomBytes(32).toString('hex');
}

async function authenticateApiKey(req, res, next) {
  try {
    const apiKey = req.headers['x-api-key'] || req.query.api_key;
    if (!apiKey) {
      return res.status(401).json({
        success: false,
        error: { message: 'API key required. Provide via x-api-key header or api_key query parameter.' },
      });
    }

    const db = getFirestore();
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
    const keysSnapshot = await db.collection('apiKeys').where('keyHash', '==', keyHash).where('isActive', '==', true).limit(1).get();

    if (keysSnapshot.empty) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid or inactive API key' },
      });
    }

    const keyDoc = keysSnapshot.docs[0];
    const keyData = keyDoc.data();

    if (keyData.expiresAt && new Date(keyData.expiresAt) < new Date()) {
      return res.status(401).json({
        success: false,
        error: { message: 'API key has expired' },
      });
    }

    await keyDoc.ref.update({
      lastUsedAt: new Date().toISOString(),
      usageCount: (keyData.usageCount || 0) + 1,
    });

    req.apiKeyOwner = keyData.ownerId;
    req.apiKeyId = keyDoc.id;
    req.apiKeyPermissions = keyData.permissions || ['read'];
    next();
  } catch (error) {
    logger.error('API key authentication error:', error.message);
    return res.status(500).json({
      success: false,
      error: { message: 'API key verification failed' },
    });
  }
}

module.exports = { authenticateApiKey, generateApiKey };
