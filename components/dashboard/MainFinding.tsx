'use client';

import { useEffect, useState } from 'react';
import { Card, CardBody } from '@/components/ui/Card';
import { formatUsd } from '@/lib/format';
import type { ConcentrationResponse } from '@/lib/types';

const CATEGORY_LABEL: Record<string, string> = {
  exchange: 'exchanges',
  issuer: 'issuers',
  bridge: 'bridges',
  defi: 'DeFi contracts',
  mm: 'market makers',
  other: 'other categories',
};

function dominantCategory(data: ConcentrationResponse): string | null {
  const totals = new Map<string, number>();
  for (const a of data.topAddresses) {
    if (!a.category) continue;
    totals.set(a.category, (totals.get(a.category) ?? 0) + a.volume);
  }
  if (totals.size === 0) return null;
  let best: { cat: string; vol: number } | null = null;
  for (const [cat, vol] of totals) {
    if (!best || vol > best.vol) best = { cat, vol };
  }
  return best ? CATEGORY_LABEL[best.cat] ?? best.cat : null;
}

export function MainFinding() {
  const [data, setData] = useState<ConcentrationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch('/api/concentration?token=BOTH');
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
  }, []);

  return (
    <Card>
      <CardBody>
        <div className="text-[11px] uppercase tracking-wider text-[var(--muted)]">
          Main Finding
        </div>
        {loading || !data ? (
          <div className="mt-2 space-y-2">
            <div className="skeleton h-4 w-5/6" />
            <div className="skeleton h-4 w-3/4" />
          </div>
        ) : error ? (
          <p className="mt-2 text-sm text-[var(--muted)]">
            Couldn&apos;t load main finding. {error}
          </p>
        ) : data.total7dVolume === 0 ? (
          <p className="mt-2 text-base leading-relaxed">
            No whale activity above $100,000 in the last 7 days.
          </p>
        ) : (
          <p className="mt-2 text-base leading-relaxed">
            In the last 7 days, the top 20 addresses handled{' '}
            <span className="font-semibold text-white">
              {Math.round(data.top20Share * 100)}%
            </span>{' '}
            of observed USDC + USDT whale volume (
            <span className="font-mono text-white">
              {formatUsd(data.total7dVolume)}
            </span>{' '}
            total), suggesting whale stablecoin activity is highly concentrated.
            {dominantCategory(data) && (
              <>
                {' '}
                Most of it ran through addresses tagged as{' '}
                <span className="font-semibold text-white">{dominantCategory(data)}</span>.
              </>
            )}
          </p>
        )}
      </CardBody>
    </Card>
  );
}
