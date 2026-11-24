import Link from "next/link";
import { Card } from "@/components/ui";

const FEATURES = [
  {
    icon: "📊",
    title: "Live CPCB air quality",
    body: "Real-time AQI and pollutant breakdown for your exact location, from Copernicus CAMS — with honest provenance labels.",
  },
  {
    icon: "🧮",
    title: "The Breath Ledger",
    body: "Every suggestion is converted into grounded numbers: µg of PM2.5 avoided and cigarette-equivalents — computed, never guessed.",
  },
  {
    icon: "🤖",
    title: "GenAI daily plan",
    body: "Gemini writes a warm, time-blocked routine tailored to your family — narrating the verified numbers, never inventing them.",
  },
  {
    icon: "🏠",
    title: "Indoor air hacks",
    body: "Right-size a purifier, build a ₹2,000 DIY box filter, and time your ventilation with the real indoor-aerosol physics.",
  },
  {
    icon: "🚌",
    title: "Commute exposure compare",
    body: "See which way to travel inhales the least smog for your trip — walk, auto, metro or a recirculating car.",
  },
  {
    icon: "🤝",
    title: "Community action",
    body: "Pledge cleaner choices and watch your neighbourhood's avoided emissions add up. The airshed is a team sport.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col gap-16">
      <section className="grid items-center gap-8 pt-6 md:grid-cols-2 md:pt-12">
        <div>
          <p className="pill bg-brand-500/15 text-brand-300">
            Winter smog, handled — for the whole family
          </p>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight md:text-5xl">
            Clean breath for <span className="text-brand-400">every family.</span>
          </h1>
          <p className="mt-4 max-w-xl text-lg text-white/70">
            SaafSaans turns severe winter-smog data into calm, personalized action — and shows you
            the <strong className="text-white">exact impact of every choice</strong>, measured in
            PM2.5 avoided and cigarettes-not-smoked.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/setup" className="btn-primary text-base">
              Set up my household →
            </Link>
            <Link href="/dashboard" className="btn-ghost text-base">
              See live air quality
            </Link>
          </div>
          <p className="mt-4 text-sm text-white/45">
            No sign-up. No tracking. Runs free on live Copernicus data + Google Gemini.
          </p>
        </div>

        <Card className="md:justify-self-end md:p-7">
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-400">
            The Breath Ledger
          </p>
          <h2 className="mt-1 text-xl font-bold">What one smog-smart day saves</h2>
          <dl className="mt-5 grid gap-3">
            {[
              ["Shift the 7 AM jog indoors", "−1.8 🚬"],
              ["Take the metro, not the open auto", "−0.9 🚬"],
              ["Run a right-sized purifier at night", "−2.4 🚬"],
              ["Swap incense for the kitchen exhaust", "−0.6 🚬"],
            ].map(([k, v]) => (
              <div
                key={k}
                className="flex items-center justify-between rounded-xl bg-black/25 px-4 py-3"
              >
                <dt className="text-sm text-white/75">{k}</dt>
                <dd className="font-bold text-brand-300">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 rounded-xl border border-brand-500/20 bg-brand-500/10 px-4 py-3 text-sm">
            <strong className="text-brand-200">≈ 5.7 cigarettes</strong> of PM2.5 avoided for the
            household today.
            <span className="block text-white/50">
              Illustrative — your real numbers come from live data.
            </span>
          </p>
        </Card>
      </section>

      <section>
        <h2 className="text-2xl font-bold md:text-3xl">
          Everything a household needs to breathe safer
        </h2>
        <p className="mt-2 max-w-2xl text-white/60">
          Six tools, one promise: no vague advice. Every recommendation is tied to a transparent
          number you can check.
        </p>
        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <Card key={f.title}>
              <div className="text-2xl" aria-hidden>
                {f.icon}
              </div>
              <h3 className="mt-3 text-lg font-bold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-white/65">{f.body}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-[1.2fr_1fr]">
        <Card className="md:p-7">
          <h2 className="text-2xl font-bold">How it stays honest</h2>
          <ol className="mt-4 grid gap-4">
            {[
              [
                "Measure",
                "We pull live, modelled air quality and compute the CPCB National AQI, labelling provenance clearly.",
              ],
              [
                "Compute",
                "A deterministic engine turns concentration + breathing rate + time into inhaled dose and cigarette-equivalents.",
              ],
              [
                "Narrate",
                "Gemini personalizes the plan for your family using those exact numbers — it is forbidden to invent figures.",
              ],
              [
                "Act",
                "You see the direct impact of each choice, then log it to your Breath Ledger and community total.",
              ],
            ].map(([t, d], i) => (
              <li key={t} className="flex gap-4">
                <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-brand-500 font-bold text-ink">
                  {i + 1}
                </span>
                <div>
                  <p className="font-semibold">{t}</p>
                  <p className="text-sm text-white/60">{d}</p>
                </div>
              </li>
            ))}
          </ol>
        </Card>
        <Card className="flex flex-col justify-center gap-4 md:p-7">
          <h2 className="text-xl font-bold">Built for Challenge 6</h2>
          <p className="text-sm text-white/65">
            Urban Air Quality Assistant — low-emission routines, indoor-air hacks and sustainable
            alternatives tuned to your location and lifestyle, with the direct impact of every
            choice made explicit.
          </p>
          <Link href="/setup" className="btn-primary">
            Start now →
          </Link>
        </Card>
      </section>
    </div>
  );
}
