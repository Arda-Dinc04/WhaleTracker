'use client';

import { ExternalLink } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ExplainerCard } from './ExplainerCard';
import { TokenToggle } from '@/components/ui/TokenToggle';
import { AddressLabel } from '@/components/ui/AddressLabel';
import { formatUsd, formatRelativeTime } from '@/lib/format';
import {
  FLOW_TYPE_COLOR,
  FLOW_TYPE_LABEL,
  type FlowType,
} from '@/lib/flow-type';
import type { TokenFilter, WhaleTransfer, WhalesResponse } from '@/lib/types';

function tokenColor(token: 'USDC' | 'USDT'): string {
  return token === 'USDC' ? 'var(--usdc)' : 'var(--usdt)';
}

function TxLink({ hash }: { hash: string }) {
  return (
    <a
      href={`https://etherscan.io/tx/${hash}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-[var(--muted)] hover:text-white"
      aria-label="View on Etherscan"
    >
      <ExternalLink size={14} />
    </a>
  );
}

function TokenChip({ token }: { token: 'USDC' | 'USDT' }) {
  return (
    <span
      className="inline-flex items-center rounded px-1.5 py-0.5 font-mono text-[11px] font-medium"
      style={{ color: tokenColor(token), border: `1px solid ${tokenColor(token)}55` }}
    >
      {token}
    </span>
  );
}

function FlowChip({ flowType }: { flowType: FlowType }) {
  const color = FLOW_TYPE_COLOR[flowType];
  return (
    <span
      className="inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium"
      style={{ color, border: `1px solid ${color}55` }}
    >
      {FLOW_TYPE_LABEL[flowType]}
    </span>
  );
}

export function WhaleFeed() {
  const [token, setToken] = useState<TokenFilter>('BOTH');
  const [transfers, setTransfers] = useState<WhaleTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/whales?limit=50&token=${token}`);
        if (!res.ok) throw new Error(`whales ${res.status}`);
        const json = (await res.json()) as WhalesResponse;
        if (!cancelled) {
          setTransfers(json.transfers);
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
  }, [token]);

  return (
    <ExplainerCard
      title="Recent Whale Transfers"
      right={<TokenToggle value={token} onChange={setToken} />}
      explainer={
        <>
          The 50 most recent USDC + USDT transfers above $100,000 on Ethereum mainnet,
          newest first. Click the link icon to open the transaction on Etherscan.
        </>
      }
    >
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton h-9 w-full" />
          ))}
        </div>
      ) : error ? (
        <div className="text-sm text-[var(--muted)]">Couldn&apos;t load feed. {error}</div>
      ) : transfers.length === 0 ? (
        <div className="flex h-32 items-center justify-center text-sm text-[var(--muted)]">
          No whale transfers in the window.
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-left text-[11px] uppercase tracking-wider text-[var(--muted)]">
                  <th className="py-2 pr-3 font-normal">Time</th>
                  <th className="py-2 pr-3 font-normal">Token</th>
                  <th className="py-2 pr-3 font-normal">Type</th>
                  <th className="py-2 pr-3 font-normal">From</th>
                  <th className="py-2 pr-3 font-normal">To</th>
                  <th className="py-2 pr-3 text-right font-normal">Amount</th>
                  <th className="py-2 pr-1 text-right font-normal">Tx</th>
                </tr>
              </thead>
              <tbody>
                {transfers.map((t) => (
                  <tr
                    key={`${t.txHash}-${t.logIndex}`}
                    className="border-b border-[var(--border)]/60 last:border-0"
                  >
                    <td className="py-2 pr-3 text-[var(--muted)]">
                      {formatRelativeTime(t.timestamp)}
                    </td>
                    <td className="py-2 pr-3">
                      <TokenChip token={t.token} />
                    </td>
                    <td className="py-2 pr-3">
                      <FlowChip flowType={t.flowType} />
                    </td>
                    <td className="py-2 pr-3">
                      <AddressLabel
                        address={t.from.address}
                        label={t.from.label}
                        category={t.from.category}
                      />
                    </td>
                    <td className="py-2 pr-3">
                      <AddressLabel
                        address={t.to.address}
                        label={t.to.label}
                        category={t.to.category}
                      />
                    </td>
                    <td className="py-2 pr-3 text-right font-mono">
                      {formatUsd(t.amountUsd, { abbreviated: false })}
                    </td>
                    <td className="py-2 pr-1 text-right">
                      <TxLink hash={t.txHash} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-2 md:hidden">
            {transfers.map((t) => (
              <div
                key={`${t.txHash}-${t.logIndex}`}
                className="rounded-md border border-[var(--border)] p-3 text-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TokenChip token={t.token} />
                    <FlowChip flowType={t.flowType} />
                    <span className="text-xs text-[var(--muted)]">
                      {formatRelativeTime(t.timestamp)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono">
                      {formatUsd(t.amountUsd, { abbreviated: false })}
                    </span>
                    <TxLink hash={t.txHash} />
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-[40px_1fr] items-center gap-y-1 text-xs">
                  <span className="text-[var(--muted)]">From</span>
                  <AddressLabel
                    address={t.from.address}
                    label={t.from.label}
                    category={t.from.category}
                  />
                  <span className="text-[var(--muted)]">To</span>
                  <AddressLabel
                    address={t.to.address}
                    label={t.to.label}
                    category={t.to.category}
                  />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </ExplainerCard>
  );
}
