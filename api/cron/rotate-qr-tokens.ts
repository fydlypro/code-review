import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * FYDLY — Vercel Cron Job : Rotation des QR tokens
 * Appelé quotidiennement à 00h00 UTC.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const authHeader = req.headers['authorization'];
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Non autorisé' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  if (!supabaseUrl) {
    return res.status(500).json({ error: 'VITE_SUPABASE_URL non configuré' });
  }

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/rotate-qr-tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cronSecret}`,
      },
      body: JSON.stringify({}),
    });

    const data = await response.json();
    return res.status(200).json({ success: true, result: data });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
}
