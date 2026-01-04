const db = require('../config/db');

const dropTables = async () => {
  try {
    await db.query('BEGIN');

    // Drop tables in reverse dependency order
    const tables = [
      'timetable_entries',
      'student_subjects',
      'term_subjects',
      'registrations',
      'sections',
      'periods',
      'terms',
      'department_subjects',
      'subjects',
      'students',
      // legacy tables
      'enrollments',
      'subject_schedule',
      'semesters',
      'departments'
    ];

    for (const table of tables) {
      await db.query(`DROP TABLE IF EXISTS ${table};`);
    }

    await db.query('COMMIT');
    console.log('✅ Drop migration applied successfully.');
    process.exit(0);
  } catch (err) {
    await db.query('ROLLBACK');
    console.error('❌ Error applying drop migration:', err);
    process.exit(1);
  }
};

dropTables();
