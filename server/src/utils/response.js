/**
 * Consistent API response helper ensuring { success, data, error } shape
 */
export const successResponse = (res, data = null, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    data,
    error: null,
  });
};

export const errorResponse = (res, message, statusCode = 500, code = 'ERROR', details = null) => {
  return res.status(statusCode).json({
    success: false,
    data: null,
    error: {
      message,
      code,
      details,
    },
  });
};
