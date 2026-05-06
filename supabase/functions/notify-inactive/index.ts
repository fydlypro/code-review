// ============================================================
// FYDLY — Edge Function : notify-inactive
// Relances automatisées pour les clients inactifs (30 jours)
// Exécutée quotidiennement via pg_cron
// ============================================================

import { serve } from "https://deno.land/std/http/server.ts";
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

serve(async (req: Request) => {
  const corsHeaders = getCorsHeaders(req.headers.get("Origin"));

  const authHeader = req.headers.get("Authorization");
  const cronSecret = Deno.env.get("CRON_SECRET");

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response(JSON.stringify({ error: "Non autorisé" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );

  const oneSignalApiKey = Deno.env.get("ONESIGNAL_API_KEY");
  const oneSignalAppId = Deno.env.get("ONESIGNAL_APP_ID");

  if (!oneSignalApiKey || !oneSignalAppId) {
    return new Response(JSON.stringify({ error: "OneSignal non configuré" }), {
      status: 500,
      headers: corsHeaders,
    });
  }

  try {
    // 1. Définir les seuils de date
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // 2. Trouver les clients inactifs éligibles à une relance
    // On cherche les cartes inactives depuis 30j chez des commerçants ayant activé l'option
    const { data: eligibleCards, error: dbError } = await supabaseAdmin
      .from("loyalty_cards")
      .select(`
        id,
        last_scan_at,
        last_reminded_at,
        merchant_id,
        merchants!inner (name, auto_reminders_enabled, auto_reminder_message),
        customers!inner (id, first_name, onesignal_player_id)
      `)
      .lt("last_scan_at", thirtyDaysAgo)
      .or(`last_reminded_at.is.null,last_reminded_at.lt.${sevenDaysAgo}`)
      .eq("merchants.auto_reminders_enabled", true)
      .not("customers.onesignal_player_id", "is", null);

    if (dbError) throw dbError;

    if (!eligibleCards || eligibleCards.length === 0) {
      return new Response(JSON.stringify({ message: "Aucun client à relancer aujourd'hui", count: 0 }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[notify-inactive] ${eligibleCards.length} relances potentielles trouvées.`);

    let successCount = 0;
    const notifiedCardIds: string[] = [];

    // 3. Envoyer les notifications (traitement par lots ou individuel pour simplicité)
    for (const card of eligibleCards) {
      const merchantName = (card.merchants as any).name;
      const message = (card.merchants as any).auto_reminder_message || `Vous nous manquez chez ${merchantName} ! Revenez nous voir.`;
      const playerId = (card.customers as any).onesignal_player_id;

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
            headings: { fr: merchantName },
            contents: { fr: message },
            data: { type: "auto_reminder", merchant_id: card.merchant_id },
          }),
        });

        if (response.ok) {
          successCount++;
          notifiedCardIds.push(card.id);
        }
      } catch (err) {
        console.error(`Erreur OneSignal pour card ${card.id}:`, err);
      }
    }

    // 4. Mettre à jour last_reminded_at pour les succès
    if (notifiedCardIds.length > 0) {
      const { error: updateError } = await supabaseAdmin
        .from("loyalty_cards")
        .update({ last_reminded_at: now.toISOString() })
        .in("id", notifiedCardIds);

      if (updateError) console.error("Erreur mise à jour last_reminded_at:", updateError);
    }

    return new Response(JSON.stringify({ success: true, count: successCount }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("[notify-inactive] Erreur critique:", error);
    return new Response(JSON.stringify({ error: "Erreur interne." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
