import { NextResponse } from "next/server";
import { generateDailyPlan } from "@/lib/gemini";
import { getAirSnapshot } from "@/lib/airquality";
import { MAX_BODY_BYTES, parseProfile } from "@/lib/validate";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request) {
  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Request body too large." }, { status: 413 });
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const profile = parseProfile(body);
  if (!profile) {
    return NextResponse.json({ error: "Invalid household profile." }, { status: 422 });
  }

  const air = await getAirSnapshot(profile.latitude, profile.longitude, profile.city);
  const plan = await generateDailyPlan(profile, air);
  return NextResponse.json({ plan, air });
}
