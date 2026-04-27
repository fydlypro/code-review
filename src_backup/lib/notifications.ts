// ============================================================
// FYDLY — Logique Métier Notifications
// src/lib/notifications.ts
//
// Fonctions métier appelées après les événements clés (scan, etc.)
// Utilise le SDK OneSignal sous le capot.
// ============================================================
import { supabase } from "./supabase";
import { isPushEnabled } from "./onesignal";

/**
 * Envoie une notification quand la récompense est débloquée (solde atteint).
 * @param customerId ID du client
 * @param merchantName Nom du commerce
 * @param rewardDescription Description de la récompense
 */
export async function notifyRewardUnlocked(
  customerId: string,
  merchantName: string,
  rewardDescription: string
): Promise<void> {
  try {
    const { data: customer } = await supabase
      .from("customers")
      .select("onesignal_player_id")
      .eq("id", customerId)
      .single();

    if (!customer?.onesignal_player_id) return;

    // Appel à l'API système (backend) car le call direct n'autorise pas tout
    // Dans Fydly, le cron ou une edge function "system-push" serait idéal.
    // Mais pour une PWA client-side, on s'appuie sur la Edge Function
    // 'send-push-notification' pour les envois commerçant.
    // Le système va envoyer via l'Edge de notification si on veut simplifier.
    
    // Note: Pour une implémentation complète, une table queue_notifications
    // ou une fonction déclencheur côté DB est préférable.
    console.log(
      `[Notif] Push à envoyer à ${customer.onesignal_player_id}: 🎁 Félicitations ! Vous avez gagné : ${rewardDescription} chez ${merchantName}.`
    );
  } catch (error) {
    console.error("[Notifications] Erreur notifyRewardUnlocked:", error);
  }
}

/**
 * Notification lors de la validation d'une récompense par le commerçant.
 */
export async function notifyRewardValidated(
  customerId: string,
  rewardDescription: string
): Promise<void> {
  try {
    const { data: customer } = await supabase
      .from("customers")
      .select("onesignal_player_id")
      .eq("id", customerId)
      .single();

    if (!customer?.onesignal_player_id) return;

    console.log(
      `[Notif] Push à envoyer à ${customer.onesignal_player_id}: ✅ Profitez de votre ${rewardDescription} !`
    );
  } catch (error) {
    console.error("[Notifications] Erreur notifyRewardValidated:", error);
  }
}
