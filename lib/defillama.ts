const TTL_MS = 5 * 60 * 1000;

type CacheEntry = { value: unknown; expires: number };
const cache = new Map<string, CacheEntry>();

async function fetchJson(url: string): Promise<unknown> {
  const cached = cache.get(url);
  if (cached && cached.expires > Date.now()) return cached.value;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`DefiLlama ${res.status}`);
  const json = await res.json();
  cache.set(url, { value: json, expires: Date.now() + TTL_MS });
  return json;
}

// DefiLlama stablecoin IDs:
//   1 = USDT, 2 = USDC
type StablecoinDetail = {
  chainBalances?: Record<
    string,
    {
      tokens?: Array<{ date: number; circulating?: { peggedUSD?: number } }>;
    }
  >;
};

async function getCirculatingOnEthereum(stablecoinId: number): Promise<number> {
  const url = `https://stablecoins.llama.fi/stablecoin/${stablecoinId}`;
  const data = (await fetchJson(url)) as StablecoinDetail;
  const ethereum = data.chainBalances?.Ethereum;
  if (!ethereum?.tokens?.length) return 0;
  // tokens is an array of historical points; the last one is most recent.
  const last = ethereum.tokens[ethereum.tokens.length - 1];
  const value = last?.circulating?.peggedUSD;
  return typeof value === 'number' ? value : 0;
}

export async function getUsdcCirculatingOnEthereum(): Promise<number> {
  return getCirculatingOnEthereum(2);
}

export async function getUsdtCirculatingOnEthereum(): Promise<number> {
  return getCirculatingOnEthereum(1);
}
