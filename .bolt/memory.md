# Project memory

## Product intent & audience

- Project name: **Drip**.
- Built for a class; code must be explainable line by line (vanilla, no abstractions).
- Exact product purpose still unconfirmed; previous signal said "not a finance app" and mentioned "a final" (possibly exam/quiz, final project, or app name — unresolved).

## Brand personality & voice

- Not yet inferred; awaiting confirmation of app direction.

## Visual design & UX direction

- UI elements mentioned: tabs, forms, tables.
- Includes light/dark theme toggle.
- Mobile-first responsive layout.
- All styling hand-written in `style.css` (no Tailwind in the actual app).

## Decisions, constraints & rationale

- Tech stack: **vanilla HTML/CSS/JavaScript** — not React, not Tailwind, no UI frameworks.
- Vite used only as dev server/bundler (`npm run build`); not present in final app code.
- Files: `index.html` (structure), `style.css` (styling/themes/responsive), `data.js` (save/load data), `app.js` (interactivity), `tests.js` (console self-checks).
- Data persistence via `data.js` (likely localStorage); no backend/DB.
- No auth model discussed.
- Note: `.bolt/prompt` describes JSX/Tailwind/React defaults, but the actual Drip project is vanilla JS — treat prompt as template defaults, not project facts.

## Open questions & assumptions

- What does "a final" refer to, and what is Drip's exact purpose?
- What should users be able to do in the app?
- Target platforms: web-only or mobile-responsive expected? (mobile-first already implemented)
- Auth model not yet discussed.