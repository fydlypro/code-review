// ============================================================
// FYDLY — Intégration OneSignal
// src/lib/onesignal.ts
//
// Ce fichier gère l'initialisation du SDK OneSignal,
// l'enregistrement du player_id cliente et
// les appels à l'Edge Function send-push-notification.
// ============================================================
import { supabase } from "./supabase";

// ── Types ──────────────────────────────────────────────────────────────────────

export type NotificationSegment = "all" | "active" | "inactive";

interface PushSendResult {
  success: boolean;
  recipients: number;
  error?: string;
}

// ── State interne ──────────────────────────────────────────────────────────────

let initialized = false;

// ── Initialisation OneSignal ───────────────────────────────────────────────────

/**
 * Initialise le SDK OneSignal.
 * À appeler UNIQUEMENT côté client (pas en SSR).
 * Doit être appelé depuis main.tsx ou un useEffect top-level.
 */
export async function initOneSignal(): Promise<void> {
  if (initialized) return;

  const appId = import.meta.env.VITE_ONESIGNAL_APP_ID;

  if (!appId || appId === "VOTRE_ONESIGNAL_APP_ID") {
    console.warn("[OneSignal] VITE_ONESIGNAL_APP_ID non configuré — notifications désactivées.");
    return;
  }

  try {
    // Chargement dynamique du SDK pour ne pas bloquer le rendu initial
    const { default: OneSignal } = await import("onesignal-web");

    await OneSignal.init({
      appId,
      // Utilise notre service worker custom qui inclut aussi le SW OneSignal
      serviceWorkerPath: "/OneSignalSDKWorker.js",
      serviceWorkerParam: { scope: "/" },
      // Prompt automatique — on demande la permission au moment opportun
      promptOptions: {
        slidedown: {
          enabled: true,
          actionMessage:
            "Fydly souhaite vous envoyer des notifications pour vos récompenses et offres.",
          acceptButton: "Activer",
          cancelButton: "Non merci",
        },
      },
      // Ne pas montrer le prompt automatiquement — on le contrôle depuis Settings
      autoResubscribe: true,
      allowLocalhostAsSecureOrigin: import.meta.env.DEV,
    });

    initialized = true;
    console.log("[OneSignal] SDK initialisé avec succès.");
  } catch (err) {
    console.error("[OneSignal] Erreur d'initialisation:", err);
  }
}

// ── Enregistrement du Player ID ────────────────────────────────────────────────

/**
 * Récupère le player_id OneSignal du navigateur et le sauvegarde
 * dans la table `customers` (colonne onesignal_player_id).
 * À appeler après authentification du client.
 */
export async function registerOneSignalPlayer(customerId: string): Promise<void> {
  if (!initialized) return;

  try {
    const { default: OneSignal } = await import("onesignal-web");

    // Récupérer l'ID de l'appareil (player_id)
    const playerId = await OneSignal.getUserId();
    if (!playerId) {
      console.warn("[OneSignal] Pas de player_id — l'utilisateur n'a pas encore accepté les notifications.");
      return;
    }

    // Sauvegarder dans Supabase
    const { error } = await supabase
      .from("customers")
      .update({ onesignal_player_id: playerId })
      .eq("id", customerId);

    if (error) {
      console.error("[OneSignal] Erreur mise à jour player_id:", error);
      return;
    }

    console.log(`[OneSignal] Player ID enregistré pour customer ${customerId}`);
  } catch (err) {
    console.error("[OneSignal] Erreur registerOneSignalPlayer:", err);
  }
}

// ── Demande de permission ──────────────────────────────────────────────────────

/**
 * Affiche la demande de permission de notification.
 * À appeler depuis les Paramètres client (toggle).
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!initialized) {
    console.warn("[OneSignal] SDK non initialisé.");
    return false;
  }

  try {
    const { default: OneSignal } = await import("onesignal-web");
    await OneSignal.showSlidedownPrompt();

    // Vérifier si l'utilisateur a accepté
    const isSubscribed = await OneSignal.isPushNotificationsEnabled();
    return isSubscribed;
  } catch (err) {
    console.error("[OneSignal] Erreur requestNotificationPermission:", err);
    return false;
  }
}

/**
 * Vérifie si les notifications push sont activées pour cet appareil.
 */
export async function isPushEnabled(): Promise<boolean> {
  if (!initialized) return false;

  try {
    const { default: OneSignal } = await import("onesignal-web");
    return OneSignal.isPushNotificationsEnabled();
  } catch {
    return false;
  }
}

/**
 * Désactive les notifications pour cet appareil.
 */
export async function disablePushNotifications(): Promise<void> {
  if (!initialized) return;

  try {
    const { default: OneSignal } = await import("onesignal-web");
    await OneSignal.setSubscription(false);
    console.log("[OneSignal] Notifications désactivées.");
  } catch (err) {
    console.error("[OneSignal] Erreur désactivation:", err);
  }
}

/**
 * Réactive les notifications pour cet appareil.
 */
export async function enablePushNotifications(): Promise<void> {
  if (!initialized) return;

  try {
    const { default: OneSignal } = await import("onesignal-web");
    await OneSignal.setSubscription(true);
    console.log("[OneSignal] Notifications réactivées.");
  } catch (err) {
    console.error("[OneSignal] Erreur réactivation:", err);
  }
}

// ── Envoi de notifications (via Edge Function sécurisée) ─────────────────────

/**
 * Envoie une notification push à un segment de clients d'un commerçant.
 * Appelle l'Edge Function Supabase `send-push-notification` qui gère
 * la clé API OneSignal côté serveur de manière sécurisée.
 *
 * @param merchantId - ID du commerçant
 * @param segment - Segment ciblé
 * @param message - Message (max 140 caractères)
 */
export async function sendPushNotification(
  merchantId: string,
  segment: NotificationSegment,
  message: string
): Promise<PushSendResult> {
  if (message.length > 140) {
    return {
      success: false,
      recipients: 0,
      error: "Le message ne peut pas dépasser 140 caractères.",
    };
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    return { success: false, recipients: 0, error: "Non authentifié." };
  }

  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const response = await fetch(
      `${supabaseUrl}/functions/v1/send-push-notification`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          merchant_id: merchantId,
          message,
          segment,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        recipients: 0,
        error: data.error || "Erreur lors de l'envoi.",
      };
    }

    return {
      success: data.success,
      recipients: data.recipients ?? 0,
      error: data.error,
    };
  } catch (err) {
    console.error("[OneSignal] Erreur sendPushNotification:", err);
    return {
      success: false,
      recipients: 0,
      error: "Erreur réseau. Vérifiez votre connexion.",
    };
  }
}

// ── Compteur de destinataires ──────────────────────────────────────────────────

/**
 * Retourne le nombre estimé de destinataires pour un segment donné.
 * Utilisé pour afficher la confirmation avant envoi.
 */
export async function getSegmentRecipientCount(
  merchantId: string,
  segment: NotificationSegment
): Promise<number> {
  try {
    let query = supabase
      .from("loyalty_cards")
      .select("customer_id", { count: "exact", head: false })
      .eq("merchant_id", merchantId);

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    if (segment === "active") {
      query = query.gte("last_scan_at", thirtyDaysAgo);
    } else if (segment === "inactive") {
      query = query.lt("last_scan_at", thirtyDaysAgo);
    }

    const { count, error } = await query;
    if (error) throw error;
    return count ?? 0;
  } catch {
    return 0;
  }
}
