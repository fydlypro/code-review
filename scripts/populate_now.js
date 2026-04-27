
import { createClient } from '@supabase/supabase-js';

const URL = 'https://qvtttsyfjsmsozfpllzq.supabase.co';
const KEY = 'sb_publishable_gZSROpMXmyicigroLFDgUA_Rp2cpS50';
const MERCHANT_ID = '7a9ef3c9-baa0-4e3c-8788-9769f798fc32';

async function populate() {
  const supabase = createClient(URL, KEY);
  console.log('--- STARTING AUTO-POPULATION ---');

  const names = ['Alice', 'Bob', 'Charlie', 'David', 'Eva', 'Frank', 'Grace', 'Henry'];
  
  for (const name of names) {
    const email = `test_${name.toLowerCase()}_${Math.random().toString(36).substring(7)}@fydly-test.com`;
    console.log(`Processing ${name} (${email})...`);

    try {
      // 1. SignUp
      const { data: auth, error: aErr } = await supabase.auth.signUp({
        email,
        password: 'password123'
      });
      if (aErr) throw aErr;
      const user = auth.user;

      // 2. Create customer client and sign in
      const customerSupabase = createClient(URL, KEY);
      await customerSupabase.auth.signInWithPassword({ email, password: 'password123' });

      // 3. Insert customer profile
      const { data: profile, error: pErr } = await customerSupabase
        .from('customers')
        .insert({
          user_id: user.id,
          email: email,
          first_name: name
        })
        .select('id')
        .single();
      if (pErr) throw pErr;

      // 4. Attribute a stamp (the real way!)
      const { data: result, error: rpcErr } = await customerSupabase.rpc('upsert_stamp', {
        p_customer_id: profile.id,
        p_merchant_id: MERCHANT_ID,
        p_qr_token_used: 'DUMMY_TOKEN_SEED'
      });
      if (rpcErr) console.warn(`  RPC warning for ${name}:`, rpcErr.message);
      else console.log(`  ✅ ${name} registered and scanned!`);

    } catch (err) {
      console.error(`  ❌ Failed for ${name}:`, err.message);
    }
  }

  console.log('--- AUTO-POPULATION FINISHED ---');
}

populate();
