const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const apiKeyController = require('../controllers/apiKeyController');

router.post('/', authenticate, apiKeyController.createApiKey);
router.get('/', authenticate, apiKeyController.listApiKeys);
router.delete('/:keyId', authenticate, apiKeyController.revokeApiKey);

module.exports = router;
