const pool = require('../config/db');

const createTables = async () => {
  try {
    await pool.query('BEGIN');

    // Enable pgcrypto for UUID generation
    await pool.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`);

    // =========================
    // Table: departments
    // =========================
    await pool.query(`
      CREATE TABLE IF NOT EXISTS departments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        code TEXT UNIQUE
      );
    `);

    // =========================
    // Table: semesters
    // =========================
    await pool.query(`
      CREATE TABLE IF NOT EXISTS semesters (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        label TEXT NOT NULL,
        year INT NOT NULL,
        term_number INT NOT NULL,
        starts_on DATE,
        ends_on DATE,
        UNIQUE (year, term_number)
      );
    `);

    // =========================
    // Table: subjects
    // =========================
    await pool.query(`
      CREATE TABLE IF NOT EXISTS subjects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        credit_hours INT NOT NULL CHECK (credit_hours > 0),
        department_id UUID NOT NULL REFERENCES departments(id) ON UPDATE CASCADE
      );
    `);

    // =========================
    // Table: students
    // =========================
    await pool.query(`
      CREATE TABLE IF NOT EXISTS students (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        roll_id TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        full_name TEXT NOT NULL,
        department_id UUID NOT NULL REFERENCES departments(id) ON UPDATE CASCADE,
        current_semester_id UUID REFERENCES semesters(id) ON UPDATE CASCADE,
        gpa_total NUMERIC(5,2) DEFAULT 0
          CHECK (gpa_total >= 0 AND gpa_total <= 100),
        registration_state TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
    `);

    // =========================
    // Table: enrollments  (NO grade_letter)
    // =========================
    await pool.query(`
      CREATE TABLE IF NOT EXISTS enrollments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        subject_id UUID NOT NULL REFERENCES subjects(id) ON UPDATE CASCADE,
        semester_id UUID NOT NULL REFERENCES semesters(id) ON UPDATE CASCADE,
        subject_grade NUMERIC(5,2)
          CHECK (subject_grade >= 0 AND subject_grade <= 100),
        recorded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        UNIQUE (student_id, subject_id, semester_id)
      );
    `);

    // =========================
    // Indexes
    // =========================
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_students_roll_id ON students(roll_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_students_dept ON students(department_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(student_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_enrollments_subject ON enrollments(subject_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_enrollments_semester ON enrollments(semester_id);`);

    await pool.query('COMMIT');
    console.log('✅ Migration 001_init_students applied successfully (grade_letter removed).');
    process.exit(0);
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('❌ Error applying 001_init_students migration:', err);
    process.exit(1);
  }
};

createTables();
