
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

async function seed() {
  // 1. Get Merchant
  const { data: merchant, error: mErr } = await supabase
    .from('merchants')
    .select('id')
    .eq('email', 'test@fydly.com')
    .single();

  if (mErr || !merchant) {
    console.error('Merchant not found:', mErr);
    return;
  }
  const merchantId = merchant.id;
  console.log('Seeding for merchant:', merchantId);

  // 2. Create Fake Customers (if not exist)
  const customersData = [
    { first_name: 'Alice', email: 'alice@test.com' },
    { first_name: 'Bob', email: 'bob@test.com' },
    { first_name: 'Charlie', email: 'charlie@test.com' },
    { first_name: 'David', email: 'david@test.com' },
    { first_name: 'Eve', email: 'eve@test.com' },
    { first_name: 'Frank', email: 'frank@test.com' },
    { first_name: 'Grace', email: 'grace@test.com' },
    { first_name: 'Heidi', email: 'heidi@test.com' },
    { first_name: 'Ivan', email: 'ivan@test.com' },
    { first_name: 'Judy', email: 'judy@test.com' },
  ];

  for (const c of customersData) {
    const { data: cust, error: cErr } = await supabase
      .from('customers')
      .upsert(c, { onConflict: 'email' })
      .select('id')
      .single();

    if (cErr || !cust) continue;

    // 3. Create Loyalty Card
    const { data: card } = await supabase
      .from('loyalty_cards')
      .upsert({
        customer_id: cust.id,
        merchant_id: merchantId,
        balance: Math.floor(Math.random() * 10),
        total_earned: Math.floor(Math.random() * 50) + 10,
        last_scan_at: new Date(Date.now() - Math.random() * 40 * 24 * 60 * 60 * 1000).toISOString()
      }, { onConflict: 'customer_id,merchant_id' })
      .select('id')
      .single();

    if (!card) continue;

    // 4. Create Transactions (Passages)
    const txs = [];
    for (let i = 0; i < 5; i++) {
        txs.push({
            card_id: card.id,
            customer_id: cust.id,
            merchant_id: merchantId,
            amount: 1,
            type: 'earn',
            created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
        });
    }
    await supabase.from('transactions').insert(txs);
  }

  console.log('Seed complete!');
}

seed();
