
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://qvtttsyfjsmsozfpllzq.supabase.co',
  'sb_publishable_gZSROpMXmyicigroLFDgUA_Rp2cpS50'
);

async function checkOnboarding() {
    const { data: merchant } = await supabase
        .from('merchants')
        .select('*')
        .eq('id', '7a9ef3c9-baa0-4e3c-8788-9769f798fc32')
        .single();
    
    console.log('MERCHANT PROFILE:', JSON.stringify(merchant));
    if (merchant?.program_type) {
        console.log('ONBOARDING: COMPLETE');
    } else {
        console.log('ONBOARDING: STILL PENDING');
    }
}

checkOnboarding();
