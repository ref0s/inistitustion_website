# Repository Guidelines

## Project Structure & Module Organization
- `client/` hosts the Vite + React + TypeScript frontend.
  - `client/src/pages/` contains route-level pages like `Login.tsx` and `StudentDashboard.tsx`.
  - `client/src/components/` holds reusable UI; `client/src/components/ui/` contains shadcn components.
  - `client/src/assets/` stores images, while `client/public/` is for static assets.
- `server/` hosts the Node.js + Express API.
  - `server/index.js` is the entry point; `server/router/` defines routes; `server/controllers/` implements handlers.
  - `server/config/db.js` configures PostgreSQL; `server/migrations/` contains schema scripts.

## Build, Test, and Development Commands
Frontend (from `client/`):
- `npm run dev` starts the Vite dev server (default `http://localhost:5173`).
- `npm run build` creates a production build.
- `npm run build:dev` builds with development mode enabled.
- `npm run preview` serves the production build locally.
- `npm run lint` runs ESLint on the frontend.

Backend (from `server/`):
- `npm start` runs the API using nodemon.
- `npm test` is a placeholder and currently exits with an error.

## Coding Style & Naming Conventions
- Use 2-space indentation for JS/TS and keep lines compact.
- Components and pages use PascalCase (e.g., `Header.tsx`, `StudentDashboard.tsx`).
- Hooks follow `use-*.ts(x)` and live in `client/src/hooks/` (e.g., `use-mobile.tsx`).
- Linting is configured for the client via `client/eslint.config.js`; the server has no lint step.

## Testing Guidelines
- No automated test framework is configured yet.
- If you add tests, prefer `*.test.tsx` in `client/src/` and `*.test.js` in `server/`, and wire a test script in the relevant `package.json`.

## Commit & Pull Request Guidelines
- Commit history is free-form; use short, imperative messages (e.g., `update README`, `add admin form`).
- PRs should include a brief summary, relevant issue links, and screenshots for UI changes.
- Note any database schema changes and include updated migration scripts when applicable.

## Security & Configuration Tips
- Keep secrets in `server/.env`; do not commit credentials.
- Ensure `PORT` and DB settings are set before running the server.
