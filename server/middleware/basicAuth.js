const { HttpError } = require('../utils/errors');

const ADMIN_USER = 'admin';
const ADMIN_PASS = 'admin';

const basicAuth = (req, res, next) => {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Basic ')) {
    res.set('WWW-Authenticate', 'Basic realm="admin"');
    return next(new HttpError(401, 'Unauthorized'));
  }

  const base64 = header.replace('Basic ', '').trim();
  let decoded = '';
  try {
    decoded = Buffer.from(base64, 'base64').toString('utf8');
  } catch (err) {
    return next(new HttpError(401, 'Unauthorized'));
  }
  const [user, pass] = decoded.split(':');

  if (user !== ADMIN_USER || pass !== ADMIN_PASS) {
    res.set('WWW-Authenticate', 'Basic realm="admin"');
    return next(new HttpError(401, 'Unauthorized'));
  }

  return next();
};

module.exports = { basicAuth };
