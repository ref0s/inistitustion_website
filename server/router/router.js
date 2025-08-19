const express = require("express");
const router = express.Router();
const {
  addDepartment,
  addSemester,
  addSubject,
  addStudent,
  addEnrollment,
  getStudentData,
  bootStrap
} = require('../controllers/studentController');
router.post('/student-dashboard',getStudentData)
router.post('/departments', addDepartment);
router.post('/semesters', addSemester);
router.post('/subjects', addSubject);
router.post('/students', addStudent);
router.post('/enrollments', addEnrollment);
router.get('/bootstrap', bootStrap);
module.exports = router;
