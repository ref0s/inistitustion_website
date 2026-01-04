const express = require('express');
const bcrypt = require('bcryptjs');
const { z } = require('zod');
const { asyncHandler, HttpError } = require('../utils/errors');
const { validate } = require('../middleware/validate');
const { db } = require('../utils/db');

const router = express.Router();

const studentLoginSchema = z.object({
  email: z.string().min(1),
  rollId: z.string().min(1),
  password: z.string().min(1)
});

router.post(
  '/student-dashboard',
  validate(studentLoginSchema),
  asyncHandler(async (req, res) => {
    const { email, rollId, password } = req.validatedBody;
    const { rows } = await db.query(
      `
        SELECT s.id, s.registration_id, s.full_name, s.email, s.mother_name, s.phone, s.password_hash, s.study_semesters_count,
               d.name as department_name, d.code as department_code
        FROM students s
        JOIN departments d ON d.id = s.department_id
        WHERE lower(s.email) = lower(?) AND s.registration_id = ?
        LIMIT 1
      `,
      [email, rollId]
    );
    if (!rows.length) {
      throw new HttpError(404, 'Student not found');
    }
    const student = rows[0];
    const ok = await bcrypt.compare(password, student.password_hash);
    if (!ok) {
      throw new HttpError(401, 'Invalid credentials');
    }

    const { rows: registrations } = await db.query(
      `
        SELECT r.term_id, t.name AS term_name, t.start_date, t.end_date
        FROM registrations r
        JOIN terms t ON t.id = r.term_id
        WHERE r.student_id = ?
        ORDER BY date(t.start_date) DESC
      `,
      [student.id]
    );
    const currentTerm = registrations[0] || null;

    const { rows: academicRows } = await db.query(
      `
        SELECT ss.term_id,
               t.name AS term_name,
               t.start_date,
               t.end_date,
               s.id AS subject_id,
               s.code,
               s.name,
               s.units,
               ss.grade
        FROM student_subjects ss
        JOIN terms t ON t.id = ss.term_id
        JOIN subjects s ON s.id = ss.subject_id
        WHERE ss.student_id = ?
        ORDER BY date(t.start_date) DESC, s.code ASC
      `,
      [student.id]
    );

    const academicRecord = [];
    const termMap = new Map();

    // seed academicRecord with all registered terms (even if no subjects assigned)
    registrations.forEach((reg) => {
      if (!termMap.has(reg.term_id)) {
        const entry = {
          semester: {
            id: reg.term_id,
            label: reg.term_name,
            year: reg.start_date?.slice(0, 4),
            term_number: null,
            starts_on: reg.start_date,
            ends_on: reg.end_date
          },
          courses: []
        };
        termMap.set(reg.term_id, entry);
        academicRecord.push(entry);
      }
    });

    // attach courses with grades
    for (const row of academicRows) {
      if (!termMap.has(row.term_id)) {
        const entry = {
          semester: {
            id: row.term_id,
            label: row.term_name,
            year: row.start_date?.slice(0, 4),
            term_number: null,
            starts_on: row.start_date,
            ends_on: row.end_date
          },
          courses: []
        };
        termMap.set(row.term_id, entry);
        academicRecord.push(entry);
      }
      termMap.get(row.term_id).courses.push({
        subject_id: row.subject_id,
        code: row.code,
        title: row.name,
        credit_hours: row.units,
        grade: row.grade
      });
    }

    const response = {
      headerCards: {
        department: {
          name: student.department_name || 'القسم غير محدد',
          code: student.department_code || ''
        },
        currentSemester: currentTerm
          ? { label: currentTerm.term_name, year: currentTerm.start_date?.slice(0, 4), term: null }
          : null,
        gpaPercent: 0,
        registrationState: 'مسجل'
      },
      personalInfo: {
        fullName: student.full_name,
        rollId: student.registration_id,
        email: student.email,
        department: student.department_name || 'القسم غير محدد'
      },
      academicRecord
    };

    res.json(response);
  })
);

router.get(
  '/schedule',
  asyncHandler(async (_req, res) => {
    const { rows } = await db.query(
      `
        SELECT tt.id,
               tt.day_of_week,
               p.start_time,
               p.end_time,
               s.id AS subject_id,
               s.code AS subject_code,
               s.name AS subject_title,
               s.units AS credit_hours
        FROM timetable_entries tt
        JOIN periods p ON p.id = tt.period_id
        JOIN subjects s ON s.id = tt.subject_id
        ORDER BY tt.day_of_week, p.sort_order, s.code
      `
    );
    res.json(rows);
  })
);

module.exports = router;
