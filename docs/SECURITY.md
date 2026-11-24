# Security Architecture

SaafSaans is a small app, but it is built with defense-in-depth appropriate to a
public web service that calls a paid AI API and third-party data providers.

## 1. Secret handling
- `GEMINI_API_KEY` is read **only** inside Node route handlers (`/api/plan`). It
  is never imported into a client component, so it never reaches the browser
  bundle. Verify with `grep -r GEMINI_API_KEY app/` → only server routes.
- `.env` is git-ignored; `.env.example` ships with blank values.
- No secret is ever logged.

## 2. Input validation (fail-closed)
- `/api/plan` parses the body with a strict validator (`parseProfile`) that:
  - rejects non-object bodies (422),
  - bounds latitude/longitude to valid ranges,
  - whitelists `commuteMode`, `cookingFuel` and `persona` against known enums,
  - clamps every numeric field to a sane range,
  - caps the member array at 10 and string lengths (names 40, city 80 chars).
- `/api/air-quality` validates coordinate ranges before any outbound fetch.
- `/api/geocode` enforces a minimum query length and caps input length.

## 3. Request-size bound
- `/api/plan` rejects bodies larger than **12 KB** (413) before JSON parsing, to
  blunt oversized-payload abuse.

## 4. HTTP security headers (`next.config.mjs`)
Applied to every route:
- `Content-Security-Policy` restricting `script/style/img/font/connect` sources;
  `connect-src` is allow-listed to the Open-Meteo endpoints only (dev adds the
  HMR websocket + `unsafe-eval` that Next requires locally; production is strict).
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` (HSTS)
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY` + `frame-ancestors 'none'` (clickjacking defence)
- `Cross-Origin-Opener-Policy: same-origin`
- `X-DNS-Prefetch-Control: off`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` disabling camera/mic/payment; geolocation self-only.
- `poweredByHeader: false` removes the `X-Powered-By` fingerprint.

## 4a. Rate limiting (`middleware.ts`)
Edge middleware applies a per-IP fixed-window limiter to every `/api/*` route:
60 requests/minute by default, and a stricter **20/minute for `/api/plan`**
because that path spends Gemini quota. Over-limit requests get `429` with a
`Retry-After` header. The counter is per runtime instance (exact on a single
instance; best-effort on serverless) and would be backed by a shared store
(e.g. Upstash Redis) for a multi-instance production fleet.

## 5. Output safety from the LLM
- Gemini is constrained to a **JSON response schema**; the output is parsed and
  rendered as text (React escapes it). No `dangerouslySetInnerHTML` anywhere.
- On any model error or missing key the route falls back to a deterministic plan,
  so a provider outage cannot break or hang the request.

## 6. Privacy posture
- No database, no accounts, no cookies, no third-party analytics.
- The household profile and pledges live in the browser's `localStorage`; they
  are sent to the server only transiently to compute a plan and are not persisted.

## 7. Dependency hygiene
- Next.js pinned to a patched 15.5.x release (the initial 15.1.6 carried
  CVE-2025-66478 and was upgraded immediately).
- Remaining `npm audit` items are build-time transitive (PostCSS via Next's build
  toolchain) and do not reach the runtime bundle. Re-check with `npm audit`.

## Known residual risks
- The rate limiter's counter is in-memory and per-instance; a multi-instance
  serverless deployment should back it with a shared store (e.g. Upstash Redis)
  for a globally exact limit. Vercel platform protections apply in the meantime.
- A nonce-based CSP would let us drop `'unsafe-inline'` for scripts entirely; it
  is the natural next hardening step.
