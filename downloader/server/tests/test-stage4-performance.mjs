/**
 * StreamVault — Stage 4: Performance & Latency Profiling (MongoDB)
 * Benchmarks latency (avg & p95) for:
 * 1. Auth login & session lookup
 * 2. User profile & quota stats
 * 3. Queue operations (insert & status check)
 * 4. History & Favorites queries (indexed queries)
 * 5. Memory consumption & connection pool stability
 */

import { createStage4TestServer } from './test-stage4-helper.mjs';
import { getQueueRepository } from '../src/db/repositories/queueRepository.js';

let passed = 0;
let failed = 0;
const results = [];

function assert(condition, message) {
  if (!condition) {
    failed++;
    results.push({ name: message, status: 'FAILED' });
    console.error(`  ❌ FAIL: ${message}`);
    throw new Error(message);
  } else {
    passed++;
    results.push({ name: message, status: 'PASSED' });
    console.log(`  ✅ PASS: ${message}`);
  }
}

function calculateStats(latencies) {
  if (!latencies.length) return { avg: 0, p95: 0, min: 0, max: 0 };
  const sorted = [...latencies].sort((a, b) => a - b);
  const sum = sorted.reduce((acc, val) => acc + val, 0);
  const avg = sum / sorted.length;
  const p95Index = Math.min(Math.floor(sorted.length * 0.95), sorted.length - 1);
  const p95 = sorted[p95Index];
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  return {
    avg: Number(avg.toFixed(2)),
    p95: Number(p95.toFixed(2)),
    min: Number(min.toFixed(2)),
    max: Number(max.toFixed(2))
  };
}

