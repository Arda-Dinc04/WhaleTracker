import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { classifyAddress, deriveStats } from '@/lib/classify';
import type { ClassifyResponse } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

function isAddress(input: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(input);
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const raw = (url.searchParams.get('address') ?? '').trim();
    if (!isAddress(raw)) {
      return NextResponse.json({ error: 'invalid address' }, { status: 400 });
    }
    const lower = raw.toLowerCase();

    const supabase = getSupabase();
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('transfers')
      .select('from_addr,to_addr,amount_usd')
      .gte('block_timestamp', since)
      .or(`from_addr.eq.${lower},to_addr.eq.${lower}`);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const rows = (data ?? []) as Array<{
      from_addr: string;
      to_addr: string;
      amount_usd: number;
    }>;

    const stats24h = deriveStats(rows, lower);
    const classification = classifyAddress(lower, {
      transferCount: stats24h.transferCount,
      distinctCounterparties: stats24h.distinctCounterparties,
      avgTransferSize: stats24h.avgTransferSize,
      totalVolume: stats24h.sentVolume + stats24h.receivedVolume,
    });

    const body: ClassifyResponse = {
      address: lower,
      classification,
      stats24h,
    };
    return NextResponse.json(body);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'classify failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
