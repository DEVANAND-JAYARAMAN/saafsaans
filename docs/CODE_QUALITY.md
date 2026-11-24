# Code Quality

SaafSaans is built to a production bar, not a demo bar. The quality posture is
enforced by tooling and a CI gate, not by convention alone.

## Enforced gates (run `npm run verify`)

`verify` runs all five in sequence and must pass before any change ships:

1. **Prettier** (`format:check`) — one formatting standard across the repo.
2. **ESLint** (`lint`) — modern flat config extending `next/core-web-vitals`
   and `next/typescript`, with `eslint-config-prettier` to avoid rule conflicts.
   Zero warnings, zero errors.
3. **TypeScript** (`typecheck`) — `tsc --noEmit` in **strict** mode.
4. **Vitest** (`test:run`) — 19 unit/integration tests over the engine.
5. **Next build** (`build`) — production build with linting enforced (no
   `ignoreDuringBuilds` escape hatch).

A GitHub Actions workflow (`.github/workflows/ci.yml`) runs the same gate on
every push and pull request to `main`, on Node 20, with a secretless build to
prove the deterministic fallback path.

## TypeScript strictness

`tsconfig.json` goes beyond `strict`:

- `strict: true`
- `noUncheckedIndexedAccess: true` — array/object access is treated as possibly
  undefined, forcing explicit handling.
- `noUnusedLocals` / `noUnusedParameters` — no dead bindings.
- `noImplicitOverride`, `forceConsistentCasingInFileNames`.
- **Zero `any`.** Untrusted input is parsed through explicit validators.

## Architecture & separation of concerns

- **Pure, framework-free engine** in `lib/` (`aqi.ts`, `health.ts`,
  `community.ts`) — deterministic functions with no I/O, which is why they are
  trivially testable and reused identically on client and server.
- **I/O at the edges** — data providers (`airquality.ts`) and the GenAI layer
  (`gemini.ts`) are isolated; the AI layer only *narrates* engine output.
- **Thin route handlers** (`app/api/*`) do validation + orchestration only.
- **Presentational components** (`components/`) are small and reused.

## Conventions

- Named exports throughout; `@/` path alias for absolute imports.
- Every module carries a header comment stating its responsibility and, for the
  science, its source. See `docs/METHODOLOGY.md` for the formula citations.
- No `console.log` in shipped paths; errors fail closed to the safe fallback.

## Commands

```bash
npm run verify        # the full gate
npm run lint          # eslint .
npm run format        # prettier --write .
npm run typecheck     # tsc --noEmit
npm run test:run      # vitest run
```
