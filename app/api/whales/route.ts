import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { lookupAddress } from '@/lib/known-addresses';
import { flowTypeFromCategories } from '@/lib/flow-type';
import type { TokenFilter, WhaleTransfer, WhalesResponse } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

function parseToken(input: string | null): TokenFilter {
  if (input === 'USDC' || input === 'USDT' || input === 'BOTH') return input;
  return 'BOTH';
}

type Row = {
  tx_hash: string;
  log_index: number;
  token: 'USDC' | 'USDT';
  from_addr: string;
  to_addr: string;
  amount_usd: number;
  block_number: number;
  block_timestamp: string;
};

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const limitParam = parseInt(url.searchParams.get('limit') ?? '50', 10);
    const limit = Number.isFinite(limitParam) && limitParam > 0 && limitParam <= 200
      ? limitParam
      : 50;
    const token = parseToken(url.searchParams.get('token'));

    const supabase = getSupabase();
    let query = supabase
      .from('transfers')
      .select('tx_hash,log_index,token,from_addr,to_addr,amount_usd,block_number,block_timestamp')
      .order('block_timestamp', { ascending: false })
      .order('log_index', { ascending: false })
      .limit(limit);
    if (token !== 'BOTH') query = query.eq('token', token);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const rows = (data ?? []) as Row[];

    const transfers: WhaleTransfer[] = rows.map((r) => {
      const fromKnown = lookupAddress(r.from_addr);
      const toKnown = lookupAddress(r.to_addr);
      return {
        txHash: r.tx_hash,
        logIndex: r.log_index,
        token: r.token,
        from: {
          address: r.from_addr,
          label: fromKnown?.label ?? null,
          category: fromKnown?.category ?? null,
        },
        to: {
          address: r.to_addr,
          label: toKnown?.label ?? null,
          category: toKnown?.category ?? null,
        },
        amountUsd: Number(r.amount_usd),
        blockNumber: r.block_number,
        timestamp: r.block_timestamp,
        flowType: flowTypeFromCategories(
          fromKnown?.category ?? null,
          toKnown?.category ?? null,
        ),
      };
    });

    const body: WhalesResponse = { transfers };
    return NextResponse.json(body);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'whales failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
