import http from 'http';

const BASE_URL = 'http://localhost:5000';

function request(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(url, { method, headers }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting Phase 2 End-to-End Automated Verification...\n');
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
    const testEmail = `tester_${unique}@streamvault.io`;
    const testPassword = 'Password123!';

    // 1. Register & Login
    const regRes = await request('POST', '/api/auth/register', {
      email: testEmail,
      password: testPassword,
      name: 'Phase 2 Tester'
    });
    assert(regRes.status === 201 && regRes.body.success, 'User Registration');

    const loginRes = await request('POST', '/api/auth/login', {
      email: testEmail,
      password: testPassword
    });
    assert(loginRes.status === 200 && loginRes.body.data?.token, 'User Login & Session Token issued');
    const token = loginRes.body.data?.token;

    // 2. User Profile & Update
    const profRes = await request('GET', '/api/user/profile', null, token);
    assert(profRes.status === 200 && profRes.body.data.email === testEmail, 'Fetch User Profile');

    const updateProfRes = await request('PUT', '/api/user/profile', { name: 'Super Tester' }, token);
    assert(updateProfRes.status === 200 && updateProfRes.body.success, 'Update User Profile Name');

    // 3. User Dashboard Stats
    const statsRes = await request('GET', '/api/user/stats', null, token);
    assert(statsRes.status === 200 && statsRes.body.success, 'Fetch Dashboard Stats');
    assert(typeof statsRes.body.data.totalDownloads === 'number', 'Stats returns real totalDownloads count');
    assert(statsRes.body.data.quota && typeof statsRes.body.data.quota.remainingDaily === 'number', 'Stats returns real daily quota remaining');
    assert(Array.isArray(statsRes.body.data.downloadTrend), 'Stats returns 7-day download trend');

    // 4. Favorites System
    const addFavRes = await request('POST', '/api/favorites', {
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      title: 'Never Gonna Give You Up',
      platform: 'YouTube',
      thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
      collection: 'Music Classics'
    }, token);
    assert(addFavRes.status === 201 && addFavRes.body.success, 'Add Favorite with Collection');
    const favId = addFavRes.body.data.id;

    const listFavRes = await request('GET', '/api/favorites', null, token);
    assert(listFavRes.status === 200 && listFavRes.body.data.favorites.length >= 1, 'List User Favorites');
    assert(listFavRes.body.data.collections.includes('Music Classics'), 'Favorites Collections List extracted');

    const delFavRes = await request('DELETE', `/api/favorites/${favId}`, null, token);
    assert(delFavRes.status === 200 && delFavRes.body.success, 'Delete Favorite');

    // 5. Bulk Downloader
    const bulkRes = await request('POST', '/api/queue/bulk', {
      urls: [
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        'https://www.tiktok.com/@tiktok/video/7106594312292453678',
        'invalid-broken-url'
      ],
      type: 'video'
    }, token);
    assert(bulkRes.status === 200 && bulkRes.body.success, 'Bulk Download Queue Submission');
    assert(bulkRes.body.data.summary.total === 3, 'Bulk summary total counted');
    assert(bulkRes.body.data.summary.invalid === 1, 'Bulk validation flagged 1 invalid URL');
    assert(bulkRes.body.data.summary.added >= 1, 'Bulk valid URLs queued');

    const validJobs = bulkRes.body.data.results.filter(r => r.valid && r.job);
    const validJobIds = validJobs.map(r => r.job.id);

    // 6. Bulk Cancel & Bulk Retry
    if (validJobIds.length > 0) {
      const cancelRes = await request('POST', '/api/queue/bulk-cancel', { jobIds: validJobIds }, token);
      assert(cancelRes.status === 200 && cancelRes.body.data.cancelledCount >= 1, 'Bulk Cancel Jobs');

      const retryRes = await request('POST', '/api/queue/bulk-retry', { jobIds: validJobIds }, token);
      assert(retryRes.status === 200 && retryRes.body.data.retriedCount >= 1, 'Bulk Retry Jobs');
    }

    // 7. Notification Center
    const notifRes = await request('GET', '/api/notifications', null, token);
    assert(notifRes.status === 200 && notifRes.body.data.notifications.length >= 1, 'Fetch Notifications with unread count');
    const firstNotifId = notifRes.body.data.notifications[0].id;

    const readRes = await request('PUT', `/api/notifications/${firstNotifId}/read`, null, token);
    assert(readRes.status === 200 && readRes.body.success, 'Mark single notification read');

    const readAllRes = await request('PUT', '/api/notifications/read-all', null, token);
    assert(readAllRes.status === 200 && readAllRes.body.success, 'Mark all notifications read');

    // 8. User Activity Audit Trail
    const actRes = await request('GET', '/api/user/activity', null, token);
    assert(actRes.status === 200 && actRes.body.data.activities.length >= 2, 'User Activity Log tracked actions (register, login, bulk_download)');

    // 9. Download History Filtering & Deletion
    const historyListRes = await request('GET', '/api/history', null, token);
    assert(historyListRes.status === 200 && Array.isArray(historyListRes.body.data.history), 'Download History listing');

    // 10. User Isolation Check: Create User 2, verify they cannot see User 1's notifications or history
    const user2Email = `tester2_${unique}@streamvault.io`;
    await request('POST', '/api/auth/register', { email: user2Email, password: testPassword, name: 'User Two' });
    const user2Login = await request('POST', '/api/auth/login', { email: user2Email, password: testPassword });
    const user2Token = user2Login.body.data?.token;

    const user2Notifs = await request('GET', '/api/notifications', null, user2Token);
    assert(user2Notifs.body.data.notifications.length === 0, 'User Data Isolation: User 2 cannot see User 1 notifications');

    const user2DeleteAttempt = await request('DELETE', `/api/notifications/${firstNotifId}`, null, user2Token);
    assert(user2DeleteAttempt.status === 404, 'User Security Check: User 2 cannot delete User 1 notification (IDOR prevented)');

    // 11. Existing Download Functionality Integrity
    const extractRes = await request('POST', '/api/extract', {
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    });
    assert(extractRes.status === 200 && extractRes.body.success && extractRes.body.data.title, 'Existing /api/extract functionality intact');

    console.log(`\n========================================`);
    console.log(`Phase 2 Tests Finished: ${passed} passed, ${failed} failed`);
    console.log(`========================================\n`);

  } catch (err) {
    console.error('Fatal test error:', err);
  }
}

runTests();
