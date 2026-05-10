// Shared auth + rate-limit + input sanitization helpers for AI endpoints.
// Used by: rzuma-chat, review-trip-plan, suggest-activity-alternatives.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.0";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Daily rate-limit quotas per user tier.
// Null = unlimited. Applies to AI endpoints that cost money per call.
export const RATE_LIMITS = {
  anonymous: 10,
  free: 30,
  premium: null as number | null,
};

export type AuthContext = {
  userId: string | null; // null for anonymous (IP-bucketed)
  ip: string; // fallback identifier for anonymous
  isPremium: boolean;
  tier: "anonymous" | "free" | "premium";
};

/** Build a Supabase admin client that bypasses RLS — ONLY for server use. */
export function getAdminClient() {
  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) {
    throw new Error("Supabase env not configured");
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Extract client IP from a request; Supabase edge runtime populates x-forwarded-for. */
function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for") || "";
  const first = xff.split(",")[0]?.trim();
  return first || req.headers.get("x-real-ip") || "0.0.0.0";
}

/**
 * Resolve the auth context for an incoming request.
 * Verifies the JWT if present, determines premium status from DB (ignoring
 * any client-supplied isPremium flag), and returns a typed context.
 */
export async function resolveAuth(req: Request): Promise<AuthContext> {
  const ip = getClientIp(req);
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();

  if (!token) {
    return { userId: null, ip, isPremium: false, tier: "anonymous" };
  }

  const admin = getAdminClient();
  const { data: userRes } = await admin.auth.getUser(token);
  const user = userRes?.user;
  if (!user) {
    return { userId: null, ip, isPremium: false, tier: "anonymous" };
  }

  // Real premium check — DO NOT trust the client.
  const { data: sub } = await admin
    .from("subscriptions")
    .select("plan, status, expires_at")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  const premium =
    !!sub &&
    (!sub.expires_at || new Date(sub.expires_at as string) > new Date());

  return {
    userId: user.id,
    ip,
    isPremium: premium,
    tier: premium ? "premium" : "free",
  };
}

/**
 * Check + increment the per-day usage counter.
 * Anonymous users are bucketed by IP. Returns { ok, remaining, limit }.
 * If ok=false, caller should 429.
 */
export async function enforceRateLimit(
  ctx: AuthContext,
  endpoint: string,
): Promise<{ ok: boolean; remaining: number | null; limit: number | null }> {
  const limit = RATE_LIMITS[ctx.tier];
  // Premium = unlimited, skip entirely
  if (limit === null) return { ok: true, remaining: null, limit: null };

  const admin = getAdminClient();
  const bucket = ctx.userId ? `user:${ctx.userId}` : `ip:${ctx.ip}`;
  const day = new Date().toISOString().slice(0, 10); // YYYY-MM-DD UTC

  // Read current count
  const { data: row } = await admin
    .from("api_usage")
    .select("count")
    .eq("bucket", bucket)
    .eq("endpoint", endpoint)
    .eq("day", day)
    .maybeSingle();

  const current = row?.count ?? 0;
  if (current >= limit) {
    return { ok: false, remaining: 0, limit };
  }

  // Upsert increment (race-free enough for our purposes; worst case a user
  // gets 1 extra request on a race, not a security issue).
  await admin
    .from("api_usage")
    .upsert(
      { bucket, endpoint, day, count: current + 1, updated_at: new Date().toISOString() },
      { onConflict: "bucket,endpoint,day" },
    );

  return { ok: true, remaining: limit - current - 1, limit };
}

/**
 * Strip dangerous characters from user-controlled strings before they land in
 * a system prompt. Blocks code-fence injection, newline-based injection, and
 * length-bombs.
 */
export function sanitizeForPrompt(value: unknown, maxLen = 200): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  return s
    .replace(/[`\r\n\u2028\u2029]+/g, " ") // strip backticks + all newline variants
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLen);
}

/** Sanitize the whole preferences object before building system prompts. */
export function sanitizePreferences(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== "object") return null;
  const p = raw as Record<string, unknown>;
  const clean: Record<string, unknown> = {};

  if (typeof p.displayName === "string") {
    const v = sanitizeForPrompt(p.displayName, 40);
    if (v) clean.displayName = v;
  }
  if (typeof p.homeCity === "string") {
    const v = sanitizeForPrompt(p.homeCity, 80);
    if (v) clean.homeCity = v;
  }
  if (typeof p.travelStyle === "string") {
    const v = sanitizeForPrompt(p.travelStyle, 40);
    if (v) clean.travelStyle = v;
  }
  if (Array.isArray(p.dietaryRestrictions)) {
    const arr = (p.dietaryRestrictions as unknown[])
      .slice(0, 10)
      .map((x) => sanitizeForPrompt(x, 40))
      .filter(Boolean);
    if (arr.length) clean.dietaryRestrictions = arr;
  }
  if (Array.isArray(p.pastTrips)) {
    const arr = (p.pastTrips as unknown[])
      .slice(0, 20)
      .map((x) => sanitizeForPrompt(x, 80))
      .filter(Boolean);
    if (arr.length) clean.pastTrips = arr;
  }
  if (Array.isArray(p.visitedPlaces)) {
    const arr = (p.visitedPlaces as unknown[])
      .slice(0, 30)
      .map((raw) => {
        if (!raw || typeof raw !== "object") return null;
        const pp = raw as Record<string, unknown>;
        const name = sanitizeForPrompt(pp.name, 80);
        if (!name) return null;
        return {
          name,
          rating: sanitizeForPrompt(pp.rating, 20),
          category: sanitizeForPrompt(pp.category, 40),
        };
      })
      .filter(Boolean);
    if (arr.length) clean.visitedPlaces = arr;
  }
  if (Array.isArray(p.likedCategories)) {
    const arr = (p.likedCategories as unknown[])
      .slice(0, 20)
      .map((x) => sanitizeForPrompt(x, 40))
      .filter(Boolean);
    if (arr.length) clean.likedCategories = arr;
  }
  if (Array.isArray(p.dislikedCategories)) {
    const arr = (p.dislikedCategories as unknown[])
      .slice(0, 20)
      .map((x) => sanitizeForPrompt(x, 40))
      .filter(Boolean);
    if (arr.length) clean.dislikedCategories = arr;
  }
  return clean;
}

/**
 * Strip dangerous content from a list of revision-issue strings that get
 * interpolated into a system message.
 */
export function sanitizeRevisionIssues(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return (raw as unknown[])
    .slice(0, 20)
    .map((x) => sanitizeForPrompt(x, 500))
    .filter(Boolean);
}

/** Build a consistent 429 response. */
export function rateLimitResponse(limit: number | null) {
  return new Response(
    JSON.stringify({
      error: "Daily limit reached. Upgrade to premium for unlimited planning, or try again tomorrow.",
      limit,
      upgradeUrl: "/chat",
    }),
    {
      status: 429,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
}

/** Build a consistent 401 response for missing auth on protected endpoints. */
export function unauthorizedResponse() {
  return new Response(
    JSON.stringify({
      error: "Sign in to continue planning. Anonymous usage is limited.",
    }),
    {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
}
