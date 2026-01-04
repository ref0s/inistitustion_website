/* eslint-disable no-console */
// Simple CSV importer for students and subjects into SQLite
// Usage: node scripts/import-csv.js
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { db, runInTransaction } = require('../utils/db');

const DEFAULT_DEPT_ID = 'dept-general';

const studentsFile = path.join(__dirname, '..', 'data', 'students.csv');
const subjectsFile = path.join(__dirname, '..', 'data', 'subjects.csv');

const parseCsv = (filePath) => {
  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw.split(/\r?\n/).filter(Boolean);
  const headers = lines.shift().split(',').map((h) => h.trim());
  return lines.map((line) => {
    const cells = line.split(',').map((c) => c.trim());
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = cells[idx] ?? '';
    });
    return row;
  });
};

const ensureDefaultDepartment = async () => {
  await db.query(
    `
      INSERT INTO departments (id, name, code, is_active)
      VALUES (?, 'القسم العام', 'GEN', 1)
      ON CONFLICT(code) DO NOTHING
    `,
    [DEFAULT_DEPT_ID]
  );
};

const importStudents = async () => {
  const rows = parseCsv(studentsFile);
  let inserted = 0;
  let updated = 0;

  await ensureDefaultDepartment();
  await runInTransaction(async () => {
    for (const row of rows) {
      const passwordHash = await bcrypt.hash(row.password || 'password123', 10);
      const res = await db.query(
        `
          INSERT INTO students (registration_id, full_name, email, department_id, mother_name, phone, password_hash)
          VALUES (?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(registration_id) DO UPDATE SET
            full_name = excluded.full_name,
            email = excluded.email,
            department_id = excluded.department_id,
            mother_name = excluded.mother_name,
            phone = excluded.phone,
            password_hash = excluded.password_hash
        `,
        [
          row.registration_id,
          row.full_name,
          row.email.toLowerCase(),
          DEFAULT_DEPT_ID,
          row.mother_name,
          row.phone,
          passwordHash
        ]
      );
      if (res.changes === 1) inserted += 1;
      else updated += 1;
    }
  });
  console.log(`Students: inserted/updated ${inserted}/${updated}`);
};

const importSubjects = async () => {
  const rows = parseCsv(subjectsFile);
  let inserted = 0;
  let updated = 0;

  await ensureDefaultDepartment();
  await runInTransaction(async () => {
    for (const row of rows) {
      const res = await db.query(
        `
          INSERT INTO subjects (code, name, units, curriculum_semester)
          VALUES (?, ?, ?, ?)
          ON CONFLICT(code) DO UPDATE SET
            name = excluded.name,
            units = excluded.units,
            curriculum_semester = excluded.curriculum_semester
        `,
        [row.code.toUpperCase(), row.name, Number(row.units), Number(row.curriculum_semester)]
      );
      const { rows: subjectRow } = await db.query(`SELECT id FROM subjects WHERE code = ?`, [
        row.code.toUpperCase()
      ]);
      const subjectId = subjectRow[0]?.id;
      if (subjectId) {
        await db.query(`INSERT OR IGNORE INTO department_subjects (id, department_id, subject_id) VALUES (?, ?, ?)`, [
          crypto.randomUUID(),
          DEFAULT_DEPT_ID,
          subjectId
        ]);
      }
      if (res.changes === 1) inserted += 1;
      else updated += 1;
    }
  });
  console.log(`Subjects: inserted/updated ${inserted}/${updated}`);
};

const main = async () => {
  try {
    await importStudents();
    await importSubjects();
  } catch (err) {
    console.error('Import failed:', err);
    process.exit(1);
  }
};

main().then(() => process.exit(0));
