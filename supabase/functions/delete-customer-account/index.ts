// ============================================================
// FYDLY — Edge Function : delete-customer-account
// Supprime définitivement le compte client et toutes ses données.
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
    // Client anon pour vérifier l'identité de l'appelant
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

    // Client service_role pour les opérations d'administration
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Supprimer le profil client (CASCADE supprime loyalty_cards, transactions, rewards)
    const { error: deleteCustomerErr } = await adminClient
      .from("customers")
      .delete()
      .eq("user_id", user.id);

    if (deleteCustomerErr) {
      console.error("[delete-customer-account] Erreur suppression customer:", deleteCustomerErr);
      throw deleteCustomerErr;
    }

    // Supprimer le compte auth
    const { error: deleteAuthErr } = await adminClient.auth.admin.deleteUser(user.id);
    if (deleteAuthErr) {
      console.error("[delete-customer-account] Erreur suppression auth:", deleteAuthErr);
      throw deleteAuthErr;
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[delete-customer-account] Erreur:", err);
    return new Response(
      JSON.stringify({ error: "Erreur lors de la suppression du compte." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
