const { getFirestore } = require('../config/firebase');
const { generateApiKey } = require('../middleware/apiKey');
const { success, error } = require('../utils/response');
const { logger } = require('../utils/logger');
const crypto = require('crypto');

async function createApiKey(req, res) {
  try {
    const { name, permissions, expiresInDays } = req.body;
    const db = getFirestore();

    const rawKey = generateApiKey();
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

    const keyData = {
      name: name || 'Unnamed Key',
      keyHash,
      keyPrefix: rawKey.substring(0, 12) + '...',
      ownerId: req.user.uid,
      permissions: permissions || ['read', 'write'],
      isActive: true,
      usageCount: 0,
      createdAt: new Date().toISOString(),
      lastUsedAt: null,
      expiresAt: expiresInDays
        ? new Date(Date.now() + expiresInDays * 86400000).toISOString()
        : null,
    };

    const docRef = await db.collection('apiKeys').add(keyData);
    logger.info(`API key created: ${docRef.id} by ${req.user.uid}`);

    return success(res, {
      apiKey: rawKey,
      keyId: docRef.id,
      name: keyData.name,
      permissions: keyData.permissions,
      expiresAt: keyData.expiresAt,
      message: 'Save this API key securely. It will not be shown again.',
    }, 'API key created', 201);
  } catch (err) {
    logger.error('Create API key error:', err);
    return error(res, 'Failed to create API key');
  }
}

async function listApiKeys(req, res) {
  try {
    const db = getFirestore();
    const snapshot = await db.collection('apiKeys')
      .where('ownerId', '==', req.user.uid)
      .orderBy('createdAt', 'desc')
      .get();

    const keys = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        keyPrefix: data.keyPrefix,
        permissions: data.permissions,
        isActive: data.isActive,
        usageCount: data.usageCount,
        createdAt: data.createdAt,
        lastUsedAt: data.lastUsedAt,
        expiresAt: data.expiresAt,
      };
    });

    return success(res, keys);
  } catch (err) {
    logger.error('List API keys error:', err);
    return error(res, 'Failed to list API keys');
  }
}

async function revokeApiKey(req, res) {
  try {
    const { keyId } = req.params;
    const db = getFirestore();
    const keyRef = db.collection('apiKeys').doc(keyId);
    const keyDoc = await keyRef.get();

    if (!keyDoc.exists) {
      return error(res, 'API key not found', 404);
    }

    if (keyDoc.data().ownerId !== req.user.uid) {
      return error(res, 'Not authorized to revoke this key', 403);
    }

    await keyRef.update({ isActive: false, revokedAt: new Date().toISOString() });
    logger.info(`API key revoked: ${keyId}`);

    return success(res, null, 'API key revoked');
  } catch (err) {
    logger.error('Revoke API key error:', err);
    return error(res, 'Failed to revoke API key');
  }
}

module.exports = { createApiKey, listApiKeys, revokeApiKey };
