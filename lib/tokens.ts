import type { TokenSymbol } from './types';

export const TOKENS = {
  USDC: {
    symbol: 'USDC',
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    decimals: 6,
  },
  USDT: {
    symbol: 'USDT',
    address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    decimals: 6,
  },
} as const;

export const WHALE_THRESHOLD_USD = 100_000;

export const TOKEN_COLORS: Record<TokenSymbol, string> = {
  USDC: '#2775CA',
  USDT: '#26A17B',
};

export function getTokenByAddress(address: string): TokenSymbol | null {
  const lower = address.toLowerCase();
  if (lower === TOKENS.USDC.address.toLowerCase()) return 'USDC';
  if (lower === TOKENS.USDT.address.toLowerCase()) return 'USDT';
  return null;
}
