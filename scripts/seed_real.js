
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://qvtttsyfjsmsozfpllzq.supabase.co',
  'sb_publishable_gZSROpMXmyicigroLFDgUA_Rp2cpS50'
);

const MERCHANT_ID = '7a9ef3c9-baa0-4e3c-8788-9769f798fc32';

async function seed() {
  console.log('Seeding fake customers and transactions...');

  const customers = [
    { email: `alice_${Math.random().toString(36).substring(7)}@test.com`, name: 'Alice' },
    { email: `bob_${Math.random().toString(36).substring(7)}@test.com`, name: 'Bob' },
    { email: `charlie_${Math.random().toString(36).substring(7)}@test.com`, name: 'Charlie' },
    { email: `david_${Math.random().toString(36).substring(7)}@test.com`, name: 'David' },
    { email: `emilie_${Math.random().toString(36).substring(7)}@test.com`, name: 'Emilie' },
  ];

  for (const cData of customers) {
    try {
      // 1. Auth Signup
      const { data: auth, error: aErr } = await supabase.auth.signUp({
        email: cData.email,
        password: 'password123'
      });
      if (aErr) throw aErr;
      const userId = auth.user.id;

      // 2. Public Customer
      const { data: customer, error: cErr } = await supabase
        .from('customers')
        .insert({
          user_id: userId,
          email: cData.email,
          first_name: cData.name,
          gdpr_accepted_at: new Date().toISOString()
        })
        .select('id')
        .single();
      if (cErr) throw cErr;

      // 3. Loyalty Card
      const cardBalance = Math.floor(Math.random() * 8) + 1;
      const { data: card, error: lcErr } = await supabase
        .from('loyalty_cards')
        .insert({
          customer_id: customer.id,
          merchant_id: MERCHANT_ID,
          balance: cardBalance,
          total_earned: cardBalance + Math.floor(Math.random() * 15),
          last_scan_at: new Date().toISOString()
        })
        .select('id')
        .single();
      if (lcErr) throw lcErr;

      // 4. Fake Transactions (spread over last 3 weeks)
      const txCount = 5 + Math.floor(Math.random() * 10);
      const txs = [];
      for (let i = 0; i < txCount; i++) {
        const date = new Date();
        date.setDate(date.getDate() - Math.floor(Math.random() * 25));
        txs.push({
          card_id: card.id,
          customer_id: customer.id,
          merchant_id: MERCHANT_ID,
          type: 'earn',
          amount: 1,
          created_at: date.toISOString()
        });
      }
      await supabase.from('transactions').insert(txs);
      
      console.log(`- Created ${cData.name} (${cData.email}) with ${txCount} transactions`);
    } catch (e) {
      console.error(`Failed seeding ${cData.name}:`, e.message);
    }
  }

  console.log('Seed complete! Refresh your dashboard.');
}

seed();
