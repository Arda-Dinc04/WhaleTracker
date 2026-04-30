import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { lookupAddress } from '@/lib/known-addresses';
import { classifyAddress } from '@/lib/classify';
import { whaleStatsSinceIso } from '@/lib/dashboard-window';
import type {
  ConcentrationAddress,
  ConcentrationResponse,
  TokenFilter,
} from '@/lib/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

function parseToken(input: string | null): TokenFilter {
  if (input === 'USDC' || input === 'USDT' || input === 'BOTH') return input;
  return 'BOTH';
}

type Row = {
  from_addr: string;
  to_addr: string;
  amount_usd: number;
  token: 'USDC' | 'USDT';
};

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const token = parseToken(url.searchParams.get('token'));
    const supabase = getSupabase();

    const since = whaleStatsSinceIso();
    let query = supabase
      .from('transfers')
      .select('from_addr,to_addr,amount_usd,token')
      .gte('block_timestamp', since);
    if (token !== 'BOTH') query = query.eq('token', token);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const rows = (data ?? []) as Row[];
    // Address-side volume: each transfer contributes its amount once to the
    // sender and once to the receiver. The top-20 share uses this doubled
    // total so the ratio is consistent with how each address's volume is
    // computed below ("includes both transfers it sent and transfers it
    // received").
    const totalAddressVolume = rows.reduce(
      (acc, r) => acc + 2 * Number(r.amount_usd),
      0,
    );

    type Agg = { volume: number; count: number; counterparties: Set<string>; totalAmt: number };
    const agg = new Map<string, Agg>();
    const bump = (addr: string, amount: number, counter: string) => {
      const key = addr.toLowerCase();
      let entry = agg.get(key);
      if (!entry) {
        entry = { volume: 0, count: 0, counterparties: new Set(), totalAmt: 0 };
        agg.set(key, entry);
      }
      entry.volume += amount;
      entry.count += 1;
      entry.totalAmt += amount;
      entry.counterparties.add(counter.toLowerCase());
    };

    for (const r of rows) {
      const amount = Number(r.amount_usd);
      bump(r.from_addr, amount, r.to_addr);
      bump(r.to_addr, amount, r.from_addr);
    }

    const sorted = Array.from(agg.entries())
      .map(([address, info]) => ({ address, ...info }))
      .sort((a, b) => b.volume - a.volume);

    const top = sorted.slice(0, 20);

    const topAddresses: ConcentrationAddress[] = top.map((entry, idx) => {
      const known = lookupAddress(entry.address);
      const classification = classifyAddress(entry.address, {
        transferCount: entry.count,
        distinctCounterparties: entry.counterparties.size,
        avgTransferSize: entry.count ? entry.totalAmt / entry.count : 0,
        totalVolume: entry.volume,
      });
      const classText =
        classification.type === 'known'
          ? `known: ${classification.category}`
          : classification.guess;
      return {
        address: entry.address,
        label: known?.label ?? null,
        category: known?.category ?? null,
        classification: classText,
        volume: entry.volume,
        transferCount: entry.count,
        rank: idx + 1,
      };
    });

    const top5Volume = top.slice(0, 5).reduce((acc, e) => acc + e.volume, 0);
    const top20Volume = top.reduce((acc, e) => acc + e.volume, 0);
    const top5Share = totalAddressVolume > 0 ? top5Volume / totalAddressVolume : 0;
    const top20Share = totalAddressVolume > 0 ? top20Volume / totalAddressVolume : 0;

    const unknownVolumeInTop20 = topAddresses
      .filter((a) => a.classification === 'unknown')
      .reduce((acc, a) => acc + a.volume, 0);
    const unknownShare = top20Volume > 0 ? unknownVolumeInTop20 / top20Volume : 0;

    const body: ConcentrationResponse = {
      token,
      total7dVolume: totalAddressVolume,
      topAddresses,
      top5Share,
      top20Share,
      unknownShare,
    };
    return NextResponse.json(body);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'concentration failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
