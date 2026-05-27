// ============================================================
// FYDLY — Edge Function : delete-merchant-account
// Supprime définitivement le compte commerçant et toutes ses données.
// Requiert la service_role key — jamais exposée au client.
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

serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req.headers.get("Origin"));

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } } }
    );

    const { data: { user }, error: authError } = await anonClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Non authentifié." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Récupérer le merchant pour annuler Stripe avant suppression
    const { data: merchant } = await adminClient
      .from("merchants")
      .select("stripe_subscription_id")
      .eq("user_id", user.id)
      .single();

    // Annuler l'abonnement Stripe s'il existe
    if (merchant?.stripe_subscription_id) {
      const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
      if (stripeKey) {
        try {
          const stripe = new Stripe(stripeKey, { apiVersion: "2024-04-10", httpClient: Stripe.createFetchHttpClient() });
          await stripe.subscriptions.cancel(merchant.stripe_subscription_id);
        } catch (stripeErr) {
          console.error("[delete-merchant-account] Erreur annulation Stripe:", stripeErr);
        }
      }
    }

    // Supprimer le compte auth EN PREMIER (plus facile de recréer un profil merchant si besoin)
    const { error: deleteAuthErr } = await adminClient.auth.admin.deleteUser(user.id);
    if (deleteAuthErr) {
      console.error("[delete-merchant-account] Erreur suppression auth:", deleteAuthErr);
      throw deleteAuthErr;
    }

    // Supprimer le profil merchant (CASCADE supprime qr_tokens, loyalty_cards, transactions, rewards, notifications)
    const { error: deleteMerchantErr } = await adminClient
      .from("merchants")
      .delete()
      .eq("user_id", user.id);

    if (deleteMerchantErr) {
      console.error("[delete-merchant-account] Erreur suppression merchant:", deleteMerchantErr);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[delete-merchant-account] Erreur:", err);
    return new Response(
      JSON.stringify({ error: "Erreur lors de la suppression du compte." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
