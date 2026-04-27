
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://qvtttsyfjsmsozfpllzq.supabase.co',
  'sb_publishable_gZSROpMXmyicigroLFDgUA_Rp2cpS50'
);

async function checkMerchant() {
    const { data: merchant, error } = await supabase.auth.signInWithPassword({
        email: 'test@fydly.com',
        password: 'password123'
    });
    if (error) { console.error(error); return; }

    const { data: profile } = await supabase
        .from('merchants')
        .select('*')
        .eq('user_id', merchant.user.id)
        .single();
    
    console.log('MERCHANT_PROFILE:', JSON.stringify(profile));
}

checkMerchant();
