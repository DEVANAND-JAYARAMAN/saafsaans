# Building SaafSaans: turning smog data into choices families can trust

_PromptWars: Virtual — Challenge 6, Urban Air Quality Assistant. This is the
build narrative that accompanies the code and the live demo._

## The problem I kept coming back to

Every winter, north-Indian cities disappear under a grey ceiling. There is no
shortage of apps that will show you an AQI number. What families actually lack is
the next sentence: *given this number, what should we do today, and does it
actually help?*

That gap — between **information** and **trustworthy action** — became the whole
design brief. The Challenge 6 statement ends with a demanding clause: the app
must *"clearly explain the direct impact of their choices."* I decided to treat
that sentence as the product, not a footnote.

## The core idea: the Breath Ledger

I wanted every recommendation to come with a receipt. Not "avoid outdoor
exercise" but "shifting the 7 AM jog indoors avoids about 1.8 cigarettes' worth
of PM2.5 for your household today." A number you can sanity-check.

That forced an architectural decision early: **the language model is not allowed
to produce the numbers.** LLMs are wonderful narrators and terrible calculators,
and on a health topic a hallucinated figure is worse than no figure. So I split
the system in two:

1. A **deterministic engine** (`lib/health.ts`, `lib/aqi.ts`) computes everything
   quantitative from published science — inhaled-dose physics, a steady-state
   indoor mass-balance model, CPCB AQI breakpoints, the Berkeley Earth cigarette
   anchor.
2. **Gemini narrates** those computed facts for the specific family, with a system
   instruction that forbids inventing or altering any number.

I call this "grounded generation." The payoff: the user sees the same impact
figure whether the AI is switched on or off. The AI makes it *warm and personal*;
the engine makes it *true*.

## Intent-driven, prompt-by-prompt

PromptWars is about building by expressing intent, so I worked in deliberate
layers rather than one giant prompt:

- **Prompt the science first.** Before any UI, I specified the formulas and their
  citations and had the engine generated as small, pure, testable functions. Pure
  functions are the most AI-friendly code there is — easy to describe, easy to
  verify.
- **Lock behaviour with tests.** I asked for a Vitest suite over the engine
  (breakpoint edges, interpolation, a purifier lowering indoor PM2.5, the
  commute ranking). 19 tests became my safety net for every later change.
- **Then the data layer**, with a hard rule: label provenance honestly and always
  have a fallback. Open-Meteo's CAMS data is free and needs no key, but it is
  *modelled*, so the UI never pretends it is a roadside sensor.
- **Then the GenAI route**, designed around a strict JSON response schema so the
  output is structured and safe to render.
- **Finally the UI**, one route at a time: dashboard, plan, indoor, commute,
  community — each reading a local-only household profile.

The most useful prompting lesson: **constrain the model's job.** "Narrate these
exact facts for this family, never change a number" produced dramatically more
reliable output than "give air-quality advice."

## Decisions I'm glad I made

- **Single Next.js stack over a split front/back end.** One deployable unit, one
  `vercel` import, server route handlers that keep the API key off the client.
  Less to break at 2 AM.
- **No database.** The household profile lives in `localStorage`. For a family
  health tool, "we store nothing" is a feature, and it removed an entire class of
  security and privacy work.
- **A deterministic fallback for the AI.** During judging, demos fail on stage
  when an API key or network hiccups. SaafSaans degrades to a templated plan with
  identical numbers, so it is impossible for the demo to show a blank screen.

## The hard parts

- **Being honest about data without gutting the experience.** Hourly modelled
  values are not regulatory AQI. The fix was labels, not silence — and a clearly
  marked severe-winter demo scenario for offline use.
- **Making impact numbers intuitive.** Micrograms mean nothing to a parent.
  Cigarette-equivalents — grounded in the Berkeley Earth work — turned the abstract
  into the visceral.
- **Accessibility of a data app.** A pretty gauge is useless to a screen reader, so
  the SVG carries a full text alternative and the commute chart is a real table.

## What I'd build next

Per-IP rate limiting at the edge, a shared community backend (the current
neighbourhood total is an illustrative seed), push alerts when AQI crosses a
household's threshold, and OpenAQ ground-station data where a sensor is nearby.

## Try it

- **Live demo:** https://saafsaans-sepia.vercel.app
- **Code:** https://github.com/DEVANAND-JAYARAMAN/saafsaans
- Run `npm run verify` to see the typecheck, tests and build pass end-to-end.

SaafSaans is a small app with one strong opinion: air-quality advice should come
with its receipts. For families deciding whether the kids can play outside this
evening, that receipt is the whole point.
