/**
 * StreamVault — Master Regression Suite Runner
 * Executes all Phase test suites sequentially and validates 100% pass rate.
 */

import { execSync } from 'child_process';
import path from 'path';

const suites = [
  { name: 'Phase 1 (MongoDB Infrastructure)', file: 'server/test-mongo-phase1.mjs' },
  { name: 'Phase 2 (MongoDB Schema & Collections)', file: 'server/test-mongo-phase2.mjs' },
  { name: 'Phase 3 (Migration Script Idempotency)', file: 'server/test-mongo-phase3.mjs' },
  { name: 'Phase 4 (Repository Abstraction)', file: 'server/test-mongo-phase4.mjs' },
  { name: 'Phase 4 (Audit Verification)', file: 'server/test-mongo-phase4-audit.mjs' },
  { name: 'Phase 5.1 (Favorites, History, Notifications, Admin)', file: 'server/test-phase5-1.mjs' },
  { name: 'Phase 5.2 (API Keys & Webhooks)', file: 'server/test-phase5-2.mjs' },
  { name: 'Phase 5.3 (Auth, Sessions & Security)', file: 'server/test-phase5-3.mjs' },
  { name: 'Phase 5.4 (Queue & Background Workers)', file: 'server/test-phase5-4.mjs' },
  { name: 'Phase 5.5 (Subscriptions & Payments)', file: 'server/test-phase5-5.mjs' },
  { name: 'Stage 1 Architecture & Dual Parity Audit', file: 'server/test-phase5-audit.mjs' },
  { name: 'Core Regression Suite 1 (Downloader & Platform)', file: 'server/test-phase1.mjs' },
  { name: 'Core Regression Suite 2 (Queue & Job Workers)', file: 'server/test-phase2.mjs' },
  { name: 'Core Regression Suite 3 (Storage, Quota & API Keys)', file: 'server/test-phase3.mjs' },
  { name: 'Core Regression Suite 4 (Auth & Subscriptions)', file: 'server/test-phase4.mjs' },
  { name: 'Core Regression Suite 5 (System, Admin & Audit)', file: 'server/test-phase5.mjs' }
];

console.log('='.repeat(75));
console.log('StreamVault — Master Full Regression Test Runner');
console.log('='.repeat(75));

const results = [];
let totalPassed = 0;
let totalFailed = 0;

for (const suite of suites) {
  process.stdout.write(`Running ${suite.name} ... `);
  const start = Date.now();
  try {
    const output = execSync(`node ${suite.file}`, {
      cwd: process.cwd(),
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 30000
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
}
