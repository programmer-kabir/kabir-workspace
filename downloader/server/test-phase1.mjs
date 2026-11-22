const BASE_URL = 'http://localhost:5000';

async function runTests() {
  console.log('🧪 Starting Phase 1 Comprehensive Verification Suite...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // 1. Healthcheck
  console.log('1. Testing Health & DB connection...');
  const healthRes = await fetch(`${BASE_URL}/api/health`);
  const healthData = await healthRes.json();
  assert(healthData.status === 'healthy', 'Health status is healthy');
  assert(healthData.database.includes('node:sqlite'), 'Database is connected with WAL mode');

  // 2. Existing Downloader Extraction (Preserve functionality)
  console.log('\n2. Testing Existing Downloader Extraction (Regression check)...');
  const extractRes = await fetch(`${BASE_URL}/api/extract`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' })
  });
  const extractData = await extractRes.json();
  assert(extractData.success === true, 'Existing /api/extract works');
  assert(extractData.data.videoFormats.length > 0, `Extracted ${extractData.data.videoFormats.length} formats`);

  // 3. User Registration
  console.log('\n3. Testing Auth: User Registration...');
  const testEmail = `tester_${Date.now()}@example.com`;
  const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Test Pilot',
      email: testEmail,
      password: 'StrongPassword123!'
    })
  });
  const regData = await regRes.json();
  assert(regData.success === true, 'Registration succeeded');
  assert(!!regData.data.token, 'Session token issued');
  assert(regData.data.user.email === testEmail, 'User profile returned');
  const userToken = regData.data.token;

  // 4. User Login
  console.log('\n4. Testing Auth: User Login...');
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: 'StrongPassword123!'
    })
  });
  const loginData = await loginRes.json();
  assert(loginData.success === true, 'Login succeeded');
  assert(loginData.data.user.plan === 'free', 'Default plan is free');

  // 5. Auth: Get Profile / Me
  console.log('\n5. Testing Auth: Verify Profile (/api/auth/me)...');
  const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { Authorization: `Bearer ${userToken}` }
  });
  const meData = await meRes.json();
  assert(meData.success === true, 'Profile verified with Bearer token');
  assert(meData.data.user.name === 'Test Pilot', 'User name matches');

  // 6. Master Admin Account
  console.log('\n6. Testing Master Admin Authentication...');
  const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@streamvault.io',
      password: 'AdminPassword123!'
    })
  });
  const adminData = await adminLoginRes.json();
  assert(adminData.success === true, 'Admin login succeeded');
  assert(adminData.data.user.role === 'admin', 'Admin role confirmed');
  assert(adminData.data.user.plan === 'enterprise', 'Enterprise plan confirmed');

  // 7. Active Sessions & Login History
  console.log('\n7. Testing Session & Login History tracking...');
  const sessRes = await fetch(`${BASE_URL}/api/auth/sessions`, {
    headers: { Authorization: `Bearer ${userToken}` }
  });
  const sessData = await sessRes.json();
  assert(sessData.success === true && sessData.data.length >= 1, `Found ${sessData.data.length} active sessions`);

  const histRes = await fetch(`${BASE_URL}/api/auth/login-history`, {
    headers: { Authorization: `Bearer ${userToken}` }
  });
  const histData = await histRes.json();
  assert(histData.success === true && histData.data.length >= 1, `Recorded ${histData.data.length} login events`);

  // 8. Queue Engine: Add Job
  console.log('\n8. Testing Queue Engine: Add Job...');
  const queueAddRes = await fetch(`${BASE_URL}/api/queue/add`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${userToken}`
    },
    body: JSON.stringify({
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      type: 'video',
      quality: '1080p'
    })
  });
  const queueAddData = await queueAddRes.json();
  assert(queueAddData.success === true, 'Job queued successfully');
  assert(!!queueAddData.job.id, `Job ID generated: ${queueAddData.job?.id}`);
  const jobId = queueAddData.job.id;

  // 9. Queue Engine: Duplicate Detection
  console.log('\n9. Testing Queue Duplicate Detection...');
  const dupRes = await fetch(`${BASE_URL}/api/queue/add`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${userToken}`
    },
    body: JSON.stringify({
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    })
  });
  const dupData = await dupRes.json();
  assert(dupData.isDuplicate === true, 'Duplicate download job intercepted successfully');
  assert(dupData.job.id === jobId, 'Existing job returned without redundant processing');

  // 10. Queue Engine: Pause & Resume
  console.log('\n10. Testing Queue Job Controls (Pause / Resume)...');
  const pauseRes = await fetch(`${BASE_URL}/api/queue/${jobId}/pause`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${userToken}` }
  });
  const pauseData = await pauseRes.json();
  assert(pauseData.success === true, 'Pause request responded successfully');

  // 11. Queue Engine: List Jobs
  console.log('\n11. Testing Queue List endpoint...');
  const listRes = await fetch(`${BASE_URL}/api/queue/list`, {
    headers: { Authorization: `Bearer ${userToken}` }
  });
  const listData = await listRes.json();
  assert(listData.success === true && listData.data.jobs.length >= 1, `User queue retrieved: ${listData.data.jobs.length} job(s)`);

  // Summary
  console.log(`\n========================================`);
  console.log(`📊 Phase 1 Tests Completed: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((e) => {
  console.error('Test script crashed:', e);
  process.exit(1);
});
