'use client';

import type { TokenFilter } from '@/lib/types';

const OPTIONS: TokenFilter[] = ['USDC', 'USDT', 'BOTH'];

export function TokenToggle({
  value,
  onChange,
}: {
  value: TokenFilter;
  onChange: (value: TokenFilter) => void;
}) {
  return (
    <div className="inline-flex rounded-md border border-[var(--border)] bg-[var(--card)] p-0.5 text-xs">
      {OPTIONS.map((opt) => {
        const active = value === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`rounded px-2.5 py-1 font-medium transition-colors ${
              active
                ? 'bg-white/10 text-white'
                : 'text-[var(--muted)] hover:text-white'
            }`}
          >
            {opt === 'BOTH' ? 'Both' : opt}
          </button>
        );
      })}
    </div>
  );
}
