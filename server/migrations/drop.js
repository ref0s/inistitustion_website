const db = require('../config/db');

const dropTables = async () => {
  try {
    await db.query('BEGIN');

    // Drop tables in reverse dependency order
    await db.query(`DROP TABLE IF EXISTS enrollments;`);
    await db.query(`DROP TABLE IF EXISTS students;`);
    await db.query(`DROP TABLE IF EXISTS subject_schedule;`);
    await db.query(`DROP TABLE IF EXISTS subjects;`);
    await db.query(`DROP TABLE IF EXISTS semesters;`);
    await db.query(`DROP TABLE IF EXISTS departments;`);

    await db.query('COMMIT');
    console.log('✅ Migration 002_drop_students applied successfully.');
    process.exit(0);
  } catch (err) {
    await db.query('ROLLBACK');
    console.error('❌ Error applying 002_drop_students migration:', err);
    process.exit(1);
  }
};

dropTables();
