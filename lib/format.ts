export function formatUsd(value: number, opts: { abbreviated?: boolean } = {}): string {
  const { abbreviated = true } = opts;
  if (!Number.isFinite(value)) return '$0';
  const sign = value < 0 ? '-' : '';
  const abs = Math.abs(value);

  if (!abbreviated) {
    return (
      sign +
      abs.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      })
    );
  }

  if (abs >= 1_000_000_000) return `${sign}$${(abs / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(1)}K`;
  return `${sign}$${abs.toFixed(0)}`;
}

export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return '0';
  return value.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

export function formatAddress(address: string, chars = 4): string {
  if (!address) return '';
  if (address.length <= 2 + chars * 2) return address;
  return `${address.slice(0, 2 + chars)}…${address.slice(-chars)}`;
}

export function formatRelativeTime(input: string | Date): string {
  const date = typeof input === 'string' ? new Date(input) : input;
  const diffMs = Date.now() - date.getTime();
  const sec = Math.round(diffMs / 1000);
  if (sec < 5) return 'just now';
  if (sec < 60) return `${sec} sec ago`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min} min ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr} hr ago`;
  const day = Math.round(hr / 24);
  return `${day}d ago`;
}

export function toChecksumLikeAddress(address: string): string {
  // Without ethers/viem we can't compute true EIP-55 checksum.
  // We display the address as the user typed but normalized to lowercase 0x prefix.
  // The "checksum casing" in §7.6 is approximated by lowercasing.
  if (!address) return '';
  const trimmed = address.trim();
  if (!trimmed.startsWith('0x') && !trimmed.startsWith('0X')) return trimmed;
  return '0x' + trimmed.slice(2).toLowerCase();
}
