// ============================================================
// FYDLY — Edge Function : delete-merchant-account
// Supprime définitivement le compte commerçant et toutes ses données.
// Requiert la service_role key — jamais exposée au client.
// ============================================================
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
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

    // Supprimer le profil merchant (CASCADE supprime qr_tokens, loyalty_cards, transactions, rewards, notifications)
    const { error: deleteMerchantErr } = await adminClient
      .from("merchants")
      .delete()
      .eq("user_id", user.id);

    if (deleteMerchantErr) {
      console.error("[delete-merchant-account] Erreur suppression merchant:", deleteMerchantErr);
      throw deleteMerchantErr;
    }

    // Supprimer le compte auth
    const { error: deleteAuthErr } = await adminClient.auth.admin.deleteUser(user.id);
    if (deleteAuthErr) {
      console.error("[delete-merchant-account] Erreur suppression auth:", deleteAuthErr);
      throw deleteAuthErr;
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
