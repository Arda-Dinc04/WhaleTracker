import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import type { FlowBucket, FlowResponse, TokenSymbol } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

type Row = {
  amount_usd: number;
  token: TokenSymbol;
  block_timestamp: string;
};

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const hoursParam = parseInt(url.searchParams.get('hours') ?? '48', 10);
    const hours = Number.isFinite(hoursParam) && hoursParam > 0 && hoursParam <= 168
      ? hoursParam
      : 48;

    const supabase = getSupabase();
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    const { data, error } = await supabase
      .from('transfers')
      .select('amount_usd,token,block_timestamp')
      .gte('block_timestamp', since.toISOString());
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const rows = (data ?? []) as Row[];

    // Build hourly buckets keyed by start-of-hour (UTC).
    const buckets = new Map<string, FlowBucket>();
    const startHourMs = (() => {
      const d = new Date();
      d.setUTCMinutes(0, 0, 0);
      return d.getTime() - (hours - 1) * 60 * 60 * 1000;
    })();
    for (let i = 0; i < hours; i++) {
      const t = new Date(startHourMs + i * 60 * 60 * 1000);
      buckets.set(t.toISOString(), {
        hourStart: t.toISOString(),
        usdcVolume: 0,
        usdtVolume: 0,
        usdcCount: 0,
        usdtCount: 0,
      });
    }

    for (const r of rows) {
      const ts = new Date(r.block_timestamp);
      ts.setUTCMinutes(0, 0, 0);
      const key = ts.toISOString();
      const bucket = buckets.get(key);
      if (!bucket) continue; // outside requested window
      const amount = Number(r.amount_usd);
      if (r.token === 'USDC') {
        bucket.usdcVolume += amount;
        bucket.usdcCount += 1;
      } else {
        bucket.usdtVolume += amount;
        bucket.usdtCount += 1;
      }
    }

    const body: FlowResponse = {
      hours,
      buckets: Array.from(buckets.values()).sort((a, b) =>
        a.hourStart.localeCompare(b.hourStart),
      ),
    };
    return NextResponse.json(body);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'flow failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
