// ============================================================
// FYDLY — Service Worker
// Gestion du cache, des notifications push et du mode offline
// Généré automatiquement par vite-plugin-pwa (Workbox)
// Ce fichier est le point d'entrée custom — les injections Workbox
// viennent s'ajouter automatiquement lors du build.
// ============================================================

// 1. Import OneSignal SDK SW — DOIT être en premier pour que OneSignal
//    puisse s'enregistrer correctement dans ce service worker.
//    Sans ceci, Vite PWA et OneSignal s'enregistrent sur le scope /
//    en même temps et se bloquent mutuellement → onesignal_player_id
//    reste null et aucune notification n'est jamais reçue.
importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

// 2. Precaching Workbox (injecté automatiquement par vite-plugin-pwa)
const WB_MANIFEST = self.__WB_MANIFEST || []
WB_MANIFEST // utilisé pour le precaching Workbox

// 3. Écoute le clic sur une notification
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "dismiss") return;

  const notifData = event.notification.data || {};
  let targetUrl = "/customer/card";

  // Rediriger selon le type de notification
  switch (notifData.type) {
    case "reward_unlocked":
    case "reward_validated":
    case "reward_expired":
      targetUrl = "/customer/card";
      break;
    case "merchant_push":
      targetUrl = notifData.merchant_id
        ? `/customer/card?m=${notifData.merchant_id}`
        : "/customer/card";
      break;
    case "trial_expiring":
      targetUrl = "/merchant/billing";
      break;
    default:
      targetUrl = notifData.url || "/scan";
  }

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Si une fenêtre est déjà ouverte, naviguer dedans
        for (const client of clientList) {
          if (client.url && "focus" in client) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
        // Sinon ouvrir une nouvelle fenêtre
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});

// 4. Installation — Claim immédiat des clients (skipWaiting géré par workbox)
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});

// 5. Message depuis l'app React (pour debugging/contrôle)
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
