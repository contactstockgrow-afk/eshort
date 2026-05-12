const { body, param, query, validationResult } = require('express-validator');

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        details: errors.array().map((e) => ({ field: e.path, message: e.msg })),
      },
    });
  }
  next();
}

const videoUploadRules = [
  body('caption').optional().isLength({ max: 500 }).withMessage('Caption must be under 500 characters'),
  body('hashtags').optional().isArray({ max: 30 }).withMessage('Maximum 30 hashtags'),
  body('hashtags.*').optional().isString().isLength({ max: 50 }),
  body('isPrivate').optional().isBoolean(),
];

const profileUpdateRules = [
  body('displayName').optional().isLength({ min: 2, max: 50 }).withMessage('Display name must be 2-50 characters'),
  body('bio').optional().isLength({ max: 200 }).withMessage('Bio must be under 200 characters'),
  body('website').optional().isURL().withMessage('Invalid website URL'),
];

const searchRules = [
  query('q').notEmpty().withMessage('Search query is required'),
  query('type').optional().isIn(['users', 'videos', 'hashtags']).withMessage('Invalid search type'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be 1-50'),
  query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative'),
];

const paginationRules = [
  query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
  query('cursor').optional().isString(),
];

const reportRules = [
  body('targetId').notEmpty().withMessage('Target ID is required'),
  body('targetType').isIn(['video', 'user', 'comment']).withMessage('Invalid target type'),
  body('reason').isIn(['spam', 'harassment', 'inappropriate', 'violence', 'copyright', 'other']).withMessage('Invalid reason'),
  body('description').optional().isLength({ max: 500 }),
];

module.exports = {
  validate,
  videoUploadRules,
  profileUpdateRules,
  searchRules,
  paginationRules,
  reportRules,
  body,
  param,
  query,
};
