import fs from 'fs';

const BASE_URL = 'http://localhost:5000/api';

async function runTest() {
  const testEmail = `global_aid_${Date.now()}@test.com`;
  console.log('--- Starting Admin & NGO E2E API Test ---');
  try {
    // 1. NGO Request Access
    console.log('\\n1. Requesting NGO Access...');
    const accessRes = await fetch(`${BASE_URL}/access/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Global Aid Test',
        email: testEmail,
        password: 'password123',
        role: 'NGO'
      })
    });
    const accessData = await accessRes.json();
    console.log('Access Request Response:', accessRes.status, accessData);

    // 2. Admin Login
    console.log('\\n2. Admin Login...');
    const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@aidflow.gov', password: 'admin123' })
    });
    const adminLoginData = await adminLoginRes.json();
    console.log('Admin Login Response:', adminLoginRes.status, adminLoginData.user?.email);
    const adminToken = adminLoginData.token;

    if (!adminToken) throw new Error("Admin login failed");

    // 3. Admin Get Pending Requests
    console.log('\\n3. Fetching Pending Requests...');
    const pendingRes = await fetch(`${BASE_URL}/admin/access/pending`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const pendingRequests = await pendingRes.json();
    console.log(`Found ${pendingRequests.length} pending requests.`);
    
    const targetRequest = pendingRequests.find(r => r.email === testEmail);
    if (!targetRequest) throw new Error("Our test request was not found in pending list");

    // 4. Admin Approve Request
    console.log(`\\n4. Approving Request ID: ${targetRequest._id}...`);
    const approveRes = await fetch(`${BASE_URL}/admin/access/${targetRequest._id}/approve`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ category: 'NGO' })
    });
    console.log('Approve Response:', approveRes.status, await approveRes.json());

    // 5. NGO Login
    console.log('\\n5. NGO Login...');
    const ngoLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: 'password123' })
    });
    const ngoLoginData = await ngoLoginRes.json();
    console.log('NGO Login Response:', ngoLoginRes.status, ngoLoginData.user?.email);
    const ngoToken = ngoLoginData.token;

    if (!ngoToken) throw new Error("NGO login failed");

    // 6. Create Campaign
    console.log('\\n6. NGO Creating Campaign...');
    const createCampRes = await fetch(`${BASE_URL}/campaigns`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${ngoToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: 'API Test Relief Campaign',
        description: 'Testing the backend APIs sequentially',
        targetAmount: 200000,
        location: 'Mumbai',
        disasterType: 'FLOOD',
        policySnapshot: {
          allowedCategories: ['FOOD', 'MEDICINE'],
          maxPerBeneficiary: 5000,
          validityDays: 30,
          cooldownDays: 0,
          minEligibilityConfidence: 0.8,
          maxFraudRisk: 0.2
        }
      })
    });
    const createCampData = await createCampRes.json();
    console.log('Create Campaign Response:', createCampRes.status, createCampData.campaign?.title || createCampData);
    const campaignId = createCampData.campaign?._id;

    if (!campaignId) throw new Error("Campaign creation failed");

    // 7. Activate Campaign
    console.log(`\\n7. Activating Campaign ${campaignId}...`);
    const activateRes = await fetch(`${BASE_URL}/campaigns/${campaignId}/activate`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${ngoToken}` }
    });
    const activateData = await activateRes.json();
    console.log('Activate Response:', activateRes.status, activateData.status || activateData);

    console.log('\\n--- OVERALL SUCCESS ---');
  } catch (error) {
    console.error('\\n--- TEST FAILED ---', error);
  }
}

runTest();
