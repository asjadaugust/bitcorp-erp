const ACCOUNTS_PAYABLE_API_URL = 'http://localhost:3400/api';

async function verifyAccountsPayable() {
  try {
    console.log('🚀 Starting Accounts Payable Verification...');

    // 1. Login
    console.log('\n1. Logging in...');
    const loginRes = await fetch(`${ACCOUNTS_PAYABLE_API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'director',
        password: 'password123',
      }),
    });

    if (!loginRes.ok) {
      throw new Error(`Login failed: ${loginRes.statusText}`);
    }

    const loginData = await loginRes.json() as Record<string, unknown>;
    const token = loginData.access_token;
    console.log('✅ Login successful');

    // 2. Get a Provider (assuming seed data exists)
    console.log('\n2. Fetching Providers...');
    const providersRes = await fetch(`${ACCOUNTS_PAYABLE_API_URL}/providers`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!providersRes.ok) {
      // If providers endpoint fails, we might need to rely on known ID or skip
      console.log('⚠️ Could not fetch providers, using default ID 1');
    }

    const providers = providersRes.ok ? (await providersRes.json() as Record<string, unknown>[]) : [];
    const providerId = providers.length > 0 ? providers[0].id : 1;
    console.log(`ℹ️ Using Provider ID: ${providerId}`);

    // 3. Create Accounts Payable
    console.log('\n3. Creating Accounts Payable...');
    const newAp = {
      provider_id: providerId,
      document_type: 'invoice',
      document_number: `INV-${Date.now()}`,
      issue_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0], // +30 days
      amount: 1500.5,
      currency: 'PEN',
      description: 'Test Invoice from Verification Script',
      tenant_id: 1,
    };

    const createRes = await fetch(`${ACCOUNTS_PAYABLE_API_URL}/accounts-payable`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(newAp),
    });

    if (!createRes.ok) {
      const err = await createRes.text();
      throw new Error(`Create failed: ${createRes.status} - ${err}`);
    }

    const createdAp = await createRes.json() as Record<string, unknown>;
    console.log('✅ Created Accounts Payable:', createdAp.id);

    // 4. Get All
    console.log('\n4. Fetching All Accounts Payable...');
    const getAllRes = await fetch(`${ACCOUNTS_PAYABLE_API_URL}/accounts-payable`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const allAp = await getAllRes.json() as Record<string, unknown>[];
    console.log(`✅ Fetched ${allAp.length} records`);

    // 5. Get One
    console.log(`\n5. Fetching Accounts Payable ID: ${createdAp.id}...`);
    const getOneRes = await fetch(`${ACCOUNTS_PAYABLE_API_URL}/accounts-payable/${createdAp.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const oneAp = await getOneRes.json() as Record<string, unknown>;
    if (oneAp.id === createdAp.id) {
      console.log('✅ Fetched correct record');
    } else {
      console.error('❌ Fetched incorrect record');
    }

    // 6. Update
    console.log(`\n6. Updating Accounts Payable ID: ${createdAp.id}...`);
    const updateRes = await fetch(`${ACCOUNTS_PAYABLE_API_URL}/accounts-payable/${createdAp.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        amount: 2000.0,
        status: 'paid',
      }),
    });

    if (!updateRes.ok) {
      throw new Error(`Update failed: ${updateRes.statusText}`);
    }

    const updatedAp = await updateRes.json() as Record<string, unknown>;
    if (updatedAp.amount === '2000.00' || updatedAp.amount === 2000) {
      console.log('✅ Update successful (Amount updated)');
    } else {
      console.error('❌ Update failed verification', updatedAp);
    }

    // 7. Delete
    console.log(`\n7. Deleting Accounts Payable ID: ${createdAp.id}...`);
    const deleteRes = await fetch(`${ACCOUNTS_PAYABLE_API_URL}/accounts-payable/${createdAp.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (deleteRes.status === 204) {
      console.log('✅ Delete successful');
    } else {
      console.error(`❌ Delete failed: ${deleteRes.status}`);
    }

    // 8. Verify Deletion
    console.log('\n8. Verifying Deletion...');
    const verifyDelRes = await fetch(
      `${ACCOUNTS_PAYABLE_API_URL}/accounts-payable/${createdAp.id}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (verifyDelRes.status === 404) {
      console.log('✅ Record correctly not found');
    } else {
      console.error('❌ Record still exists or error');
    }

    console.log('\n🎉 Verification Complete!');
  } catch (error) {
    console.error('\n❌ Verification Failed:', error);
    process.exit(1);
  }
}

verifyAccountsPayable();
