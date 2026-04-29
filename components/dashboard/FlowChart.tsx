'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ExplainerCard } from './ExplainerCard';
import { formatUsd } from '@/lib/format';
import type { FlowResponse } from '@/lib/types';

type Datum = {
  hourStart: string;
  label: string;
  USDC: number;
  USDT: number;
  usdcCount: number;
  usdtCount: number;
};

function FlowTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ payload: Datum }>; label?: string }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const total = d.USDC + d.USDT;
  return (
    <div className="min-w-[200px] rounded-md border border-[var(--border)] bg-[#0f0f0f] p-3 text-xs">
      <div className="font-medium">{label}</div>
      <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
        <span style={{ color: 'var(--usdc)' }}>USDC</span>
        <span className="mono text-right">{formatUsd(d.USDC)} ({d.usdcCount})</span>
        <span style={{ color: 'var(--usdt)' }}>USDT</span>
        <span className="mono text-right">{formatUsd(d.USDT)} ({d.usdtCount})</span>
        <span className="text-[var(--muted)]">Total</span>
        <span className="mono text-right">{formatUsd(total)}</span>
      </div>
    </div>
  );
}

export function FlowChart() {
  const [data, setData] = useState<FlowResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch('/api/flow?hours=48');
        if (!res.ok) throw new Error(`flow ${res.status}`);
        const json = (await res.json()) as FlowResponse;
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

  const series = useMemo<Datum[]>(() => {
    if (!data) return [];
    return data.buckets.map((b) => {
      const d = new Date(b.hourStart);
      const hh = d.getUTCHours();
      const dd = d.getUTCDate();
      return {
        hourStart: b.hourStart,
        label: `${dd}/${String(hh).padStart(2, '0')}:00`,
        USDC: b.usdcVolume,
        USDT: b.usdtVolume,
        usdcCount: b.usdcCount,
        usdtCount: b.usdtCount,
      };
    });
  }, [data]);

  const tickInterval = Math.max(1, Math.floor(series.length / 8));
  const hasAny = series.some((d) => d.USDC + d.USDT > 0);

  return (
    <ExplainerCard
      title="Hourly Whale Flow · Last 48h"
      explainer={
        <>
          Each bar is the total USD value of USDC + USDT transfers above $100,000 in that
          hour. The two stacks split by token. Hours with no whale activity show empty.
        </>
      }
      footer={
        <>Each bar is the total volume of transfers above $100k in that hour, broken down by token.</>
      }
    >
      {loading ? (
        <div className="skeleton h-72 w-full" />
      ) : error ? (
        <div className="text-sm text-[var(--muted)]">Couldn&apos;t load flow. {error}</div>
      ) : !hasAny ? (
        <div className="flex h-72 items-center justify-center text-sm text-[var(--muted)]">
          No whale activity in the last 48 hours.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={series} margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
            <CartesianGrid stroke="#1f1f1f" vertical={false} />
            <XAxis
              dataKey="label"
              stroke="#444"
              tick={{ fill: '#8a8a8a', fontSize: 11 }}
              interval={tickInterval}
            />
            <YAxis
              stroke="#444"
              tick={{ fill: '#8a8a8a', fontSize: 11 }}
              tickFormatter={(v) => formatUsd(Number(v))}
              width={64}
            />
            <Tooltip cursor={{ fill: 'rgba(255,255,255,0.04)' }} content={<FlowTooltip />} />
            <Legend wrapperStyle={{ color: '#cfcfcf', fontSize: 12 }} />
            <Bar dataKey="USDC" stackId="vol" fill="var(--usdc)" isAnimationActive={false} />
            <Bar dataKey="USDT" stackId="vol" fill="var(--usdt)" isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ExplainerCard>
  );
}
