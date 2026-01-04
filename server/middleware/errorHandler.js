const { HttpError, mapDbError } = require('../utils/errors');

const errorHandler = (err, _req, res, _next) => {
  const mapped = mapDbError(err);
  const handled = mapped || err;

  if (handled instanceof HttpError) {
    return res.status(handled.status).json({
      error: handled.message,
      details: handled.details || undefined
    });
  }

  console.error('Unhandled error:', err);
  return res.status(500).json({ error: 'Internal server error' });
};

module.exports = { errorHandler };
