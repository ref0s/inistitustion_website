const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { z } = require('zod');
const { basicAuth } = require('../middleware/basicAuth');
const { validate } = require('../middleware/validate');
const { asyncHandler, HttpError } = require('../utils/errors');
const { db, runInTransaction } = require('../utils/db');

const router = express.Router();
router.use(basicAuth);

const DAY_VALUES = ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday'];
const emailSchema = z
  .string()
  .min(3)
  .regex(/^[^@\s]+@[^@\s]+$/, { message: 'Invalid email address' });

const departmentCreateSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  isActive: z.boolean().optional().default(true)
});

const departmentUpdateSchema = departmentCreateSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'No fields provided' }
);

const departmentListQuery = z.object({
  search: z.string().optional(),
  isActive: z.enum(['true', 'false']).optional()
});

const studentCreateSchema = z.object({
  registrationId: z.string().min(1),
  fullName: z.string().min(1),
  email: emailSchema,
  departmentId: z.string().min(1),
  motherName: z.string().min(1),
  phone: z.string().min(1),
  password: z.string().min(6)
});

const studentUpdateSchema = z
  .object({
    registrationId: z.string().min(1).optional(),
    fullName: z.string().min(1).optional(),
    email: emailSchema.optional(),
    departmentId: z.string().min(1).optional(),
    motherName: z.string().min(1).optional(),
    phone: z.string().min(1).optional(),
    password: z.string().min(6).optional()
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'No fields provided' });

const studentListQuery = z.object({
  search: z.string().optional(),
  departmentId: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20)
});

const termCreateSchema = z.object({
  name: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  isActive: z.boolean().optional().default(false),
  isArchived: z.boolean().optional().default(false)
});

const termUpdateSchema = z
  .object({
    name: z.string().min(1).optional(),
    startDate: z.string().min(1).optional(),
    endDate: z.string().min(1).optional(),
    isActive: z.boolean().optional(),
    isArchived: z.boolean().optional()
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'No fields provided' });

const termListQuery = z.object({
  includeArchived: z.enum(['true', 'false']).optional()
});

const registrationSchema = z.object({
  termId: z.string().min(1),
  studentIds: z.array(z.string().min(1)).nonempty(),
  sectionId: z.string().optional()
});

const unregisterSchema = z.object({
  termId: z.string().min(1),
  studentIds: z.array(z.string().min(1)).nonempty()
});

const subjectCreateSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  units: z.coerce.number().int().positive(),
  curriculumSemester: z.coerce.number().int().min(1).max(8),
  departmentIds: z.array(z.string().min(1)).nonempty()
});

const subjectUpdateSchema = subjectCreateSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'No fields provided' }
);

const subjectListQuery = z.object({
  search: z.string().optional(),
  departmentId: z.string().optional()
});

const bulkSubjectsSchema = z.object({
  subjects: z.array(subjectCreateSchema).nonempty()
});

const assignSubjectsSchema = z.object({
  subjectIds: z.array(z.string().min(1)).nonempty()
});

const studentSubjectsSchema = z.object({
  subjectIds: z.array(z.string().min(1)).nonempty()
});

const gradeSchema = z.object({
  grade: z.union([z.number().min(0).max(100), z.null()])
});

const timetableCreateSchema = z.object({
  dayOfWeek: z.enum(DAY_VALUES),
  periodId: z.string().min(1),
  subjectId: z.string().min(1),
  roomText: z.string().optional(),
  lecturerText: z.string().optional()
});

const timetableUpdateSchema = timetableCreateSchema;

const periodUpdateSchema = z
  .object({
    label: z.string().min(1).optional(),
    startTime: z.string().min(1).optional(),
    endTime: z.string().min(1).optional()
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'No fields provided' });

const mapStudent = (row) => ({
  id: row.id,
  registrationId: row.registration_id,
  fullName: row.full_name,
  email: row.email,
  department: row.department_id
    ? {
        id: row.department_id,
        name: row.department_name,
        code: row.department_code
      }
    : null,
  motherName: row.mother_name,
  phone: row.phone,
  studySemestersCount: row.study_semesters_count
});

const mapTerm = (row) => ({
  id: row.id,
  name: row.name,
  startDate: row.start_date,
  endDate: row.end_date,
  isActive: !!row.is_active,
  isArchived: !!row.is_archived
});

const mapSubject = (row) => ({
  id: row.id,
  name: row.name,
  code: row.code,
  units: row.units,
  curriculumSemester: row.curriculum_semester,
  departments: row.departments || []
});

const mapDepartment = (row) => ({
  id: row.id,
  name: row.name,
  code: row.code,
  isActive: !!row.is_active
});

const ensureTermExists = async (termId) => {
  const { rows } = await db.query(`SELECT * FROM terms WHERE id = ?`, [termId]);
  if (!rows.length) {
    throw new HttpError(404, 'Term not found');
  }
  return rows[0];
};

