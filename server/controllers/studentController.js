// routes/student.js
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db = require('../config/db');


exports.addDepartment = async (req, res) => {
  const { name, code } = req.body;
  try {
    const id = crypto.randomUUID();
    const sql = `
      INSERT INTO departments (id, name, code)
      VALUES (?, ?, ?)
    `;
    await db.query(sql, [id, name, code]);
    const { rows } = await db.query(`SELECT * FROM departments WHERE id = ?`, [id]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('addDepartment error:', err);
    res.status(500).json({ error: 'Failed to add department' });
  }
};

exports.addSemester = async (req, res) => {
  const { label, year, term_number, starts_on, ends_on } = req.body;
  try {
    if (!label || year === undefined || year === null || year === "") {
      return res.status(400).json({ error: 'label and year are required' });
    }
    let termNumber = term_number;
    if (termNumber === undefined || termNumber === null || termNumber === "") {
      const { rows } = await db.query(
        `SELECT MAX(term_number) AS max_term FROM semesters WHERE year = ?`,
        [year]
      );
      const maxTerm = rows[0]?.max_term;
      termNumber = maxTerm ? Number(maxTerm) + 1 : 1;
    } else {
      termNumber = Number(termNumber);
      if (Number.isNaN(termNumber) || termNumber < 1) {
        return res.status(400).json({ error: 'term_number must be a positive number' });
      }
    }
    const id = crypto.randomUUID();
    const sql = `
      INSERT INTO semesters (id, label, year, term_number, starts_on, ends_on)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    await db.query(sql, [id, label, year, termNumber, starts_on, ends_on]);
    const { rows } = await db.query(`SELECT * FROM semesters WHERE id = ?`, [id]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('addSemester error:', err);
    res.status(500).json({ error: 'Failed to add semester' });
  }
};

exports.addSubject = async (req, res) => {
  const { code, title, credit_hours, department_id } = req.body;
  try {
    const id = crypto.randomUUID();
    const sql = `
      INSERT INTO subjects (id, code, title, credit_hours, department_id)
      VALUES (?, ?, ?, ?, ?)
    `;
    await db.query(sql, [id, code, title, credit_hours, department_id]);
    const { rows } = await db.query(`SELECT * FROM subjects WHERE id = ?`, [id]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('addSubject error:', err);
    res.status(500).json({ error: 'Failed to add subject' });
  }
};

exports.addStudent = async (req, res) => {
  const {
    roll_id,
    name,
    full_name,
    department_id,
    current_semester_id,
    gpa_total,
    registration_state,
    email,
    password
  } = req.body;
  try {
    const id = crypto.randomUUID();
    const sql = `
      INSERT INTO students (
        id,
        roll_id,
        name,
        full_name,
        department_id,
        current_semester_id,
        gpa_total,
        registration_state,
        email,
        password
      ) VALUES (
        ?,?,?,?,?,?,?,?,?,?
      )
    `;
    await db.query(sql, [
      id,
      roll_id,
      name,
      full_name,
      department_id,
      current_semester_id,
      gpa_total,
      registration_state,
      email,
      password
    ]);
    const { rows } = await db.query(`SELECT * FROM students WHERE id = ?`, [id]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('addStudent error:', err);
    res.status(500).json({ error: 'Failed to add student' });
  }
};

exports.addEnrollment = async (req, res) => {
  const { student_id, subject_id, semester_id, subject_grade } = req.body;
  try {
    const id = crypto.randomUUID();
    const sql = `
      INSERT INTO enrollments (
        id,
        student_id,
        subject_id,
        semester_id,
        subject_grade,
        recorded_at
      ) VALUES (
        ?,?,?,?,?,CURRENT_TIMESTAMP
      )
    `;
    await db.query(sql, [id, student_id, subject_id, semester_id, subject_grade]);
    const { rows } = await db.query(`SELECT * FROM enrollments WHERE id = ?`, [id]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('addEnrollment error:', err);
    res.status(500).json({ error: 'Failed to add enrollment' });
  }
};

exports.getSchedule = async (_req, res) => {
  try {
    const sql = `
      SELECT
        ss.id,
        ss.day_of_week,
        ss.start_time,
        ss.end_time,
        s.id AS subject_id,
        s.code AS subject_code,
        s.title AS subject_title,
        s.credit_hours,
        d.name AS department_name,
        d.code AS department_code
      FROM subject_schedule ss
      JOIN subjects s ON s.id = ss.subject_id
      JOIN departments d ON d.id = s.department_id
      ORDER BY
        CASE ss.day_of_week
          WHEN 'saturday' THEN 1
          WHEN 'sunday' THEN 2
          WHEN 'monday' THEN 3
          WHEN 'tuesday' THEN 4
          WHEN 'wednesday' THEN 5
          WHEN 'thursday' THEN 6
          ELSE 7
        END,
        ss.start_time ASC,
        s.code ASC
    `;
    const { rows } = await db.query(sql);
    res.json(rows);
  } catch (err) {
    console.error('getSchedule error:', err);
    res.status(500).json({ error: 'Failed to load schedule' });
  }
};

exports.addScheduleEntry = async (req, res) => {
  const { subject_id, day_of_week, start_time, end_time } = req.body;
  if (!subject_id || !day_of_week || !start_time || !end_time) {
    return res.status(400).json({ error: 'subject_id, day_of_week, start_time, end_time are required' });
  }
  try {
    const id = crypto.randomUUID();
    const sql = `
      INSERT INTO subject_schedule (
        id,
        subject_id,
        day_of_week,
        start_time,
        end_time
      ) VALUES (
        ?,?,?,?,?
      )
    `;
    await db.query(sql, [id, subject_id, day_of_week, start_time, end_time]);
    const { rows } = await db.query(`SELECT * FROM subject_schedule WHERE id = ?`, [id]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('addScheduleEntry error:', err);
    res.status(500).json({ error: 'Failed to add schedule entry' });
  }
};

exports.updateScheduleEntry = async (req, res) => {
  const { id } = req.params;
  const { subject_id, day_of_week, start_time, end_time } = req.body;
  if (!subject_id || !day_of_week || !start_time || !end_time) {
    return res.status(400).json({ error: 'subject_id, day_of_week, start_time, end_time are required' });
  }
  try {
    const sql = `
      UPDATE subject_schedule
      SET subject_id = ?, day_of_week = ?, start_time = ?, end_time = ?
      WHERE id = ?
    `;
    const result = await db.query(sql, [subject_id, day_of_week, start_time, end_time, id]);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Schedule entry not found' });
    }
    const { rows } = await db.query(`SELECT * FROM subject_schedule WHERE id = ?`, [id]);
    res.json(rows[0]);
  } catch (err) {
    console.error('updateScheduleEntry error:', err);
    res.status(500).json({ error: 'Failed to update schedule entry' });
  }
};

exports.deleteScheduleEntry = async (req, res) => {
  const { id } = req.params;
  try {
    const sql = `DELETE FROM subject_schedule WHERE id = ?`;
    const result = await db.query(sql, [id]);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Schedule entry not found' });
    }
    res.json({ id });
  } catch (err) {
    console.error('deleteScheduleEntry error:', err);
    res.status(500).json({ error: 'Failed to delete schedule entry' });
  }
};

exports.getStudents = async (_req, res) => {
  try {
    const sql = `
      SELECT
        s.id,
        s.roll_id,
        s.full_name,
        s.department_id,
        d.name AS department_name,
        d.code AS department_code,
        s.current_semester_id,
        sem.label AS current_semester_label,
        sem.year AS current_semester_year,
        sem.term_number AS current_semester_term
      FROM students s
      JOIN departments d ON d.id = s.department_id
      LEFT JOIN semesters sem ON sem.id = s.current_semester_id
      ORDER BY s.full_name ASC
    `;
    const { rows } = await db.query(sql);
    res.json(rows);
  } catch (err) {
    console.error('getStudents error:', err);
    res.status(500).json({ error: 'Failed to load students' });
  }
};

exports.getStudentData = async (req, res) => {
  const { email, rollId, password } = req.body || {};
  if (!email || !rollId || !password) {
    return res.status(400).json({ error: 'email, rollId and password are required' });
  }

  try {
    const studentSql = `
      SELECT
        s.id,
        s.roll_id,
        s.name,
        s.full_name,
        s.email,
        s.password,  -- نخليها بدون alias
        s.gpa_total,
        s.registration_state,
        s.created_at,
        s.updated_at,
        d.id   AS department_id,
        d.name AS department_name,
        d.code AS department_code,
        cur.id     AS current_semester_id,
        cur.label  AS current_semester_label,
        cur.year   AS current_semester_year,
        cur.term_number AS current_semester_term
      FROM students s
      JOIN departments d ON d.id = s.department_id
      LEFT JOIN semesters cur ON cur.id = s.current_semester_id
      WHERE s.email = ? AND s.roll_id = ?
      LIMIT 1
    `;
    const stuRes = await db.query(studentSql, [email, rollId]);
    if (stuRes.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const student = stuRes.rows[0];

    // مقارنة مباشرة بدون bcrypt
    if (password !== student.password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const enrollmentsSql = `
      SELECT
        e.semester_id,
        sem.label AS semester_label,
        sem.year AS semester_year,
        sem.term_number AS semester_term_number,
        sem.starts_on AS semester_starts_on,
        sem.ends_on AS semester_ends_on,
        sub.id AS subject_id,
        sub.code,
        sub.title,
        sub.credit_hours,
        e.subject_grade AS grade
      FROM enrollments e
      JOIN subjects sub ON sub.id = e.subject_id
      JOIN semesters sem ON sem.id = e.semester_id
      WHERE e.student_id = ?
      ORDER BY sem.year, sem.term_number, sub.code
    `;
    const enrollmentsRes = await db.query(enrollmentsSql, [student.id]);
    const academicRecord = [];
    const semesterIndex = new Map();

    enrollmentsRes.rows.forEach((row) => {
      let entry = semesterIndex.get(row.semester_id);
      if (!entry) {
        entry = {
          semester: {
            id: row.semester_id,
            label: row.semester_label,
            year: row.semester_year,
            term_number: row.semester_term_number,
            starts_on: row.semester_starts_on,
            ends_on: row.semester_ends_on
          },
          courses: []
        };
        semesterIndex.set(row.semester_id, entry);
        academicRecord.push(entry);
      }
      entry.courses.push({
        subject_id: row.subject_id,
        code: row.code,
        title: row.title,
        credit_hours: row.credit_hours,
        grade: row.grade
      });
    });

    const response = {
      headerCards: {
        department: {
          name: student.department_name,
          code: student.department_code
        },
        currentSemester: student.current_semester_label
          ? {
              label: student.current_semester_label,
              year: student.current_semester_year,
              term: student.current_semester_term
            }
          : null,
        gpaPercent: student.gpa_total,
        registrationState: student.registration_state
      },
      personalInfo: {
        fullName: student.full_name,
        rollId: student.roll_id,
        email: student.email,
        department: student.department_name
      },
      academicRecord
    };

    return res.json(response);
  } catch (err) {
    console.error('error while fetching students data: ', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

exports.bootStrap = async (_req, res) => {
  try {
    const [departments, subjects, semesters] = await Promise.all([
      db.query(`SELECT id, name, code FROM departments ORDER BY name ASC`),
      db.query(`SELECT id, code, title, credit_hours, department_id FROM subjects ORDER BY code ASC`),
      db.query(`SELECT id, label, year, term_number, starts_on, ends_on FROM semesters ORDER BY year DESC, term_number DESC`)
    ]);
    res.json({
      departments: departments.rows,
      subjects: subjects.rows,
      semesters: semesters.rows,
    });
  } catch (e) {
    console.error('bootstrap error:', e);
    res.status(500).json({ error: 'failed to load bootstrap data' });
  }
}
