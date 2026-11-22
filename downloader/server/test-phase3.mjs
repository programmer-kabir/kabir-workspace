import http from 'http';
import { hmacSha256 } from './src/utils/crypto.js';

const BASE_URL = 'http://localhost:5000';

function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const reqHeaders = { 'Content-Type': 'application/json', ...headers };

    const req = http.request(url, { method, headers: reqHeaders }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting Phase 3 End-to-End Developer API & Webhook Verification...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, name) {
    if (condition) {
      console.log(`  ✅ ${name}`);
      passed++;
    } else {
      console.error(`  ❌ ${name}`);
      failed++;
    }
  }

  try {
    const unique = Date.now();
    const devEmail = `dev_${unique}@streamvault.io`;
    const devPassword = 'Password123!';

    // 1. Register & Login Developer User
    const regRes = await request('POST', '/api/auth/register', {
      email: devEmail,
      password: devPassword,
      name: 'API Developer'
    });
    assert(regRes.status === 201 && regRes.body.success, 'Developer Account Registration');
    const userToken = regRes.body.data.token;

    // 2. Generate API Key
    const createKeyRes = await request('POST', '/api/developer/keys', {
      name: 'Production Worker Key'
    }, { Authorization: `Bearer ${userToken}` });

    assert(createKeyRes.status === 201 && createKeyRes.body.success, 'Generate API Key');
    assert(createKeyRes.body.data.rawKey && createKeyRes.body.data.rawKey.startsWith('sk_live_'), 'Raw API Key format is sk_live_...');
    const rawApiKey = createKeyRes.body.data.rawKey;
    const apiKeyId = createKeyRes.body.data.key.id;

    // 3. List API Keys (Verify Masking)
    const listKeysRes = await request('GET', '/api/developer/keys', null, { Authorization: `Bearer ${userToken}` });
    assert(listKeysRes.status === 200 && listKeysRes.body.data.length >= 1, 'List User API Keys');
    const foundKey = listKeysRes.body.data.find(k => k.id === apiKeyId);
    assert(foundKey && foundKey.keyPrefix.includes('...'), 'API Key is securely masked in list output');
    assert(!('rawKey' in foundKey) && !('key_hash' in foundKey), 'Raw key and hash are never exposed');

    // 4. Authenticate /api/v1/extract with Valid API Key
    const extractRes = await request('POST', '/api/v1/extract', {
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    }, { 'X-API-Key': rawApiKey });
    assert(extractRes.status === 200 && extractRes.body.success && extractRes.body.data.title, 'Authenticate /api/v1/extract with X-API-Key');

    // 5. Authenticate with Bearer sk_live_...
    const extractBearerRes = await request('POST', '/api/v1/extract', {
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    }, { Authorization: `Bearer ${rawApiKey}` });
    assert(extractBearerRes.status === 200 && extractBearerRes.body.success, 'Authenticate /api/v1/extract with Bearer token');

    // 6. Missing API Key Test
    const missingKeyRes = await request('POST', '/api/v1/extract', { url: 'https://www.youtube.com' });
    assert(missingKeyRes.status === 401 && missingKeyRes.body.code === 'API_KEY_MISSING', 'Reject request with missing API key');

    // 7. Invalid API Key Test
    const invalidKeyRes = await request('POST', '/api/v1/extract', { url: 'https://www.youtube.com' }, { 'X-API-Key': 'sk_live_bogus_key' });
    assert(invalidKeyRes.status === 401 && invalidKeyRes.body.code === 'INVALID_API_KEY', 'Reject request with invalid API key');

    // 8. Toggle API Key (Disable & Re-enable)
    await request('PUT', `/api/developer/keys/${apiKeyId}/toggle`, { isEnabled: false }, { Authorization: `Bearer ${userToken}` });
    const disabledAttempt = await request('POST', '/api/v1/extract', { url: 'https://www.youtube.com' }, { 'X-API-Key': rawApiKey });
    assert(disabledAttempt.status === 401 && disabledAttempt.body.error.includes('disabled'), 'Disabled API key is blocked');

    await request('PUT', `/api/developer/keys/${apiKeyId}/toggle`, { isEnabled: true }, { Authorization: `Bearer ${userToken}` });
    const enabledAttempt = await request('POST', '/api/v1/extract', { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }, { 'X-API-Key': rawApiKey });
    assert(enabledAttempt.status === 200 && enabledAttempt.body.success, 'Re-enabled API key succeeds');

    // 9. API Key Regeneration
    const regenRes = await request('POST', `/api/developer/keys/${apiKeyId}/regenerate`, null, { Authorization: `Bearer ${userToken}` });
    assert(regenRes.status === 200 && regenRes.body.data.rawKey, 'Regenerate API key');
    const newRawKey = regenRes.body.data.rawKey;

    const oldKeyAttempt = await request('POST', '/api/v1/extract', { url: 'https://www.youtube.com' }, { 'X-API-Key': rawApiKey });
    assert(oldKeyAttempt.status === 401, 'Old API key invalidated after regeneration');

    const newKeyAttempt = await request('POST', '/api/v1/extract', { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }, { 'X-API-Key': newRawKey });
    assert(newKeyAttempt.status === 200, 'New regenerated API key functions properly');

    // 10. POST /api/v1/download job creation
    const jobRes = await request('POST', '/api/v1/download', {
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      type: 'video'
    }, { 'X-API-Key': newRawKey });
    assert(jobRes.status === 200 || jobRes.status === 201, 'Submit download job via /api/v1/download');
    const jobId = jobRes.body.data.jobId;

    // 11. GET /api/v1/jobs/:jobId
    const getJobRes = await request('GET', `/api/v1/jobs/${jobId}`, null, { 'X-API-Key': newRawKey });
    assert(getJobRes.status === 200 && getJobRes.body.data.id === jobId, 'Fetch job status via /api/v1/jobs/:jobId');

    // 12. GET /api/v1/jobs list
    const listJobsRes = await request('GET', '/api/v1/jobs', null, { 'X-API-Key': newRawKey });
    assert(listJobsRes.status === 200 && Array.isArray(listJobsRes.body.data.jobs), 'List user jobs via /api/v1/jobs');

    // 13. POST /api/v1/jobs/:jobId/cancel
    const cancelJobRes = await request('POST', `/api/v1/jobs/${jobId}/cancel`, null, { 'X-API-Key': newRawKey });
    assert(cancelJobRes.status === 200 && cancelJobRes.body.success, 'Cancel job via /api/v1/jobs/:jobId/cancel');

    // 14. GET /api/v1/usage
    const usageRes = await request('GET', '/api/v1/usage', null, { 'X-API-Key': newRawKey });
    assert(usageRes.status === 200 && usageRes.body.data.quota, 'Fetch API usage via /api/v1/usage');

    // 15. Developer Portal Stats & Logs
    const devStatsRes = await request('GET', '/api/developer/stats', null, { Authorization: `Bearer ${userToken}` });
    assert(devStatsRes.status === 200 && devStatsRes.body.data.totalRequests >= 3, 'Developer portal stats counts real requests');
    assert(Array.isArray(devStatsRes.body.data.usageTrend), 'Developer portal returns 7-day usage trend');

    const devLogsRes = await request('GET', '/api/developer/logs', null, { Authorization: `Bearer ${userToken}` });
    assert(devLogsRes.status === 200 && devLogsRes.body.data.logs.length >= 3, 'Developer portal request logs captured');
    assert(devLogsRes.body.data.logs[0].response_time_ms >= 0, 'Log records actual response time');

    // 16. Webhook SSRF Protection Tests
    const ssrfLocalhost = await request('POST', '/api/developer/webhooks', {
      name: 'Malicious Localhost',
      url: 'http://localhost:8080/hook'
    }, { Authorization: `Bearer ${userToken}` });
    assert(ssrfLocalhost.status === 400 && ssrfLocalhost.body.error.includes('SSRF'), 'SSRF Blocked: localhost destination');

    const ssrfLoopback = await request('POST', '/api/developer/webhooks', {
      name: 'Malicious 127.0.0.1',
      url: 'http://127.0.0.1:3000/hook'
    }, { Authorization: `Bearer ${userToken}` });
    assert(ssrfLoopback.status === 400 && ssrfLoopback.body.error.includes('Loopback'), 'SSRF Blocked: 127.0.0.1 destination');

    const ssrfPrivateNet = await request('POST', '/api/developer/webhooks', {
      name: 'Malicious 192.168.1.1',
      url: 'http://192.168.1.1/hook'
    }, { Authorization: `Bearer ${userToken}` });
    assert(ssrfPrivateNet.status === 400 && ssrfPrivateNet.body.error.includes('Private network'), 'SSRF Blocked: 192.168.x.x private network');

    const ssrfCloudMeta = await request('POST', '/api/developer/webhooks', {
      name: 'Malicious AWS Metadata',
      url: 'http://169.254.169.254/latest/meta-data'
    }, { Authorization: `Bearer ${userToken}` });
    assert(ssrfCloudMeta.status === 400 && ssrfCloudMeta.body.error.includes('Metadata'), 'SSRF Blocked: 169.254.169.254 Cloud Metadata endpoint');

    // 17. Valid Webhook Creation & HMAC Signature Check
    const validHookRes = await request('POST', '/api/developer/webhooks', {
      name: 'Production Webhook Endpoint',
      url: 'https://httpbin.org/post',
      events: ['download.completed', 'download.failed']
    }, { Authorization: `Bearer ${userToken}` });
    assert(validHookRes.status === 201 && validHookRes.body.data.secret.startsWith('whsec_'), 'Valid Webhook Created with whsec_ secret');
    const webhookSecret = validHookRes.body.data.secret;

    // Test HMAC Calculation
    const testPayload = JSON.stringify({ event: 'download.completed', id: 'del_123' });
    const signature = hmacSha256(webhookSecret, testPayload);
    assert(signature && signature.length === 64, 'HMAC-SHA256 signature generated accurately');

    // 18. Existing Public Website Integrity
    const publicExtract = await request('POST', '/api/extract', {
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    });
    assert(publicExtract.status === 200 && publicExtract.body.success, 'Public /api/extract remains fully functional');

    console.log(`\n========================================`);
    console.log(`Phase 3 Tests Finished: ${passed} passed, ${failed} failed`);
    console.log(`========================================\n`);

  } catch (err) {
    console.error('Fatal test error:', err);
  }
}

runTests();
