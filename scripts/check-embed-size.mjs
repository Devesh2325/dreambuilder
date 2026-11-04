import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

// Every visitor to a customer's site downloads this script, so growth should be a decision.
const LIMIT_KB = 40;
const file = process.argv[2] ?? 'dist/flowpilot.js';

const size = gzipSync(readFileSync(file)).length / 1024;
console.log(`${file}: ${size.toFixed(1)} KB gzipped (limit ${LIMIT_KB} KB)`);
if (size > LIMIT_KB) {
  console.error('Embed script is over its size limit.');
  process.exit(1);
}
