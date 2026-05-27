// ============================================================
// FYDLY — Sécurité et Validation
// src/lib/security.ts
// ============================================================

/**
 * Vérifie le format d'un email.
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Sanitize une chaîne de caractères pour éviter l'injection XSS basique.
 * Affiche la valeur tout en neutralisant le HTML.
 */
export function sanitizeInput(str: string): string {
  if (!str) return "";
  const div = document.createElement("div");
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

/**
 * Vérifie que l'URL scannée est potentiellement un lien Fydly valide
 * avant même de tenter un appel API.
 */
const ALLOWED_HOSTS = ["fydly.vercel.app", "www.fydly.com", "fydly.com", "localhost"];

export function isValidFydlyQRUrl(url: string): boolean {
  try {
    const parsed = new URL(url);

    if (!ALLOWED_HOSTS.includes(parsed.hostname)) return false;

    const token = parsed.searchParams.get("token");
    const merchantId = parsed.searchParams.get("m");

    if (!token || !merchantId) return false;

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuidRegex.test(merchantId)) return false;

    return true;
  } catch {
    return false;
  }
}

/**
 * Redirige vers la version HTTPS si on est en HTTP (en production).
 * Sécurité de base, à appeler au démarrage.
 */
export function enforceHTTPS(): void {
  if (
    import.meta.env.PROD &&
    window.location.protocol !== "https:" &&
    window.location.hostname !== "localhost"
  ) {
    window.location.href = `https://${window.location.hostname}${window.location.pathname}${window.location.search}`;
  }
}
