const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db = require('../config/db');

const PERMITTED_DAYS = `'saturday','sunday','monday','tuesday','wednesday','thursday'`;
const DEFAULT_DEPT_ID = 'dept-general';

const createSchema = async () => {
  await db.query('PRAGMA foreign_keys = OFF;');
  await db.query('BEGIN');

  // Drop legacy and new tables to allow repeatable runs
  const dropOrder = [
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
    'departments',
    // legacy tables
    'enrollments',
    'subject_schedule',
    'semesters'
  ];
  for (const table of dropOrder) {
    await db.query(`DROP TABLE IF EXISTS ${table};`);
  }
  await db.query('PRAGMA foreign_keys = ON;');

  // Departments
  await db.query(`
    CREATE TABLE IF NOT EXISTS departments (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      name TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE,
      is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Students
  await db.query(`
    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      registration_id TEXT NOT NULL UNIQUE,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      department_id TEXT NOT NULL,
      mother_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      study_semesters_count INTEGER NOT NULL DEFAULT 0 CHECK (study_semesters_count >= 0),
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE RESTRICT
    );
  `);

  // Terms (registration semesters)
  await db.query(`
    CREATE TABLE IF NOT EXISTS terms (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      name TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 0 CHECK (is_active IN (0,1)),
      is_archived INTEGER NOT NULL DEFAULT 0 CHECK (is_archived IN (0,1)),
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      CHECK (date(start_date) <= date(end_date))
    );
  `);

  // Subjects
  await db.query(`
    CREATE TABLE IF NOT EXISTS subjects (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      name TEXT NOT NULL,
      code TEXT NOT NULL UNIQUE,
      units INTEGER NOT NULL CHECK (units > 0),
      curriculum_semester INTEGER NOT NULL CHECK (curriculum_semester BETWEEN 1 AND 8),
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Department subjects (many-to-many)
  await db.query(`
    CREATE TABLE IF NOT EXISTS department_subjects (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      department_id TEXT NOT NULL,
      subject_id TEXT NOT NULL,
      UNIQUE (department_id, subject_id),
      FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE RESTRICT,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
    );
  `);

  // Periods (3 fixed rows, editable times)
  await db.query(`
    CREATE TABLE IF NOT EXISTS periods (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      label TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      sort_order INTEGER NOT NULL UNIQUE
    );
  `);

  // Sections (optional)
  await db.query(`
    CREATE TABLE IF NOT EXISTS sections (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      term_id TEXT NOT NULL,
      name TEXT NOT NULL,
      UNIQUE (term_id, name),
      FOREIGN KEY (term_id) REFERENCES terms(id) ON DELETE CASCADE
    );
  `);

  // Registrations (students ↔ terms)
  await db.query(`
    CREATE TABLE IF NOT EXISTS registrations (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      term_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      section_id TEXT,
      registered_at TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (term_id, student_id),
      FOREIGN KEY (term_id) REFERENCES terms(id) ON DELETE CASCADE,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
      FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE SET NULL
    );
  `);

  // Subjects offered in a term
  await db.query(`
    CREATE TABLE IF NOT EXISTS term_subjects (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      term_id TEXT NOT NULL,
      subject_id TEXT NOT NULL,
      UNIQUE (term_id, subject_id),
      FOREIGN KEY (term_id) REFERENCES terms(id) ON DELETE CASCADE,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
    );
  `);

  // Student subjects within a term
  await db.query(`
    CREATE TABLE IF NOT EXISTS student_subjects (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      term_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      subject_id TEXT NOT NULL,
      grade REAL CHECK (grade IS NULL OR (grade >= 0 AND grade <= 100)),
      UNIQUE (term_id, student_id, subject_id),
      FOREIGN KEY (term_id, student_id) REFERENCES registrations(term_id, student_id) ON DELETE CASCADE,
      FOREIGN KEY (term_id, subject_id) REFERENCES term_subjects(term_id, subject_id) ON DELETE CASCADE
    );
  `);

  // Timetable entries
  await db.query(`
    CREATE TABLE IF NOT EXISTS timetable_entries (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      term_id TEXT NOT NULL,
      day_of_week TEXT NOT NULL CHECK (day_of_week IN (${PERMITTED_DAYS})),
      period_id TEXT NOT NULL,
      subject_id TEXT NOT NULL,
      room_text TEXT,
      lecturer_text TEXT,
      UNIQUE (term_id, day_of_week, period_id, subject_id),
      FOREIGN KEY (term_id) REFERENCES terms(id) ON DELETE CASCADE,
      FOREIGN KEY (period_id) REFERENCES periods(id) ON DELETE CASCADE,
      FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
    );
  `);

  // Indexes and helpers
  await db.query(`CREATE INDEX IF NOT EXISTS idx_departments_code ON departments(code);`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_students_registration_id ON students(registration_id);`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);`);
  await db.query(
    `CREATE INDEX IF NOT EXISTS idx_department_subjects_department ON department_subjects(department_id);`
  );
  await db.query(
    `CREATE INDEX IF NOT EXISTS idx_department_subjects_subject ON department_subjects(subject_id);`
  );
  await db.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_terms_active ON terms(is_active) WHERE is_active = 1;`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_terms_dates ON terms(start_date, end_date);`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_registrations_student ON registrations(student_id);`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_registrations_term ON registrations(term_id);`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_term_subjects_term ON term_subjects(term_id);`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_student_subjects_student ON student_subjects(student_id);`);
  await db.query(`CREATE INDEX IF NOT EXISTS idx_timetable_term_day_period ON timetable_entries(term_id, day_of_week, period_id);`);

  // Triggers
  await db.query(`
    CREATE TRIGGER IF NOT EXISTS trg_terms_no_overlap_insert
    BEFORE INSERT ON terms
    WHEN EXISTS (
      SELECT 1 FROM terms t
      WHERE (date(t.start_date) <= date(NEW.end_date))
        AND (date(t.end_date) >= date(NEW.start_date))
    )
    BEGIN
      SELECT RAISE(ABORT, 'TERM_DATES_OVERLAP');
    END;
  `);

  await db.query(`
    CREATE TRIGGER IF NOT EXISTS trg_terms_no_overlap_update
    BEFORE UPDATE ON terms
    WHEN EXISTS (
      SELECT 1 FROM terms t
      WHERE t.id != NEW.id
        AND (date(t.start_date) <= date(NEW.end_date))
        AND (date(t.end_date) >= date(NEW.start_date))
    )
    BEGIN
      SELECT RAISE(ABORT, 'TERM_DATES_OVERLAP');
    END;
  `);

  await db.query(`
    CREATE TRIGGER IF NOT EXISTS trg_students_updated_at
    AFTER UPDATE ON students
    BEGIN
      UPDATE students SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;
  `);

  await db.query(`
    CREATE TRIGGER IF NOT EXISTS trg_terms_updated_at
    AFTER UPDATE ON terms
    BEGIN
      UPDATE terms SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;
  `);

  await db.query(`
    CREATE TRIGGER IF NOT EXISTS trg_subjects_updated_at
    AFTER UPDATE ON subjects
    BEGIN
      UPDATE subjects SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;
  `);
};

