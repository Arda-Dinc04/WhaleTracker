'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';
import { formatRelativeTime } from '@/lib/format';

export function Header() {
  const [lastIngested, setLastIngested] = useState<string | null>(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch('/api/overview');
        if (!res.ok) return;
        const json = (await res.json()) as { lastIngestedAt: string };
        if (!cancelled) setLastIngested(json.lastIngestedAt);
      } catch {
        // ignore
      }
    }
    load();
    const id = setInterval(load, 60_000);
    const tick = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => {
      cancelled = true;
      clearInterval(id);
      clearInterval(tick);
    };
  }, []);

  const updated =
    lastIngested && new Date(lastIngested).getTime() > 0
      ? `Last updated: ${formatRelativeTime(lastIngested)}`
      : 'Awaiting first ingestion';

  return (
    <header className="border-b border-[var(--border)]">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <Activity size={18} className="text-[var(--usdc)]" />
          <span className="text-sm font-medium">Stablecoin Flow Tracker</span>
        </Link>
        <div className="flex items-center gap-4 text-xs text-[var(--muted)]">
          <span className="hidden sm:inline">{updated}</span>
          <Link href="/about" className="hover:text-white">
            About
          </Link>
        </div>
      </div>
    </header>
  );
}
