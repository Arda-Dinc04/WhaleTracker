import { TOKENS, WHALE_THRESHOLD_USD } from './tokens';
import { fetchLatestBlockNumber, fetchTokenTransfers } from './etherscan';
import { getSupabase } from './supabase';
import type { TokenSymbol } from './types';

const APPROX_BLOCKS_24H = 7200;
const APPROX_BLOCKS_48H = 14400;
const MAX_PAGES_PER_RUN = 3;
const PAGE_SIZE = 10000;

type IngestStateRow = { token: TokenSymbol; last_block: number };

type WhaleTransferRow = {
  tx_hash: string;
  log_index: number;
  token: TokenSymbol;
  from_addr: string;
  to_addr: string;
  amount_usd: number;
  block_number: number;
  block_timestamp: string;
};

export async function ingestToken(
  token: TokenSymbol,
  opts: { lookbackBlocks?: number } = {},
): Promise<{ token: TokenSymbol; ingested: number; lastBlock: number }> {
  const supabase = getSupabase();
  const meta = TOKENS[token];

  const { data: stateRow } = await supabase
    .from('ingest_state')
    .select('token, last_block')
    .eq('token', token)
    .maybeSingle<IngestStateRow>();

  let startBlock: number;
  if (!stateRow) {
    const latest = await fetchLatestBlockNumber();
    const lookback = opts.lookbackBlocks ?? APPROX_BLOCKS_24H;
    startBlock = Math.max(0, latest - lookback);
  } else {
    startBlock = stateRow.last_block + 1;
    if (opts.lookbackBlocks) {
      const latest = await fetchLatestBlockNumber();
      const desired = Math.max(0, latest - opts.lookbackBlocks);
      startBlock = Math.min(startBlock, desired);
    }
  }

  let totalIngested = 0;
  let highestBlock = stateRow?.last_block ?? startBlock - 1;
  let cursor = startBlock;

  // Etherscan v2 caps `page * offset` at 10000, so we always request page=1
  // and advance the start block after each batch to walk forward in time.
  for (let iter = 0; iter < MAX_PAGES_PER_RUN; iter++) {
    const txs = await fetchTokenTransfers({
      contractAddress: meta.address,
      startBlock: cursor,
      page: 1,
      offset: PAGE_SIZE,
    });
    if (txs.length === 0) break;

    const rows: WhaleTransferRow[] = [];
    const logIndexCounter = new Map<string, number>();
    let maxBlockInBatch = cursor;
    for (const tx of txs) {
      const decimals = parseInt(tx.tokenDecimal || String(meta.decimals), 10);
      const value = Number(tx.value);
      if (!Number.isFinite(value)) continue;
      const amountUsd = value / 10 ** decimals; // USDC/USDT treated as $1
      if (amountUsd < WHALE_THRESHOLD_USD) continue;

      const block = parseInt(tx.blockNumber, 10);
      if (Number.isFinite(block)) {
        if (block > highestBlock) highestBlock = block;
        if (block > maxBlockInBatch) maxBlockInBatch = block;
      }

      // Etherscan v2 tokentx does not return logIndex. Synthesize a stable
      // index per (tx_hash) using insertion order so the (tx_hash, log_index)
      // primary key still de-dupes correctly across cron retries.
      const seen = logIndexCounter.get(tx.hash) ?? 0;
      logIndexCounter.set(tx.hash, seen + 1);

      rows.push({
        tx_hash: tx.hash,
        log_index: seen,
        token,
        from_addr: tx.from.toLowerCase(),
        to_addr: tx.to.toLowerCase(),
        amount_usd: amountUsd,
        block_number: block,
        block_timestamp: new Date(parseInt(tx.timeStamp, 10) * 1000).toISOString(),
      });
    }

    if (rows.length > 0) {
      const { error } = await supabase
        .from('transfers')
        .upsert(rows, { onConflict: 'tx_hash,log_index' });
      if (error) throw new Error(`Supabase upsert failed: ${error.message}`);
      totalIngested += rows.length;
    }

    // If we got a full page, walk the cursor forward to keep paging within
    // Etherscan's `page*offset <= 10000` limit. Advancing past `maxBlockInBatch`
    // is safe because results are sorted ascending; the +1 prevents re-fetching
    // the same boundary block.
    if (txs.length < PAGE_SIZE) break;
    if (maxBlockInBatch + 1 <= cursor) break; // safety: no progress
    cursor = maxBlockInBatch + 1;
  }

  if (highestBlock >= 0) {
    const { error } = await supabase
      .from('ingest_state')
      .upsert(
        {
          token,
          last_block: highestBlock,
          last_ingested_at: new Date().toISOString(),
        },
        { onConflict: 'token' },
      );
    if (error) throw new Error(`Supabase ingest_state upsert failed: ${error.message}`);
  }

  return { token, ingested: totalIngested, lastBlock: highestBlock };
}

export async function pruneOldTransfers(): Promise<void> {
  const supabase = getSupabase();
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  await supabase.from('transfers').delete().lt('block_timestamp', cutoff);
}

export async function ingestAll(opts: { lookbackBlocks?: number } = {}) {
  const usdc = await ingestToken('USDC', opts);
  const usdt = await ingestToken('USDT', opts);
  await pruneOldTransfers();
  return { USDC: usdc.ingested, USDT: usdt.ingested };
}

export const INGEST_LOOKBACKS = {
  blocks24h: APPROX_BLOCKS_24H,
  blocks48h: APPROX_BLOCKS_48H,
};
