"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, SectionTitle, Stat } from "@/components/ui";
import { PLEDGES, tallyPledges } from "@/lib/community";
import { clsx } from "clsx";

const KEY = "saafsaans.pledges.v1";

// Illustrative neighbourhood baseline so the collective total feels alive in the
// demo. Clearly labelled as illustrative — no shared backend is claimed.
const NEIGHBOURHOOD_SEED = { co2Kg: 1840, families: 126 };

export default function CommunityPage() {
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setSelected(JSON.parse(raw) as string[]);
    } catch {
      /* ignore */
    }
  }, []);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id];
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }

  const tally = useMemo(() => tallyPledges(selected), [selected]);
  const neighbourhoodTotal = NEIGHBOURHOOD_SEED.co2Kg + tally.co2Kg;

  return (
    <div className="flex flex-col gap-6">
      <SectionTitle
        kicker="Community"
        title="Clean air is a team sport"
        description="Your room protects your family; your pledges clean the airshed everyone shares. Pick what you'll commit to and watch the avoided emissions add up."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Your weekly CO₂ avoided" value={`${tally.co2Kg} kg`} accent="#6ee7b7" />
        <Stat label="Your weekly PM2.5 avoided" value={`${tally.pm25Grams} g`} />
        <Stat
          label="≈ Trees working for you"
          value={tally.treeEquivalent}
          sub="per week equivalent"
          accent="#6ee7b7"
        />
      </div>

      <Card>
        <h2 className="text-lg font-bold">Pick your pledges</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {PLEDGES.map((p) => {
            const on = selected.includes(p.id);
            return (
              <li key={p.id}>
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle(p.id)}
                  className={clsx(
                    "w-full rounded-xl border p-4 text-left transition",
                    on
                      ? "border-brand-400/60 bg-brand-500/10"
                      : "border-white/10 bg-black/20 hover:border-white/25",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold">
                      <span aria-hidden>{p.emoji}</span> {p.title}
                    </span>
                    <span
                      className={clsx(
                        "pill",
                        on ? "bg-brand-500/20 text-brand-200" : "bg-white/10 text-white/50",
                      )}
                    >
                      {on ? "Pledged ✓" : "Add"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-white/60">{p.detail}</p>
                  {(p.co2KgPerWeek > 0 || p.pm25GramsPerWeek > 0) && (
                    <p className="mt-2 text-xs text-brand-300">
                      −{p.co2KgPerWeek} kg CO₂ · −{p.pm25GramsPerWeek} g PM2.5 / week
                    </p>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </Card>

      <Card className="border-brand-500/20">
        <h2 className="text-lg font-bold">Neighbourhood impact</h2>
        <p className="mt-1 text-sm text-white/60">
          {NEIGHBOURHOOD_SEED.families} families on this illustrative street have pledged together.
        </p>
        <p className="mt-3 text-3xl font-extrabold text-brand-300">
          {neighbourhoodTotal.toLocaleString()} kg CO₂ / week
        </p>
        <p className="mt-1 text-sm text-white/55">
          avoided collectively — your pledges add {tally.co2Kg} kg to the total.
        </p>
        <p className="mt-3 text-xs text-white/40">
          Neighbourhood figure is an illustrative demo seed; pledges you pick are stored privately
          on your device.
        </p>
      </Card>
    </div>
  );
}
