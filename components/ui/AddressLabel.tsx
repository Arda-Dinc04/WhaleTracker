'use client';

import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { formatAddress } from '@/lib/format';

export function AddressLabel({
  address,
  label,
  category,
  truncate = true,
  showCopy = true,
}: {
  address: string;
  label?: string | null;
  category?: string | null;
  truncate?: boolean;
  showCopy?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const display = label ?? (truncate ? formatAddress(address) : address);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // ignore
    }
  };

  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        title={address}
        className={label ? 'text-[var(--foreground)]' : 'mono text-[var(--foreground)]'}
      >
        {display}
      </span>
      {category && (
        <span className="rounded-sm border border-[var(--border)] px-1 py-px text-[10px] uppercase tracking-wide text-[var(--muted)]">
          {category}
        </span>
      )}
      {showCopy && (
        <button
          type="button"
          aria-label="Copy address"
          className="text-[var(--muted)] hover:text-white"
          onClick={onCopy}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
        </button>
      )}
    </span>
  );
}
