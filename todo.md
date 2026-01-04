# TODO — Add Departments + Department Assignments (Incremental Upgrade)

> Context: The system is already refactored (SQLite + admin Basic Auth API + full admin UI + Jest/Supertest tests).
> Goal: Add **Departments** and wire them through Students + Subjects + Assignments, without expanding scope beyond what is defined here.

## Non-negotiable rules
- Keep existing functionality working (terms, registrations, offerings, student_subjects, timetable, periods).
- Admin auth remains **HTTP Basic Auth** (admin/admin). No JWT/sessions/cookies.
- Use transactions for multi-row writes and keep operations idempotent.
- Do NOT add new major domains (no instructors, no student portal expansion).
- Prefer safety: prevent destructive deletes when referenced.

---

## Decisions (implement exactly)
- Departments:
  - `code` is REQUIRED and UNIQUE.
  - `name` is not required to be unique.
  - `isActive` field exists (toggle in UI).
- Students:
  - Every student MUST belong to exactly ONE department (required FK).
  - Only admin can assign/change a student’s department (already admin-only system).
- Subjects:
  - A subject MUST belong to **one or more** departments (no “general” subjects).
  - A subject MAY belong to multiple departments (many-to-many).
  - Subject form must allow selecting **multiple departments** (multi-select, min 1).
- Offerings / Timetable:
  - Term offerings remain **not restricted by department** (keep current behavior).
  - Timetable remains **term-wide**, not department-based (keep current behavior).
- Student subject assignment restriction:
  - When assigning subject(s) to a student within a term, the subject MUST be linked to the student’s department.
  - (Existing validations still apply: student registered in term + subject offered in term.)
- Deletion:
  - Prevent deleting a department if referenced by any student or any subject link (return 409 with clear message).
  - Do not implement archive-as-delete here unless already present; just enforce safe delete prevention.

---

## Backend — DB Schema + Migration (SQLite)
### 1) Schema additions
- [ ] Add `departments` table:
  - `id` (PK), `name`, `code` (UNIQUE, NOT NULL), `is_active` (default true)
- [ ] Add `department_id` column to `students` (FK -> departments.id).
  - This must be REQUIRED in the final state.

- [ ] Add join table `department_subjects` (many-to-many):
  - `department_id` (FK), `subject_id` (FK)
  - UNIQUE(`department_id`, `subject_id`)
  - Indexes on `department_id` and `subject_id`

### 2) Migration strategy (required FK on students)
- [ ] Update migration/init script to:
  - Create departments table
  - Create join table
  - Add `students.department_id` and ensure final schema enforces NOT NULL
- [ ] Handle existing rows safely:
  - Create a default department (e.g., name="General", code="GEN") ONLY for backfill
  - Assign all existing students to this default department
  - Then enforce `students.department_id` as NOT NULL
- [ ] Update seeds/demo data:
  - Add a few sample departments (optional)
  - Ensure seeded subjects are linked to >=1 department via `department_subjects`

---

## Backend — Admin API updates
### 3) Departments CRUD (admin-only, basic auth)
- [ ] Implement endpoints:
  - `GET /admin/departments` (support search + filter active if simple)
  - `POST /admin/departments` (name, code, isActive)
  - `PUT /admin/departments/:id`
  - `DELETE /admin/departments/:id`
- [ ] Delete behavior:
  - If any `students.department_id = :id` OR any row exists in `department_subjects` for this department → return **409 Conflict** with message like `"Department is in use"`.

### 4) Students updates (department required)
- [ ] Update student create endpoint:
  - Require `departmentId` and persist it.
- [ ] Update student update endpoint:
  - Allow changing `departmentId` freely (no restrictions).
- [ ] Update student list endpoint:
  - Include department info (id/name/code) in response.
- [ ] Ensure validation with zod (or existing validation approach).

### 5) Subjects updates (multi-department required)
- [ ] Update subject create endpoint to accept:
  - `departmentIds: string[]` (required, min length 1)
  - On create: transactionally create subject + insert all department links into `department_subjects` (idempotent inserts).
- [ ] Update subject update endpoint:
  - Allow updating subject fields
  - If `departmentIds` present: **replace** the full set of department links (min length 1 enforced):
    - Transaction: delete existing links for subject → insert new ones
- [ ] Update subject list endpoint:
  - Include linked departments (at least id/name/code array).
  - Add filter support: `GET /admin/subjects?departmentId=...` (join via `department_subjects`).

### 6) Student-subject assignment validation (department restriction)
- [ ] Update the existing “assign subject(s) to student(s) within term” endpoint(s) to enforce:
  - Student is registered in term (existing)
  - Subject is offered in term (existing)
  - NEW: Subject is linked to the student’s department via `department_subjects`
- [ ] For bulk payloads:
  - Keep transactional behavior
  - Provide clear error details for failures (at least which subjectId/studentId failed)

---

## Frontend — Admin UI updates
### 7) Departments tab (new)
- [ ] Add “Departments” tab/page:
  - List departments with: name, code, isActive
  - Create/Edit modal/form
  - Delete action
  - Show friendly error if delete fails (409 “in use”)
  - Optional: search and active filter (recommended)

### 8) Students UI (department required)
- [ ] In Students list/table:
  - Display department name (or code) column
  - Add filter by department (dropdown) (required)
- [ ] In Student create/edit form:
  - Department dropdown (REQUIRED)
  - Only admin can set it (system is admin-only; no student UI edits)

### 9) Subjects UI (multi-select departments)
- [ ] In Subject create/edit form:
  - Replace department dropdown with **multi-select** departments (REQUIRED, min 1)
- [ ] In Subjects list/table:
  - Display departments (chips/tags; show first 2–3 + “+N”)
  - Add filter by department (dropdown) (required)
- [ ] Bulk add subjects:
  - Keep it working; optionally allow selecting departmentIds once and applying to all rows (if trivial),
    otherwise require department selection per subject row or apply a single selected set to the batch.

### 10) Student Subjects assignment UI (restrict choices)
- [ ] In the “Assign subjects to student(s) in term” UI:
  - When a student is selected, only show subjects that:
    - are offered in the selected term
    - AND are linked to the student’s department
  - Keep server-side validation regardless (defense in depth)

---

## Testing (Jest + Supertest)
### 11) Add/extend API tests
- [ ] Department CRUD:
  - create/list/update
  - delete blocked (409) when referenced by a student
  - delete blocked (409) when referenced by department_subjects link
- [ ] Student create/update:
  - create fails without departmentId
  - update changes departmentId successfully
- [ ] Subject create/update:
  - create fails if departmentIds empty
  - create creates N department_subjects links
  - update with departmentIds replaces links (old removed, new present)
  - list filter by departmentId works
- [ ] Assignment restriction:
  - assigning subject to student fails if subject not linked to student’s department (even if offered + registered)

---

## Docs
### 12) Update documentation
- [ ] Update README:
  - Explain Departments
  - Student department required
  - Subject belongs to one or more departments (multi-department)
  - Mention new migration/init behavior and seeding/backfill
  - Mention filters in UI (students/subjects by department)

---

## Completion checklist
- [ ] `server` tests pass (`npm test`)
- [ ] `client` build passes (`npm run build`)
- [ ] App runs end-to-end with fresh DB: init/migrate/seed → server start → client dev → admin dashboard usable
- [ ] Departments CRUD works and delete is safely prevented when referenced
- [ ] Student cannot be created without a department
- [ ] Subject cannot be created without at least one department
- [ ] Student-subject assignment respects department restriction
