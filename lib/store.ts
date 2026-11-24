"use client";

import { useCallback, useEffect, useState } from "react";
import type { HouseholdProfile } from "./types";

const KEY = "saafsaans.household.v1";

export const DEFAULT_PROFILE: HouseholdProfile = {
  city: "Delhi",
  latitude: 28.6139,
  longitude: 77.209,
  members: [
    { id: "m1", name: "You", persona: "adult" },
    { id: "m2", name: "Aarav", persona: "child" },
    { id: "m3", name: "Dadi", persona: "senior" },
  ],
  commuteMode: "auto",
  commuteKm: 8,
  cookingFuel: "lpg",
  hasPurifier: false,
  purifierCadr: 0,
  roomAreaSqm: 14,
  roomHeightM: 3,
  outdoorActivityMinutes: 60,
  updatedAt: Date.now(),
};

export function loadProfile(): HouseholdProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as HouseholdProfile;
  } catch {
    return null;
  }
}

export function saveProfile(profile: HouseholdProfile): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify({ ...profile, updatedAt: Date.now() }));
}

export function clearProfile(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}

/** React hook wrapping the persisted household profile. */
export function useHousehold() {
  const [profile, setProfile] = useState<HouseholdProfile | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setProfile(loadProfile());
    setReady(true);
  }, []);

  const update = useCallback((next: HouseholdProfile) => {
    saveProfile(next);
    setProfile({ ...next, updatedAt: Date.now() });
  }, []);

  const reset = useCallback(() => {
    clearProfile();
    setProfile(null);
  }, []);

  return { profile, ready, update, reset, hasProfile: ready && profile !== null };
}
