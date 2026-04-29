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
import { formatUsd, formatNumber } from '@/lib/format';
import {
  FLOW_TYPE_COLOR,
  FLOW_TYPE_ORDER,
  type FlowType,
} from '@/lib/flow-type';
import type { RolesResponse } from '@/lib/types';

const ROLE_TITLE: Record<FlowType, string> = {
  issuer: 'Issuer',
  exchange: 'Exchange',
  bridge: 'Bridge',
  defi: 'DeFi',
  unknown: 'Unknown',
};

type ChartRow = {
  role: FlowType;
  title: string;
  volume: number;
  transferCount: number;
};

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: ChartRow }>;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="min-w-[180px] rounded-md border border-[var(--border)] bg-[#0f0f0f] p-3 text-xs">
      <div className="font-medium">{d.title} flow</div>
      <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
        <span className="text-[var(--muted)]">Volume</span>
        <span className="mono text-right">{formatUsd(d.volume)}</span>
        <span className="text-[var(--muted)]">Transfers</span>
        <span className="mono text-right">{formatNumber(d.transferCount)}</span>
      </div>
    </div>
  );
}

export function RoleBreakdown() {
  const [data, setData] = useState<RolesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch('/api/roles');
        if (!res.ok) throw new Error(`roles ${res.status}`);
        const json = (await res.json()) as RolesResponse;
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

  const rows = useMemo<ChartRow[]>(() => {
    if (!data) return [];
    return FLOW_TYPE_ORDER.map((role) => {
      const found = data.buckets.find((b) => b.role === role);
      return {
        role,
        title: ROLE_TITLE[role],
        volume: found?.volume ?? 0,
        transferCount: found?.transferCount ?? 0,
      };
    });
  }, [data]);

  const empty = !!data && data.totalVolume === 0;

  return (
    <ExplainerCard
      title="Address Role Breakdown · Last 24h"
      explainer={
        <>
          Each whale transfer is attributed to a single role using the from/to address
          labels. Priority is fixed: issuer &gt; bridge &gt; exchange &gt; DeFi &gt; unknown.
          Known labels override heuristics; heuristic &quot;exchange-like&quot; addresses
          contribute to the Exchange bucket. Volume is single-counted per transfer.
        </>
      }
      footer={
        <>
          Color: purple — issuer, blue — exchange, orange — bridge, green — DeFi, gray —
          unknown.
        </>
      }
    >
      {loading ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="rounded-md border border-[var(--border)] p-3">
                <div className="skeleton h-3 w-16" />
                <div className="skeleton mt-2 h-6 w-24" />
              </div>
            ))}
          </div>
          <div className="skeleton h-64 w-full" />
        </div>
      ) : error || !data ? (
        <div className="text-sm text-[var(--muted)]">
          Couldn&apos;t load role breakdown. {error ?? ''}
        </div>
      ) : empty ? (
        <div className="flex h-32 items-center justify-center text-sm text-[var(--muted)]">
          No whale transfers in the last 24h.
        </div>
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {rows.map((r) => (
              <div
                key={r.role}
                className="rounded-md border border-[var(--border)] bg-[#0c0c0c] p-3"
              >
                <div className="text-[11px] uppercase tracking-wider text-[var(--muted)]">
                  {r.title}
                </div>
                <div
                  className="mt-1 font-mono text-lg font-semibold"
                  style={{ color: FLOW_TYPE_COLOR[r.role] }}
                >
                  {formatUsd(r.volume)}
                </div>
                <div className="mt-0.5 text-[11px] text-[var(--muted)]">
                  {formatNumber(r.transferCount)} transfer{r.transferCount === 1 ? '' : 's'}
                </div>
              </div>
            ))}
          </div>

          <ResponsiveContainer width="100%" height={260}>
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
                dataKey="title"
                stroke="#444"
                tick={{ fill: '#cfcfcf', fontSize: 11 }}
                width={90}
              />
              <Tooltip
                cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                content={<ChartTooltip />}
              />
              <Bar dataKey="volume" radius={[0, 3, 3, 0]} isAnimationActive={false}>
                {rows.map((r) => (
                  <Cell key={r.role} fill={FLOW_TYPE_COLOR[r.role]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </ExplainerCard>
  );
}