const ensureStudentExists = async (studentId) => {
  const { rows } = await db.query(`SELECT * FROM students WHERE id = ?`, [studentId]);
  if (!rows.length) {
    throw new HttpError(404, 'Student not found');
  }
  return rows[0];
};

const ensureSubjectExists = async (subjectId) => {
  const { rows } = await db.query(`SELECT * FROM subjects WHERE id = ?`, [subjectId]);
  if (!rows.length) {
    throw new HttpError(404, 'Subject not found');
  }
  return rows[0];
};

const ensurePeriodExists = async (periodId) => {
  const { rows } = await db.query(`SELECT * FROM periods WHERE id = ?`, [periodId]);
  if (!rows.length) {
    throw new HttpError(404, 'Period not found');
  }
  return rows[0];
};

const ensureDepartmentExists = async (departmentId) => {
  const { rows } = await db.query(`SELECT * FROM departments WHERE id = ?`, [departmentId]);
  if (!rows.length) {
    throw new HttpError(404, 'Department not found');
  }
  return rows[0];
};

const attachDepartmentsToSubjects = async (subjectRows) => {
  if (!subjectRows.length) return [];
  const ids = subjectRows.map((s) => s.id);
  const placeholders = ids.map(() => '?').join(',');
  const { rows } = await db.query(
    `
      SELECT ds.subject_id, d.id, d.name, d.code
      FROM department_subjects ds
      JOIN departments d ON d.id = ds.department_id
      WHERE ds.subject_id IN (${placeholders})
      ORDER BY d.code ASC
    `,
    ids
  );
  const map = new Map();
  for (const row of rows) {
    if (!map.has(row.subject_id)) map.set(row.subject_id, []);
    map.get(row.subject_id).push({ id: row.id, name: row.name, code: row.code });
  }
  return subjectRows.map((s) => ({ ...s, departments: map.get(s.id) || [] }));
};

router.get(
  '/me',
  asyncHandler(async (_req, res) => {
    res.json({ role: 'admin' });
  })
);

// Departments
router.get(
  '/departments',
  validate(departmentListQuery, 'query'),
  asyncHandler(async (req, res) => {
    const { search, isActive } = req.validatedQuery;
    const conditions = [];
    const params = [];
    if (search) {
      const like = `%${search.toLowerCase()}%`;
      conditions.push('(lower(name) LIKE ? OR lower(code) LIKE ?)');
      params.push(like, like);
    }
    if (isActive === 'true') {
      conditions.push('is_active = 1');
    } else if (isActive === 'false') {
      conditions.push('is_active = 0');
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await db.query(
      `SELECT id, name, code, is_active FROM departments ${where} ORDER BY name ASC`,
      params
    );
    res.json(rows.map(mapDepartment));
  })
);

router.post(
  '/departments',
  validate(departmentCreateSchema),
  asyncHandler(async (req, res) => {
    const { name, code, isActive } = req.validatedBody;
    const id = crypto.randomUUID();
    await db.query(
      `
        INSERT INTO departments (id, name, code, is_active)
        VALUES (?, ?, ?, ?)
      `,
      [id, name, code, isActive ? 1 : 0]
    );
    const { rows } = await db.query(`SELECT id, name, code, is_active FROM departments WHERE id = ?`, [id]);
    res.status(201).json(mapDepartment(rows[0]));
  })
);

router.put(
  '/departments/:id',
  validate(departmentUpdateSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    await ensureDepartmentExists(id);
    const { name, code, isActive } = req.validatedBody;
    const fields = [];
    const params = [];
    if (name !== undefined) {
      fields.push('name = ?');
      params.push(name);
    }
    if (code !== undefined) {
      fields.push('code = ?');
      params.push(code);
    }
    if (isActive !== undefined) {
      fields.push('is_active = ?');
      params.push(isActive ? 1 : 0);
    }
    await db.query(`UPDATE departments SET ${fields.join(', ')} WHERE id = ?`, [...params, id]);
    const { rows } = await db.query(`SELECT id, name, code, is_active FROM departments WHERE id = ?`, [id]);
    res.json(mapDepartment(rows[0]));
  })
);

router.delete(
  '/departments/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    await ensureDepartmentExists(id);

    const { rows: studentRef } = await db.query(
      `SELECT 1 FROM students WHERE department_id = ? LIMIT 1`,
      [id]
    );
    if (studentRef.length) {
      throw new HttpError(409, 'Department is in use by students');
    }

    const { rows: subjectRef } = await db.query(
      `SELECT 1 FROM department_subjects WHERE department_id = ? LIMIT 1`,
      [id]
    );
    if (subjectRef.length) {
      throw new HttpError(409, 'Department is in use by subjects');
    }

    await db.query(`DELETE FROM departments WHERE id = ?`, [id]);
    res.json({ id });
  })
);

