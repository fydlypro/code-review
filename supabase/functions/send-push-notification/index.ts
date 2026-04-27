// ============================================================
// FYDLY — Edge Function : send-push-notification
// verify_jwt: true — la gateway Supabase valide déjà la signature.
// On parse le payload JWT directement (pas de getUser() réseau).
// ============================================================
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  const oneSignalApiKey = Deno.env.get("ONESIGNAL_API_KEY");
  const oneSignalAppId = Deno.env.get("ONESIGNAL_APP_ID");

  if (!oneSignalApiKey || !oneSignalAppId) {
    return new Response(
      JSON.stringify({ success: false, error: "OneSignal non configuré" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Non authentifié" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // verify_jwt:true a déjà validé la signature — on lit juste le sub
    const userId = getUserIdFromJwt(authHeader);
    if (!userId) {
      return new Response(JSON.stringify({ error: "Token invalide" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    const payload = await req.json();
    const { merchant_id, message, segment } = payload;

    if (!merchant_id || !message || !segment) {
      return new Response(
        JSON.stringify({ error: "Paramètres manquants (merchant_id, message, segment)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (message.length > 140) {
      return new Response(
        JSON.stringify({ error: "Message trop long (140 caractères maximum)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Vérifier que l'utilisateur est propriétaire du merchant
    const { data: merchant, error: merchantError } = await supabaseAdmin
      .from("merchants")
      .select("id, name, subscription_status")
      .eq("id", merchant_id)
      .eq("user_id", userId)
      .single();

    if (merchantError || !merchant) {
      return new Response(JSON.stringify({ error: "Commerçant introuvable ou accès refusé" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (merchant.subscription_status === "expired") {
      return new Response(
        JSON.stringify({ error: "Abonnement expiré" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Filtrer les cartes selon le segment
    let loyaltyQuery = supabaseAdmin
      .from("loyalty_cards")
      .select("customer_id")
      .eq("merchant_id", merchant_id);

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    if (segment === "active") loyaltyQuery = loyaltyQuery.gte("last_scan_at", thirtyDaysAgo);
    else if (segment === "inactive") loyaltyQuery = loyaltyQuery.lt("last_scan_at", thirtyDaysAgo);

    const { data: loyaltyCards, error: cardsError } = await loyaltyQuery;
    if (cardsError) throw cardsError;

    if (!loyaltyCards || loyaltyCards.length === 0) {
      await supabaseAdmin.from("notifications").insert({
        merchant_id, message, segment,
        recipients_count: 0,
        status: "sent",
        sent_at: new Date().toISOString(),
      });
      return new Response(
        JSON.stringify({ success: true, recipients: 0, total_customers: 0, players_with_push: 0, onesignal_id: null }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const customerIds = loyaltyCards.map((lc: { customer_id: string }) => lc.customer_id);

    const { data: customers, error: customersError } = await supabaseAdmin
      .from("customers")
      .select("onesignal_player_id")
      .in("id", customerIds)
      .not("onesignal_player_id", "is", null);

    if (customersError) throw customersError;

    const playerIds = (customers ?? [])
      .map((c: { onesignal_player_id: string | null }) => c.onesignal_player_id)
      .filter((id): id is string => !!id);

    let notificationId: string | null = null;
    let recipientsCount = 0;

    if (playerIds.length > 0) {
      const oneSignalResponse = await fetch("https://onesignal.com/api/v1/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Basic ${oneSignalApiKey}`,
        },
        body: JSON.stringify({
          app_id: oneSignalAppId,
          include_subscription_ids: playerIds,
          headings: { fr: merchant.name },
          contents: { fr: message },
          data: { type: "merchant_push", merchant_id },
        }),
      });

      const oneSignalData = await oneSignalResponse.json();
      if (oneSignalResponse.ok) {
        notificationId = oneSignalData.id;
        recipientsCount = oneSignalData.recipients ?? playerIds.length;
      } else {
        console.error("[send-push] OneSignal error:", JSON.stringify(oneSignalData));
      }
    }

    // Toujours enregistrer en DB
    await supabaseAdmin.from("notifications").insert({
      merchant_id, message, segment,
      recipients_count: recipientsCount,
      status: (notificationId || playerIds.length === 0) ? "sent" : "failed",
      sent_at: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        success: true,
        recipients: recipientsCount,
        total_customers: customerIds.length,
        players_with_push: playerIds.length,
        onesignal_id: notificationId,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[send-push] Erreur:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
