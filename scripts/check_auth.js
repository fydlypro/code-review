
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://qvtttsyfjsmsozfpllzq.supabase.co',
  'sb_publishable_gZSROpMXmyicigroLFDgUA_Rp2cpS50'
);

async function checkUser() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'test@fydly.com',
    password: 'password123'
  });

  if (error) {
    console.log('Auth check:', error.message);
  } else {
    console.log('Auth check: Success, session present');
  }
}

checkUser();
