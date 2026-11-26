import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverDir = path.resolve(__dirname, '..');

/**
 * StreamVault — Master MongoDB-Only Regression Suite Runner
 * Executes all MongoDB test suites sequentially and validates 100% pass rate.
 */

const suites = [
  { name: 'Stage 7 (MongoDB-Only Master Verification)', file: 'test-stage7-mongo-only.mjs' },
  { name: 'Phase 1 (MongoDB Driver & Infrastructure)', file: 'test-mongo-phase1.mjs' },
  { name: 'Phase 2 (MongoDB Schema, Collections & 57 Indexes)', file: 'test-mongo-phase2.mjs' },
  { name: 'Stage 3.1 (MongoDB Repositories CRUD)', file: 'test-stage3-repositories.mjs' },
  { name: 'Stage 3.2 (Auth & Sessions Compatibility)', file: 'test-stage3-auth.mjs' },
  { name: 'Stage 3.3 (Download Queue & History)', file: 'test-stage3-download.mjs' },
  { name: 'Stage 3.4 (Subscriptions & Payments)', file: 'test-stage3-subscription.mjs' },
  { name: 'Stage 3.5 (Admin & System Diagnostics)', file: 'test-stage3-admin.mjs' },
  { name: 'Stage 3.8 (Concurrency & Reliability)', file: 'test-stage3-concurrency.mjs' },
  { name: 'Stage 4.2 (Background Workers Lifecycle)', file: 'test-stage4-workers.mjs' },
  { name: 'Stage 4.4 (Security & OWASP Protection)', file: 'test-stage4-security.mjs' },
  { name: 'Stage 4.5 (Performance & Latency Profiling)', file: 'test-stage4-performance.mjs' },
  { name: 'Stage 5.5 (Readiness & Architecture Detection)', file: 'test-stage5-readiness.mjs' },
  { name: 'Stage 6.5 (Hosting Reality & Binary Extraction)', file: 'test-stage6.5-hosting-reality.mjs' }
];

console.log('='.repeat(75));
console.log('StreamVault — Master Full Regression Test Runner (MongoDB-Only)');
console.log('='.repeat(75));

const results = [];
let totalPassed = 0;
let totalFailed = 0;

for (const suite of suites) {
  process.stdout.write(`Running ${suite.name} ... `);
  const start = Date.now();
  try {
    const output = execSync(`node "${path.resolve(__dirname, suite.file)}"`, {
      cwd: serverDir,
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 120000,
      env: { ...process.env, DB_ENGINE: 'mongodb' }
    }).toString();
    const duration = ((Date.now() - start) / 1000).toFixed(2);
    console.log(`✅ PASS (${duration}s)`);
    results.push({ Suite: suite.name, Status: 'PASS', Duration: `${duration}s` });
    totalPassed++;
  } catch (err) {
    const duration = ((Date.now() - start) / 1000).toFixed(2);
    console.log(`❌ FAIL (${duration}s)`);
    console.error(err.stdout ? err.stdout.toString() : err.message);
    console.error(err.stderr ? err.stderr.toString() : '');
    results.push({ Suite: suite.name, Status: 'FAIL', Duration: `${duration}s` });
    totalFailed++;
  }
}

console.log('\n' + '='.repeat(75));
console.log('Master Regression Summary:');
console.table(results);
console.log(`Total Suites: ${suites.length} | Passed: ${totalPassed} | Failed: ${totalFailed}`);
console.log('='.repeat(75));

if (totalFailed > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL REGRESSION SUITES PASSED (100% MONGODB).');
}
