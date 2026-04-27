
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://qvtttsyfjsmsozfpllzq.supabase.co',
  'sb_publishable_gZSROpMXmyicigroLFDgUA_Rp2cpS50'
);

async function findMerchant() {
  const { data, error } = await supabase
    .from('merchants')
    .select('id, name, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Error fetching merchants:', error);
    return;
  }
  console.log('Latest merchants:', JSON.stringify(data, null, 2));
}

findMerchant();