// Students
router.get(
  '/students',
  validate(studentListQuery, 'query'),
  asyncHandler(async (req, res) => {
    const { search, page, pageSize, departmentId } = req.validatedQuery;
    const offset = (page - 1) * pageSize;
    const params = [];
    const conditions = [];
    if (search) {
      const like = `%${search.toLowerCase()}%`;
      params.push(like, like, like);
      conditions.push(`(lower(s.registration_id) LIKE ? OR lower(s.full_name) LIKE ? OR lower(s.email) LIKE ?)`);
    }
    if (departmentId) {
      params.push(departmentId);
      conditions.push('s.department_id = ?');
    }
    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const { rows: students } = await db.query(
      `
        SELECT s.id, s.registration_id, s.full_name, s.email, s.mother_name, s.phone, s.study_semesters_count,
               s.department_id, d.name as department_name, d.code as department_code
        FROM students s
        JOIN departments d ON d.id = s.department_id
        ${whereClause}
        ORDER BY s.full_name ASC
        LIMIT ? OFFSET ?
      `,
      [...params, pageSize, offset]
    );

    const { rows: totalRows } = await db.query(
      `SELECT COUNT(*) as count FROM students s ${whereClause}`,
      params
    );

    res.json({
      data: students.map(mapStudent),
      page,
      pageSize,
      total: totalRows[0]?.count || 0
    });
  })
);

router.post(
  '/students',
  validate(studentCreateSchema),
  asyncHandler(async (req, res) => {
    const { registrationId, fullName, email, departmentId, motherName, phone, password } = req.validatedBody;
    await ensureDepartmentExists(departmentId);
    const passwordHash = await bcrypt.hash(password, 10);
    const id = crypto.randomUUID();

    await db.query(
      `
        INSERT INTO students (id, registration_id, full_name, email, department_id, mother_name, phone, password_hash)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?);
      `,
      [id, registrationId, fullName, email, departmentId, motherName, phone, passwordHash]
    );

    const { rows } = await db.query(
      `
        SELECT s.id, s.registration_id, s.full_name, s.email, s.mother_name, s.phone, s.study_semesters_count,
               s.department_id, d.name as department_name, d.code as department_code
        FROM students s
        JOIN departments d ON d.id = s.department_id
        WHERE s.id = ?
      `,
      [id]
    );

    res.status(201).json(mapStudent(rows[0]));
  })
);

router.put(
  '/students/:id',
  validate(studentUpdateSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const existing = await ensureStudentExists(id);

    const { registrationId, fullName, email, departmentId, motherName, phone, password } = req.validatedBody;
    const fields = [];
    const params = [];

    if (registrationId !== undefined) {
      fields.push('registration_id = ?');
      params.push(registrationId);
    }
    if (fullName !== undefined) {
      fields.push('full_name = ?');
      params.push(fullName);
    }
    if (email !== undefined) {
      fields.push('email = ?');
      params.push(email);
    }
    if (departmentId !== undefined) {
      await ensureDepartmentExists(departmentId);
      fields.push('department_id = ?');
      params.push(departmentId);
    }
    if (motherName !== undefined) {
      fields.push('mother_name = ?');
      params.push(motherName);
    }
    if (phone !== undefined) {
      fields.push('phone = ?');
      params.push(phone);
    }
    if (password !== undefined) {
      const hash = await bcrypt.hash(password, 10);
      fields.push('password_hash = ?');
      params.push(hash);
    }

    const result = await db.query(
      `UPDATE students SET ${fields.join(', ')} WHERE id = ?`,
      [...params, id]
    );

    const { rows } = await db.query(
      `
        SELECT s.id, s.registration_id, s.full_name, s.email, s.mother_name, s.phone, s.study_semesters_count,
               s.department_id, d.name as department_name, d.code as department_code
        FROM students s
        JOIN departments d ON d.id = s.department_id
        WHERE s.id = ?
      `,
      [id]
    );
    res.json(mapStudent(rows[0]));
  })
);

router.delete(
  '/students/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await db.query(`DELETE FROM students WHERE id = ?`, [id]);
    if (result.changes === 0) {
      throw new HttpError(404, 'Student not found');
    }
    res.json({ id });
  })
);

// Terms
router.get(
  '/terms',
  validate(termListQuery, 'query'),
  asyncHandler(async (req, res) => {
    const includeArchived = req.validatedQuery.includeArchived === 'true';
    const where = includeArchived ? '' : 'WHERE is_archived = 0';
    const { rows } = await db.query(
      `SELECT id, name, start_date, end_date, is_active, is_archived FROM terms ${where} ORDER BY start_date DESC`
    );
    res.json(rows.map(mapTerm));
  })
);