const seedData = async () => {
  // Seed departments (with a default for backfill)
  const departments = [
    { id: DEFAULT_DEPT_ID, name: 'القسم العام', code: 'GEN', is_active: 1 },
    { id: 'dept-cs', name: 'علوم الحاسوب', code: 'CS', is_active: 1 },
    { id: 'dept-se', name: 'هندسة البرمجيات', code: 'SE', is_active: 1 }
  ];
  for (const dept of departments) {
    await db.query(
      `
        INSERT INTO departments (id, name, code, is_active)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(code) DO UPDATE SET
          name = excluded.name,
          is_active = excluded.is_active;
      `,
      [dept.id, dept.name, dept.code, dept.is_active]
    );
  }

  // Seed periods (3 fixed slots)
  const periods = [
    { id: 'period-1', label: '09:00 - 11:00', start_time: '09:00', end_time: '11:00', sort_order: 1 },
    { id: 'period-2', label: '11:00 - 13:00', start_time: '11:00', end_time: '13:00', sort_order: 2 },
    { id: 'period-3', label: '13:00 - 15:00', start_time: '13:00', end_time: '15:00', sort_order: 3 }
  ];
  for (const p of periods) {
    await db.query(
      `
        INSERT INTO periods (id, label, start_time, end_time, sort_order)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(sort_order) DO UPDATE SET
          label = excluded.label,
          start_time = excluded.start_time,
          end_time = excluded.end_time;
      `,
      [p.id, p.label, p.start_time, p.end_time, p.sort_order]
    );
  }

  // Optional demo data to speed up manual testing
  const demoTermId = 'term-demo-1';
  await db.query(
    `
      INSERT OR IGNORE INTO terms (id, name, start_date, end_date, is_active, is_archived)
      VALUES (?, 'Spring 2025', '2025-02-01', '2025-05-15', 1, 0);
    `,
    [demoTermId]
  );

  const demoSubjects = [
    { id: 'subj-math101', name: 'Calculus I', code: 'MATH101', units: 3, curriculum_semester: 1 },
    { id: 'subj-cs101', name: 'Intro to CS', code: 'CS101', units: 4, curriculum_semester: 1 },
    { id: 'subj-eng101', name: 'Academic Writing', code: 'ENG101', units: 2, curriculum_semester: 1 }
  ];
  for (const s of demoSubjects) {
    await db.query(
      `
        INSERT INTO subjects (id, name, code, units, curriculum_semester)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(code) DO UPDATE SET
          name = excluded.name,
          units = excluded.units,
          curriculum_semester = excluded.curriculum_semester;
      `,
      [s.id, s.name, s.code, s.units, s.curriculum_semester]
    );
  }

  const passwordHash = await bcrypt.hash('password123', 10);
  const demoStudents = [
    {
      id: 'student-demo-1',
      registration_id: '2025001',
      full_name: 'Sara Ali',
      email: 'sara@example.com',
      department_id: 'dept-cs',
      mother_name: 'Amal Hassan',
      phone: '+201000000001'
    },
    {
      id: 'student-demo-2',
      registration_id: '2025002',
      full_name: 'Omar Khaled',
      email: 'omar@example.com',
      department_id: 'dept-se',
      mother_name: 'Noura Adel',
      phone: '+201000000002'
    }
  ];

  for (const stu of demoStudents) {
    await db.query(
      `
        INSERT OR IGNORE INTO students (
          id, registration_id, full_name, email, department_id, mother_name, phone, password_hash, study_semesters_count
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
      `,
      [
        stu.id,
        stu.registration_id,
        stu.full_name,
        stu.email,
        stu.department_id,
        stu.mother_name,
        stu.phone,
        passwordHash,
        0
      ]
    );
  }

  // Link demo subjects to departments
  const demoDepartmentSubjects = [
    { department_id: 'dept-cs', subject_id: 'subj-math101' },
    { department_id: 'dept-cs', subject_id: 'subj-cs101' },
    { department_id: 'dept-se', subject_id: 'subj-cs101' },
    { department_id: 'dept-se', subject_id: 'subj-eng101' }
  ];
  for (const link of demoDepartmentSubjects) {
    await db.query(
      `
        INSERT OR IGNORE INTO department_subjects (id, department_id, subject_id)
        VALUES (?, ?, ?);
      `,
      [crypto.randomUUID(), link.department_id, link.subject_id]
    );
  }

  // Offer subjects in the demo term
  for (const s of demoSubjects) {
    await db.query(
      `
        INSERT OR IGNORE INTO term_subjects (id, term_id, subject_id)
        VALUES (?, ?, ?);
      `,
      [`offer-${s.id}`, demoTermId, s.id]
    );
  }

  // Register demo students
  for (const stu of demoStudents) {
    await db.query(
      `
        INSERT OR IGNORE INTO registrations (id, term_id, student_id, section_id, registered_at)
        VALUES (?, ?, ?, NULL, CURRENT_TIMESTAMP);
      `,
      [`reg-${stu.id}`, demoTermId, stu.id]
    );
  }

  // Assign student subjects
  const studentSubjects = [
    { id: 'stu-subj-1', student_id: 'student-demo-1', subject_id: 'subj-math101' },
    { id: 'stu-subj-2', student_id: 'student-demo-1', subject_id: 'subj-cs101' },
    { id: 'stu-subj-3', student_id: 'student-demo-2', subject_id: 'subj-cs101' },
    { id: 'stu-subj-4', student_id: 'student-demo-2', subject_id: 'subj-eng101' }
  ];
  for (const entry of studentSubjects) {
    await db.query(
      `
        INSERT OR IGNORE INTO student_subjects (id, term_id, student_id, subject_id)
        VALUES (?, ?, ?, ?);
      `,
      [entry.id, demoTermId, entry.student_id, entry.subject_id]
    );
  }

  // Timetable seed (term-wide)
  const timetable = [
    { id: 'tt-1', day: 'saturday', period_id: 'period-1', subject_id: 'subj-math101', room: 'Room 101', lecturer: 'Dr. Hassan' },
    { id: 'tt-2', day: 'sunday', period_id: 'period-2', subject_id: 'subj-cs101', room: 'Lab 1', lecturer: 'Prof. Salem' },
    { id: 'tt-3', day: 'monday', period_id: 'period-3', subject_id: 'subj-eng101', room: 'Room 202', lecturer: 'Ms. Huda' }
  ];
  for (const slot of timetable) {
    await db.query(
      `
        INSERT OR IGNORE INTO timetable_entries (
          id, term_id, day_of_week, period_id, subject_id, room_text, lecturer_text
        ) VALUES (?, ?, ?, ?, ?, ?, ?);
      `,
      [slot.id, demoTermId, slot.day, slot.period_id, slot.subject_id, slot.room, slot.lecturer]
    );
  }
};

const migrate = async () => {
  try {
    await createSchema();
    await seedData();
    await db.query('COMMIT');
  } catch (err) {
    await db.query('ROLLBACK');
    throw err;
  }
};

if (require.main === module) {
  migrate()
    .then(() => {
      console.log('✅ Migration applied successfully (schema + seeds).');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Error applying migration:', err);
      process.exit(1);
    });
}

module.exports = { migrate };
