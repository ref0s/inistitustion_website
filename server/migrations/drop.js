const pool = require('../config/db');

const dropTables = async () => {
  try {
    await pool.query('BEGIN');

    // Drop tables in reverse dependency order
    await pool.query(`DROP TABLE IF EXISTS enrollments CASCADE;`);
    await pool.query(`DROP TABLE IF EXISTS students CASCADE;`);
    await pool.query(`DROP TABLE IF EXISTS subjects CASCADE;`);
    await pool.query(`DROP TABLE IF EXISTS semesters CASCADE;`);
    await pool.query(`DROP TABLE IF EXISTS departments CASCADE;`);

    await pool.query('COMMIT');
    console.log('✅ Migration 002_drop_students applied successfully.');
    process.exit(0);
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('❌ Error applying 002_drop_students migration:', err);
    process.exit(1);
  }
};

dropTables();
