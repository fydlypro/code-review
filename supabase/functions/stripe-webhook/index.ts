// ============================================================
// FYDLY — Edge Function : stripe-webhook
// Gestion des événements Stripe (abonnements, paiements)
// URL à configurer dans Stripe Dashboard → Webhooks
// ============================================================
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.5.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
  const stripeWebhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  if (!stripeSecretKey || !stripeWebhookSecret) {
    console.error("[stripe-webhook] STRIPE_SECRET_KEY ou STRIPE_WEBHOOK_SECRET manquant");
    return new Response(JSON.stringify({ error: "Configuration manquante" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const stripe = new Stripe(stripeSecretKey, {
    apiVersion: "2024-04-10",
    httpClient: Stripe.createFetchHttpClient(),
  });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );

  try {
    // Récupérer le body brut pour la vérification de signature
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      return new Response(JSON.stringify({ error: "Signature manquante" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Vérifier la signature Stripe (sécurité critique)
    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, stripeWebhookSecret);
    } catch (sigErr) {
      console.error("[stripe-webhook] Signature invalide:", sigErr.message);
      return new Response(JSON.stringify({ error: "Signature invalide" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[stripe-webhook] Événement reçu: ${event.type}`);

    switch (event.type) {
      // ── Abonnement créé ────────────────────────────────────────
      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        await supabase
          .from("merchants")
          .update({
            subscription_status: "active",
            stripe_subscription_id: subscription.id,
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_customer_id", customerId);

        console.log(`[stripe-webhook] Abonnement créé pour customer ${customerId}`);
        break;
      }

      // ── Abonnement mis à jour ──────────────────────────────────
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        let status: "trial" | "active" | "expired" = "active";
        if (subscription.status === "trialing") status = "trial";
        else if (["canceled", "incomplete_expired", "unpaid", "past_due"].includes(subscription.status)) {
          status = "expired";
        }

        await supabase
          .from("merchants")
          .update({
            subscription_status: status,
            stripe_subscription_id: subscription.id,
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_customer_id", customerId);

        console.log(`[stripe-webhook] Abonnement mis à jour: ${subscription.status} → ${status}`);
        break;
      }

      // ── Abonnement annulé ──────────────────────────────────────
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        await supabase
          .from("merchants")
          .update({
            subscription_status: "expired",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_customer_id", customerId);

        console.log(`[stripe-webhook] Abonnement annulé pour customer ${customerId}`);
        break;
      }

      // ── Paiement réussi ────────────────────────────────────────
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        await supabase
          .from("merchants")
          .update({
            subscription_status: "active",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_customer_id", customerId);

        console.log(`[stripe-webhook] Paiement réussi pour customer ${customerId}`);
        break;
      }

      // ── Paiement échoué ────────────────────────────────────────
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        // On garde "active" pendant la période de grâce Stripe (quelques jours)
        // Stripe passe en "past_due" → géré par subscription.updated
        console.log(`[stripe-webhook] Paiement échoué pour customer ${customerId}`);
        break;
      }

      // ── Création customer Stripe ───────────────────────────────
      case "customer.created": {
        const customer = event.data.object as Stripe.Customer;
        const email = customer.email;

        if (email) {
          // Lier le stripe_customer_id au commerçant via email
          const { data: merchant } = await supabase
            .from("merchants")
            .select("id")
            .eq("user_id", (
              await supabase.auth.admin.getUserByEmail(email)
            ).data.user?.id ?? "")
            .single();

          if (merchant) {
            await supabase
              .from("merchants")
              .update({
                stripe_customer_id: customer.id,
                updated_at: new Date().toISOString(),
              })
              .eq("id", merchant.id);
          }
        }
        break;
      }

      default:
        console.log(`[stripe-webhook] Événement ignoré: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[stripe-webhook] Erreur interne:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
