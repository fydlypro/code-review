// ============================================================
// FYDLY — Edge Function : create-checkout
// Crée une session Checkout Stripe
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

function getPriceId(planId: string): string | null {
  if (planId === "pro") return Deno.env.get("STRIPE_PRO_PRICE_ID") ?? null;
  if (planId === "business") return Deno.env.get("STRIPE_BUSINESS_PRICE_ID") ?? null;
  return null;
}

// H-3 : valider que success_url / cancel_url pointent vers notre domaine
function isAllowedRedirectUrl(url: string): boolean {
  try {
    const appUrl = Deno.env.get("APP_URL") ?? "https://fydly.vercel.app";
    const allowed = [new URL(appUrl).origin, "http://localhost:5173", "http://localhost:4173"];
    return allowed.includes(new URL(url).origin);
  } catch {
    return false;
  }
}

serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req.headers.get("Origin"));

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const { merchant_id, plan_id, success_url, cancel_url } = await req.json();

  if (!merchant_id || !plan_id || !success_url || !cancel_url) {
    return new Response(JSON.stringify({ error: "Paramètres invalides" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!isAllowedRedirectUrl(success_url) || !isAllowedRedirectUrl(cancel_url)) {
    return new Response(JSON.stringify({ error: "URL de redirection invalide" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const priceId = getPriceId(plan_id);
  if (!priceId) {
    return new Response(JSON.stringify({ error: "Plan inconnu ou Price ID non configuré" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error("Non authentifié");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: merchant } = await supabaseAdmin
      .from("merchants")
      .select("stripe_customer_id, user_id")
      .eq("id", merchant_id)
      .single();

    if (!merchant || merchant.user_id !== user.id) {
      throw new Error("Accès refusé");
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
      apiVersion: "2024-04-10",
      httpClient: Stripe.createFetchHttpClient(),
    });

    let customerId = merchant.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { merchant_id },
      });
      customerId = customer.id;

      await supabaseAdmin
        .from("merchants")
        .update({ stripe_customer_id: customerId })
        .eq("id", merchant_id);
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      payment_method_collection: "if_required",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      subscription_data: {
        trial_period_days: 30,
        trial_settings: { end_behavior: { missing_payment_method: "cancel" } },
      },
      success_url,
      cancel_url,
      client_reference_id: merchant_id,
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("[create-checkout] Erreur:", error);
    return new Response(JSON.stringify({ error: "Erreur lors de la création du paiement." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
