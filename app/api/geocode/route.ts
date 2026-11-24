import { NextResponse } from "next/server";
import { geocodeCity } from "@/lib/airquality";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = (searchParams.get("name") ?? "").trim().slice(0, 80);
  if (name.length < 2) {
    return NextResponse.json({ error: "Query 'name' must be at least 2 characters." }, { status: 400 });
  }
  const results = await geocodeCity(name);
  return NextResponse.json(
    { results },
    { headers: { "Cache-Control": "public, s-maxage=86400" } },
  );
}