router.post(
  '/terms',
  validate(termCreateSchema),
  asyncHandler(async (req, res) => {
    const { name, startDate, endDate, isActive, isArchived } = req.validatedBody;
    if (new Date(startDate) > new Date(endDate)) {
      throw new HttpError(400, 'startDate must be before endDate');
    }
    const id = crypto.randomUUID();

    await runInTransaction(async () => {
      if (isActive) {
        await db.query(`UPDATE terms SET is_active = 0`);
      }
      await db.query(
        `
          INSERT INTO terms (id, name, start_date, end_date, is_active, is_archived)
          VALUES (?, ?, ?, ?, ?, ?);
        `,
        [id, name, startDate, endDate, isActive ? 1 : 0, isArchived ? 1 : 0]
      );
    });

    const term = await ensureTermExists(id);
    res.status(201).json(mapTerm(term));
  })
);

router.put(
  '/terms/:id',
  validate(termUpdateSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    await ensureTermExists(id);
    const { name, startDate, endDate, isActive, isArchived } = req.validatedBody;

    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      throw new HttpError(400, 'startDate must be before endDate');
    }

    const fields = [];
    const params = [];

    if (name !== undefined) {
      fields.push('name = ?');
      params.push(name);
    }
    if (startDate !== undefined) {
      fields.push('start_date = ?');
      params.push(startDate);
    }
    if (endDate !== undefined) {
      fields.push('end_date = ?');
      params.push(endDate);
    }
    if (isActive !== undefined) {
      fields.push('is_active = ?');
      params.push(isActive ? 1 : 0);
    }
    if (isArchived !== undefined) {
      fields.push('is_archived = ?');
      params.push(isArchived ? 1 : 0);
    }

    await runInTransaction(async () => {
      if (isActive === true) {
        await db.query(`UPDATE terms SET is_active = 0 WHERE id != ?`, [id]);
      }

      await db.query(
        `UPDATE terms SET ${fields.join(', ')} WHERE id = ?`,
        [...params, id]
      );
    });

    const term = await ensureTermExists(id);
    res.json(mapTerm(term));
  })
);

router.delete(
  '/terms/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await db.query(`DELETE FROM terms WHERE id = ?`, [id]);
    if (result.changes === 0) {
      throw new HttpError(404, 'Term not found');
    }
    res.json({ id });
  })
);

// Registrations
router.get(
  '/registrations',
  asyncHandler(async (req, res) => {
    const termId = req.query.termId;
    if (!termId) {
      throw new HttpError(400, 'termId is required');
    }
    await ensureTermExists(termId);
    const { rows } = await db.query(
      `
        SELECT r.id, r.term_id, r.student_id, r.section_id, r.registered_at,
               s.registration_id, s.full_name, s.email
        FROM registrations r
        JOIN students s ON s.id = r.student_id
        WHERE r.term_id = ?
        ORDER BY s.full_name ASC
      `,
      [termId]
    );
    res.json(
      rows.map((row) => ({
        id: row.id,
        termId: row.term_id,
        studentId: row.student_id,
        sectionId: row.section_id,
        registeredAt: row.registered_at,
        student: {
          registrationId: row.registration_id,
          fullName: row.full_name,
          email: row.email
        }
      }))
    );
  })
);

router.post(
  '/registrations/register',
  validate(registrationSchema),
  asyncHandler(async (req, res) => {
    const { termId, studentIds, sectionId } = req.validatedBody;
    await ensureTermExists(termId);

    const uniqueIds = Array.from(new Set(studentIds));

    await runInTransaction(async () => {
      for (const studentId of uniqueIds) {
        await ensureStudentExists(studentId);
        const result = await db.query(
          `
            INSERT OR IGNORE INTO registrations (id, term_id, student_id, section_id, registered_at)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP);
          `,
          [crypto.randomUUID(), termId, studentId, sectionId || null]
        );

        if (result.changes > 0) {
          await db.query(
            `UPDATE students SET study_semesters_count = study_semesters_count + 1 WHERE id = ?`,
            [studentId]
          );
        }
      }
    });

    res.status(200).json({ termId, registered: uniqueIds });
  })
);

router.post(
  '/registrations/unregister',
  validate(unregisterSchema),
  asyncHandler(async (req, res) => {
    const { termId, studentIds } = req.validatedBody;
    await ensureTermExists(termId);
    const uniqueIds = Array.from(new Set(studentIds));

    await runInTransaction(async () => {
      for (const studentId of uniqueIds) {
        await db.query(
          `DELETE FROM registrations WHERE term_id = ? AND student_id = ?`,
          [termId, studentId]
        );
      }
    });

    res.json({ termId, unregistered: uniqueIds });
  })
);

