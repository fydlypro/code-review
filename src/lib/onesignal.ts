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

  const appId = import.meta.env.VITE_ONESIGNAL_APP_ID;

  if (!appId || appId === "VOTRE_ONESIGNAL_APP_ID") {
    console.warn("[OneSignal] VITE_ONESIGNAL_APP_ID non configuré — notifications désactivées.");
    return;
  }

  const safariWebId = import.meta.env.VITE_ONESIGNAL_SAFARI_WEB_ID;

  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async (OneSignal: any) => {
    try {
      const initConfig: Record<string, any> = {
        appId,
        serviceWorkerPath: "/sw.js",
        serviceWorkerUpdaterPath: "/sw.js",
        serviceWorkerParam: { scope: "/" },
        autoResubscribe: true,
        allowLocalhostAsSecureOrigin: import.meta.env.DEV,
        promptOptions: {
          slidedown: {
            prompts: [{
              type: "push",
              autoPrompt: false,
              text: {
                actionMessage: "Fydly souhaite vous envoyer des notifications pour vos récompenses et offres.",
                acceptButton: "Activer",
                cancelButton: "Non merci",
              },
            }],
          },
        },
      };

      if (safariWebId && safariWebId !== "VOTRE_ONESIGNAL_SAFARI_WEB_ID") {
        initConfig.safari_web_id = safariWebId;
      }

      await OneSignal.init(initConfig);

      console.log("[OneSignal] SDK v16 initialisé.");

      // Sauvegarder le subscription ID si déjà abonné (retour utilisateur)
      const currentId: string | undefined = OneSignal.User?.PushSubscription?.id;
      if (currentId) {
        await autoSaveSubscriptionId(currentId);
      }

      // Listener unique — le guard _oneSignalInitialized garantit qu'il n'est
      // enregistré qu'une seule fois, évitant les doublons de writes en DB.
      const onSubscriptionChange = async (event: any) => {
        const id: string | undefined = event.current?.id;
        if (id) {
          await autoSaveSubscriptionId(id);
        }
      };
      OneSignal.User?.PushSubscription?.addEventListener("change", onSubscriptionChange);
    } catch (err) {
      console.error("[OneSignal] Erreur d'initialisation:", err);
    }
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

  if (typeof Notification !== "undefined" && Notification.permission !== "granted") {
    console.log("[OneSignal] Permission non accordée — pas d'enregistrement.");
    return;
  }

  try {
    // Attendre que le SDK soit prêt — borné à 15s pour éviter une boucle infinie
    // si le SDK ne charge jamais (adblock, erreur réseau).
    await new Promise<void>((resolve) => {
      let attempts = 0;
      const MAX_ATTEMPTS = 50; // 50 × 300ms = 15s
      const check = () => {
        if (OneSignal.User?.PushSubscription !== undefined) {
          resolve();
        } else if (attempts >= MAX_ATTEMPTS) {
          console.warn("[OneSignal] SDK PushSubscription non disponible après 15s — abandon.");
          resolve();
        } else {
          attempts++;
          setTimeout(check, 300);
        }
      };
      setTimeout(check, 300);
    });

    let subscriptionId: string | undefined = OneSignal.User?.PushSubscription?.id;

    if (!subscriptionId) {
      console.log("[OneSignal] Pas de subscription — tentative optIn() et attente APNs (iOS peut prendre 30s)...");
      try {
        await OneSignal.User?.PushSubscription?.optIn();
      } catch {
        // optIn peut échouer si déjà en cours
      }
      // iOS prend parfois 20-30s pour le handshake APNs — attendre jusqu'à 45s
      for (let i = 0; i < 150; i++) {
        subscriptionId = OneSignal.User?.PushSubscription?.id;
        if (subscriptionId) break;
        await new Promise<void>((resolve) => setTimeout(resolve, 300));
      }
    }

    if (!subscriptionId) {
      console.log("[OneSignal] Toujours pas de subscription après 45s — abandon.");
      return;
    }

    const { error } = await supabase
      .from("customers")
      .update({ onesignal_player_id: subscriptionId })
      .eq("id", customerId);

    if (error) {
      console.error("[OneSignal] Erreur mise à jour player_id:", error);
    } else {
      console.log(`[OneSignal] Subscription ID enregistré pour customer ${customerId}:`, subscriptionId);
    }
  } catch (err) {
    console.error("[OneSignal] Erreur registerOneSignalPlayer:", err);
  }
}

// ── Permission / opt-in ───────────────────────────────────────────────────────

/**
 * Demande la permission native et déclenche l'opt-in OneSignal.
 * Retourne true dès que la permission OS est accordée, sans attendre
 * la création de la subscription (qui peut prendre 10-20s sur iOS).
 * L'enregistrement du player ID se fait ensuite via registerOneSignalPlayer().
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof Notification === "undefined" || !("Notification" in window)) {
    console.warn("[OneSignal] API Notification non disponible.");
    return false;
  }

  if (Notification.permission === "denied") {
    console.warn("[OneSignal] Permission déjà refusée dans les réglages système.");
    return false;
  }

  const OneSignal = getOS();

  // Déjà opt-in → succès immédiat
  if (OneSignal?.User?.PushSubscription?.optedIn) {
    return true;
  }

  try {
    if (Notification.permission !== "granted") {
      // Appel natif direct pour afficher le dialog iOS/Android.
      // NE PAS utiliser OneSignal.Notifications.requestPermission() car il ne
      // déclenche pas le dialog système Apple et peut bloquer indéfiniment.
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        console.log("[OneSignal] Permission refusée par l'utilisateur.");
        return false;
      }
    }

    // Permission accordée — déclencher l'opt-in OneSignal en arrière-plan.
    // On ne l'attend PAS ici car sur iOS cela peut prendre 10-30s (handshake APNs).
    // registerOneSignalPlayer() sera appelé ensuite avec un timeout plus généreux.
    if (OneSignal) {
      OneSignal.User?.PushSubscription?.optIn().catch(() => {});
    }

    return true;
  } catch (err) {
    console.error("[OneSignal] Erreur requestNotificationPermission:", err);
    return false;
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
