const db = require('../config/db');

const runInTransaction = async (fn) => {
  await db.query('BEGIN');
  try {
    const result = await fn();
    await db.query('COMMIT');
    return result;
  } catch (err) {
    await db.query('ROLLBACK');
    throw err;
  }
};

module.exports = { db, runInTransaction };
