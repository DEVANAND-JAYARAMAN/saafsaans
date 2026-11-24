"use client";

import { useCallback, useEffect, useState } from "react";
import { useHousehold } from "@/lib/store";
import { Card, SectionTitle, Stat } from "@/components/ui";
import { EmptyState } from "@/components/EmptyState";
import { indoorPm25 } from "@/lib/health";
import { fmtPercent } from "@/lib/format";
import type { AirSnapshot } from "@/lib/types";

export default function IndoorPage() {
  const { profile, ready } = useHousehold();
  const [air, setAir] = useState<AirSnapshot | null>(null);
  const [area, setArea] = useState(14);
  const [height, setHeight] = useState(3);
  const [cadr, setCadr] = useState(0);
  const [windowsOpen, setWindowsOpen] = useState(false);

  const load = useCallback(async () => {
    if (!profile) return;
    setArea(profile.roomAreaSqm);
    setHeight(profile.roomHeightM);
    setCadr(profile.purifierCadr);
    const res = await fetch(
      `/api/air-quality?lat=${profile.latitude}&lon=${profile.longitude}&city=${encodeURIComponent(profile.city)}`,
    );
    if (res.ok) setAir((await res.json()) as AirSnapshot);
  }, [profile]);

  useEffect(() => {
    void load();
  }, [load]);

  if (ready && !profile) return <EmptyState />;

  const outdoor = air?.pollutants.pm2_5 ?? 150;
  const volume = Math.max(area * height, 1);
  const model = indoorPm25({
    outdoorPm25: outdoor,
    roomVolumeM3: volume,
    purifierCadr: cadr,
    windowsOpen,
  });
  const ventilationGood = (air?.aqi.index ?? 400) <= 100;

  return (
    <div className="flex flex-col gap-6">
      <SectionTitle
        kicker="Indoor air"
        title="Make one room a clean-air refuge"
        description="Indoor PM2.5 follows physics, not marketing. Size a purifier for your room, or build one for ₹2,000, and see the result instantly."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <Card>
          <h2 className="text-lg font-bold">Your room</h2>
          <div className="mt-4 grid gap-4">
            <div>
              <label className="label" htmlFor="area">
                Floor area: {area} m²
              </label>
              <input
                id="area"
                type="range"
                min={4}
                max={60}
                value={area}
                className="w-full"
                onChange={(e) => setArea(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="label" htmlFor="height">
                Ceiling height: {height} m
              </label>
              <input
                id="height"
                type="range"
                min={2}
                max={5}
                step={0.5}
                value={height}
                className="w-full"
                onChange={(e) => setHeight(Number(e.target.value))}
              />
            </div>
            <div>
              <label className="label" htmlFor="cadr">
                Purifier clean-air rate (CADR): {cadr} m³/h
              </label>
              <input
                id="cadr"
                type="range"
                min={0}
                max={600}
                step={10}
                value={cadr}
                className="w-full"
                onChange={(e) => setCadr(Number(e.target.value))}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={windowsOpen}
                onChange={(e) => setWindowsOpen(e.target.checked)}
              />
              Windows open (ventilating)
            </label>
          </div>
          <button
            type="button"
            className="btn-ghost mt-4 text-sm"
            onClick={() => setCadr(model.recommendedCadr)}
          >
            Auto-size for clean air (5 ACH) → {model.recommendedCadr} m³/h
          </button>
        </Card>

        <div className="grid content-start gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Stat
              label="Outdoor PM2.5"
              value={Math.round(outdoor)}
              sub="µg/m³ (live)"
              accent={air?.aqi.color}
            />
            <Stat
              label="Indoor PM2.5"
              value={model.indoorPm25}
              sub="µg/m³ (modelled)"
              accent="#6ee7b7"
            />
            <Stat label="Reduction vs outdoor" value={fmtPercent(model.reductionFraction)} />
            <Stat
              label="Clean-air changes/hour"
              value={model.achFromPurifier}
              sub="from the purifier"
            />
          </div>
          <Card className="border-white/10">
            <p className="text-sm text-white/60">
              Steady-state mass-balance model: indoor PM2.5 = outdoor × (P·a) / (a + k +
              CADR/Volume), with penetration P, infiltration a and deposition k for a typical
              dwelling. Close windows when the outdoor AQI is Poor or worse — ventilating then{" "}
              {windowsOpen ? "is raising" : "would raise"} your indoor dose.
            </p>
          </Card>
        </div>
      </div>

      <Card className={ventilationGood ? "border-aqi-good/40" : "border-aqi-poor/40"}>
        <h2 className="text-lg font-bold">Ventilation timing</h2>
        <p className="mt-2 text-white/75">
          {ventilationGood
            ? "✅ Outdoor air is currently clean enough — open windows now to flush indoor pollutants (cooking, CO₂)."
            : "⛔ Keep windows shut. Outdoor AQI is Poor or worse; ventilating now pulls smog straight into your home."}
        </p>
      </Card>

      <Card>
        <h2 className="text-lg font-bold">🛠️ DIY Corsi-Rosenthal box filter (~₹2,000)</h2>
        <p className="mt-1 text-sm text-white/60">
          A box fan + four MERV-13/HEPA-grade filters taped into a cube. Community testing shows a
          CADR comparable to purifiers costing many times more.
        </p>
        <ol className="mt-4 grid gap-2 text-sm text-white/75">
          {[
            "Buy a 50 cm box fan and four high-grade pleated filters (MERV-13 or HEPA-type).",
            "Tape the four filters into an open cube, arrows pointing inward (airflow direction matters).",
            "Seat the fan on top blowing upward/outward and seal every edge with tape.",
            "Add a cardboard shroud on the fan outlet to boost airflow efficiency.",
            `Run it in your smallest occupied room — aim for the ${model.recommendedCadr} m³/h your room needs.`,
          ].map((s, i) => (
            <li key={i} className="flex gap-2">
              <span className="font-bold text-brand-400">{i + 1}.</span>
              <span>{s}</span>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}
