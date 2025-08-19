// routes/student.js
const bcrypt = require('bcryptjs');
const pool = require('../config/db');


exports.addDepartment = async (req, res) => {
  const { name, code } = req.body;
  try {
    const sql = `
      INSERT INTO departments (id, name, code)
      VALUES (gen_random_uuid(), $1, $2)
      RETURNING *;
    `;
    const { rows } = await pool.query(sql, [name, code]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('addDepartment error:', err);
    res.status(500).json({ error: 'Failed to add department' });
  }
};

exports.addSemester = async (req, res) => {
  const { label, year, term_number, starts_on, ends_on } = req.body;
  try {
    const sql = `
      INSERT INTO semesters (id, label, year, term_number, starts_on, ends_on)
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const { rows } = await pool.query(sql, [label, year, term_number, starts_on, ends_on]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('addSemester error:', err);
    res.status(500).json({ error: 'Failed to add semester' });
  }
};

exports.addSubject = async (req, res) => {
  const { code, title, credit_hours, department_id } = req.body;
  try {
    const sql = `
      INSERT INTO subjects (id, code, title, credit_hours, department_id)
      VALUES (gen_random_uuid(), $1, $2, $3, $4)
      RETURNING *;
    `;
    const { rows } = await pool.query(sql, [code, title, credit_hours, department_id]);
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
        gen_random_uuid(),
        $1,$2,$3,$4,$5,$6,$7,$8,$9
      )
      RETURNING *;
    `;
    const { rows } = await pool.query(sql, [
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
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('addStudent error:', err);
    res.status(500).json({ error: 'Failed to add student' });
  }
};

exports.addEnrollment = async (req, res) => {
  const { student_id, subject_id, semester_id, subject_grade } = req.body;
  try {
    const sql = `
      INSERT INTO enrollments (
        id,
        student_id,
        subject_id,
        semester_id,
        subject_grade,
        recorded_at
      ) VALUES (
        gen_random_uuid(),
        $1,$2,$3,$4, now()
      )
      RETURNING *;
    `;
    const { rows } = await pool.query(sql, [student_id, subject_id, semester_id, subject_grade]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('addEnrollment error:', err);
    res.status(500).json({ error: 'Failed to add enrollment' });
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
      WHERE s.email = $1 AND s.roll_id = $2
      LIMIT 1
    `;
    const stuRes = await pool.query(studentSql, [email, rollId]);
    if (stuRes.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const student = stuRes.rows[0];

    // مقارنة مباشرة بدون bcrypt
    if (password !== student.password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const semestersSql = `
      SELECT COALESCE(
        json_agg(
          json_build_object(
            'semester', json_build_object(
              'id', sem.id,
              'label', sem.label,
              'year', sem.year,
              'term_number', sem.term_number,
              'starts_on', sem.starts_on,
              'ends_on', sem.ends_on
            ),
            'courses', (
              SELECT json_agg(
                json_build_object(
                  'subject_id', sub.id,
                  'code', sub.code,
                  'title', sub.title,
                  'credit_hours', sub.credit_hours,
                  'grade', e.subject_grade
                )
                ORDER BY sub.code
              )
              FROM enrollments e
              JOIN subjects sub ON sub.id = e.subject_id
              WHERE e.student_id = $1 AND e.semester_id = sem.id
            )
          )
          ORDER BY sem.year, sem.term_number
        ),
        '[]'::json
      ) AS semesters
      FROM (
        SELECT DISTINCT semester_id
        FROM enrollments
        WHERE student_id = $1
      ) t
      JOIN semesters sem ON sem.id = t.semester_id
    `;
    const semRes = await pool.query(semestersSql, [student.id]);

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
      academicRecord: semRes.rows[0]?.semesters || []
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
      pool.query(`SELECT id, name, code FROM departments ORDER BY name ASC`),
      pool.query(`SELECT id, code, title, credit_hours, department_id FROM subjects ORDER BY code ASC`),
      pool.query(`SELECT id, label, year, term_number, starts_on, ends_on FROM semesters ORDER BY year DESC, term_number DESC`)
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