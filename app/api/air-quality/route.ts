import { NextResponse } from "next/server";
import { getAirSnapshot } from "@/lib/airquality";

export const runtime = "nodejs";

function parseCoord(value: string | null, min: number, max: number): number | null {
  if (value === null) return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < min || n > max) return null;
  return n;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = parseCoord(searchParams.get("lat"), -90, 90);
  const lon = parseCoord(searchParams.get("lon"), -180, 180);
  const city = (searchParams.get("city") ?? "").slice(0, 80) || "Your area";

  if (lat === null || lon === null) {
    return NextResponse.json(
      { error: "Valid 'lat' (-90..90) and 'lon' (-180..180) query params are required." },
      { status: 400 },
    );
  }

  const snapshot = await getAirSnapshot(lat, lon, city);
  return NextResponse.json(snapshot, {
    headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1200" },
  });
}
