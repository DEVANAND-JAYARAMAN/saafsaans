# Testing & QA

Tests target the parts where correctness is non-negotiable: the deterministic
engine that produces every health number, the trust-boundary validator, and the
always-available fallback path. The language-model call itself is not unit-tested
(it is non-deterministic and external); instead we test the deterministic plan it
falls back to, which uses identical numbers.

## Suites (`npm run test:run`)

| File | Covers |
| --- | --- |
| `tests/aqi.test.ts` | CPCB sub-index breakpoints, linear interpolation, cap at 500, dominant-pollutant selection, category labels |
| `tests/health.test.ts` | Inhaled-dose formula, cigarette anchor, indoor mass-balance (purifier + windows), commute ranking, avoided dose |
| `tests/community.test.ts` | Pledge CO₂/PM2.5 tally, unknown-id handling, tree equivalent |
| `tests/validate.test.ts` | Input validation: rejects bad coords/types, defaults unknown enums, clamps ranges, caps members, truncates names |
| `tests/format.test.ts` | `round`, `fmtMass`, `fmtPercent`, `clamp` |
| `tests/airquality.test.ts` | Offline demo snapshot: honest labels + computed severe-smog AQI |
| `tests/plan.test.ts` | Deterministic plan fallback with no API key: structure, sensitive-member targeting, quantified impact per block |

## How to run

```bash
npm run test:run          # single pass
npm run test              # watch mode
npx vitest run --coverage # coverage report (lib/** instrumented)
```

## Notes on approach

- **Pure functions first.** The engine is side-effect-free, so tests assert exact
  numeric outputs (e.g. 100 µg/m³ at moderate activity for 60 min → 160 µg).
- **Fail-closed validation is tested from the attacker's side** — malformed
  coordinates, wrong types, oversized arrays and unknown enum values.
- **The fallback is a feature, so it is tested.** `tests/plan.test.ts` removes
  `GEMINI_API_KEY` and asserts a complete, grounded plan is still produced with no
  network call — guaranteeing the product never shows a blank screen.
- CI runs the whole suite on every push (`.github/workflows/ci.yml`).
