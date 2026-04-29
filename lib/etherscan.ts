type EtherscanErrorKind = 'rate_limit' | 'invalid_response' | 'network';

export class EtherscanError extends Error {
  kind: EtherscanErrorKind;
  constructor(kind: EtherscanErrorKind, message: string) {
    super(message);
    this.name = 'EtherscanError';
    this.kind = kind;
  }
}

export type EtherscanTokenTx = {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  from: string;
  to: string;
  value: string;
  contractAddress: string;
  tokenDecimal: string;
  tokenSymbol: string;
};

const BASE_URL = 'https://api.etherscan.io/v2/api';
const TTL_MS = 5 * 60 * 1000;

type CacheEntry = { value: unknown; expires: number };
const cache = new Map<string, CacheEntry>();

function buildUrl(params: Record<string, string | number>): string {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) usp.set(k, String(v));
  return `${BASE_URL}?${usp.toString()}`;
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchWithRetry(url: string): Promise<unknown> {
  const cached = cache.get(url);
  if (cached && cached.expires > Date.now()) return cached.value;

  const delays = [2000, 4000, 8000];
  let lastErr: Error | null = null;
  for (let attempt = 0; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (res.status === 429) {
        if (attempt < 3) {
          await sleep(delays[attempt]);
          continue;
        }
        throw new EtherscanError('rate_limit', 'Etherscan rate limit exceeded');
      }
      if (res.status >= 500) {
        if (attempt < 3) {
          await sleep(delays[attempt]);
          continue;
        }
        throw new EtherscanError('network', `Etherscan ${res.status}`);
      }
      const json = (await res.json()) as { status?: string; message?: string; result?: unknown };
      // Etherscan returns status="0" for "No transactions found" — treat as empty success.
      if (json.status === '1' || json.message === 'No transactions found' || Array.isArray(json.result)) {
        cache.set(url, { value: json, expires: Date.now() + TTL_MS });
        return json;
      }
      // Status "0" with NOTOK is often a rate-limit warning embedded in 200.
      if (typeof json.result === 'string' && /max rate/i.test(json.result)) {
        if (attempt < 3) {
          await sleep(delays[attempt]);
          continue;
        }
        throw new EtherscanError('rate_limit', json.result);
      }
      throw new EtherscanError('invalid_response', JSON.stringify(json).slice(0, 200));
    } catch (err) {
      if (err instanceof EtherscanError) {
        lastErr = err;
        if (err.kind === 'invalid_response') break;
      } else {
        lastErr = err as Error;
      }
      if (attempt < 3) {
        await sleep(delays[attempt]);
        continue;
      }
    }
  }
  if (lastErr instanceof EtherscanError) throw lastErr;
  throw new EtherscanError('network', lastErr?.message ?? 'unknown');
}

export async function fetchTokenTransfers(opts: {
  contractAddress: string;
  startBlock: number;
  page?: number;
  offset?: number;
  endBlock?: number;
}): Promise<EtherscanTokenTx[]> {
  const apiKey = process.env.ETHERSCAN_API_KEY;
  if (!apiKey) throw new EtherscanError('invalid_response', 'ETHERSCAN_API_KEY not set');

  const url = buildUrl({
    chainid: 1,
    module: 'account',
    action: 'tokentx',
    contractaddress: opts.contractAddress,
    startblock: opts.startBlock,
    endblock: opts.endBlock ?? 99999999,
    sort: 'asc',
    page: opts.page ?? 1,
    offset: opts.offset ?? 10000,
    apikey: apiKey,
  });

  const json = (await fetchWithRetry(url)) as { result?: unknown };
  if (!Array.isArray(json.result)) return [];
  return json.result as EtherscanTokenTx[];
}

export async function fetchLatestBlockNumber(): Promise<number> {
  const apiKey = process.env.ETHERSCAN_API_KEY;
  if (!apiKey) throw new EtherscanError('invalid_response', 'ETHERSCAN_API_KEY not set');
  const url = buildUrl({
    chainid: 1,
    module: 'proxy',
    action: 'eth_blockNumber',
    apikey: apiKey,
  });
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new EtherscanError('network', `Etherscan ${res.status}`);
  const json = (await res.json()) as { result?: string };
  if (!json.result) throw new EtherscanError('invalid_response', 'no block number returned');
  return parseInt(json.result, 16);
}
