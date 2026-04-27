import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * FYDLY — Vercel Cron Job : Relances automatiques
 * 
 * Appelé quotidiennement par Vercel Cron (voir vercel.json).
 * Cette fonction appelle l'Edge Function Supabase `notify-inactive`
 * qui envoie des notifications push aux clients inactifs (+30 jours).
 * 
 * Alternative gratuite à pg_cron (Supabase Pro uniquement).
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Sécurité : vérifier que c'est bien Vercel Cron qui appelle
  const authHeader = req.headers['authorization'];
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error('[cron/notify-inactive] CRON_SECRET non configuré');
    return res.status(500).json({ error: 'CRON_SECRET non configuré' });
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Non autorisé' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  if (!supabaseUrl) {
    return res.status(500).json({ error: 'VITE_SUPABASE_URL non configuré' });
  }

  try {
    console.log('[cron/notify-inactive] Lancement des relances automatiques...');

    const response = await fetch(`${supabaseUrl}/functions/v1/notify-inactive`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cronSecret}`,
      },
      body: JSON.stringify({}),
    });

    const data = await response.json();

    console.log('[cron/notify-inactive] Résultat:', data);

    return res.status(200).json({
      success: true,
      message: 'Relances automatiques exécutées',
      result: data,
    });
  } catch (error: any) {
    console.error('[cron/notify-inactive] Erreur:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
