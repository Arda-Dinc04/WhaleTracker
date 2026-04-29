import { NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import {
  getUsdcCirculatingOnEthereum,
  getUsdtCirculatingOnEthereum,
} from '@/lib/defillama';
import type { OverviewResponse } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = 0;

export async function GET() {
  try {
    const supabase = getSupabase();
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const [usdcSupply, usdtSupply, transfersResp, latestResp] = await Promise.all([
      getUsdcCirculatingOnEthereum().catch(() => 0),
      getUsdtCirculatingOnEthereum().catch(() => 0),
      supabase
        .from('transfers')
        .select('amount_usd', { count: 'exact' })
        .gte('block_timestamp', since),
      supabase
        .from('transfers')
        .select('ingested_at')
        .order('ingested_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    if (transfersResp.error) {
      return NextResponse.json({ error: transfersResp.error.message }, { status: 500 });
    }

    const rows = (transfersResp.data ?? []) as Array<{ amount_usd: number }>;
    const whaleVolume24h = rows.reduce((acc, r) => acc + Number(r.amount_usd), 0);
    const whaleCount24h = transfersResp.count ?? rows.length;

    const lastIngestedAt =
      (latestResp.data as { ingested_at: string } | null)?.ingested_at ??
      new Date(0).toISOString();

    const body: OverviewResponse = {
      usdcSupplyEthereum: usdcSupply,
      usdtSupplyEthereum: usdtSupply,
      whaleVolume24h,
      whaleCount24h,
      lastIngestedAt,
    };
    return NextResponse.json(body);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'overview failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
