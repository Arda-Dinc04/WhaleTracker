#!/usr/bin/env tsx
import { config as loadEnv } from 'dotenv';
import { resolve } from 'node:path';

// Match Next.js: use the same files as `next dev` (dotenv's default is only `.env`).
loadEnv({ path: resolve(process.cwd(), '.env') });
loadEnv({ path: resolve(process.cwd(), '.env.local'), override: true });

import { ingestAll, INGEST_LOOKBACKS } from '../lib/ingest';

const MAX_LOOPS = 60;

async function main() {
  console.log('[backfill] starting — looking back ~48h');

  // First call: floor the starting block to ~48h ago.
  const totals = { USDC: 0, USDT: 0 };
  const first = await ingestAll({ lookbackBlocks: INGEST_LOOKBACKS.blocks48h });
  totals.USDC += first.USDC;
  totals.USDT += first.USDT;
  console.log(`[backfill] iter 1 ingested:`, first);

  // Subsequent calls: walk forward from the saved last_block until each
  // token is "caught up" (a call returns zero rows for it).
  for (let i = 2; i <= MAX_LOOPS; i++) {
    const result = await ingestAll();
    totals.USDC += result.USDC;
    totals.USDT += result.USDT;
    console.log(`[backfill] iter ${i} ingested:`, result);
    if (result.USDC === 0 && result.USDT === 0) break;
  }

  console.log('[backfill] totals:', totals);
  console.log('[backfill] done');
}

main().catch((err) => {
  console.error('[backfill] failed:', err);
  process.exit(1);
});
