const PAYMENT_SCHEDULE_API_URL = 'http://localhost:3400/api';

async function verifyPaymentSchedule() {
  try {
    console.log('🚀 Starting Payment Schedule Verification...');

    // 1. Login
    console.log('\n1. Logging in...');
    const loginRes = await fetch(`${PAYMENT_SCHEDULE_API_URL}/auth/login`, {
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

    // 2. Create Accounts Payable (prerequisite)
    console.log('\n2. Creating Accounts Payable item...');
    const newAp = {
      provider_id: 1,
      document_type: 'invoice',
      document_number: `INV-${Date.now()}`,
      issue_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0],
      amount: 5000.0,
      currency: 'PEN',
      description: 'Test Invoice for Payment Schedule',
      tenant_id: 1,
    };

    const createApRes = await fetch(`${PAYMENT_SCHEDULE_API_URL}/accounts-payable`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(newAp),
    });

    if (!createApRes.ok) {
      throw new Error(`Create AP failed: ${createApRes.status}`);
    }

    const createdAp = await createApRes.json() as Record<string, unknown>;
    console.log('✅ Created Accounts Payable:', createdAp.id);

    // 3. Create Payment Schedule
    console.log('\n3. Creating Payment Schedule...');
    const newSchedule = {
      schedule_date: new Date().toISOString().split('T')[0],
      payment_date: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
      description: 'Weekly Payment Schedule',
      currency: 'PEN',
    };

    const createScheduleRes = await fetch(`${PAYMENT_SCHEDULE_API_URL}/payment-schedules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(newSchedule),
    });

    if (!createScheduleRes.ok) {
      const err = await createScheduleRes.text();
      throw new Error(`Create Schedule failed: ${createScheduleRes.status} - ${err}`);
    }

    const createdSchedule = await createScheduleRes.json() as Record<string, unknown>;
    console.log('✅ Created Payment Schedule:', createdSchedule.id);

    // 4. Add Detail to Schedule
    console.log('\n4. Adding detail to schedule...');
    const addDetailRes = await fetch(
      `${PAYMENT_SCHEDULE_API_URL}/payment-schedules/${createdSchedule.id}/details`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          accounts_payable_id: createdAp.id,
          amount_to_pay: 5000.0,
        }),
      }
    );

    if (!addDetailRes.ok) {
      throw new Error(`Add detail failed: ${addDetailRes.status}`);
    }

    console.log('✅ Detail added successfully');

    // 5. Get Schedule with Details
    console.log('\n5. Fetching schedule with details...');
    const getScheduleRes = await fetch(
      `${PAYMENT_SCHEDULE_API_URL}/payment-schedules/${createdSchedule.id}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const scheduleWithDetails = await getScheduleRes.json() as Record<string, unknown>;
    console.log(`✅ Fetched schedule with ${(scheduleWithDetails.details as unknown[])?.length || 0} details`);
    console.log(`   Total amount: ${scheduleWithDetails.total_amount}`);

    // 6. Get All Schedules
    console.log('\n6. Fetching all schedules...');
    const getAllRes = await fetch(`${PAYMENT_SCHEDULE_API_URL}/payment-schedules`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    const allSchedules = await getAllRes.json() as Record<string, unknown>[];
    console.log(`✅ Fetched ${allSchedules.length} schedules`);

    // 7. Update Schedule
    console.log('\n7. Updating schedule...');
    const updateRes = await fetch(
      `${PAYMENT_SCHEDULE_API_URL}/payment-schedules/${createdSchedule.id}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          description: 'Updated Payment Schedule',
          status: 'approved',
        }),
      }
    );

    if (!updateRes.ok) {
      throw new Error(`Update failed: ${updateRes.statusText}`);
    }
    console.log('✅ Update successful');

    // 8. Clean up - Delete Schedule
    console.log('\n8. Cleaning up...');

    // First change status back to draft to allow deletion
    await fetch(`${PAYMENT_SCHEDULE_API_URL}/payment-schedules/${createdSchedule.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: 'draft' }),
    });

    const deleteRes = await fetch(
      `${PAYMENT_SCHEDULE_API_URL}/payment-schedules/${createdSchedule.id}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (deleteRes.status === 204) {
      console.log('✅ Schedule deleted successfully');
    }

    // Clean up AP
    await fetch(`${PAYMENT_SCHEDULE_API_URL}/accounts-payable/${createdAp.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    console.log('\n🎉 Verification Complete!');
  } catch (error) {
    console.error('\n❌ Verification Failed:', error);
    process.exit(1);
  }
}

verifyPaymentSchedule();
