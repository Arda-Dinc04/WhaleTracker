-- Run this in the Supabase SQL editor before first deploy.

-- All whale transfers we've ingested
create table if not exists transfers (
  tx_hash text not null,
  log_index int not null,
  token text not null check (token in ('USDC', 'USDT')),
  from_addr text not null,
  to_addr text not null,
  amount_usd numeric not null,
  block_number bigint not null,
  block_timestamp timestamptz not null,
  ingested_at timestamptz not null default now(),
  primary key (tx_hash, log_index)
);

create index if not exists transfers_block_timestamp_idx
  on transfers (block_timestamp desc);
create index if not exists transfers_token_timestamp_idx
  on transfers (token, block_timestamp desc);
create index if not exists transfers_from_idx on transfers (from_addr);
create index if not exists transfers_to_idx on transfers (to_addr);

-- Tracks how far we've ingested per token, so cron can resume
create table if not exists ingest_state (
  token text primary key check (token in ('USDC', 'USDT')),
  last_block bigint not null,
  last_ingested_at timestamptz not null default now()
);

-- Optional: cache table for DefiLlama macro responses (5 min TTL)
create table if not exists cache_kv (
  key text primary key,
  value jsonb not null,
  expires_at timestamptz not null
);
