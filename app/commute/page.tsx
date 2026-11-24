"use client";

import { useCallback, useEffect, useState } from "react";
import { useHousehold } from "@/lib/store";
import { Card, SectionTitle } from "@/components/ui";
import { EmptyState } from "@/components/EmptyState";
import { rankCommute } from "@/lib/health";
import type { AirSnapshot } from "@/lib/types";

export default function CommutePage() {
  const { profile, ready } = useHousehold();
  const [air, setAir] = useState<AirSnapshot | null>(null);
  const [km, setKm] = useState(8);

  const load = useCallback(async () => {
    if (!profile) return;
    setKm(profile.commuteKm || 8);
    const res = await fetch(
      `/api/air-quality?lat=${profile.latitude}&lon=${profile.longitude}&city=${encodeURIComponent(profile.city)}`,
    );
    if (res.ok) setAir((await res.json()) as AirSnapshot);
  }, [profile]);

  useEffect(() => {
    void load();
  }, [load]);

  if (ready && !profile) return <EmptyState />;

  const pm25 = air?.pollutants.pm2_5 ?? 150;
  const ranked = rankCommute(pm25, km);
  const maxDose = Math.max(...ranked.map((r) => r.doseUg), 1);
  const cleanest = ranked[0];
  const dirtiest = ranked[ranked.length - 1];

  return (
    <div className="flex flex-col gap-6">
      <SectionTitle
        kicker="Commute"
        title="Which way inhales the least smog?"
        description="Same trip, very different doses. We combine your distance, the live PM2.5 and each mode's ventilation and in-cabin exposure."
      />

      <Card>
        <label className="label" htmlFor="km">
          Trip distance (one way): {km} km
        </label>
        <input id="km" type="range" min={1} max={40} value={km} className="w-full"
          onChange={(e) => setKm(Number(e.target.value))} />
        <p className="mt-2 text-sm text-white/55">
          Live ambient PM2.5: <strong>{Math.round(pm25)} µg/m³</strong>
          {air ? ` · ${air.city}` : ""}
        </p>
      </Card>

      {cleanest && dirtiest && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="border-aqi-good/40">
            <p className="text-sm font-semibold uppercase tracking-wide text-aqi-good">Cleanest</p>
            <p className="mt-1 text-xl font-bold">
              {cleanest.emoji} {cleanest.label}
            </p>
            <p className="text-sm text-white/60">
              ~{cleanest.cigarettes} 🚬 over {cleanest.minutes} min
            </p>
          </Card>
          <Card className="border-aqi-verypoor/40">
            <p className="text-sm font-semibold uppercase tracking-wide text-aqi-verypoor">Most polluting</p>
            <p className="mt-1 text-xl font-bold">
              {dirtiest.emoji} {dirtiest.label}
            </p>
            <p className="text-sm text-white/60">
              ~{dirtiest.cigarettes} 🚬 over {dirtiest.minutes} min
            </p>
          </Card>
        </div>
      )}

      <Card>
        <h2 className="text-lg font-bold">Inhaled PM2.5 by mode</h2>
        <table className="mt-4 w-full border-collapse text-sm">
          <caption className="sr-only">Inhaled PM2.5 dose and cigarette-equivalents for each commute mode</caption>
          <thead>
            <tr className="text-left text-white/50">
              <th scope="col" className="py-2">Mode</th>
              <th scope="col" className="py-2">Time</th>
              <th scope="col" className="py-2 pr-2 text-right">Dose (µg)</th>
              <th scope="col" className="w-1/2 py-2">Relative</th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((r, i) => (
              <tr key={r.mode} className="border-t border-white/10">
                <th scope="row" className="py-2.5 text-left font-medium">
                  {r.emoji} {r.label}
                  {i === 0 && <span className="pill ml-2 bg-aqi-good/20 text-aqi-good">best</span>}
                </th>
                <td className="py-2.5 text-white/60">{r.minutes}m</td>
                <td className="py-2.5 pr-2 text-right font-semibold">{r.doseUg}</td>
                <td className="py-2.5">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 rounded-full"
                      style={{
                        width: `${Math.max((r.doseUg / maxDose) * 100, 4)}%`,
                        background: i === 0 ? "#4caf50" : i === ranked.length - 1 ? "#e63946" : "#f6d242",
                      }}
                      aria-hidden
                    />
                    <span className="text-xs text-white/60">{r.cigarettes} 🚬</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-xs text-white/45">
          Dose = in-cabin PM2.5 × breathing rate × time. Active modes (walk, cycle) carry extra dose from higher
          ventilation; recirculating cars and the metro cut in-cabin concentration. An illustrative comparison, not
          turn-by-turn routing.
        </p>
      </Card>
    </div>
  );
}
