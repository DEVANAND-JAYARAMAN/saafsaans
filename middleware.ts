import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Lightweight per-IP rate limiting for API routes.
 *
 * A fixed-window in-memory counter guards against accidental or abusive
 * bursts — most importantly on /api/plan, which spends Gemini quota. The
 * window is per runtime instance (best-effort on serverless); for a single
 * instance it is exact, and it demonstrates the control cleanly. For a
 * multi-instance production deployment this would be backed by a shared store
 * (e.g. Upstash Redis).
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const WINDOW_MS = 60_000;
const DEFAULT_LIMIT = 60; // requests/minute per IP for general API
const AI_LIMIT = 20; // stricter for the Gemini-backed planner

const buckets = new Map<string, Bucket>();

function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

function limitFor(pathname: string): number {
  return pathname.startsWith("/api/plan") ? AI_LIMIT : DEFAULT_LIMIT;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const limit = limitFor(pathname);
  const key = `${clientIp(req)}:${pathname.startsWith("/api/plan") ? "ai" : "api"}`;
  const now = Date.now();

  const bucket = buckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return NextResponse.next();
  }

  if (bucket.count >= limit) {
    const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": String(limit),
          "X-RateLimit-Remaining": "0",
        },
      },
    );
  }

  bucket.count += 1;
  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
