const db = require('../config/db');

const createTables = async () => {
  try {
    await db.query('BEGIN');

    // =========================
    // Table: departments
    // =========================
    await db.query(`
      CREATE TABLE IF NOT EXISTS departments (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        name TEXT NOT NULL,
        code TEXT UNIQUE
      );
    `);

    // =========================
    // Table: semesters
    // =========================
    await db.query(`
      CREATE TABLE IF NOT EXISTS semesters (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        label TEXT NOT NULL,
        year INTEGER NOT NULL,
        term_number INTEGER NOT NULL,
        starts_on TEXT,
        ends_on TEXT,
        UNIQUE (year, term_number)
      );
    `);

    // =========================
    // Table: subjects
    // =========================
    await db.query(`
      CREATE TABLE IF NOT EXISTS subjects (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        code TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        credit_hours INTEGER NOT NULL CHECK (credit_hours > 0),
        department_id TEXT NOT NULL,
        FOREIGN KEY (department_id) REFERENCES departments(id) ON UPDATE CASCADE
      );
    `);

    // =========================
    // Table: subject_schedule
    // =========================
    await db.query(`
      CREATE TABLE IF NOT EXISTS subject_schedule (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        subject_id TEXT NOT NULL,
        day_of_week TEXT NOT NULL
          CHECK (day_of_week IN ('saturday','sunday','monday','tuesday','wednesday','thursday')),
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (subject_id, day_of_week, start_time),
        FOREIGN KEY (subject_id) REFERENCES subjects(id) ON UPDATE CASCADE ON DELETE CASCADE,
        CHECK (
          (start_time = '09:00' AND end_time = '11:00') OR
          (start_time = '11:00' AND end_time = '13:00') OR
          (start_time = '13:00' AND end_time = '15:00')
        )
      );
    `);

    // =========================
    // Table: students
    // =========================
    await db.query(`
      CREATE TABLE IF NOT EXISTS students (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        roll_id TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        full_name TEXT NOT NULL,
        department_id TEXT NOT NULL,
        current_semester_id TEXT,
        gpa_total REAL DEFAULT 0
          CHECK (gpa_total >= 0 AND gpa_total <= 100),
        registration_state TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (department_id) REFERENCES departments(id) ON UPDATE CASCADE,
        FOREIGN KEY (current_semester_id) REFERENCES semesters(id) ON UPDATE CASCADE
      );
    `);

    // =========================
    // Table: enrollments  (NO grade_letter)
    // =========================
    await db.query(`
      CREATE TABLE IF NOT EXISTS enrollments (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        student_id TEXT NOT NULL,
        subject_id TEXT NOT NULL,
        semester_id TEXT NOT NULL,
        subject_grade REAL
          CHECK (subject_grade >= 0 AND subject_grade <= 100),
        recorded_at TEXT DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (student_id, subject_id, semester_id),
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        FOREIGN KEY (subject_id) REFERENCES subjects(id) ON UPDATE CASCADE,
        FOREIGN KEY (semester_id) REFERENCES semesters(id) ON UPDATE CASCADE
      );
    `);

    // =========================
    // Indexes
    // =========================
    await db.query(`CREATE INDEX IF NOT EXISTS idx_students_roll_id ON students(roll_id);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_students_dept ON students(department_id);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(student_id);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_enrollments_subject ON enrollments(subject_id);`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_enrollments_semester ON enrollments(semester_id);`);

    await db.query('COMMIT');
    console.log('✅ Migration 001_init_students applied successfully (SQLite).');
    process.exit(0);
  } catch (err) {
    await db.query('ROLLBACK');
    console.error('❌ Error applying 001_init_students migration:', err);
    process.exit(1);
  }
};

createTables();
