# Agent Portal

## Cursor Cloud specific instructions

### Overview

This is a self-contained Next.js 15 app (AI-powered "living webpage" with chat agents). No external services or databases required. All state is in-memory.

### Running the app

- `npm run dev` starts the dev server on port 3000 (uses Turbopack).
- The app runs in **mock mode** by default (no `OPENROUTER_API_KEY` needed). Set the key in `.env.local` to enable real LLM responses.
- Admin panel at `/admin` uses HTTP Basic Auth (default password: `admin`, configurable via `ADMIN_PASSWORD` env var).

### Known pre-existing issues

- **ESLint errors**: `FloatingEye.tsx` has 3 `@typescript-eslint/no-explicit-any` errors. These cause `npm run build` to fail at the lint stage even though compilation succeeds. `npm run dev` is unaffected.
- **ESLint warnings**: Multiple `@next/next/no-img-element` warnings and one `react-hooks/exhaustive-deps` warning in `LayoutClient.tsx`.

### Commands reference

| Task | Command |
|------|---------|
| Dev server | `npm run dev` |
| Lint | `npx eslint .` |
| Build | `npm run build` |
| Production | `npm run build && npm start` |

### Gotchas

- Tailwind CSS v4 is used with CSS-based configuration (`@import "tailwindcss"` in `globals.css`). The `@theme inline` block in `globals.css` maps shadcn/ui-style HSL CSS variables to Tailwind theme colors — do not remove it.
- There is no lockfile (`package-lock.json`) committed to the repo, so `npm install` resolves latest compatible versions each time.
