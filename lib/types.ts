export type TokenSymbol = 'USDC' | 'USDT';
export type TokenFilter = TokenSymbol | 'BOTH';

export type KnownAddressCategory =
  | 'exchange'
  | 'issuer'
  | 'bridge'
  | 'defi'
  | 'mm'
  | 'other';

export type KnownAddress = {
  address: string;
  label: string;
  category: KnownAddressCategory;
};

export type Classification =
  | {
      type: 'known';
      label: string;
      category: KnownAddressCategory;
      reasoning: string;
    }
  | {
      type: 'heuristic';
      guess: 'exchange-like' | 'whale-like' | 'retail-like' | 'unknown';
      reasoning: string;
    };

export type TransferRow = {
  tx_hash: string;
  log_index: number;
  token: TokenSymbol;
  from_addr: string;
  to_addr: string;
  amount_usd: number;
  block_number: number;
  block_timestamp: string;
  ingested_at: string;
};

export type OverviewResponse = {
  usdcSupplyEthereum: number;
  usdtSupplyEthereum: number;
  whaleVolume24h: number;
  whaleCount24h: number;
  lastIngestedAt: string;
};

export type ConcentrationAddress = {
  address: string;
  label: string | null;
  category: string | null;
  classification: string;
  volume: number;
  transferCount: number;
  rank: number;
};

export type ConcentrationResponse = {
  token: TokenFilter;
  total24hVolume: number;
  topAddresses: ConcentrationAddress[];
  top5Share: number;
  top20Share: number;
  unknownShare: number;
};

export type FlowBucket = {
  hourStart: string;
  usdcVolume: number;
  usdtVolume: number;
  usdcCount: number;
  usdtCount: number;
};

export type FlowResponse = {
  hours: number;
  buckets: FlowBucket[];
};

import type { FlowType } from './flow-type';

export type WhaleTransfer = {
  txHash: string;
  logIndex: number;
  token: TokenSymbol;
  from: { address: string; label: string | null; category: string | null };
  to: { address: string; label: string | null; category: string | null };
  amountUsd: number;
  blockNumber: number;
  timestamp: string;
  flowType: FlowType;
};

export type WhalesResponse = { transfers: WhaleTransfer[] };

export type ClassifyStats24h = {
  sentVolume: number;
  receivedVolume: number;
  transferCount: number;
  distinctCounterparties: number;
  avgTransferSize: number;
};

export type ClassifyResponse = {
  address: string;
  classification: Classification;
  stats24h: ClassifyStats24h;
};

export type ComparisonTokenStats = {
  token: TokenSymbol;
  whaleVolume24h: number;
  whaleTransfers24h: number;
  avgTransferSize: number;
  largestTransfer: number;
  uniqueSenders: number;
  uniqueReceivers: number;
  top20Share: number;
};

export type ComparisonResponse = {
  usdc: ComparisonTokenStats;
  usdt: ComparisonTokenStats;
};

export type RoleVolume = {
  role: FlowType;
  volume: number;
  transferCount: number;
};

export type RolesResponse = {
  totalVolume: number;
  buckets: RoleVolume[];
};
