#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Set test environment
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://localhost/test_db';

console.log('🧪 Running Integration Tests...');
console.log('Environment: test');
console.log('Database:', process.env.DATABASE_URL);
console.log('');

// Run vitest with the test configuration
const testProcess = spawn('npx', ['vitest', 'run', '--config', 'vitest.config.ts'], {
  cwd: rootDir,
  stdio: 'inherit',
  env: process.env
});

testProcess.on('close', (code) => {
  if (code === 0) {
    console.log('\n✅ All tests passed!');
  } else {
    console.log('\n❌ Some tests failed.');
    process.exit(code);
  }
});