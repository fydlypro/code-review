// ============================================================
// FYDLY — Intégration Stripe
// src/lib/stripe.ts
//
// Gestion des plans, checkout et customer portal Stripe.
// Les appels utilisent des Edge Functions Supabase
// pour ne jamais exposer la clé secrète côté client.
// ============================================================
import { supabase } from "./supabase";

// ── Plans Stripe ───────────────────────────────────────────────────────────────

export interface StripePlan {
  id: string;
  name: string;
  price: number; // en euros
  period: "mois";
  description: string;
  features: string[];
  highlighted?: boolean;
  badge?: string;
}

/**
 * Définition des 3 plans Fydly selon instruction.md
 * Les price_id Stripe sont à configurer dans Supabase Edge Function secrets.
 */
export const STRIPE_PLANS: StripePlan[] = [
  {
    id: "pro",
    name: "Pro",
    price: 59.99,
    period: "mois",
    description: "La solution complète pour engager vos clients au quotidien",
    highlighted: true,
    badge: "Le plus populaire",
    features: [
      "1 établissement",
      "Clients illimités",
      "QR code automatique du jour",
      "Notifications push illimitées",
      "Analytics complets + recommandations IA",
      "Segmentation clients (actifs / inactifs / VIP)",
      "Export CSV clients",
      "Support email (réponse sous 48h)",
    ],
  },
  {
    id: "business",
    name: "Business",
    price: 109.99,
    period: "mois",
    description: "Pour les réseaux et multi-établissements avec accompagnement personnalisé",
    features: [
      "Tout le plan Pro inclus",
      "Jusqu'à 5 établissements",
      "Dashboard centralisé multi-sites",
      "Clients partagés entre établissements",
      "API accès + personnalisation avancée",
      "Appel de lancement en visio (1h)",
      "Audit mensuel du programme (30 min)",
      "Accès WhatsApp direct — fondateur",
    ],
  },
];

// ── Création d'une session Checkout ───────────────────────────────────────────

interface CheckoutResult {
  url: string | null;
  error?: string;
}

/**
 * Crée une session de paiement Stripe Checkout.
 * L'Edge Function `create-checkout` génère l'URL de manière sécurisée.
 *
 * @param merchantId - UUID du commerçant
 * @param planId - "starter" | "pro" | "business"
 */
export async function createCheckoutSession(
  merchantId: string,
  planId: string
): Promise<CheckoutResult> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return { url: null, error: "Non authentifié." };
  }

  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const response = await fetch(`${supabaseUrl}/functions/v1/create-checkout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        merchant_id: merchantId,
        plan_id: planId,
        success_url: `${window.location.origin}/merchant/billing?success=true`,
        cancel_url: `${window.location.origin}/merchant/billing?canceled=true`,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { url: null, error: data.error || "Erreur lors de la création du paiement." };
    }

    return { url: data.url };
  } catch (err) {
    console.error("[Stripe] Erreur createCheckoutSession:", err);
    return { url: null, error: "Erreur réseau. Veuillez réessayer." };
  }
}

/**
 * Redirige le commerçant vers la page Stripe Checkout.
 * Gère automatiquement la redirection.
 */
export async function redirectToCheckout(
  merchantId: string,
  planId: string
): Promise<{ error?: string }> {
  const result = await createCheckoutSession(merchantId, planId);

  if (result.error || !result.url) {
    return { error: result.error || "Impossible de créer la session de paiement." };
  }

  // Redirection vers Stripe Checkout
  window.location.href = result.url;
  return {};
}

// ── Customer Portal ────────────────────────────────────────────────────────────

interface PortalResult {
  url: string | null;
  error?: string;
}

/**
 * Crée une session Stripe Customer Portal pour gérer l'abonnement.
 * Permet au commerçant de : changer de plan, annuler, voir les factures.
 *
 * @param merchantId - UUID du commerçant
 */
export async function createCustomerPortalSession(
  merchantId: string
): Promise<PortalResult> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return { url: null, error: "Non authentifié." };
  }

  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const response = await fetch(`${supabaseUrl}/functions/v1/create-portal`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({
        merchant_id: merchantId,
        return_url: `${window.location.origin}/merchant/billing`,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { url: null, error: data.error || "Erreur portail abonnement." };
    }

    return { url: data.url };
  } catch (err) {
    console.error("[Stripe] Erreur createCustomerPortalSession:", err);
    return { url: null, error: "Erreur réseau. Veuillez réessayer." };
  }
}

/**
 * Redirige le commerçant vers le Stripe Customer Portal.
 */
export async function redirectToCustomerPortal(
  merchantId: string
): Promise<{ error?: string }> {
  const result = await createCustomerPortalSession(merchantId);

  if (result.error || !result.url) {
    return { error: result.error || "Impossible d'accéder au portail." };
  }

  window.location.href = result.url;
  return {};
}

// ── Utilitaires ────────────────────────────────────────────────────────────────

/**
 * Calcule les jours restants avant la fin du trial.
 * Retourne un nombre négatif si le trial est expiré.
 */
export function getTrialDaysLeft(trialEndsAt: string): number {
  const now = new Date();
  const endDate = new Date(trialEndsAt);
  const diffMs = endDate.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Retourne la couleur de la bannière trial selon les jours restants
 */
export function getTrialBannerColor(daysLeft: number): {
  bg: string;
  border: string;
  text: string;
  badge: string;
} {
  if (daysLeft <= 0) {
    // Expiré
    return {
      bg: "#FFEBEE",
      border: "#FFCDD2",
      text: "#C62828",
      badge: "#FFEBEE",
    };
  }
  if (daysLeft <= 7) {
    // Urgent — orange
    return {
      bg: "#FFF3E0",
      border: "#FFE0B2",
      text: "#E65100",
      badge: "#FFF3E0",
    };
  }
  // Normal — bleu
  return {
    bg: "#E3F2FD",
    border: "#BBDEFB",
    text: "#1565C0",
    badge: "#E3F2FD",
  };
}
