
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://qvtttsyfjsmsozfpllzq.supabase.co',
  'sb_publishable_gZSROpMXmyicigroLFDgUA_Rp2cpS50'
);

async function findMerchant() {
    const { data, error } = await supabase.auth.signInWithPassword({
        email: 'test@fydly.com',
        password: 'password123'
    });

    if (error) {
        console.error('Login error:', error.message);
        return;
    }

    const { data: merchant } = await supabase
        .from('merchants')
        .select('id, name')
        .eq('user_id', data.user.id)
        .single();
    
    console.log('MERCHANT:', JSON.stringify(merchant));
}

findMerchant();