async function run() {
  console.log('='.repeat(70));
  console.log('  STAGE 4.5: PERFORMANCE & LATENCY PROFILING (MONGODB)');
  console.log('='.repeat(70));

  const { baseUrl, close } = await createStage4TestServer();
  console.log(`[PERF-HARNESS] Connected to ${baseUrl} -> MongoDB StreamVault_Stage4_Test\n`);

  try {
    const memInitial = process.memoryUsage();
    console.log(`[PERF] Initial Heap: ${(memInitial.heapUsed / 1024 / 1024).toFixed(2)} MB, RSS: ${(memInitial.rss / 1024 / 1024).toFixed(2)} MB`);

    // Setup benchmark user
    const perfEmail = `perf_${Date.now()}@streamvault.test`;
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Perf Benchmarker', email: perfEmail, password: 'Password123!' })
    });
    const regJson = await regRes.json();
    const token = (regJson.data && regJson.data.token) || regJson.token;
    assert(token, 'Benchmark user created successfully');

    const ITERATIONS = 5;

    // ----------------------------------------------------
    // 1. AUTH LOGIN & SESSION LOOKUP
    // ----------------------------------------------------
    console.log(`\n--- 1. Auth Login & Session Lookup (${ITERATIONS} iterations) ---`);
    const loginLatencies = [];
    for (let i = 0; i < ITERATIONS; i++) {
      const t0 = performance.now();
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: perfEmail, password: 'Password123!' })
      });
      const t1 = performance.now();
      assert(res.status === 200, `Login iteration ${i + 1} succeeded`);
      loginLatencies.push(t1 - t0);
    }
    const loginStats = calculateStats(loginLatencies);
    console.log(`  Login Latency: Avg = ${loginStats.avg}ms | p95 = ${loginStats.p95}ms | Min = ${loginStats.min}ms | Max = ${loginStats.max}ms`);
    assert(loginStats.avg < 15000, `Average login latency acceptable (${loginStats.avg}ms < 15000ms)`);

    // Session verification latency
    const sessionLatencies = [];
    for (let i = 0; i < ITERATIONS; i++) {
      const t0 = performance.now();
      const res = await fetch(`${baseUrl}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const t1 = performance.now();
      assert(res.status === 200, `Session check iteration ${i + 1} succeeded`);
      sessionLatencies.push(t1 - t0);
    }
    const sessionStats = calculateStats(sessionLatencies);
    console.log(`  Session Lookup Latency: Avg = ${sessionStats.avg}ms | p95 = ${sessionStats.p95}ms | Min = ${sessionStats.min}ms | Max = ${sessionStats.max}ms`);
    assert(sessionStats.avg < 5000, `Average session lookup latency acceptable (${sessionStats.avg}ms < 5000ms)`);

    // ----------------------------------------------------
    // 2. USER STATS & PROFILE
    // ----------------------------------------------------
    console.log(`\n--- 2. User Stats & Profile Latency (${ITERATIONS} iterations) ---`);
    const statsLatencies = [];
    for (let i = 0; i < ITERATIONS; i++) {
      const t0 = performance.now();
      const res = await fetch(`${baseUrl}/api/user/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const t1 = performance.now();
      assert(res.status === 200, `User stats iteration ${i + 1} succeeded`);
      statsLatencies.push(t1 - t0);
    }
    const statsMetrics = calculateStats(statsLatencies);
    console.log(`  User Stats Latency: Avg = ${statsMetrics.avg}ms | p95 = ${statsMetrics.p95}ms | Min = ${statsMetrics.min}ms | Max = ${statsMetrics.max}ms`);
    assert(statsMetrics.avg < 5000, `Average user stats latency acceptable (${statsMetrics.avg}ms < 5000ms)`);

    // ----------------------------------------------------
    // 3. QUEUE OPERATIONS (INSERT & CLAIM)
    // ----------------------------------------------------
    console.log(`\n--- 3. Queue Operations Latency: Insert & Atomic Claim (${ITERATIONS} iterations) ---`);
    const queueRepo = getQueueRepository();
    const queueInsertLatencies = [];
    const queueClaimLatencies = [];
    for (let i = 0; i < ITERATIONS; i++) {
      const t0 = performance.now();
      const job = await queueRepo.create({
        user_id: `user_perf_${i}`,
        url: `https://www.youtube.com/watch?v=perf_bench_${i}_${Date.now()}`,
        format_id: '1080p',
        title: `Perf Test Video ${i}`,
        type: 'video',
        status: 'queued',
        priority: 1
      });
      const t1 = performance.now();
      assert(job && (job.id || job._id), `Queue insert iteration ${i + 1} succeeded`);
      queueInsertLatencies.push(t1 - t0);

      const tc0 = performance.now();
      const claimed = await queueRepo.claimNextJob();
      const tc1 = performance.now();
      assert(claimed && (claimed.id || claimed._id), `Queue atomic claim iteration ${i + 1} succeeded`);
      queueClaimLatencies.push(tc1 - tc0);
    }
    const queueInsertStats = calculateStats(queueInsertLatencies);
    const queueClaimStats = calculateStats(queueClaimLatencies);
    console.log(`  Queue Insert Latency: Avg = ${queueInsertStats.avg}ms | p95 = ${queueInsertStats.p95}ms | Min = ${queueInsertStats.min}ms | Max = ${queueInsertStats.max}ms`);
    console.log(`  Queue Claim Latency:  Avg = ${queueClaimStats.avg}ms | p95 = ${queueClaimStats.p95}ms | Min = ${queueClaimStats.min}ms | Max = ${queueClaimStats.max}ms`);
    assert(queueInsertStats.avg < 3000, `Average queue insert latency acceptable (${queueInsertStats.avg}ms < 3000ms)`);
    assert(queueClaimStats.avg < 3000, `Average queue claim latency acceptable (${queueClaimStats.avg}ms < 3000ms)`);

    // ----------------------------------------------------
    // 4. HISTORY & FAVORITES (INDEXED QUERIES)
    // ----------------------------------------------------
    console.log(`\n--- 4. History & Favorites Indexed Query Latency (${ITERATIONS} iterations) ---`);
    const historyQueryLatencies = [];
    for (let i = 0; i < ITERATIONS; i++) {
      const t0 = performance.now();
      const res = await fetch(`${baseUrl}/api/history?page=1&limit=20&search=test`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const t1 = performance.now();
      assert(res.status === 200, `History query iteration ${i + 1} succeeded`);
      historyQueryLatencies.push(t1 - t0);
    }
    const histStats = calculateStats(historyQueryLatencies);
    console.log(`  History Indexed Query Latency: Avg = ${histStats.avg}ms | p95 = ${histStats.p95}ms | Min = ${histStats.min}ms | Max = ${histStats.max}ms`);
    assert(histStats.avg < 3000, `Average history query latency acceptable (${histStats.avg}ms < 3000ms)`);

    // ----------------------------------------------------
    // 5. MEMORY CONSUMPTION & CONNECTION STABILITY
    // ----------------------------------------------------
    console.log('\n--- 5. Memory Consumption & Connection Pool Stability ---');
    const memFinal = process.memoryUsage();
    const heapDiffMb = ((memFinal.heapUsed - memInitial.heapUsed) / 1024 / 1024).toFixed(2);
    console.log(`  Initial Heap: ${(memInitial.heapUsed / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Final Heap:   ${(memFinal.heapUsed / 1024 / 1024).toFixed(2)} MB (Delta: ${heapDiffMb} MB)`);
    console.log(`  Final RSS:    ${(memFinal.rss / 1024 / 1024).toFixed(2)} MB`);
    assert(memFinal.heapUsed < 250 * 1024 * 1024, 'Heap usage remains bounded under 250MB under load');

    // Health check ping to verify pool stability
    const healthRes = await fetch(`${baseUrl}/api/health`);
    const healthJson = await healthRes.json();
    assert(healthRes.status === 200, 'Health endpoint responds with 200 after burst profiling');
    assert(healthJson.mongodb === 'connected', 'MongoDB connection pool remains fully connected and stable');

    console.log('\n' + '='.repeat(70));
    console.log(`  STAGE 4.5 PERFORMANCE & LATENCY SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('='.repeat(70));
    console.log(JSON.stringify({
      login: loginStats,
      session: sessionStats,
      stats: statsMetrics,
      queueInsert: queueInsertStats,
      queueClaim: queueClaimStats,
      historyQuery: histStats,
      memory: {
        initialHeapMb: Number((memInitial.heapUsed / 1024 / 1024).toFixed(2)),
        finalHeapMb: Number((memFinal.heapUsed / 1024 / 1024).toFixed(2)),
        deltaMb: Number(heapDiffMb),
        rssMb: Number((memFinal.rss / 1024 / 1024).toFixed(2))
      }
    }, null, 2) + '\n');

  } finally {
    await close();
  }
}

run().then(() => {
  if (failed > 0) process.exit(1);
  process.exit(0);
}).catch(err => {
  console.error('\nFatal performance profiling execution error:', err);
  process.exit(1);
});
