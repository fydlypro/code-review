// ============================================================
// FYDLY — Intégration OneSignal SDK v16
// src/lib/onesignal.ts
//
// Compatible OneSignal Web SDK v16 (CDN v16).
// iPhone/iOS PWA supporté depuis iOS 16.4 en mode standalone.
// ============================================================
import { supabase } from "./supabase";

declare global {
  interface Window {
    OneSignal: any;
    OneSignalDeferred: any[];
  }
}

export type NotificationSegment = "all" | "active" | "inactive";

interface PushSendResult {
  success: boolean;
  recipients: number;
  error?: string;
}

// ── Accès sécurisé au SDK ────────────────────────────────────────────────────

function getOS(): any | null {
  return typeof window !== "undefined" ? window.OneSignal ?? null : null;
}

// ── Sauvegarde automatique du subscription ID en DB ──────────────────────────

async function autoSaveSubscriptionId(subscriptionId: string): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("customers")
      .update({ onesignal_player_id: subscriptionId })
      .eq("user_id", user.id);

    console.log("[OneSignal] Subscription ID auto-sauvegardé:", subscriptionId);
  } catch (err) {
    // Silencieux — l'utilisateur n'est peut-être pas encore connecté
  }
}

// ── Initialisation ────────────────────────────────────────────────────────────

// Guard pour éviter que initOneSignal() soit appelé plusieurs fois
// (hot-reload, double-mount) et accumule des listeners.
let _oneSignalInitialized = false;

export async function initOneSignal(): Promise<void> {
  if (_oneSignalInitialized) return;
  _oneSignalInitialized = true;

  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async function(OneSignal: any) {
    await OneSignal.init({
      appId: import.meta.env.VITE_ONESIGNAL_APP_ID,
      safari_web_id: import.meta.env.VITE_ONESIGNAL_SAFARI_WEB_ID,
      notifyButton: { enable: false },
      allowLocalhostAsSecureOrigin: true,
      // Le SW OneSignal est fusionné dans sw.js (importScripts) — sans ces
      // paramètres, OneSignal enregistre OneSignalSDKWorker.js qui entre en
      // conflit avec le SW de la PWA sur le scope "/" : la subscription
      // n'est jamais créée même quand la permission est accordée.
      serviceWorkerPath: "sw.js",
      serviceWorkerParam: { scope: "/" },
    });

    console.log("[OneSignal] SDK v16 initialisé.");

    const currentId = OneSignal.User?.PushSubscription?.id;
    if (currentId) {
      await autoSaveSubscriptionId(currentId);
    }

    const onSubscriptionChange = async (event: any) => {
      const id = event.current?.id;
      if (id) {
        await autoSaveSubscriptionId(id);
      }
    };
    OneSignal.User?.PushSubscription?.addEventListener("change", onSubscriptionChange);
  });
}

// ── Enregistrement explicite du player (appelé après login) ──────────────────

/**
 * Lit le subscription ID actuel et le sauvegarde pour ce client.
 * Appeler après authentification du client pour s'assurer que l'ID est à jour.
 */
export async function registerOneSignalPlayer(customerId: string): Promise<void> {
  const OneSignal = getOS();
  if (!OneSignal) return;

  try {
    const playerId = await OneSignal.User.PushSubscription.id;
    if (playerId) {
      await savePlayerIdForCustomer(customerId, playerId);
    }

    const onChange = async (event: any) => {
      const id = event.current?.id;
      if (id) {
        await savePlayerIdForCustomer(customerId, id);
      }
    };
    OneSignal.User?.PushSubscription?.addEventListener("change", onChange);
  } catch (err) {
    console.error("[OneSignal] Erreur registerOneSignalPlayer:", err);
  }
}

async function savePlayerIdForCustomer(customerId: string, subscriptionId: string): Promise<void> {
  const { error } = await supabase
    .from("customers")
    .update({ onesignal_player_id: subscriptionId })
    .eq("id", customerId);

  if (error) {
    console.error("[OneSignal] Erreur mise à jour player_id:", error);
  } else {
    console.log(`[OneSignal] Subscription ID enregistré pour customer ${customerId}:`, subscriptionId);
  }
}

// ── Permission / opt-in ───────────────────────────────────────────────────────

