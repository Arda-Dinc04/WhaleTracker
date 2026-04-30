'use client';

import { useEffect, useState } from 'react';
import { Stat } from '@/components/ui/Stat';
import { Card } from '@/components/ui/Card';
import { formatUsd, formatNumber } from '@/lib/format';
import type { OverviewResponse } from '@/lib/types';

export function MacroStrip({
  onLastIngestedAt,
}: {
  onLastIngestedAt?: (iso: string) => void;
}) {
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch('/api/overview');
        if (!res.ok) throw new Error(`overview ${res.status}`);
        const json = (await res.json()) as OverviewResponse;
        if (cancelled) return;
        setData(json);
        setError(null);
        onLastIngestedAt?.(json.lastIngestedAt);
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
  }, [onLastIngestedAt]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-5">
            <div className="skeleton h-3 w-32" />
            <div className="skeleton mt-3 h-8 w-24" />
            <div className="skeleton mt-3 h-2 w-20" />
          </Card>
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-md border border-[var(--border)] bg-[var(--card)] p-4 text-sm text-[var(--muted)]">
        Couldn&apos;t load macro stats. {error ?? ''}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Stat
        label="USDC on Ethereum"
        value={formatUsd(data.usdcSupplyEthereum)}
        explainer={
          <>
            Total USDC circulating on Ethereum mainnet, sourced from DefiLlama. Reflects
            issuance, not whale activity.
          </>
        }
      />
      <Stat
        label="USDT on Ethereum"
        value={formatUsd(data.usdtSupplyEthereum)}
        explainer={
          <>
            Total USDT circulating on Ethereum mainnet, sourced from DefiLlama. Reflects
            issuance, not whale activity.
          </>
        }
      />
      <Stat
        label="Whale Volume (7d)"
        value={formatUsd(data.whaleVolume7d)}
        explainer={
          <>
            Total USD value of all USDC + USDT transfers above $100,000 on Ethereum mainnet
            in the last 7 days. This is the gross amount moved, not net flow.
          </>
        }
      />
      <Stat
        label="Whale Transfers (7d)"
        value={formatNumber(data.whaleCount7d)}
        explainer={
          <>
            Count of USDC + USDT transfers above $100,000 on Ethereum mainnet in the last
            7 days.
          </>
        }
      />
    </div>
  );
}
