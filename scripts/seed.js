
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://qvtttsyfjsmsozfpllzq.supabase.co',
  'sb_publishable_gZSROpMXmyicigroLFDgUA_Rp2cpS50'
);

async function seed() {
  // 1. Get Merchant
  const merchantId = '7a9ef3c9-baa0-4e3c-8788-9769f798fc32';
  console.log('Seeding for merchant:', merchantId);

  const customersData = [
    { first_name: 'Alice', email: 'alice@test.com' },
    { first_name: 'Bob', email: 'bob@test.com' },
    { first_name: 'Charlie', email: 'charlie@test.com' },
    { first_name: 'David', email: 'david@test.com' },
    { first_name: 'Eve', email: 'eve@test.com' },
  ];

  for (const c of customersData) {
    const { data: cust, error: cErr } = await supabase
      .from('customers')
      .upsert(c, { onConflict: 'email' })
      .select('id')
      .single();

    if (cErr || !cust) {
        console.error('Error with customer:', c.email, cErr);
        continue;
    }

    // 3. Create Loyalty Card
    const { data: card, error: cardErr } = await supabase
      .from('loyalty_cards')
      .upsert({
        customer_id: cust.id,
        merchant_id: merchantId,
        balance: Math.floor(Math.random() * 8) + 1,
        total_earned: Math.floor(Math.random() * 20) + 10,
        last_scan_at: new Date(Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000).toISOString()
      }, { onConflict: 'customer_id,merchant_id' })
      .select('id')
      .single();

    if (cardErr || !card) {
        console.error('Error with card:', cardErr);
        continue;
    }

    // 4. Create Transactions (Passages)
    const txs = [];
    for (let i = 0; i < 10; i++) {
        txs.push({
            card_id: card.id,
            customer_id: cust.id,
            merchant_id: merchantId,
            amount: 1,
            type: 'earn',
            created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
        });
    }
    const { error: txErr } = await supabase.from('transactions').insert(txs);
    if (txErr) console.error('Error inserting txs:', txErr);
  }

  console.log('Seed complete for test@fydly.com');
}

seed();
