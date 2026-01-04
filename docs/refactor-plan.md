# Refactor Plan — Institution Management System

## Current Stack Summary
- Frontend: Vite + React + TypeScript with shadcn UI, React Router, TanStack Query. Auth is client-side only (localStorage flags). Pages: login, student dashboard, admin data entry.
- Backend: Express 5 with a thin SQLite wrapper, no auth. Routes handle departments, semesters, subjects, students, enrollments, and subject schedule. No validation, limited error handling.
- Database: SQLite via custom queries. Tables: departments, semesters, subjects, subject_schedule (3 fixed time slots), students, enrollments. Migrations are manual JS scripts.

## Keep vs Replace
- Keep: Vite/React stack, Express server, SQLite database choice, general shadcn styling baseline.
- Replace/Redesign: Database schema (align to terms/registrations/offerings/timetable), backend routing/validation/auth, admin UI flows (students/terms/registration/subjects/offerings/timetable), seed data, and add automated tests.

## Risks / Unknowns
- No existing automated tests; need to choose and wire a test runner for backend (likely Vitest/Jest with supertest).
- SQLite concurrency constraints when toggling active terms and enforcing date overlaps—must guard at application and database levels.
- Basic Auth storage on the client must avoid leaking into student flows; ensure clear separation of admin vs student state.
- Migration of legacy data is unspecified; proceed with fresh schema and optional demo seed. Document any assumptions.

## Milestones & Checkpoints
1) Schema & Migrations: Design normalized schema per spec (students, terms, subjects, registrations, term_subjects, student_subjects, sections, periods, timetable_entries) with constraints (overlap checks, uniqueness, active term rule). Add seeds (periods + optional demo data).
2) Backend Core: Implement Basic Auth middleware (admin/admin), validation layer, standardized errors. Build CRUD/bulk routes for students, terms (toggle/archive), registrations, subjects (CRUD + bulk), term offerings, student subjects, timetable with transactional/idempotent guarantees.
3) Admin UI: Admin login storing Basic Auth credentials; pages for students, terms, registrations, subjects, term offerings, and timetable grid (3 periods, Sat–Thu). Include search, bulk actions, and clear error handling.
4) Tests: Add backend tests for auth guard, students CRUD, registration counter/idempotency, term overlap, and timetable uniqueness.
5) Polish & Docs: Update README with setup, migrate/seed, dev/test commands, admin credentials; clean dead code/routes/models; ensure lint/build/test pass.
