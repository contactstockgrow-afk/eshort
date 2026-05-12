function success(res, data = null, message = 'Success', statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

function paginated(res, data, pagination) {
  return res.status(200).json({
    success: true,
    data,
    pagination: {
      hasMore: pagination.hasMore,
      nextCursor: pagination.nextCursor || null,
      total: pagination.total || undefined,
    },
  });
}

function error(res, message = 'Internal Server Error', statusCode = 500) {
  return res.status(statusCode).json({
    success: false,
    error: { message },
  });
}

module.exports = { success, paginated, error };