// Subjects
router.get(
  '/subjects',
  validate(subjectListQuery, 'query'),
  asyncHandler(async (req, res) => {
    const { search, departmentId } = req.validatedQuery;
    const conditions = [];
    const params = [];
    if (search) {
      const like = `%${search.toLowerCase()}%`;
      params.push(like, like);
      conditions.push('(lower(s.name) LIKE ? OR lower(s.code) LIKE ?)');
    }
    if (departmentId) {
      params.push(departmentId);
      conditions.push('ds.department_id = ?');
    }
    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const { rows } = await db.query(
      `
        SELECT DISTINCT s.id, s.name, s.code, s.units, s.curriculum_semester
        FROM subjects s
        LEFT JOIN department_subjects ds ON ds.subject_id = s.id
        ${whereClause}
        ORDER BY s.code ASC
      `,
      params
    );
    const hydrated = await attachDepartmentsToSubjects(rows);
    res.json(hydrated.map(mapSubject));
  })
);

router.post(
  '/subjects',
  validate(subjectCreateSchema),
  asyncHandler(async (req, res) => {
    const { name, code, units, curriculumSemester, departmentIds } = req.validatedBody;
    const uniqueDeptIds = Array.from(new Set(departmentIds));
    for (const deptId of uniqueDeptIds) {
      await ensureDepartmentExists(deptId);
    }
    const id = crypto.randomUUID();
    await runInTransaction(async () => {
      await db.query(
        `
          INSERT INTO subjects (id, name, code, units, curriculum_semester)
          VALUES (?, ?, ?, ?, ?);
        `,
        [id, name, code, units, curriculumSemester]
      );
      for (const deptId of uniqueDeptIds) {
        await db.query(
          `
            INSERT OR IGNORE INTO department_subjects (id, department_id, subject_id)
            VALUES (?, ?, ?);
          `,
          [crypto.randomUUID(), deptId, id]
        );
      }
    });
    const subject = await ensureSubjectExists(id);
    const hydrated = await attachDepartmentsToSubjects([subject]);
    res.status(201).json(mapSubject(hydrated[0]));
  })
);

router.post(
  '/subjects/bulk',
  validate(bulkSubjectsSchema),
  asyncHandler(async (req, res) => {
    const { subjects } = req.validatedBody;
    await runInTransaction(async () => {
      for (const subj of subjects) {
        const uniqueDeptIds = Array.from(new Set(subj.departmentIds));
        for (const deptId of uniqueDeptIds) {
          await ensureDepartmentExists(deptId);
        }
        await db.query(
          `
            INSERT INTO subjects (id, name, code, units, curriculum_semester)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(code) DO UPDATE SET
              name = excluded.name,
              units = excluded.units,
              curriculum_semester = excluded.curriculum_semester;
          `,
          [crypto.randomUUID(), subj.name, subj.code, subj.units, subj.curriculumSemester]
        );
        const { rows: subjectRow } = await db.query(`SELECT id FROM subjects WHERE code = ?`, [subj.code]);
        const subjectId = subjectRow[0]?.id;
        if (subjectId) {
          await db.query(`DELETE FROM department_subjects WHERE subject_id = ?`, [subjectId]);
          for (const deptId of uniqueDeptIds) {
            await db.query(
              `
                INSERT OR IGNORE INTO department_subjects (id, department_id, subject_id)
                VALUES (?, ?, ?);
              `,
              [crypto.randomUUID(), deptId, subjectId]
            );
          }
        }
      }
    });
    res.json({ added: subjects.length });
  })
);

router.put(
  '/subjects/:id',
  validate(subjectUpdateSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    await ensureSubjectExists(id);
    const { name, code, units, curriculumSemester, departmentIds } = req.validatedBody;

    const fields = [];
    const params = [];
    if (name !== undefined) {
      fields.push('name = ?');
      params.push(name);
    }
    if (code !== undefined) {
      fields.push('code = ?');
      params.push(code);
    }
    if (units !== undefined) {
      fields.push('units = ?');
      params.push(units);
    }
    if (curriculumSemester !== undefined) {
      fields.push('curriculum_semester = ?');
      params.push(curriculumSemester);
    }

    const uniqueDeptIds = departmentIds ? Array.from(new Set(departmentIds)) : null;
    if (uniqueDeptIds) {
      for (const deptId of uniqueDeptIds) {
        await ensureDepartmentExists(deptId);
      }
    }

    await runInTransaction(async () => {
      if (fields.length) {
        await db.query(`UPDATE subjects SET ${fields.join(', ')} WHERE id = ?`, [...params, id]);
      }
      if (uniqueDeptIds) {
        await db.query(`DELETE FROM department_subjects WHERE subject_id = ?`, [id]);
        for (const deptId of uniqueDeptIds) {
          await db.query(
            `INSERT OR IGNORE INTO department_subjects (id, department_id, subject_id) VALUES (?, ?, ?)`,
            [crypto.randomUUID(), deptId, id]
          );
        }
      }
    });

    const subject = await ensureSubjectExists(id);
    const hydrated = await attachDepartmentsToSubjects([subject]);
    res.json(mapSubject(hydrated[0]));
  })
);

