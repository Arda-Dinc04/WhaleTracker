import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { lookupAddress } from '@/lib/known-addresses';
import { classifyAddress } from '@/lib/classify';
import {
  flowTypeFromCategories,
  FLOW_TYPE_ORDER,
  type FlowType,
} from '@/lib/flow-type';
import type { RolesResponse, RoleVolume } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

type Row = {
  from_addr: string;
  to_addr: string;
  amount_usd: number;
  token: 'USDC' | 'USDT';
};

export async function GET() {
  try {
    const supabase = getSupabase();
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('transfers')
      .select('from_addr,to_addr,amount_usd,token')
      .gte('block_timestamp', since);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const rows = (data ?? []) as Row[];

    type Agg = { count: number; counterparties: Set<string>; totalAmt: number };
    const agg = new Map<string, Agg>();
    const bump = (addr: string, amount: number, counter: string) => {
      const key = addr.toLowerCase();
      let entry = agg.get(key);
      if (!entry) {
        entry = { count: 0, counterparties: new Set(), totalAmt: 0 };
        agg.set(key, entry);
      }
      entry.count += 1;
      entry.totalAmt += amount;
      entry.counterparties.add(counter.toLowerCase());
    };
    for (const r of rows) {
      const amt = Number(r.amount_usd);
      bump(r.from_addr, amt, r.to_addr);
      bump(r.to_addr, amt, r.from_addr);
    }

    // Resolve a category for each address: known label first, then heuristic
    // 'exchange-like' counts as exchange; everything else stays null.
    const categoryByAddress = new Map<string, string | null>();
    for (const [addr, info] of agg.entries()) {
      const known = lookupAddress(addr);
      if (known) {
        categoryByAddress.set(addr, known.category);
        continue;
      }
      const guess = classifyAddress(addr, {
        transferCount: info.count,
        distinctCounterparties: info.counterparties.size,
        avgTransferSize: info.count ? info.totalAmt / info.count : 0,
        totalVolume: info.totalAmt,
      });
      if (guess.type === 'heuristic' && guess.guess === 'exchange-like') {
        categoryByAddress.set(addr, 'exchange');
      } else {
        categoryByAddress.set(addr, null);
      }
    }

    const totals = new Map<FlowType, { volume: number; count: number }>();
    for (const f of FLOW_TYPE_ORDER) totals.set(f, { volume: 0, count: 0 });

    let totalVolume = 0;
    for (const r of rows) {
      const amt = Number(r.amount_usd);
      const fromCat = categoryByAddress.get(r.from_addr.toLowerCase()) ?? null;
      const toCat = categoryByAddress.get(r.to_addr.toLowerCase()) ?? null;
      const flow = flowTypeFromCategories(fromCat, toCat);
      const bucket = totals.get(flow)!;
      bucket.volume += amt;
      bucket.count += 1;
      totalVolume += amt;
    }

    const buckets: RoleVolume[] = FLOW_TYPE_ORDER.map((role) => ({
      role,
      volume: totals.get(role)!.volume,
      transferCount: totals.get(role)!.count,
    }));

    const body: RolesResponse = { totalVolume, buckets };
    return NextResponse.json(body);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'roles failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
