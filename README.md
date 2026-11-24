# 🌬️ SaafSaans — Clean breath for every family

> **Hack2skill × Google for Developers · PromptWars: Virtual — Challenge 6: Urban Air Quality Assistant**

SaafSaans ("clean breath" in Hindi) is a GenAI air-quality companion that helps
families and communities navigate severe winter smog. It suggests **low-emission
daily routines, indoor-air hacks, and sustainable alternatives** tuned to each
household's **location and lifestyle** — and, crucially, it **shows the direct
impact of every choice** in numbers you can check: micrograms of PM2.5 avoided
and cigarette-equivalents.

**🔗 Live demo:** https://saafsaans-sepia.vercel.app
**💻 Code:** https://github.com/DEVANAND-JAYARAMAN/saafsaans
**Tech:** Next.js 15 (App Router) · TypeScript (strict) · Tailwind CSS · Google Gemini · Open-Meteo (Copernicus CAMS)

---

## The idea in one line

> Most air-quality apps tell you *what the AQI is*. SaafSaans tells you *what to
> do about it* — and proves the payoff of each action with transparent maths,
> so advice is never hand-wavy.

## The signature feature: the Breath Ledger

Every recommendation is converted into a grounded figure by a **deterministic
health-exposure engine** (`lib/health.ts`), never invented by the language model:

```
inhaled dose (µg) = concentration (µg/m³) × breathing rate (m³/h) × time (h)
cigarette-equivalent = inhaled dose ÷ 440 µg      (Berkeley Earth anchor)
indoor PM2.5 = outdoor × (P·a) / (a + k + CADR/Volume)   (mass-balance model)
```

The GenAI layer (Gemini) then **narrates** those exact numbers for your specific
family. This "grounded generation" pattern is what lets us honestly claim to
*clearly explain the direct impact of a user's choices* — the exact wording of
the Challenge 6 problem statement.

## What's inside

| Route | What it does |
| --- | --- |
| `/` | Landing page — the mission and the Breath Ledger concept |
| `/setup` | Household onboarding: location (geocode/GPS), family personas, lifestyle |
| `/dashboard` | Live CPCB AQI, pollutant breakdown, who's most at risk, today's Breath Ledger |
| `/plan` | **GenAI daily routine** — time-blocked, persona-aware, every impact computed |
| `/indoor` | Purifier sizing (mass-balance physics), DIY Corsi-Rosenthal guide, ventilation timing |
| `/commute` | Inhaled-dose comparison across walk / cycle / auto / bus / metro / car |
| `/community` | Pledges with avoided-emission maths and a collective tally |

## Architecture

```
Browser (Next.js client components, localStorage profile — zero server storage)
        │  fetch
        ▼
Next.js Route Handlers (server)
  /api/air-quality   → Open-Meteo CAMS (cached 10 min)      [no key]
  /api/geocode       → Open-Meteo geocoding (cached 24 h)   [no key]
  /api/plan          → validate → engine → Gemini narrate   [GEMINI_API_KEY]
        │
        ▼
lib/  aqi.ts (CPCB NAQI)  health.ts (dose/indoor/commute)  community.ts
      airquality.ts (providers + demo fallback)  gemini.ts (grounded generation)
```

- **Secrets stay server-side.** The Gemini key is only ever read in a Node route
  handler; it never reaches the browser bundle.
- **Always usable.** No Gemini key? The app serves a transparent deterministic
  plan with identical numbers. No network? A clearly-labelled demo scenario.
- **Privacy by default.** The household profile lives in `localStorage`; there is
  no database and no account.

## Run it locally

```bash
npm install
cp .env.example .env     # optional — add a free Gemini key to enable AI narration
npm run dev              # http://localhost:3000
```

Get a free Gemini key at <https://aistudio.google.com/apikey>. Air + geocoding
need **no key** (Open-Meteo is free).

### Quality gates

```bash
npm run format:check # Prettier — consistent formatting
npm run lint         # ESLint (flat config): next/core-web-vitals + next/typescript
npm run typecheck    # tsc --noEmit, strict
npm run test:run     # Vitest unit suite (engine)
npm run build        # production build (lint enforced)
npm run verify       # all of the above in sequence
```

The same gate runs in CI on every push via `.github/workflows/ci.yml`.

## Deploy (Vercel, ~2 minutes)

1. Push this repo to GitHub.
2. Import it at <https://vercel.com/new> (framework auto-detected as Next.js).
3. Add one environment variable: `GEMINI_API_KEY` (optional but recommended).
4. Deploy. That's it — Open-Meteo needs no configuration.

## Evaluation evidence

This project was built against the six PromptWars evaluation parameters. See the
dedicated docs:

- [`docs/PROBLEM_ALIGNMENT.md`](docs/PROBLEM_ALIGNMENT.md) — requirement traceability
- [`docs/METHODOLOGY.md`](docs/METHODOLOGY.md) — every formula + citation
- [`docs/CODE_QUALITY.md`](docs/CODE_QUALITY.md) — tooling, strictness, CI gate
- [`docs/SECURITY.md`](docs/SECURITY.md) — defense-in-depth measures
- [`docs/ACCESSIBILITY.md`](docs/ACCESSIBILITY.md) — WCAG 2.2 AA notes
- [`BLOG.md`](BLOG.md) — the build narrative (dual-submission)

## Honesty & limitations

- Open-Meteo returns **modelled** hourly concentrations, shown as **indicative**
  CPCB AQI estimates — not roadside regulatory measurements. This is labelled in
  the UI everywhere a reading appears.
- The indoor, commute and cigarette-equivalent figures are **physically-grounded
  estimates** using published factors, not personal medical measurements.
- **Not medical advice.** In a health emergency, follow a doctor and official
  government advisories.

## Licence

MIT — see [`LICENSE`](LICENSE).
