// ============================================================
// FYDLY — Edge Function : expire-rewards
// Expire les récompenses périmées + envoie notification push
// Déclencher chaque nuit à 02h00 UTC
// ============================================================
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

interface ExpiredReward {
  id: string;
  customer_id: string;
  merchant_id: string;
  customers: {
    onesignal_player_id: string | null;
    first_name: string | null;
  };
  merchants: {
    name: string;
  };
}

serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req.headers.get("Origin"));

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // C-3 fix : refus explicite si CRON_SECRET absent ou header incorrect
    const authHeader = req.headers.get("authorization");
    const cronSecret = Deno.env.get("CRON_SECRET");
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    const oneSignalApiKey = Deno.env.get("ONESIGNAL_API_KEY");
    const oneSignalAppId = Deno.env.get("ONESIGNAL_APP_ID");

    // 1. Récupérer toutes les récompenses expirées encore "available"
    const { data: expiredRewards, error: fetchError } = await supabase
      .from("rewards")
      .select(`
        id,
        customer_id,
        merchant_id,
        customers ( onesignal_player_id, first_name ),
        merchants ( name )
      `)
      .eq("status", "available")
      .lt("expires_at", new Date().toISOString());

    if (fetchError) throw fetchError;

    if (!expiredRewards || expiredRewards.length === 0) {
      return new Response(
        JSON.stringify({ success: true, expired_count: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const rewards = expiredRewards as unknown as ExpiredReward[];

    // 2. Marquer les récompenses comme expirées
    const expiredIds = rewards.map((r) => r.id);
    const { error: updateError } = await supabase
      .from("rewards")
      .update({ status: "expired" })
      .in("id", expiredIds);

    if (updateError) throw updateError;

    // 3. Envoyer une notification push OneSignal à chaque client concerné
    let notificationsSent = 0;
    if (oneSignalApiKey && oneSignalAppId) {
      for (const reward of rewards) {
        const playerId = reward.customers?.onesignal_player_id;
        if (!playerId) continue;

        const merchantName = reward.merchants?.name ?? "votre commerçant";

        try {
          const response = await fetch("https://onesignal.com/api/v1/notifications", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Basic ${oneSignalApiKey}`,
            },
            body: JSON.stringify({
              app_id: oneSignalAppId,
              include_subscription_ids: [playerId],
              headings: { fr: "Récompense expirée ⚠️" },
              contents: {
                fr: `⚠️ Votre récompense chez ${merchantName} a expiré. Continuez à scanner pour en gagner une nouvelle !`,
              },
              data: {
                type: "reward_expired",
                merchant_id: reward.merchant_id,
              },
            }),
          });

          if (response.ok) {
            notificationsSent++;
          } else {
            const errText = await response.text();
            console.error(`[expire-rewards] OneSignal error for reward ${reward.id}:`, errText);
          }
        } catch (pushErr) {
          console.error(`[expire-rewards] Push notification failed for reward ${reward.id}:`, pushErr);
        }
      }
    }

    console.log(`[expire-rewards] ${expiredIds.length} récompenses expirées, ${notificationsSent} notifications envoyées`);

    return new Response(
      JSON.stringify({
        success: true,
        expired_count: expiredIds.length,
        notifications_sent: notificationsSent,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[expire-rewards] Erreur:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Erreur interne." }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
