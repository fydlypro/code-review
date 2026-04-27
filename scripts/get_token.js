
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://qvtttsyfjsmsozfpllzq.supabase.co',
  'sb_publishable_gZSROpMXmyicigroLFDgUA_Rp2cpS50'
);

async function getToken() {
  const merchantId = '7a9ef3c9-baa0-4e3c-8788-9769f798fc32';
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('qr_tokens')
    .select('token')
    .eq('merchant_id', merchantId)
    .eq('valid_date', today)
    .eq('is_active', true)
    .maybeSingle();

  if (error || !data) {
    console.log('No token for today? Creating one...');
    const { data: newToken, error: iErr } = await supabase
        .from('qr_tokens')
        .insert({
            merchant_id: merchantId,
            token: `TEST_${Math.random().toString(36).substring(7).toUpperCase()}`,
            valid_date: today,
            is_active: true
        })
        .select('token')
        .single();
    if (iErr) console.error(iErr);
    else console.log('TOKEN:', newToken.token);
  } else {
    console.log('TOKEN:', data.token);
  }
}

getToken();
