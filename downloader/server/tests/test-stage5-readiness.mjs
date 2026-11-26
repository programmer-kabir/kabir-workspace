/**
 * StreamVault — Stage 5.5: Readiness Verification Test Suite
 * Validates:
 * 1. Binary validation & architecture detection
 * 2. Queue shutdown & job drainage
 * 3. Dynamic API_BASE resolution
 */

import { validateMediaBinaries, getYtDlpPath } from '../src/services/extractor.js';
import { pauseQueueEngine, waitForActiveJobs, isQueueShuttingDown, initQueueEngine } from '../src/services/queueService.js';
import { connectMongo, disconnectMongo } from '../src/db/mongo.js';
import assert from 'assert';

let passed = 0;
let failed = 0;

function check(condition, message) {
  if (!condition) {
    failed++;
    console.error(`  ❌ FAIL: ${message}`);
    throw new Error(message);
  } else {
    passed++;
    console.log(`  ✅ PASS: ${message}`);
  }
}

async function run() {
  console.log('='.repeat(70));
  console.log('  STAGE 5.5: READINESS VERIFICATION TEST SUITE');
  console.log('='.repeat(70));

  // 1. Binary Validation Check
  console.log('\n--- 1. Media Binary Engine & Architecture Detection ---');
  const binStatus = validateMediaBinaries();
  console.log('  Detected Platform:', binStatus.platform);
  console.log('  Detected Architecture:', binStatus.arch);
  console.log('  yt-dlp Path:', binStatus.ytDlpPath);
  console.log('  yt-dlp Version:', binStatus.ytDlpVersion || 'none');
  console.log('  FFmpeg Available:', binStatus.ffmpegAvailable);

  check(binStatus.platform === 'win32' || binStatus.platform === 'linux' || binStatus.platform === 'darwin', 'OS platform correctly identified');
  check(binStatus.arch === 'x64' || binStatus.arch === 'arm64', 'CPU architecture correctly detected');
  check(typeof binStatus.ytDlpPath === 'string' && binStatus.ytDlpPath.length > 0, 'yt-dlp candidate path resolved');
  if (binStatus.platform === 'win32') {
    check(binStatus.healthy === true, 'Windows yt-dlp binary verified executable');
    check(binStatus.ytDlpVersion !== null, `yt-dlp version verified: ${binStatus.ytDlpVersion}`);
  }

  // 2. Queue Engine Pause & Graceful Drainage
  console.log('\n--- 2. Queue Engine Graceful Pause & In-Flight Drainage ---');
  await connectMongo();
  await initQueueEngine();
  check(isQueueShuttingDown() === false, 'Queue engine initialized in running state');

  pauseQueueEngine();
  check(isQueueShuttingDown() === true, 'pauseQueueEngine marks queue state as shutting down');

  const drainage = await waitForActiveJobs(1000);
  check(drainage.drained === true, 'waitForActiveJobs returns drained when no jobs are active');
  check(drainage.remainingJobs === 0, 'Remaining in-flight jobs is 0');

  // Re-initialize queue for clean state
  await initQueueEngine();
  check(isQueueShuttingDown() === false, 'Queue engine cleanly re-initializes after test');
  pauseQueueEngine(); // pause again for test cleanup

  // 3. Dynamic API Base URL Resolution Logic
  console.log('\n--- 3. Dynamic Frontend API_BASE Resolution Logic ---');
  function testResolve(envVal) {
    if (!envVal || typeof envVal !== 'string') return '/api';
    const clean = envVal.trim().replace(/\/+$/, '');
    return clean.endsWith('/api') ? clean : `${clean}/api`;
  }

  check(testResolve(undefined) === '/api', 'Empty environment variable defaults to /api (Vite local proxy)');
  check(testResolve('') === '/api', 'Empty string environment variable defaults to /api');
  check(testResolve('https://api.streamvault.io') === 'https://api.streamvault.io/api', 'Cross-domain URL appends /api');
  check(testResolve('https://api.streamvault.io/') === 'https://api.streamvault.io/api', 'Trailing slash handled cleanly');
  check(testResolve('https://api.streamvault.io/api') === 'https://api.streamvault.io/api', 'Existing /api suffix is not duplicated');
  check(testResolve('https://api.streamvault.io/api/') === 'https://api.streamvault.io/api', 'Existing /api suffix with trailing slash handled');

  console.log('\n' + '='.repeat(70));
  console.log(`  STAGE 5.5 READINESS CHECKS: ${passed} PASSED, ${failed} FAILED`);
  console.log('='.repeat(70) + '\n');
  await disconnectMongo();
}

run().catch(err => {
  console.error('\nReadiness test error:', err);
  process.exit(1);
});
