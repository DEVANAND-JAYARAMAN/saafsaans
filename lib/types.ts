// Shared domain types for SaafSaans.

export type PersonaId =
  | "infant"
  | "child"
  | "teen"
  | "adult"
  | "senior"
  | "pregnant"
  | "asthmatic"
  | "heart"
  | "athlete"
  | "outdoor_worker";

export type ActivityLevel = "rest" | "sedentary" | "light" | "moderate" | "vigorous";

export type CommuteMode =
  "walk" | "cycle" | "bike" | "auto" | "bus" | "metro" | "car_fresh" | "car_recirc";

export type CookingFuel = "lpg" | "induction" | "wood" | "kerosene";

export interface FamilyMember {
  id: string;
  name: string;
  persona: PersonaId;
}

export interface HouseholdProfile {
  city: string;
  latitude: number;
  longitude: number;
  members: FamilyMember[];
  commuteMode: CommuteMode;
  commuteKm: number;
  cookingFuel: CookingFuel;
  hasPurifier: boolean;
  purifierCadr: number; // m3/h, 0 if none
  roomAreaSqm: number;
  roomHeightM: number;
  outdoorActivityMinutes: number; // typical daily outdoor exertion
  updatedAt: number;
}

export interface Pollutants {
  pm2_5?: number; // ug/m3
  pm10?: number; // ug/m3
  no2?: number; // ug/m3
  o3?: number; // ug/m3
  so2?: number; // ug/m3
  co?: number; // mg/m3 (converted from ug/m3 by provider layer)
}

export interface AqiBand {
  index: number; // numeric AQI
  category: AqiCategory;
  dominant: keyof Pollutants | null;
  color: string;
  label: string;
}

export type AqiCategory = "Good" | "Satisfactory" | "Moderate" | "Poor" | "Very Poor" | "Severe";

export interface AirSnapshot {
  latitude: number;
  longitude: number;
  city: string;
  fetchedAt: number;
  pollutants: Pollutants;
  temperatureC?: number;
  windSpeedKmh?: number;
  relativeHumidity?: number;
  source: string;
  provenance: string;
  aqi: AqiBand;
}
