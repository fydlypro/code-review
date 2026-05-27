// ============================================================
// FYDLY — Edge Function : validate-merchant-code
// Vérifie le code d'accès professionnel côté serveur.
// Le secret MERCHANT_ACCESS_CODE n'est jamais exposé au client.
// ============================================================
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

function getCorsHeaders(origin: string | null): Record<string, string> {
  const appUrl = Deno.env.get("APP_URL") ?? "https://fydly.vercel.app";
  const allowed = [appUrl, "http://localhost:5173", "http://localhost:4173"];
  const allowedOrigin = origin && allowed.includes(origin) ? origin : appUrl;
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Vary": "Origin",
  };
}

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req.headers.get("Origin"));

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (isRateLimited(clientIp)) {
      return new Response(
        JSON.stringify({ valid: false, error: "Trop de tentatives. Réessayez dans 15 minutes." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { code } = await req.json();

    if (!code || typeof code !== "string") {
      return new Response(
        JSON.stringify({ valid: false, error: "Code manquant." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const validCode = Deno.env.get("MERCHANT_ACCESS_CODE");

    if (!validCode) {
      console.error("[validate-merchant-code] MERCHANT_ACCESS_CODE non configuré.");
      return new Response(
        JSON.stringify({ valid: false, error: "Configuration serveur manquante." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const isValid = code.trim() === validCode.trim();

    return new Response(
      JSON.stringify({ valid: isValid }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[validate-merchant-code] Erreur:", err);
    return new Response(
      JSON.stringify({ valid: false, error: "Erreur serveur." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
