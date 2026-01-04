const { HttpError } = require('../utils/errors');

const validate = (schema, source = 'body') => (req, _res, next) => {
  const data = source === 'query' ? req.query : req.body;
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error('Validation failed:', {
      path: req.path,
      source,
      issues: result.error.issues
    });
    const formatted = result.error.flatten();
    return next(new HttpError(400, 'Validation failed', formatted));
  }
  if (source === 'query') {
    req.validatedQuery = result.data;
  } else {
    req.validatedBody = result.data;
  }
  return next();
};

module.exports = { validate };
