// ============================================================
// FYDLY — Edge Function : get-stripe-invoices
// Liste les factures Stripe du commerçant connecté.
// verify_jwt: true — on parse le payload JWT directement.
// ============================================================
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.5.0?target=deno";

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

function getUserIdFromJwt(authHeader: string): string | null {
  try {
    const token = authHeader.replace("Bearer ", "");
    const [, payloadB64] = token.split(".");
    const payload = JSON.parse(atob(payloadB64));
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req.headers.get("Origin"));

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (!stripeSecretKey) {
    return new Response(
      JSON.stringify({ error: "Erreur de configuration serveur." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const authHeader = req.headers.get("authorization");
    const userId = authHeader ? getUserIdFromJwt(authHeader) : null;
    if (!userId) {
      return new Response(JSON.stringify({ error: "Non authentifié" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { merchant_id } = await req.json();
    if (!merchant_id) {
      return new Response(JSON.stringify({ error: "merchant_id manquant" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    const { data: merchant } = await supabaseAdmin
      .from("merchants")
      .select("id, stripe_customer_id")
      .eq("id", merchant_id)
      .eq("user_id", userId)
      .single();

    if (!merchant) {
      return new Response(JSON.stringify({ error: "Accès refusé" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!merchant.stripe_customer_id) {
      return new Response(JSON.stringify({ invoices: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2024-04-10",
      httpClient: Stripe.createFetchHttpClient(),
    });

    const list = await stripe.invoices.list({
      customer: merchant.stripe_customer_id,
      limit: 12,
    });

    const invoices = list.data.map((inv) => ({
      id: inv.number ?? inv.id,
      date: new Date(inv.created * 1000).toLocaleDateString("fr-FR", {
        day: "numeric", month: "long", year: "numeric",
      }),
      amount: `${((inv.amount_paid || inv.amount_due) / 100).toFixed(2).replace(".", ",")} €`,
      status: inv.status === "paid" ? "Payée" : inv.status === "open" ? "En attente" : "Annulée",
      url: inv.hosted_invoice_url ?? undefined,
    }));

    return new Response(JSON.stringify({ invoices }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[get-stripe-invoices] Erreur:", error);
    return new Response(
      JSON.stringify({ error: "Erreur interne." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