router.delete(
  '/subjects/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await db.query(`DELETE FROM subjects WHERE id = ?`, [id]);
    if (result.changes === 0) {
      throw new HttpError(404, 'Subject not found');
    }
    res.json({ id });
  })
);

// Term offerings
router.post(
  '/terms/:termId/subjects/assign',
  validate(assignSubjectsSchema),
  asyncHandler(async (req, res) => {
    const { termId } = req.params;
    await ensureTermExists(termId);
    const { subjectIds } = req.validatedBody;
    const uniqueIds = Array.from(new Set(subjectIds));

    await runInTransaction(async () => {
      for (const subjectId of uniqueIds) {
        await ensureSubjectExists(subjectId);
        await db.query(
          `
            INSERT OR IGNORE INTO term_subjects (id, term_id, subject_id)
            VALUES (?, ?, ?);
          `,
          [crypto.randomUUID(), termId, subjectId]
        );
      }
    });

    res.json({ termId, assigned: uniqueIds });
  })
);

router.post(
  '/terms/:termId/subjects/unassign',
  validate(assignSubjectsSchema),
  asyncHandler(async (req, res) => {
    const { termId } = req.params;
    await ensureTermExists(termId);
    const { subjectIds } = req.validatedBody;
    const uniqueIds = Array.from(new Set(subjectIds));

    await runInTransaction(async () => {
      for (const subjectId of uniqueIds) {
        await db.query(
          `DELETE FROM term_subjects WHERE term_id = ? AND subject_id = ?`,
          [termId, subjectId]
        );
      }
    });

    res.json({ termId, removed: uniqueIds });
  })
);

router.get(
  '/terms/:termId/subjects',
  asyncHandler(async (req, res) => {
    const { termId } = req.params;
    await ensureTermExists(termId);
    const { rows } = await db.query(
      `
        SELECT s.id, s.name, s.code, s.units, s.curriculum_semester
        FROM term_subjects ts
        JOIN subjects s ON s.id = ts.subject_id
        WHERE ts.term_id = ?
        ORDER BY s.code ASC
      `,
      [termId]
    );
    const hydrated = await attachDepartmentsToSubjects(rows);
    res.json(
      hydrated.map((row) => ({
        subjectId: row.id,
        name: row.name,
        code: row.code,
        units: row.units,
        curriculumSemester: row.curriculum_semester,
        departments: row.departments
      }))
    );
  })
);

// Student subjects
router.post(
  '/terms/:termId/students/:studentId/subjects/assign',
  validate(studentSubjectsSchema),
  asyncHandler(async (req, res) => {
    const { termId, studentId } = req.params;
    await ensureTermExists(termId);
    const student = await ensureStudentExists(studentId);
    const { subjectIds } = req.validatedBody;
    const uniqueIds = Array.from(new Set(subjectIds));

    const { rows: regRows } = await db.query(
      `SELECT 1 FROM registrations WHERE term_id = ? AND student_id = ?`,
      [termId, studentId]
    );
    if (!regRows.length) {
      throw new HttpError(400, 'Student must be registered in the term first.');
    }

    const { rows: offered } = await db.query(
      `SELECT subject_id FROM term_subjects WHERE term_id = ?`,
      [termId]
    );
    const offeredSet = new Set(offered.map((r) => r.subject_id));
    for (const id of uniqueIds) {
      if (!offeredSet.has(id)) {
        throw new HttpError(400, 'Subject must be offered in the term.');
      }
    }

    const { rows: deptLinks } = await db.query(
      `SELECT subject_id FROM department_subjects WHERE department_id = ?`,
      [student.department_id]
    );
    const allowedByDept = new Set(deptLinks.map((r) => r.subject_id));
    for (const id of uniqueIds) {
      if (!allowedByDept.has(id)) {
        throw new HttpError(400, 'Subject not available for student department.');
      }
    }

    const { rows: currentRows } = await db.query(
      `SELECT subject_id FROM student_subjects WHERE term_id = ? AND student_id = ?`,
      [termId, studentId]
    );
    const currentSet = new Set(currentRows.map((r) => r.subject_id));
    const newSubjects = uniqueIds.filter((id) => !currentSet.has(id));
    const MAX_SUBJECTS = 7;
    if (currentSet.size + newSubjects.length > MAX_SUBJECTS) {
      throw new HttpError(400, `لا يمكن إسناد أكثر من ${MAX_SUBJECTS} مواد لهذا الطالب في هذا الفصل.`);
    }

    await runInTransaction(async () => {
      for (const subjectId of newSubjects) {
        await db.query(
          `
            INSERT OR IGNORE INTO student_subjects (id, term_id, student_id, subject_id)
            VALUES (?, ?, ?, ?);
          `,
          [crypto.randomUUID(), termId, studentId, subjectId]
        );
      }
    });

    res.json({ termId, studentId, assigned: uniqueIds });
  })
);

