'use client';

import { useEffect, useState } from 'react';
import { ExplainerCard } from './ExplainerCard';
import { formatUsd, formatNumber } from '@/lib/format';
import type { ComparisonResponse, ComparisonTokenStats } from '@/lib/types';

type Row = {
  label: string;
  render: (s: ComparisonTokenStats) => string;
};

const ROWS: Row[] = [
  { label: 'Whale volume (7d)', render: (s) => formatUsd(s.whaleVolume7d) },
  { label: 'Whale transfers (7d)', render: (s) => formatNumber(s.whaleTransfers7d) },
  { label: 'Average whale transfer', render: (s) => formatUsd(s.avgTransferSize) },
  { label: 'Largest transfer', render: (s) => formatUsd(s.largestTransfer, { abbreviated: false }) },
  { label: 'Unique senders', render: (s) => formatNumber(s.uniqueSenders) },
  { label: 'Unique receivers', render: (s) => formatNumber(s.uniqueReceivers) },
  { label: 'Top 20 address concentration', render: (s) => `${Math.round(s.top20Share * 100)}%` },
];

export function ComparisonTable() {
  const [data, setData] = useState<ComparisonResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch('/api/comparison');
        if (!res.ok) throw new Error(`comparison ${res.status}`);
        const json = (await res.json()) as ComparisonResponse;
        if (!cancelled) {
          setData(json);
          setError(null);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'failed');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <ExplainerCard
      title="USDC vs USDT · Last 7 days"
      explainer={
        <>
          Side-by-side metrics for whale-scale activity over the last 7 days. Top 20
          concentration is the share of address-side volume held by the 20 largest
          addresses for that token.
        </>
      }
    >
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="skeleton h-8 w-full" />
          ))}
        </div>
      ) : error || !data ? (
        <div className="text-sm text-[var(--muted)]">
          Couldn&apos;t load comparison. {error ?? ''}
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left text-[11px] uppercase tracking-wider text-[var(--muted)]">
              <th className="py-2 pr-3 font-normal">Metric</th>
              <th
                className="py-2 pr-3 text-right font-medium"
                style={{ color: 'var(--usdc)' }}
              >
                USDC
              </th>
              <th
                className="py-2 pr-1 text-right font-medium"
                style={{ color: 'var(--usdt)' }}
              >
                USDT
              </th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr
                key={row.label}
                className="border-b border-[var(--border)]/60 last:border-0"
              >
                <td className="py-2 pr-3 text-[var(--muted)]">{row.label}</td>
                <td className="py-2 pr-3 text-right font-mono">{row.render(data.usdc)}</td>
                <td className="py-2 pr-1 text-right font-mono">{row.render(data.usdt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </ExplainerCard>
  );
}
