// ============================================================
// FYDLY — Anti-Fraude et Rate Limiting
// src/lib/rateLimiter.ts
//
// Protège l'application contre le spam ou le brute-force.
// ============================================================
import { supabase } from "./supabase";

const LOGIN_ATTEMPTS_KEY = "fydly_login_attempts";
const MAX_LOGIN_ATTEMPTS = 10;
const LOGIN_BAN_MINUTES = 60;

interface AttemptRecord {
  count: number;
  lastAttemptAt: number; // timestamp
}

/**
 * Vérifie si l'utilisateur courant (par IP/navigateur) est bloqué pour login.
 * Utilise le localStorage comme première barrière.
 * (Note: La vraie protection IP se fait côté Edge Function / Supabase limiters)
 */
export function isLoginRateLimited(): { limited: boolean; timeLeftMs?: number } {
  const recordStr = localStorage.getItem(LOGIN_ATTEMPTS_KEY);
  if (!recordStr) return { limited: false };

  try {
    const record: AttemptRecord = JSON.parse(recordStr);
    
    // Si la limite est atteinte
    if (record.count >= MAX_LOGIN_ATTEMPTS) {
      const banDurationMs = LOGIN_BAN_MINUTES * 60 * 1000;
      const timePassed = Date.now() - record.lastAttemptAt;
      
      if (timePassed < banDurationMs) {
        return { limited: true, timeLeftMs: banDurationMs - timePassed };
      }
      
      // La durée de ban est passée, on reset
      localStorage.removeItem(LOGIN_ATTEMPTS_KEY);
      return { limited: false };
    }
    
    return { limited: false };
  } catch {
    // Si JSON invalide, on reset
    localStorage.removeItem(LOGIN_ATTEMPTS_KEY);
    return { limited: false };
  }
}

/**
 * Enregistre une tentative de connexion échouée.
 */
export function recordFailedLogin(): void {
  const recordStr = localStorage.getItem(LOGIN_ATTEMPTS_KEY);
  let record: AttemptRecord = { count: 0, lastAttemptAt: Date.now() };

  if (recordStr) {
    try {
      record = JSON.parse(recordStr);
    } catch {
      // Ignorer erreur parsing
    }
  }

  record.count += 1;
  record.lastAttemptAt = Date.now();
  localStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify(record));
}

/**
 * Réinitialise les tentatives après un login réussi.
 */
export function resetLoginAttempts(): void {
  localStorage.removeItem(LOGIN_ATTEMPTS_KEY);
}

/**
 * Vérifie l'anti-fraude des scans : 1 scan autorisé par 60 minutes.
 * Vérifie côté base de données pour plus de sécurité.
 */
export async function checkScanRateLimit(
  customerId: string,
  merchantId: string
): Promise<{ allowed: boolean; minutesRemaining: number }> {
  try {
    const { data: card, error } = await supabase
      .from("loyalty_cards")
      .select("last_scan_at")
      .eq("customer_id", customerId)
      .eq("merchant_id", merchantId)
      .single();

    if (error && error.code !== "PGRST116") { // 116 = pas trouvé, donc 1er scan autorisé
      throw error;
    }

    if (!card || !card.last_scan_at) {
      return { allowed: true, minutesRemaining: 0 };
    }

    const lastScanDate = new Date(card.last_scan_at);
    const timeSinceLastScan = Date.now() - lastScanDate.getTime();
    const Mins60Ms = 60 * 60 * 1000;

    if (timeSinceLastScan < Mins60Ms) {
      const msRemaining = Mins60Ms - timeSinceLastScan;
      return {
        allowed: false,
        minutesRemaining: Math.ceil(msRemaining / (60 * 1000)),
      };
    }

    return { allowed: true, minutesRemaining: 0 };
  } catch (error) {
    console.error("[RateLimiter] Erreur checkScanRateLimit:", error);
    // En cas d'erreur de vérif, on bloque par précaution
    return { allowed: false, minutesRemaining: 60 };
  }
}
