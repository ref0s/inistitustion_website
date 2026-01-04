process.env.SQLITE_FILE = ':memory:';

const request = require('supertest');
const { app } = require('../app');
const { migrate } = require('../migrations/init');
const db = require('../config/db');

const authHeader = `Basic ${Buffer.from('admin:admin').toString('base64')}`;
const DEFAULT_DEPT = 'dept-general';
const CS_DEPT = 'dept-cs';
const SE_DEPT = 'dept-se';
const DEMO_TERM = 'term-demo-1';

beforeEach(async () => {
  await migrate();
});

afterAll(async () => {
  await db.close();
});

describe('Admin API', () => {
  test('enforces Basic Auth', async () => {
    const res = await request(app).get('/api/admin/terms');
    expect(res.status).toBe(401);
  });

  test('student CRUD flow', async () => {
    const payload = {
      registrationId: '2025100',
      fullName: 'Test Student',
      email: 'student@test.com',
      departmentId: DEFAULT_DEPT,
      motherName: 'Mother Name',
      phone: '12345',
      password: 'secret123',
    };

    const createRes = await request(app)
      .post('/api/admin/students')
      .set('Authorization', authHeader)
      .send(payload);
    expect(createRes.status).toBe(201);
    const studentId = createRes.body.id;

    const listRes = await request(app)
      .get('/api/admin/students')
      .set('Authorization', authHeader);
    expect(listRes.body.data.some((s) => s.id === studentId)).toBe(true);

    const updateRes = await request(app)
      .put(`/api/admin/students/${studentId}`)
      .set('Authorization', authHeader)
      .send({ fullName: 'Updated Name', password: 'newsecret123' });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.fullName).toBe('Updated Name');

    const deleteRes = await request(app)
      .delete(`/api/admin/students/${studentId}`)
      .set('Authorization', authHeader);
    expect(deleteRes.status).toBe(200);
  });

  test('registration increments studySemestersCount once', async () => {
    const termId = 'term-demo-1';
    const studentPayload = {
      registrationId: '2025200',
      fullName: 'Counter Test',
      email: 'counter@test.com',
      departmentId: DEFAULT_DEPT,
      motherName: 'Mother Test',
      phone: '98765',
      password: 'secret123',
    };

    const { body: created } = await request(app)
      .post('/api/admin/students')
      .set('Authorization', authHeader)
      .send(studentPayload);

    await request(app)
      .post('/api/admin/registrations/register')
      .set('Authorization', authHeader)
      .send({ termId, studentIds: [created.id] })
      .expect(200);

    await request(app)
      .post('/api/admin/registrations/register')
      .set('Authorization', authHeader)
      .send({ termId, studentIds: [created.id] })
      .expect(200);

    const listRes = await request(app)
      .get('/api/admin/students')
      .set('Authorization', authHeader);
    const student = listRes.body.data.find((s) => s.id === created.id);
    expect(student.studySemestersCount).toBe(1);
  });

  test('prevents overlapping terms', async () => {
    // seed term: 2025-02-01 to 2025-05-15
    const overlapRes = await request(app)
      .post('/api/admin/terms')
      .set('Authorization', authHeader)
      .send({
        name: 'Overlap Term',
        startDate: '2025-03-01',
        endDate: '2025-04-01',
        isActive: false,
      });
    expect(overlapRes.status).toBe(400);
  });

  test('timetable prevents duplicate subject per slot', async () => {
    const termId = 'term-demo-1';
    const periodsRes = await request(app)
      .get('/api/admin/periods')
      .set('Authorization', authHeader);
    const periodId = periodsRes.body[0].id;

    const offeringsRes = await request(app)
      .get(`/api/admin/terms/${termId}/subjects`)
      .set('Authorization', authHeader);
    const subjectId = offeringsRes.body[0].subjectId;

    const entryPayload = {
      dayOfWeek: 'saturday',
      periodId,
      subjectId,
      roomText: 'Room A',
      lecturerText: 'Dr. Test',
    };

    await request(app)
      .post(`/api/admin/terms/${termId}/timetable`)
      .set('Authorization', authHeader)
      .send(entryPayload)
      .expect(201);

    const dupRes = await request(app)
      .post(`/api/admin/terms/${termId}/timetable`)
      .set('Authorization', authHeader)
      .send(entryPayload);
    expect(dupRes.status).toBe(409);
  });

  test('department delete is blocked when referenced by a student', async () => {
    const deptRes = await request(app)
      .post('/api/admin/departments')
      .set('Authorization', authHeader)
      .send({ name: 'مرجع', code: 'REF1', isActive: true })
      .expect(201);
    const deptId = deptRes.body.id;

    const studentPayload = {
      registrationId: '2025300',
      fullName: 'Dept Student',
      email: 'dept@student.com',
      departmentId: deptId,
      motherName: 'Mother',
      phone: '1111',
      password: 'secret123'
    };
    await request(app).post('/api/admin/students').set('Authorization', authHeader).send(studentPayload).expect(201);

    await request(app)
      .delete(`/api/admin/departments/${deptId}`)
      .set('Authorization', authHeader)
      .expect(409);
  });

  test('department delete is blocked when referenced by subject link', async () => {
    const deptRes = await request(app)
      .post('/api/admin/departments')
      .set('Authorization', authHeader)
      .send({ name: 'مرجع مواد', code: 'REF2', isActive: true })
      .expect(201);
    const deptId = deptRes.body.id;

    const subjRes = await request(app)
      .post('/api/admin/subjects')
      .set('Authorization', authHeader)
      .send({ name: 'Subject Dept', code: 'SUBDEP', units: 3, curriculumSemester: 1, departmentIds: [deptId] });
    expect(subjRes.status).toBe(201);

    await request(app)
      .delete(`/api/admin/departments/${deptId}`)
      .set('Authorization', authHeader)
      .expect(409);
  });

  test('subject requires departments and updates links', async () => {
    const createFail = await request(app)
      .post('/api/admin/subjects')
      .set('Authorization', authHeader)
      .send({ name: 'No Dept', code: 'NODEPT', units: 2, curriculumSemester: 1, departmentIds: [] });
    expect(createFail.status).toBe(400);

    const createRes = await request(app)
      .post('/api/admin/subjects')
      .set('Authorization', authHeader)
      .send({
        name: 'Depted',
        code: 'DEPTED',
        units: 3,
        curriculumSemester: 2,
        departmentIds: [DEFAULT_DEPT]
      })
      .expect(201);
    const subjectId = createRes.body.id;

    await request(app)
      .put(`/api/admin/subjects/${subjectId}`)
      .set('Authorization', authHeader)
      .send({ departmentIds: [CS_DEPT] })
      .expect(200);

    const { rows: links } = await db.query(
      `SELECT department_id FROM department_subjects WHERE subject_id = ? ORDER BY department_id`,
      [subjectId]
    );
    expect(links.map((l) => l.department_id)).toEqual([CS_DEPT]);
  });

  test('subjects list can be filtered by department', async () => {
    const subjRes = await request(app)
      .post('/api/admin/subjects')
      .set('Authorization', authHeader)
      .send({
        name: 'Filter CS',
        code: 'FCS',
        units: 3,
        curriculumSemester: 1,
        departmentIds: [CS_DEPT]
      })
      .expect(201);

    const listRes = await request(app)
      .get(`/api/admin/subjects?departmentId=${CS_DEPT}`)
      .set('Authorization', authHeader);

    expect(listRes.status).toBe(200);
    expect(listRes.body.some((s) => s.code === 'FCS')).toBe(true);
  });

  test('student subject assignment is blocked when subject not linked to department', async () => {
    const assignRes = await request(app)
      .post(`/api/admin/terms/${DEMO_TERM}/students/student-demo-1/subjects/assign`)
      .set('Authorization', authHeader)
      .send({ subjectIds: ['subj-eng101'] });
    expect(assignRes.status).toBe(400);
  });
});
