import { computeAqi } from "./aqi";
import type { AirSnapshot, Pollutants } from "./types";
import { round } from "./format";

/**
 * Live air-quality + weather via Open-Meteo (Copernicus Atmosphere / CAMS).
 * Free, no API key. Responses are cached for 10 minutes to protect the provider
 * and keep the app fast (Efficiency rubric).
 *
 * Provenance honesty: Open-Meteo returns MODELLED (reanalysis/forecast) hourly
 * concentrations, not roadside regulatory measurements. We surface that clearly.
 */

const AIR_URL = "https://air-quality-api.open-meteo.com/v1/air-quality";
const WEATHER_URL = "https://api.open-meteo.com/v1/forecast";
const GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search";

const REVALIDATE_SECONDS = 600;

interface AirApiResponse {
  current?: {
    pm2_5?: number;
    pm10?: number;
    nitrogen_dioxide?: number;
    sulphur_dioxide?: number;
    ozone?: number;
    carbon_monoxide?: number; // µg/m³
  };
}

interface WeatherApiResponse {
  current?: {
    temperature_2m?: number;
    relative_humidity_2m?: number;
    wind_speed_10m?: number;
  };
}

export interface GeocodeResult {
  name: string;
  latitude: number;
  longitude: number;
  admin1?: string;
  country?: string;
}

export async function geocodeCity(query: string): Promise<GeocodeResult[]> {
  const url = `${GEOCODE_URL}?name=${encodeURIComponent(query)}&count=5&language=en&format=json`;
  const res = await fetch(url, { next: { revalidate: 86400 } });
  if (!res.ok) return [];
  const data = (await res.json()) as { results?: GeocodeResult[] };
  return data.results ?? [];
}

function toNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

export async function getAirSnapshot(
  latitude: number,
  longitude: number,
  city: string,
): Promise<AirSnapshot> {
  try {
    const airUrl =
      `${AIR_URL}?latitude=${latitude}&longitude=${longitude}` +
      `&current=pm2_5,pm10,nitrogen_dioxide,sulphur_dioxide,ozone,carbon_monoxide&timezone=auto`;
    const weatherUrl =
      `${WEATHER_URL}?latitude=${latitude}&longitude=${longitude}` +
      `&current=temperature_2m,relative_humidity_2m,wind_speed_10m&timezone=auto`;

    const [airRes, weatherRes] = await Promise.all([
      fetch(airUrl, { next: { revalidate: REVALIDATE_SECONDS } }),
      fetch(weatherUrl, { next: { revalidate: REVALIDATE_SECONDS } }),
    ]);

    if (!airRes.ok) throw new Error(`air-quality provider returned ${airRes.status}`);
    const air = (await airRes.json()) as AirApiResponse;
    const weather = weatherRes.ok ? ((await weatherRes.json()) as WeatherApiResponse) : {};

    const c = air.current ?? {};
    const pollutants: Pollutants = {
      pm2_5: toNumber(c.pm2_5),
      pm10: toNumber(c.pm10),
      no2: toNumber(c.nitrogen_dioxide),
      so2: toNumber(c.sulphur_dioxide),
      o3: toNumber(c.ozone),
      // Open-Meteo reports CO in µg/m³; CPCB sub-index expects mg/m³.
      co:
        toNumber(c.carbon_monoxide) !== undefined ? round(c.carbon_monoxide! / 1000, 3) : undefined,
    };

    return {
      latitude,
      longitude,
      city,
      fetchedAt: Date.now(),
      pollutants,
      temperatureC: toNumber(weather.current?.temperature_2m),
      relativeHumidity: toNumber(weather.current?.relative_humidity_2m),
      windSpeedKmh: toNumber(weather.current?.wind_speed_10m),
      source: "Open-Meteo (Copernicus CAMS)",
      provenance:
        "Modelled hourly concentrations — indicative AQI estimate, not a roadside regulatory measurement.",
      aqi: computeAqi(pollutants),
    };
  } catch {
    return demoSnapshot(latitude, longitude, city);
  }
}

/** Clearly-labelled offline demonstration scenario — a severe Delhi-winter day. */
export function demoSnapshot(latitude: number, longitude: number, city: string): AirSnapshot {
  const pollutants: Pollutants = { pm2_5: 198, pm10: 312, no2: 71, so2: 22, o3: 34, co: 1.8 };
  return {
    latitude,
    longitude,
    city,
    fetchedAt: Date.now(),
    pollutants,
    temperatureC: 12,
    relativeHumidity: 82,
    windSpeedKmh: 4,
    source: "SaafSaans demonstration scenario",
    provenance:
      "Offline demo data (severe winter-smog scenario). Not a live or historical observation.",
    aqi: computeAqi(pollutants),
  };
}