/**
 * Demande la permission native et déclenche l'opt-in OneSignal.
 * Retourne true dès que la permission OS est accordée, sans attendre
 * la création de la subscription (qui peut prendre 10-20s sur iOS).
 * L'enregistrement du player ID se fait ensuite via registerOneSignalPlayer().
 */
function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`[OneSignal] timeout ${label} (${ms}ms)`)), ms)
    ),
  ]);
}

export async function requestNotificationPermission(): Promise<boolean> {
  const OneSignal = getOS();
  if (!OneSignal) {
    console.error("[OneSignal] SDK non chargé (window.OneSignal absent)");
    return false;
  }

  try {
    // Timeout : le SDK peut rester suspendu indéfiniment si son init a échoué
    await withTimeout(OneSignal.Notifications.requestPermission(), 15000, "requestPermission");
    // Vérifier la permission réellement accordée — si l'OS a mémorisé un refus,
    // requestPermission() ne montre aucun prompt et ne lève aucune erreur.
    const granted =
      OneSignal.Notifications?.permission === true ||
      (typeof Notification !== "undefined" && Notification.permission === "granted");
    console.log("[OneSignal] permission accordée:", granted,
      "| Notification.permission:", typeof Notification !== "undefined" ? Notification.permission : "n/a",
      "| subscription id:", OneSignal.User?.PushSubscription?.id ?? null,
      "| optedIn:", OneSignal.User?.PushSubscription?.optedIn ?? null);
    if (granted) {
      try {
        // Force la création de la subscription (nécessaire si opt-out précédent)
        await withTimeout(OneSignal.User?.PushSubscription?.optIn?.(), 15000, "optIn");
      } catch (optErr) {
        // La permission est accordée — la subscription peut arriver plus tard
        // via le listener "change". On ne bloque pas l'UI pour autant.
        console.error("[OneSignal] optIn n'a pas abouti:", optErr);
      }
    }
    return granted;
  } catch (err) {
    console.error("[OneSignal] Erreur requestNotificationPermission:", err);
    return typeof Notification !== "undefined" && Notification.permission === "granted";
  }
}

/**
 * Vérifie si les notifications push sont activées pour cet appareil.
 */
export async function isPushEnabled(): Promise<boolean> {
  const OneSignal = getOS();
  if (!OneSignal) return false;
  try {
    return OneSignal.User?.PushSubscription?.optedIn ?? false;
  } catch {
    return false;
  }
}

/**
 * Désactive les notifications pour cet appareil (opt-out).
 */
export async function disablePushNotifications(): Promise<void> {
  const OneSignal = getOS();
  if (!OneSignal) return;
  try {
    await OneSignal.User?.PushSubscription?.optOut();
    console.log("[OneSignal] Notifications désactivées.");
  } catch (err) {
    console.error("[OneSignal] Erreur désactivation:", err);
  }
}

/**
 * Réactive les notifications pour cet appareil (opt-in).
 */
export async function enablePushNotifications(): Promise<void> {
  const OneSignal = getOS();
  if (!OneSignal) return;
  try {
    await OneSignal.User?.PushSubscription?.optIn();
    console.log("[OneSignal] Notifications réactivées.");
  } catch (err) {
    console.error("[OneSignal] Erreur réactivation:", err);
  }
}

// ── Envoi de notifications (via Edge Function sécurisée) ─────────────────────

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

  try {
    const { data, error } = await supabase.functions.invoke("send-push-notification", {
      body: { merchant_id: merchantId, message, segment },
    });

    if (error) {
      console.error("[OneSignal] Erreur sendPushNotification:", error);
      return { success: false, recipients: 0, error: error.message || "Erreur lors de l'envoi." };
    }

    return {
      success: data.success,
      recipients: data.recipients ?? 0,
      error: data.error,
    };
  } catch (err) {
    console.error("[OneSignal] Erreur sendPushNotification:", err);
    return { success: false, recipients: 0, error: "Erreur réseau. Vérifiez votre connexion." };
  }
}

// ── Compteur de destinataires ─────────────────────────────────────────────────

export async function getSegmentRecipientCount(
  merchantId: string,
  segment: NotificationSegment
): Promise<number> {
  try {
    // Jointure avec customers pour ne compter que ceux ayant un player_id (push activé)
    let query = supabase
      .from("loyalty_cards")
      .select("customer_id, customers!inner(onesignal_player_id)", { count: "exact", head: true })
      .eq("merchant_id", merchantId)
      .not("customers.onesignal_player_id", "is", null);

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
