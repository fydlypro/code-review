
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://qvtttsyfjsmsozfpllzq.supabase.co',
  'sb_publishable_gZSROpMXmyicigroLFDgUA_Rp2cpS50'
);

async function getMerchantID() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'test@fydly.com',
    password: 'password123'
  });

  if (error || !data.user) {
    console.error('Login failed', error);
    return;
  }
  const userId = data.user.id;
  const { data: merchant, error: mErr } = await supabase
    .from('merchants')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (mErr || !merchant) {
    console.error('Merchant not found for userId:', userId, mErr);
    return;
  }
  console.log('MERCHANT_ID:', merchant.id);
}

getMerchantID();
