"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useHousehold } from "@/lib/store";
import { AqiGauge } from "@/components/AqiGauge";
import { Card, SectionTitle, Stat } from "@/components/ui";
import { pollutantLabel } from "@/lib/aqi";
import { PERSONAS } from "@/lib/personas";
import { dailyLedger, indoorPm25 } from "@/lib/health";
import type { AirSnapshot, Pollutants } from "@/lib/types";
import { EmptyState } from "@/components/EmptyState";

const POLLUTANT_UNIT: Record<keyof Pollutants, string> = {
  pm2_5: "µg/m³",
  pm10: "µg/m³",
  no2: "µg/m³",
  o3: "µg/m³",
  so2: "µg/m³",
  co: "mg/m³",
};

export default function DashboardPage() {
  const { profile, ready } = useHousehold();
  const [air, setAir] = useState<AirSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/air-quality?lat=${profile.latitude}&lon=${profile.longitude}&city=${encodeURIComponent(profile.city)}`,
      );
      if (!res.ok) throw new Error("Could not load air quality.");
      setAir((await res.json()) as AirSnapshot);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  if (ready && !profile) {
    return <EmptyState />;
  }

  const pm25 = air?.pollutants.pm2_5 ?? 0;
  const volume = profile ? Math.max(profile.roomAreaSqm * profile.roomHeightM, 1) : 42;
  const indoorNo = indoorPm25({ outdoorPm25: pm25, roomVolumeM3: volume, purifierCadr: 0 });
  const recommendedCadr =
    profile && profile.purifierCadr > 0 ? profile.purifierCadr : indoorNo.recommendedCadr;
  const indoorWith = indoorPm25({
    outdoorPm25: pm25,
    roomVolumeM3: volume,
    purifierCadr: recommendedCadr,
  });

  const ledger =
    profile &&
    dailyLedger({
      outdoorPm25: pm25,
      indoorPm25: indoorWith.indoorPm25,
      members: profile.members.length,
      outdoorMinutesBaseline: profile.outdoorActivityMinutes,
      outdoorMinutesGuided: Math.round(profile.outdoorActivityMinutes * 0.4),
    });

  const mostSensitive =
    profile &&
    [...profile.members].sort(
      (a, b) => PERSONAS[b.persona].sensitivity - PERSONAS[a.persona].sensitivity,
    )[0];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <SectionTitle
          kicker={profile ? `Live for ${profile.city}` : "Dashboard"}
          title="Today's air at a glance"
          description="Current conditions, who in your home is most at risk, and the impact waiting to be captured."
        />
        <button type="button" className="btn-ghost text-sm" onClick={refresh} disabled={loading}>
          {loading ? "Refreshing…" : "↻ Refresh"}
        </button>
      </div>

      {error && (
        <Card className="border-aqi-verypoor/40">
          <p className="text-sm text-red-300">{error}</p>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Card className="flex flex-col items-center">
          {air ? (
            <>
              <AqiGauge aqi={air.aqi} />
              <p className="mt-2 text-center text-sm text-white/70">{air.aqi.label}</p>
              {air.aqi.dominant && (
                <p className="mt-1 text-center text-xs text-white/50">
                  Dominant pollutant: <strong>{pollutantLabel(air.aqi.dominant)}</strong>
                </p>
              )}
              <p className="mt-3 rounded-lg bg-black/20 px-3 py-2 text-center text-xs text-white/50">
                {air.source} · {air.provenance}
              </p>
            </>
          ) : (
            <div className="grid h-48 w-full place-items-center text-white/40">
              Loading live air…
            </div>
          )}
        </Card>

        <div className="grid content-start gap-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat
              label="Outdoor PM2.5"
              value={air ? `${Math.round(pm25)}` : "—"}
              sub="µg/m³ right now"
              accent={air?.aqi.color}
            />
            <Stat
              label="Indoor now (no filter)"
              value={air ? `${indoorNo.indoorPm25}` : "—"}
              sub="µg/m³ modelled"
            />
            <Stat
              label="Indoor with right purifier"
              value={air ? `${indoorWith.indoorPm25}` : "—"}
              sub={`CADR ${recommendedCadr} m³/h`}
              accent="#6ee7b7"
            />
          </div>

          {mostSensitive && (
            <Card className="border-brand-500/20 bg-brand-500/5">
              <p className="text-sm font-semibold uppercase tracking-wide text-brand-300">
                Protect first
              </p>
              <p className="mt-1 text-lg">
                <strong>{mostSensitive.name || PERSONAS[mostSensitive.persona].label}</strong> —{" "}
                {PERSONAS[mostSensitive.persona].emoji} {PERSONAS[mostSensitive.persona].label}
              </p>
              <p className="mt-1 text-sm text-white/60">{PERSONAS[mostSensitive.persona].note}</p>
            </Card>
          )}

          {ledger && air && (
            <Card className="border-brand-500/25">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-brand-400">
                    Breath Ledger · today
                  </p>
                  <p className="mt-1 text-3xl font-extrabold text-brand-300">
                    {ledger.householdCigarettes} 🚬
                  </p>
                  <p className="text-sm text-white/60">
                    cigarette-equivalents your household can avoid today ({ledger.householdUg} µg
                    PM2.5).
                  </p>
                </div>
                <Link href="/plan" className="btn-primary whitespace-nowrap">
                  Get today&apos;s plan →
                </Link>
              </div>
              <p className="mt-3 text-xs text-white/45">{ledger.note}</p>
            </Card>
          )}
        </div>
      </div>

      {air && (
        <section>
          <h2 className="mb-3 text-lg font-bold">Pollutant breakdown</h2>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {(Object.keys(POLLUTANT_UNIT) as (keyof Pollutants)[]).map((key) => {
              const value = air.pollutants[key];
              return (
                <div
                  key={key}
                  className="rounded-xl border border-white/10 bg-black/20 p-3 text-center"
                >
                  <p className="text-xs text-white/50">{pollutantLabel(key)}</p>
                  <p className="mt-1 text-lg font-bold">
                    {value === undefined ? "—" : Math.round(value * 100) / 100}
                  </p>
                  <p className="text-xs text-white/40">
                    {value === undefined ? "unavailable" : POLLUTANT_UNIT[key]}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <QuickLink
          href="/indoor"
          icon="🏠"
          title="Clean my indoor air"
          body="Size a purifier or build a DIY filter."
        />
        <QuickLink
          href="/commute"
          icon="🚌"
          title="Pick the cleanest commute"
          body="Compare inhaled dose by mode."
        />
        <QuickLink
          href="/community"
          icon="🤝"
          title="Join the community"
          body="Pledge and track avoided emissions."
        />
      </div>
    </div>
  );
}

function QuickLink({
  href,
  icon,
  title,
  body,
}: {
  href: string;
  icon: string;
  title: string;
  body: string;
}) {
  return (
    <Link href={href} className="card transition hover:border-brand-400/40 hover:bg-white/5">
      <div className="text-2xl" aria-hidden>
        {icon}
      </div>
      <p className="mt-2 font-bold">{title}</p>
      <p className="text-sm text-white/60">{body}</p>
    </Link>
  );
}