router.post(
  '/terms/:termId/students/:studentId/subjects/unassign',
  validate(studentSubjectsSchema),
  asyncHandler(async (req, res) => {
    const { termId, studentId } = req.params;
    await ensureTermExists(termId);
    await ensureStudentExists(studentId);
    const { subjectIds } = req.validatedBody;
    const uniqueIds = Array.from(new Set(subjectIds));

    await runInTransaction(async () => {
      for (const subjectId of uniqueIds) {
        await db.query(
          `DELETE FROM student_subjects WHERE term_id = ? AND student_id = ? AND subject_id = ?`,
          [termId, studentId, subjectId]
        );
      }
    });

    res.json({ termId, studentId, removed: uniqueIds });
  })
);

router.get(
  '/terms/:termId/students/:studentId/subjects',
  asyncHandler(async (req, res) => {
    const { termId, studentId } = req.params;
    await ensureTermExists(termId);
    await ensureStudentExists(studentId);

    const { rows } = await db.query(
      `
        SELECT ss.subject_id, ss.grade, s.name, s.code, s.units, s.curriculum_semester
        FROM student_subjects ss
        JOIN subjects s ON s.id = ss.subject_id
        WHERE ss.term_id = ? AND ss.student_id = ?
        ORDER BY s.code ASC
      `,
      [termId, studentId]
    );

    res.json(
      rows.map((row) => ({
        subjectId: row.subject_id,
        grade: row.grade,
        name: row.name,
        code: row.code,
        units: row.units,
        curriculumSemester: row.curriculum_semester
      }))
    );
  })
);

router.put(
  '/terms/:termId/students/:studentId/subjects/:subjectId/grade',
  validate(gradeSchema),
  asyncHandler(async (req, res) => {
    const { termId, studentId, subjectId } = req.params;
    await ensureTermExists(termId);
    await ensureStudentExists(studentId);
    await ensureSubjectExists(subjectId);
    const { grade } = req.validatedBody;

    const { rows: existing } = await db.query(
      `SELECT 1 FROM student_subjects WHERE term_id = ? AND student_id = ? AND subject_id = ?`,
      [termId, studentId, subjectId]
    );
    if (!existing.length) {
      throw new HttpError(404, 'Student is not assigned to this subject in the term.');
    }

    await db.query(
      `UPDATE student_subjects SET grade = ? WHERE term_id = ? AND student_id = ? AND subject_id = ?`,
      [grade, termId, studentId, subjectId]
    );

    res.json({ termId, studentId, subjectId, grade });
  })
);

// Periods (editable labels/times, fixed count)
router.get(
  '/periods',
  asyncHandler(async (_req, res) => {
    const { rows } = await db.query(
      `SELECT id, label, start_time, end_time, sort_order FROM periods ORDER BY sort_order ASC`
    );
    res.json(
      rows.map((p) => ({
        id: p.id,
        label: p.label,
        startTime: p.start_time,
        endTime: p.end_time,
        sortOrder: p.sort_order
      }))
    );
  })
);

router.put(
  '/periods/:id',
  validate(periodUpdateSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    await ensurePeriodExists(id);
    const { label, startTime, endTime } = req.validatedBody;

    const fields = [];
    const params = [];
    if (label !== undefined) {
      fields.push('label = ?');
      params.push(label);
    }
    if (startTime !== undefined) {
      fields.push('start_time = ?');
      params.push(startTime);
    }
    if (endTime !== undefined) {
      fields.push('end_time = ?');
      params.push(endTime);
    }

    const result = await db.query(
      `UPDATE periods SET ${fields.join(', ')} WHERE id = ?`,
      [...params, id]
    );
    const updated = await ensurePeriodExists(id);
    res.json({
      id: updated.id,
      label: updated.label,
      startTime: updated.start_time,
      endTime: updated.end_time,
      sortOrder: updated.sort_order
    });
  })
);

// Timetable
router.get(
  '/terms/:termId/timetable',
  asyncHandler(async (req, res) => {
    const { termId } = req.params;
    await ensureTermExists(termId);
    const { rows } = await db.query(
      `
        SELECT tt.id, tt.term_id, tt.day_of_week, tt.period_id, tt.subject_id, tt.room_text, tt.lecturer_text,
               p.label AS period_label, p.start_time AS period_start, p.end_time AS period_end,
               s.name AS subject_name, s.code AS subject_code
        FROM timetable_entries tt
        JOIN periods p ON p.id = tt.period_id
        JOIN subjects s ON s.id = tt.subject_id
        WHERE tt.term_id = ?
        ORDER BY tt.day_of_week, p.sort_order
      `,
      [termId]
    );
    res.json(
      rows.map((row) => ({
        id: row.id,
        termId: row.term_id,
        dayOfWeek: row.day_of_week,
        periodId: row.period_id,
        subjectId: row.subject_id,
        roomText: row.room_text,
        lecturerText: row.lecturer_text,
        period: {
          label: row.period_label,
          startTime: row.period_start,
          endTime: row.period_end
        },
        subject: {
          code: row.subject_code,
          name: row.subject_name
        }
      }))
    );
  })
);

