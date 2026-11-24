# Problem-Statement Alignment

**Challenge 6 — Urban Air Quality Assistant.**

> _"Create a GenAI-powered assistant that helps families and communities navigate
> severe winter smog and urban air pollution. The application should suggest
> low-emission daily routines, indoor air quality hacks, and sustainable
> alternatives tailored to their location and lifestyle, while clearly explaining
> the direct impact of their choices."_

Every clause of that statement maps to a shipped feature and the code that backs
it. Nothing on this list is a mock-up.

## Requirements traceability matrix

| ID | Requirement (from the prompt) | Where it lives | Evidence |
| --- | --- | --- | --- |
| REQ-01 | GenAI-powered | `lib/gemini.ts`, `/api/plan` | Google Gemini via `@google/genai`, structured JSON output |
| REQ-02 | Helps **families** | `lib/personas.ts`, `/setup` | 10 vulnerability personas; plan addresses members by name |
| REQ-03 | Helps **communities** | `/community`, `lib/community.ts` | Pledges + collective avoided-emission tally |
| REQ-04 | **Severe winter smog** focus | `lib/airquality.ts` demo, copy throughout | Winter-inversion guidance; severe-day demo scenario |
| REQ-05 | Navigate **urban air pollution** | `/dashboard`, `lib/aqi.ts` | Live CPCB AQI + full pollutant breakdown |
| REQ-06 | **Low-emission daily routines** | `/plan` | Time-blocked morning→night plan, persona-aware |
| REQ-07 | **Indoor air quality hacks** | `/indoor`, `indoorPm25()` | Purifier sizing, DIY box filter, ventilation timing |
| REQ-08 | **Sustainable alternatives** | `/plan` swaps, `/community` | Fuel switches, metro/car-pool, no-burn pledges |
| REQ-09 | Tailored to **location** | `/setup`, `/api/geocode` | City geocoding + GPS → live local readings |
| REQ-10 | Tailored to **lifestyle** | `/setup` | Commute, cooking fuel, room size, purifier, activity |
| REQ-11 | **Clearly explain direct impact** | `lib/health.ts`, Breath Ledger | Every action → µg PM2.5 + cigarette-equivalents |
| REQ-12 | Trustworthy / non-misleading | provenance labels, deterministic engine | GenAI narrates verified numbers; honest data labels |

## How REQ-11 is satisfied uniquely

The phrase *"clearly explaining the direct impact of their choices"* is the
hardest and most differentiating requirement. Our answer is the **Breath Ledger**:

- The **engine computes** the impact of each choice (shift a jog indoors, take the
  metro, run a purifier) as inhaled PM2.5 and cigarette-equivalents.
- The **model may only narrate** those numbers — it is explicitly forbidden to
  invent or alter them (see the system instruction in `lib/gemini.ts`).
- The user sees the *same* number whether Gemini is on or off, so the impact
  claim is verifiable, not persuasive fiction.

## Scope boundaries (stated honestly)

- Air data is modelled (Open-Meteo CAMS), labelled indicative, not regulatory.
- Commute comparison is an exposure estimate, not turn-by-turn routing.
- The community total includes an illustrative neighbourhood seed, clearly marked;
  user pledges are stored locally only.
