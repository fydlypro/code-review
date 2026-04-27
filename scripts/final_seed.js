
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://qvtttsyfjsmsozfpllzq.supabase.co',
  'sb_publishable_gZSROpMXmyicigroLFDgUA_Rp2cpS50'
);

async function finalSeeding() {
  console.log('--- STARTING FINAL SEEDING ---');

  // 1. LOGIN as Merchant
  console.log('Logging in as merchant...');
  const { data: mAuth, error: mAuthErr } = await supabase.auth.signInWithPassword({
    email: 'test@fydly.com',
    password: 'password123'
  });
  if (mAuthErr) {
    console.error('Merchant login failed', mAuthErr);
    return;
  }
  const merchantId = '7a9ef3c9-baa0-4e3c-8788-9769f798fc32';

  // 2. COMPLETE ONBOARDING (via update)
  console.log('Completing onboarding...');
  const { error: upErr } = await supabase
    .from('merchants')
    .update({
      program_type: 'stamps',
      reward_threshold: 10,
      reward_description: '1 café offert',
      subscription_status: 'trial'
    })
    .eq('id', merchantId);
  if (upErr) console.error('Update merchant error:', upErr);

  // 3. SEED 5 CUSTOMERS
  const names = ['Alice Durand', 'Marc Petit', 'Sophie Lefebvre', 'Julien Brun', 'Emma Berger'];
  
  for (const name of names) {
    const email = `${name.toLowerCase().replace(' ', '.')}.${Math.random().toString(36).substring(7)}@fy-test.com`;
    console.log(`Creating customer: ${name} (${email})...`);
    
    try {
        const { data: cAuth, error: cAuthErr } = await supabase.auth.signUp({
            email: email,
            password: 'password123'
        });
        if (cAuthErr) throw cAuthErr;

        const { data: customer, error: cErr } = await supabase
            .from('customers')
            .insert({
                user_id: cAuth.user.id,
                email: email,
                first_name: name.split(' ')[0],
                gdpr_accepted_at: new Date().toISOString()
            })
            .select()
            .single();
        if (cErr) throw cErr;

        const balance = Math.floor(Math.random() * 9) + 1;
        const { data: card, error: cardErr } = await supabase
            .from('loyalty_cards')
            .insert({
                customer_id: customer.id,
                merchant_id: merchantId,
                balance: balance,
                total_earned: balance + 5,
                last_scan_at: new Date().toISOString()
            })
            .select()
            .single();
        if (cardErr) throw cardErr;

        // Transactions
        const txs = [];
        for (let i = 0; i < 8; i++) {
            const date = new Date();
            date.setDate(date.getDate() - (i * 2 + Math.floor(Math.random() * 3)));
            txs.push({
                card_id: card.id,
                customer_id: customer.id,
                merchant_id: merchantId,
                type: 'earn',
                amount: 1,
                created_at: date.toISOString()
            });
        }
        await supabase.from('transactions').insert(txs);
        console.log(`  成功: ${name} added.`);
    } catch (err) {
        console.error(`  Error creating ${name}:`, err.message);
    }
  }

  console.log('--- SEEDING FINISHED ---');
}

finalSeeding();