router.post(
  '/terms/:termId/timetable',
  validate(timetableCreateSchema),
  asyncHandler(async (req, res) => {
    const { termId } = req.params;
    await ensureTermExists(termId);
    const { dayOfWeek, periodId, subjectId, roomText, lecturerText } = req.validatedBody;
    await ensurePeriodExists(periodId);

    const { rows: offered } = await db.query(
      `SELECT 1 FROM term_subjects WHERE term_id = ? AND subject_id = ?`,
      [termId, subjectId]
    );
    if (!offered.length) {
      throw new HttpError(400, 'Subject must be offered in the term.');
    }

    const id = crypto.randomUUID();
    await db.query(
      `
        INSERT INTO timetable_entries (id, term_id, day_of_week, period_id, subject_id, room_text, lecturer_text)
        VALUES (?, ?, ?, ?, ?, ?, ?);
      `,
      [id, termId, dayOfWeek, periodId, subjectId, roomText || null, lecturerText || null]
    );

    const { rows } = await db.query(`SELECT * FROM timetable_entries WHERE id = ?`, [id]);
    res.status(201).json({
      id,
      termId,
      dayOfWeek: rows[0].day_of_week,
      periodId: rows[0].period_id,
      subjectId: rows[0].subject_id,
      roomText: rows[0].room_text,
      lecturerText: rows[0].lecturer_text
    });
  })
);

router.put(
  '/timetable/:id',
  validate(timetableUpdateSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { dayOfWeek, periodId, subjectId, roomText, lecturerText } = req.validatedBody;
    await ensurePeriodExists(periodId);

    const { rows: existing } = await db.query(
      `SELECT term_id FROM timetable_entries WHERE id = ?`,
      [id]
    );
    if (!existing.length) {
      throw new HttpError(404, 'Timetable entry not found');
    }
    const termId = existing[0].term_id;
    const { rows: offered } = await db.query(
      `SELECT 1 FROM term_subjects WHERE term_id = ? AND subject_id = ?`,
      [termId, subjectId]
    );
    if (!offered.length) {
      throw new HttpError(400, 'Subject must be offered in the term.');
    }

    await db.query(
      `
        UPDATE timetable_entries
        SET day_of_week = ?, period_id = ?, subject_id = ?, room_text = ?, lecturer_text = ?
        WHERE id = ?;
      `,
      [dayOfWeek, periodId, subjectId, roomText || null, lecturerText || null, id]
    );

    const { rows } = await db.query(`SELECT * FROM timetable_entries WHERE id = ?`, [id]);
    res.json({
      id,
      termId,
      dayOfWeek: rows[0].day_of_week,
      periodId: rows[0].period_id,
      subjectId: rows[0].subject_id,
      roomText: rows[0].room_text,
      lecturerText: rows[0].lecturer_text
    });
  })
);

router.delete(
  '/timetable/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await db.query(`DELETE FROM timetable_entries WHERE id = ?`, [id]);
    if (result.changes === 0) {
      throw new HttpError(404, 'Timetable entry not found');
    }
    res.json({ id });
  })
);

// Bootstrap helper for admin UI
router.get(
  '/bootstrap',
  asyncHandler(async (_req, res) => {
    const [students, subjects, terms, periods, departments] = await Promise.all([
      db.query(
        `
          SELECT s.id, s.registration_id, s.full_name, s.email, s.mother_name, s.phone, s.study_semesters_count,
                 s.department_id, d.name as department_name, d.code as department_code
          FROM students s
          JOIN departments d ON d.id = s.department_id
          ORDER BY s.full_name ASC
        `
      ),
      db.query(
        `SELECT id, name, code, units, curriculum_semester FROM subjects ORDER BY code ASC`
      ),
      db.query(
        `SELECT id, name, start_date, end_date, is_active, is_archived FROM terms WHERE is_archived = 0 ORDER BY start_date DESC`
      ),
      db.query(
        `SELECT id, label, start_time, end_time, sort_order FROM periods ORDER BY sort_order ASC`
      ),
      db.query(`SELECT id, name, code, is_active FROM departments ORDER BY name ASC`)
    ]);

    const subjectsWithDepartments = await attachDepartmentsToSubjects(subjects.rows);

    res.json({
      students: students.rows.map(mapStudent),
      subjects: subjectsWithDepartments.map(mapSubject),
      terms: terms.rows.map(mapTerm),
      periods: periods.rows,
      departments: departments.rows.map(mapDepartment)
    });
  })
);

module.exports = router;
