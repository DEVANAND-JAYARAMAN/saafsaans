"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DEFAULT_PROFILE, useHousehold } from "@/lib/store";
import { PERSONA_LIST } from "@/lib/personas";
import { COMMUTE_MODES } from "@/lib/health";
import { Card, SectionTitle } from "@/components/ui";
import type { CommuteMode, CookingFuel, HouseholdProfile, PersonaId } from "@/lib/types";

interface GeoHit {
  name: string;
  latitude: number;
  longitude: number;
  admin1?: string;
  country?: string;
}

const COMMUTE_LABEL: Record<CommuteMode, string> = {
  walk: "Walk",
  cycle: "Cycle",
  bike: "Motorbike",
  auto: "Auto-rickshaw",
  bus: "Bus",
  metro: "Metro",
  car_fresh: "Car (fresh air)",
  car_recirc: "Car (recirculate + filter)",
};

const FUEL_LABEL: Record<CookingFuel, string> = {
  lpg: "LPG",
  induction: "Induction / electric",
  wood: "Wood / biomass",
  kerosene: "Kerosene",
};

export default function SetupPage() {
  const router = useRouter();
  const { profile, ready, update } = useHousehold();
  const [form, setForm] = useState<HouseholdProfile>(DEFAULT_PROFILE);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<GeoHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [geoMsg, setGeoMsg] = useState("");

  useEffect(() => {
    if (ready && profile) setForm(profile);
  }, [ready, profile]);

  function set<K extends keyof HouseholdProfile>(key: K, value: HouseholdProfile[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function searchCity() {
    if (query.trim().length < 2) return;
    setSearching(true);
    setHits([]);
    try {
      const res = await fetch(`/api/geocode?name=${encodeURIComponent(query.trim())}`);
      const data = (await res.json()) as { results?: GeoHit[] };
      setHits(data.results ?? []);
    } finally {
      setSearching(false);
    }
  }

  function pickCity(hit: GeoHit) {
    const label = [hit.name, hit.admin1, hit.country].filter(Boolean).join(", ");
    set("city", label);
    set("latitude", hit.latitude);
    set("longitude", hit.longitude);
    setHits([]);
    setQuery(label);
  }

  function useMyLocation() {
    setGeoMsg("");
    if (!navigator.geolocation) {
      setGeoMsg("Geolocation is not available in this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        set("latitude", Number(pos.coords.latitude.toFixed(4)));
        set("longitude", Number(pos.coords.longitude.toFixed(4)));
        set("city", "My current location");
        setQuery("My current location");
        setGeoMsg("Location set from your device.");
      },
      () => setGeoMsg("Could not get location — enter your city instead."),
      { enableHighAccuracy: false, timeout: 8000 },
    );
  }

  function addMember() {
    if (form.members.length >= 10) return;
    set("members", [
      ...form.members,
      { id: `m${Date.now()}`, name: "", persona: "adult" as PersonaId },
    ]);
  }

  function save() {
    update(form);
    router.push("/dashboard");
  }

  return (
    <div className="flex flex-col gap-6">
      <SectionTitle
        kicker="Step 1"
        title="Set up your household"
        description="Everything stays on your device — no account, no server storage. This tailors every number to your family and lifestyle."
      />

      <Card>
        <h2 className="text-lg font-bold">Where are you?</h2>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <div className="flex-1">
            <label className="label" htmlFor="city">
              City or area
            </label>
            <div className="flex gap-2">
              <input
                id="city"
                className="field"
                placeholder="e.g. Delhi, Lucknow, Patna"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchCity()}
              />
              <button type="button" className="btn-ghost" onClick={searchCity} disabled={searching}>
                {searching ? "…" : "Search"}
              </button>
            </div>
          </div>
          <div className="flex items-end">
            <button type="button" className="btn-ghost" onClick={useMyLocation}>
              📍 Use my location
            </button>
          </div>
        </div>
        {geoMsg && <p className="mt-2 text-sm text-brand-300">{geoMsg}</p>}
        {hits.length > 0 && (
          <ul className="mt-3 grid gap-2">
            {hits.map((h, i) => (
              <li key={`${h.latitude}-${h.longitude}-${i}`}>
                <button
                  type="button"
                  className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-left hover:bg-white/5"
                  onClick={() => pickCity(h)}
                >
                  {[h.name, h.admin1, h.country].filter(Boolean).join(", ")}
                </button>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-sm text-white/50">
          Selected: <strong className="text-white/80">{form.city}</strong> ({form.latitude.toFixed(2)},{" "}
          {form.longitude.toFixed(2)})
        </p>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Who&apos;s in the family?</h2>
          <button type="button" className="btn-ghost text-sm" onClick={addMember}>
            + Add member
          </button>
        </div>
        <p className="mt-1 text-sm text-white/55">
          Personas set each person&apos;s vulnerability weighting (children, seniors and patients feel smog more).
        </p>
        <ul className="mt-4 grid gap-3">
          {form.members.map((m, idx) => (
            <li key={m.id} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
              <input
                className="field"
                aria-label={`Name of member ${idx + 1}`}
                placeholder="Name"
                value={m.name}
                onChange={(e) => {
                  const next = [...form.members];
                  next[idx] = { ...m, name: e.target.value };
                  set("members", next);
                }}
              />
              <select
                className="field"
                aria-label={`Persona of member ${idx + 1}`}
                value={m.persona}
                onChange={(e) => {
                  const next = [...form.members];
                  next[idx] = { ...m, persona: e.target.value as PersonaId };
                  set("members", next);
                }}
              >
                {PERSONA_LIST.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.emoji} {p.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="btn-ghost text-sm"
                aria-label={`Remove member ${idx + 1}`}
                onClick={() => set("members", form.members.filter((_, i) => i !== idx))}
                disabled={form.members.length <= 1}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <h2 className="text-lg font-bold">Lifestyle</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="mode">
              Usual commute
            </label>
            <select
              id="mode"
              className="field"
              value={form.commuteMode}
              onChange={(e) => set("commuteMode", e.target.value as CommuteMode)}
            >
              {COMMUTE_MODES.map((mode) => (
                <option key={mode} value={mode}>
                  {COMMUTE_LABEL[mode]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="km">
              One-way commute (km): {form.commuteKm}
            </label>
            <input
              id="km"
              type="range"
              min={0}
              max={40}
              step={1}
              className="w-full"
              value={form.commuteKm}
              onChange={(e) => set("commuteKm", Number(e.target.value))}
            />
          </div>
          <div>
            <label className="label" htmlFor="fuel">
              Cooking fuel
            </label>
            <select
              id="fuel"
              className="field"
              value={form.cookingFuel}
              onChange={(e) => set("cookingFuel", e.target.value as CookingFuel)}
            >
              {(Object.keys(FUEL_LABEL) as CookingFuel[]).map((f) => (
                <option key={f} value={f}>
                  {FUEL_LABEL[f]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="outdoor">
              Daily outdoor exertion (min): {form.outdoorActivityMinutes}
            </label>
            <input
              id="outdoor"
              type="range"
              min={0}
              max={240}
              step={10}
              className="w-full"
              value={form.outdoorActivityMinutes}
              onChange={(e) => set("outdoorActivityMinutes", Number(e.target.value))}
            />
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-3">
            <input
              type="checkbox"
              checked={form.hasPurifier}
              onChange={(e) => set("hasPurifier", e.target.checked)}
            />
            <span className="text-sm">We have an air purifier</span>
          </label>
          <div>
            <label className="label" htmlFor="cadr">
              Purifier CADR (m³/h)
            </label>
            <input
              id="cadr"
              type="number"
              min={0}
              max={1000}
              className="field"
              value={form.purifierCadr}
              onChange={(e) => set("purifierCadr", Number(e.target.value))}
              disabled={!form.hasPurifier}
            />
          </div>
          <div>
            <label className="label" htmlFor="room">
              Main room area (m²)
            </label>
            <input
              id="room"
              type="number"
              min={2}
              max={200}
              className="field"
              value={form.roomAreaSqm}
              onChange={(e) => set("roomAreaSqm", Number(e.target.value))}
            />
          </div>
        </div>
      </Card>

      <div className="flex justify-end gap-3">
        <button type="button" className="btn-primary text-base" onClick={save}>
          Save &amp; see my dashboard →
        </button>
      </div>
    </div>
  );
}
