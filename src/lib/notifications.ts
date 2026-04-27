// ============================================================
// FYDLY — Logique Métier Notifications
// src/lib/notifications.ts
//
// Fonctions métier appelées après les événements clés (scan, etc.)
// Appelle l'Edge Function send-individual-push côté serveur.
// ============================================================
import { supabase } from "./supabase";

/**
 * Appelle l'Edge Function send-individual-push.
 * Silencieux en cas d'échec — les notifications ne sont jamais bloquantes.
 */
async function sendIndividualPush(customerId: string, message: string, type: string): Promise<void> {
  try {
    await supabase.functions.invoke("send-individual-push", {
      body: { customer_id: customerId, message, type },
    });
  } catch {
    // Non bloquant — l'expérience utilisateur ne doit pas en dépendre
  }
}

/**
 * Envoie une notification quand la récompense est débloquée (solde atteint).
 * @param customerId ID du client (table customers)
 * @param merchantName Nom du commerce
 * @param rewardDescription Description de la récompense
 */
export async function notifyRewardUnlocked(
  customerId: string,
  merchantName: string,
  rewardDescription: string
): Promise<void> {
  const message = `🎁 Félicitations ! Vous avez gagné : ${rewardDescription} chez ${merchantName}.`;
  await sendIndividualPush(customerId, message, "reward_unlocked");
}

/**
 * Notification lors de la validation d'une récompense par le commerçant.
 * @param customerId ID du client (table customers)
 * @param rewardDescription Description de la récompense
 */
export async function notifyRewardValidated(
  customerId: string,
  rewardDescription: string
): Promise<void> {
  const message = `✅ Profitez de votre ${rewardDescription} ! Merci de votre fidélité.`;
  await sendIndividualPush(customerId, message, "reward_validated");
}
