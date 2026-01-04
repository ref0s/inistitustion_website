class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const mapDbError = (err) => {
  if (!err || !err.message) return null;
  const msg = err.message;

  if (msg.includes('TERM_DATES_OVERLAP')) {
    return new HttpError(400, 'Term dates cannot overlap with existing terms.');
  }
  if (msg.includes('idx_terms_active')) {
    return new HttpError(400, 'Only one term can be active at a time.');
  }
  if (msg.includes('UNIQUE constraint failed: subjects.code')) {
    return new HttpError(409, 'Subject code must be unique.');
  }
  if (msg.includes('UNIQUE constraint failed: students.registration_id')) {
    return new HttpError(409, 'Registration ID must be unique.');
  }
  if (msg.includes('UNIQUE constraint failed: students.email')) {
    return new HttpError(409, 'Email must be unique.');
  }
  if (msg.includes('UNIQUE constraint failed: term_subjects.term_id, term_subjects.subject_id')) {
    return new HttpError(409, 'Subject is already offered in this term.');
  }
  if (msg.includes('UNIQUE constraint failed: registrations.term_id, registrations.student_id')) {
    return new HttpError(409, 'Student is already registered for this term.');
  }
  if (msg.includes('UNIQUE constraint failed: timetable_entries.term_id, timetable_entries.day_of_week, timetable_entries.period_id, timetable_entries.subject_id')) {
    return new HttpError(409, 'Subject already scheduled for this day/period in this term.');
  }

  return null;
};

module.exports = { HttpError, asyncHandler, mapDbError };
