"use client";

import { useCallback, useEffect, useState } from "react";
import { useHousehold } from "@/lib/store";
import { Card, SectionTitle } from "@/components/ui";
import { EmptyState } from "@/components/EmptyState";
import type { DailyPlan } from "@/lib/gemini";
import type { AirSnapshot } from "@/lib/types";

export default function PlanPage() {
  const { profile, ready } = useHousehold();
  const [plan, setPlan] = useState<DailyPlan | null>(null);
  const [air, setAir] = useState<AirSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generate = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      if (!res.ok) throw new Error("Could not generate a plan right now.");
      const data = (await res.json()) as { plan: DailyPlan; air: AirSnapshot };
      setPlan(data.plan);
      setAir(data.air);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    void generate();
  }, [generate]);

  if (ready && !profile) return <EmptyState />;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <SectionTitle
          kicker="Your day, planned"
          title="GenAI daily routine"
          description="A warm, time-blocked plan for your family — every impact figure is computed by the engine, then narrated by Gemini."
        />
        <button type="button" className="btn-ghost text-sm" onClick={generate} disabled={loading}>
          {loading ? "Thinking…" : "↻ Regenerate"}
        </button>
      </div>

      {error && (
        <Card>
          <p className="text-sm text-red-300">{error}</p>
        </Card>
      )}

      {loading && !plan && (
        <Card>
          <p className="animate-pulse text-white/60">Composing a plan for your household…</p>
        </Card>
      )}

      {plan && (
        <>
          <Card className="border-brand-500/20">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="pill bg-brand-500/15 text-brand-300">
                {plan.engine === "gemini" ? `✨ Gemini (${plan.model})` : "⚙️ Deterministic engine"}
              </span>
              {air && (
                <span className="text-xs text-white/50">
                  {air.city} · AQI {air.aqi.index} ({air.aqi.category})
                </span>
              )}
            </div>
            <p className="mt-3 text-lg font-semibold">{plan.greeting}</p>
            <p className="mt-1 text-white/70">{plan.riskSummary}</p>
            {plan.engine === "deterministic" && (
              <p className="mt-3 rounded-lg bg-black/25 px-3 py-2 text-xs text-white/50">
                Running the transparent fallback engine (no Gemini key set). Numbers are identical —
                only the phrasing is templated. Add a GEMINI_API_KEY to unlock AI narration.
              </p>
            )}
          </Card>

          <ol className="grid gap-4">
            {plan.blocks.map((b, i) => (
              <li key={`${b.period}-${i}`}>
                <Card>
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-sm font-semibold uppercase tracking-wide text-brand-400">
                      {b.period}
                    </p>
                  </div>
                  <h2 className="mt-1 text-lg font-bold">{b.headline}</h2>
                  <p className="mt-1 text-white/80">{b.action}</p>
                  <p className="mt-2 text-sm text-white/55">{b.why}</p>
                  <p className="mt-3 rounded-lg border border-brand-500/20 bg-brand-500/10 px-3 py-2 text-sm text-brand-100">
                    📉 {b.impact}
                  </p>
                </Card>
              </li>
            ))}
          </ol>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <h2 className="text-lg font-bold">🏠 Indoor air hacks</h2>
              <ul className="mt-3 grid gap-2">
                {plan.indoorHacks.map((h, i) => (
                  <li key={i} className="flex gap-2 text-sm text-white/75">
                    <span className="text-brand-400">•</span>
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </Card>
            <Card>
              <h2 className="text-lg font-bold">🌱 Sustainable swaps</h2>
              <ul className="mt-3 grid gap-2">
                {plan.sustainableSwaps.map((h, i) => (
                  <li key={i} className="flex gap-2 text-sm text-white/75">
                    <span className="text-brand-400">•</span>
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          <Card className="text-center">
            <p className="text-white/80">{plan.closing}</p>
          </Card>
        </>
      )}
    </div>
  );
}
