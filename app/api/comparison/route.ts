import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { whaleStatsSinceIso } from '@/lib/dashboard-window';
import type {
  ComparisonResponse,
  ComparisonTokenStats,
  TokenSymbol,
} from '@/lib/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

type Row = {
  from_addr: string;
  to_addr: string;
  amount_usd: number;
  token: 'USDC' | 'USDT';
};

function computeStats(token: TokenSymbol, rows: Row[]): ComparisonTokenStats {
  const tokenRows = rows.filter((r) => r.token === token);

  let whaleVolume7d = 0;
  let largestTransfer = 0;
  const senders = new Set<string>();
  const receivers = new Set<string>();
  const addressVolume = new Map<string, number>();

  for (const r of tokenRows) {
    const amt = Number(r.amount_usd);
    whaleVolume7d += amt;
    if (amt > largestTransfer) largestTransfer = amt;
    senders.add(r.from_addr.toLowerCase());
    receivers.add(r.to_addr.toLowerCase());
    addressVolume.set(
      r.from_addr.toLowerCase(),
      (addressVolume.get(r.from_addr.toLowerCase()) ?? 0) + amt,
    );
    addressVolume.set(
      r.to_addr.toLowerCase(),
      (addressVolume.get(r.to_addr.toLowerCase()) ?? 0) + amt,
    );
  }

  const whaleTransfers7d = tokenRows.length;
  const avgTransferSize = whaleTransfers7d > 0 ? whaleVolume7d / whaleTransfers7d : 0;

  const totalAddressVolume = Array.from(addressVolume.values()).reduce((a, b) => a + b, 0);
  const top20Volume = Array.from(addressVolume.values())
    .sort((a, b) => b - a)
    .slice(0, 20)
    .reduce((a, b) => a + b, 0);
  const top20Share = totalAddressVolume > 0 ? top20Volume / totalAddressVolume : 0;

  return {
    token,
    whaleVolume7d,
    whaleTransfers7d,
    avgTransferSize,
    largestTransfer,
    uniqueSenders: senders.size,
    uniqueReceivers: receivers.size,
    top20Share,
  };
}

export async function GET() {
  try {
    const supabase = getSupabase();
    const since = whaleStatsSinceIso();

    const { data, error } = await supabase
      .from('transfers')
      .select('from_addr,to_addr,amount_usd,token')
      .gte('block_timestamp', since);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const rows = (data ?? []) as Row[];

    const body: ComparisonResponse = {
      usdc: computeStats('USDC', rows),
      usdt: computeStats('USDT', rows),
    };
    return NextResponse.json(body);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'comparison failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
