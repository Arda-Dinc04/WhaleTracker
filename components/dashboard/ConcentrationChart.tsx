'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ExplainerCard } from './ExplainerCard';
import { TokenToggle } from '@/components/ui/TokenToggle';
import { formatUsd, formatAddress, formatNumber } from '@/lib/format';
import type {
  ConcentrationAddress,
  ConcentrationResponse,
  TokenFilter,
} from '@/lib/types';

const COLOR_BY_CATEGORY: Record<string, string> = {
  exchange: '#3b82f6',
  issuer: '#a855f7',
  bridge: '#f59e0b',
  defi: '#22c55e',
  mm: '#ef4444',
  other: '#6b7280',
};
const FALLBACK = '#6366f1';

function colorFor(addr: ConcentrationAddress): string {
  if (addr.category && COLOR_BY_CATEGORY[addr.category]) {
    return COLOR_BY_CATEGORY[addr.category];
  }
  return FALLBACK;
}

type RowDatum = ConcentrationAddress & { displayLabel: string };

function ChartTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: RowDatum }> }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="min-w-[220px] rounded-md border border-[var(--border)] bg-[#0f0f0f] p-3 text-xs">
      <div className="font-medium">{d.label ?? formatAddress(d.address, 6)}</div>
      <div className="mt-1 break-all text-[10px] text-[var(--muted)]">{d.address}</div>
      <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
        <span className="text-[var(--muted)]">Volume</span>
        <span className="mono text-right">{formatUsd(d.volume)}</span>
        <span className="text-[var(--muted)]">Transfers</span>
        <span className="mono text-right">{formatNumber(d.transferCount)}</span>
        <span className="text-[var(--muted)]">Class</span>
        <span className="text-right capitalize">{d.classification}</span>
      </div>
    </div>
  );
}

export function ConcentrationChart() {
  const [token, setToken] = useState<TokenFilter>('BOTH');
  const [data, setData] = useState<ConcentrationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/concentration?token=${token}`);
        if (!res.ok) throw new Error(`concentration ${res.status}`);
        const json = (await res.json()) as ConcentrationResponse;
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
  }, [token]);

  const rows = useMemo<RowDatum[]>(() => {
    if (!data) return [];
    return data.topAddresses.map((a) => ({
      ...a,
      displayLabel: a.label ?? formatAddress(a.address, 4),
    }));
  }, [data]);

  const sharePct = data ? Math.round(data.top20Share * 100) : 0;

  const chartHeight = Math.max(360, rows.length * 26);

  return (
    <ExplainerCard
      title="Address Concentration · Last 7 days"
      right={<TokenToggle value={token} onChange={setToken} />}
      explainer={
        <>
          Top 20 addresses ranked by total whale volume in the last 7 days. An address&apos;s
          volume is the sum of all transfers it sent and all transfers it received. The
          headline percentage is that top-20 volume divided by total whale volume in the
          window.
        </>
      }
      footer={
        <>
          An address&apos;s volume includes both transfers it sent and transfers it
          received. Color encodes category — blue: exchange, purple: issuer, orange:
          bridge, green: defi, gray: other/unknown. &quot;Unknown share&quot; is the
          portion of top-20 volume coming from addresses we couldn&apos;t classify.
        </>
      }
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch">
        <div className="flex flex-col justify-center rounded-md border border-[var(--border)] bg-[#0c0c0c] p-5 lg:w-72">
          {loading || !data ? (
            <>
              <div className="skeleton h-12 w-32" />
              <div className="skeleton mt-3 h-3 w-44" />
            </>
          ) : data.total7dVolume === 0 ? (
            <div className="text-sm text-[var(--muted)]">
              No whale activity in the last 7 days.
            </div>
          ) : (
            <>
              <div className="font-mono text-5xl font-semibold leading-none">
                {sharePct}%
              </div>
              <p className="mt-3 text-sm leading-snug text-[var(--muted)]">
                of whale volume flows through these{' '}
                <span className="text-white">{rows.length}</span> addresses.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                <span className="text-[var(--muted)]">Total volume (7d)</span>
                <span className="mono text-right">{formatUsd(data.total7dVolume)}</span>
                <span className="text-[var(--muted)]">Token</span>
                <span className="text-right">{token === 'BOTH' ? 'USDC + USDT' : token}</span>
                <span className="text-[var(--muted)]">Top 5 share</span>
                <span className="mono text-right">
                  {Math.round(data.top5Share * 100)}%
                </span>
                <span className="text-[var(--muted)]">Top 20 share</span>
                <span className="mono text-right">
                  {Math.round(data.top20Share * 100)}%
                </span>
                <span className="text-[var(--muted)]">Unknown share</span>
                <span className="mono text-right">
                  {Math.round(data.unknownShare * 100)}%
                </span>
              </div>
            </>
          )}
        </div>

        <div className="flex-1">
          {loading ? (
            <div className="skeleton" style={{ height: chartHeight }} />
          ) : rows.length === 0 ? (
            <div className="flex h-72 items-center justify-center text-sm text-[var(--muted)]">
              No whale transfers in the last 7 days for this filter.
            </div>
          ) : error ? (
            <div className="text-sm text-[var(--muted)]">Couldn&apos;t load chart. {error}</div>
          ) : (
            <ResponsiveContainer width="100%" height={chartHeight}>
              <BarChart
                data={rows}
                layout="vertical"
                margin={{ top: 4, right: 16, bottom: 4, left: 8 }}
              >
                <CartesianGrid stroke="#1f1f1f" horizontal={false} />
                <XAxis
                  type="number"
                  tickFormatter={(v) => formatUsd(Number(v))}
                  stroke="#444"
                  tick={{ fill: '#8a8a8a', fontSize: 11 }}
                />
                <YAxis
                  type="category"
                  dataKey="displayLabel"
                  stroke="#444"
                  tick={{ fill: '#cfcfcf', fontSize: 11 }}
                  width={140}
                />
                <Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} content={<ChartTooltip />} />
                <Bar dataKey="volume" radius={[0, 3, 3, 0]} isAnimationActive={false}>
                  {rows.map((r) => (
                    <Cell key={r.address} fill={colorFor(r)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </ExplainerCard>
  );
}
