const express = require("express");
const router = express.Router();
const {
  addDepartment,
  addSemester,
  addSubject,
  addStudent,
  addEnrollment,
  getSchedule,
  addScheduleEntry,
  updateScheduleEntry,
  deleteScheduleEntry,
  getStudents,
  getStudentData,
  bootStrap
} = require('../controllers/studentController');
router.post('/student-dashboard',getStudentData)
router.get('/schedule', getSchedule);
router.post('/schedule', addScheduleEntry);
router.put('/schedule/:id', updateScheduleEntry);
router.delete('/schedule/:id', deleteScheduleEntry);
router.get('/students', getStudents);
router.post('/departments', addDepartment);
router.post('/semesters', addSemester);
router.post('/subjects', addSubject);
router.post('/students', addStudent);
router.post('/enrollments', addEnrollment);
router.get('/bootstrap', bootStrap);
module.exports = router;
