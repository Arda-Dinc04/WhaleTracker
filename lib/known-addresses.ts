import type { KnownAddress } from './types';

// Addresses are stored lowercase. Source: Etherscan public address labels.
// Any address whose accuracy hasn't been verified by the user before demo
// is listed in NOTES.md under "Known addresses to verify".
const RAW: KnownAddress[] = [
  // Issuers
  {
    address: '0x5754284f345afc66a98fbb0a0afe71e0f007b949',
    label: 'Tether Treasury',
    category: 'issuer',
  },
  {
    address: '0x55fe002aeff02f77364de339a1292923a15844b8',
    label: 'Circle',
    category: 'issuer',
  },

  // Exchanges — Binance
  {
    address: '0x28c6c06298d514db089934071355e5743bf21d60',
    label: 'Binance 14',
    category: 'exchange',
  },
  {
    address: '0x21a31ee1afc51d94c2efccaa2092ad1028285549',
    label: 'Binance 15',
    category: 'exchange',
  },
  {
    address: '0xdfd5293d8e347dfe59e90efd55b2956a1343963d',
    label: 'Binance 16',
    category: 'exchange',
  },
  {
    address: '0x56eddb7aa87536c09ccc2793473599fd21a8b17f',
    label: 'Binance 17',
    category: 'exchange',
  },
  {
    address: '0x9696f59e4d72e237be84ffd425dcad154bf96976',
    label: 'Binance 18',
    category: 'exchange',
  },

  // Exchanges — Coinbase
  {
    address: '0x71660c4005ba85c37ccec55d0c4493e66fe775d3',
    label: 'Coinbase 1',
    category: 'exchange',
  },
  {
    address: '0x503828976d22510aad0201ac7ec88293211d23da',
    label: 'Coinbase 2',
    category: 'exchange',
  },
  {
    address: '0xddfabcdc4d8ffc6d5beaf154f18b778f892a0740',
    label: 'Coinbase 3',
    category: 'exchange',
  },
  {
    address: '0x3cd751e6b0078be393132286c442345e5dc49699',
    label: 'Coinbase 4',
    category: 'exchange',
  },
  {
    address: '0xa090e606e30bd747d4e6245a1517ebe430f0057e',
    label: 'Coinbase 10',
    category: 'exchange',
  },

  // Exchanges — Kraken
  {
    address: '0x2910543af39aba0cd09dbb2d50200b3e800a63d2',
    label: 'Kraken 4',
    category: 'exchange',
  },
  {
    address: '0x53d284357ec70ce289d6d64134dfac8e511c8a3d',
    label: 'Kraken 5',
    category: 'exchange',
  },

  // Exchanges — OKX, Bybit, Bitfinex
  {
    address: '0x6cc5f688a315f3dc28a7781717a9a798a59fda7b',
    label: 'OKX 1',
    category: 'exchange',
  },
  {
    address: '0xf89d7b9c864f589bbf53a82105107622b35eaa40',
    label: 'Bybit Hot Wallet',
    category: 'exchange',
  },
  {
    address: '0x876eabf441b2ee5b5b0554fd502a8e0600950cfa',
    label: 'Bitfinex Hot Wallet',
    category: 'exchange',
  },
  {
    address: '0x1151314c646ce4e0efd76d1af4760ae66a9fe30f',
    label: 'Bitfinex 5',
    category: 'exchange',
  },

  // Bridges
  {
    address: '0xa3a7b6f88361f48403514059f1f16c8e78d60eec',
    label: 'Arbitrum L1 ERC20 Bridge',
    category: 'bridge',
  },
  {
    address: '0x99c9fc46f92e8a1c0dec1b1747d010903e884be1',
    label: 'Optimism L1 Bridge',
    category: 'bridge',
  },
  {
    address: '0x3154cf16ccdb4c6d922629664174b904d80f2c35',
    label: 'Base L1 Bridge',
    category: 'bridge',
  },
  {
    address: '0x40ec5b33f54e0e8a33a975908c5ba1c14e5bbbdf',
    label: 'Polygon ERC20 Predicate',
    category: 'bridge',
  },

  // DeFi
  {
    address: '0xe592427a0aece92de3edee1f18e0157c05861564',
    label: 'Uniswap V3: Router',
    category: 'defi',
  },
  {
    address: '0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45',
    label: 'Uniswap: Router 3',
    category: 'defi',
  },
  {
    address: '0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2',
    label: 'Aave V3: Pool',
    category: 'defi',
  },
  {
    address: '0xbebc44782c7db0a1a60cb6fe97d0b483032ff1c7',
    label: 'Curve: 3pool',
    category: 'defi',
  },
];

export const KNOWN_ADDRESSES: Record<string, KnownAddress> = Object.fromEntries(
  RAW.map((entry) => [entry.address.toLowerCase(), { ...entry, address: entry.address.toLowerCase() }]),
);

export function lookupAddress(addr: string): KnownAddress | null {
  if (!addr) return null;
  return KNOWN_ADDRESSES[addr.toLowerCase()] ?? null;
}

export const EXAMPLE_CLASSIFIER_CHIPS: Array<{ address: string; label: string }> = [
  { address: '0x28c6c06298d514db089934071355e5743bf21d60', label: 'Binance 14' },
  { address: '0x71660c4005ba85c37ccec55d0c4493e66fe775d3', label: 'Coinbase 1' },
  { address: '0x5754284f345afc66a98fbb0a0afe71e0f007b949', label: 'Tether Treasury' },
  { address: '0xe592427a0aece92de3edee1f18e0157c05861564', label: 'Uniswap V3 Router' },
  { address: '0xa3a7b6f88361f48403514059f1f16c8e78d60eec', label: 'Arbitrum Bridge' },
];
