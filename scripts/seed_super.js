
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qvtttsyfjsmsozfpllzq.supabase.co';
const supabaseKey = 'sb_publishable_gZSROpMXmyicigroLFDgUA_Rp2cpS50';
const merchantId = '7a9ef3c9-baa0-4e3c-8788-9769f798fc32';

async function generateData() {
  console.log('--- SEEDING PHASE 2: REAL CUSTOMERS ---');

  const names = ['Alice Durand', 'Marc Petit', 'Sophie Lefebvre', 'Julien Brun', 'Emma Berger'];
  
  for (const name of names) {
    const email = `customer_${name.toLowerCase().replace(' ', '_')}_${Math.random().toString(36).substring(7)}@fydly-test.com`;
    console.log(`Processing ${name}...`);

    // Create a dedicated client for this customer to handle its own session
    const customerClient = createClient(supabaseUrl, supabaseKey);
    
    try {
      // 1. SignUp
      const { data: auth, error: aErr } = await customerClient.auth.signUp({
        email,
        password: 'password123'
      });
      if (aErr) throw aErr;
      const userId = auth.user.id;

      // 2. Insert Customer Profile (Authenticated as the newly created customer)
      const { data: customer, error: cErr } = await customerClient
        .from('customers')
        .insert({
          user_id: userId,
          email: email,
          first_name: name.split(' ')[0],
          gdpr_accepted_at: new Date().toISOString()
        })
        .select('id')
        .single();
      if (cErr) throw cErr;

      // 3. Create Loyalty Card for Merchant
      const balance = Math.floor(Math.random() * 8) + 1;
      const { data: card, error: lcErr } = await customerClient
        .from('loyalty_cards')
        .insert({
          customer_id: customer.id,
          merchant_id: merchantId,
          balance: balance,
          total_earned: balance + 10,
          last_scan_at: new Date().toISOString()
        })
        .select('id')
        .single();
      if (lcErr) throw lcErr;

      // 4. Fake transactions
      const txCount = 5 + Math.floor(Math.random() * 5);
      const txs = [];
      for (let i = 0; i < txCount; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (i * 3 + Math.floor(Math.random() * 2)));
        txs.push({
          card_id: card.id,
          customer_id: customer.id,
          merchant_id: merchantId,
          type: 'earn',
          amount: 1,
          created_at: date.toISOString()
        });
      }
      await customerClient.from('transactions').insert(txs);
      
      console.log(`- Success for ${name}`);
    } catch (e) {
      console.error(`- Failed for ${name}:`, e.message);
    }
  }

  // ALSO: Force update merchant to complete onboarding
  const mClient = createClient(supabaseUrl, supabaseKey);
  await mClient.auth.signInWithPassword({ email: 'test@fydly.com', password: 'password123' });
  await mClient.from('merchants').update({
    program_type: 'stamps',
    reward_threshold: 10,
    reward_description: '1 café offert'
  }).eq('id', merchantId);

  console.log('--- ALL DONE ---');
}

generateData();
