import { lookupAddress } from './known-addresses';
import type { Classification, ClassifyStats7d } from './types';

export function classifyAddress(
  address: string,
  stats: {
    transferCount: number;
    distinctCounterparties: number;
    avgTransferSize: number;
    totalVolume: number;
  },
): Classification {
  const known = lookupAddress(address);
  if (known) {
    return {
      type: 'known',
      label: known.label,
      category: known.category,
      reasoning: `Matched a curated label list (${known.category}).`,
    };
  }

  const { transferCount, distinctCounterparties, avgTransferSize } = stats;

  if (transferCount >= 20 && distinctCounterparties >= 10) {
    return {
      type: 'heuristic',
      guess: 'exchange-like',
      reasoning: `High transfer count (${transferCount}) and many distinct counterparties (${distinctCounterparties}) suggests an exchange or aggregator.`,
    };
  }

  if (transferCount <= 5 && avgTransferSize >= 1_000_000) {
    return {
      type: 'heuristic',
      guess: 'whale-like',
      reasoning: `Few large transfers (${transferCount} averaging $${Math.round(avgTransferSize).toLocaleString()}) suggest a whale or institutional desk.`,
    };
  }

  if (transferCount >= 5 && avgTransferSize <= 250_000) {
    return {
      type: 'heuristic',
      guess: 'retail-like',
      reasoning: `Many smaller transfers (${transferCount} averaging $${Math.round(avgTransferSize).toLocaleString()}) suggest payments or retail-style activity. Note: still above the $100k whale threshold.`,
    };
  }

  return {
    type: 'heuristic',
    guess: 'unknown',
    reasoning: 'Insufficient signal to classify.',
  };
}

export function deriveStats(rows: Array<{
  from_addr: string;
  to_addr: string;
  amount_usd: number;
}>, address: string): ClassifyStats7d {
  const a = address.toLowerCase();
  let sentVolume = 0;
  let receivedVolume = 0;
  let transferCount = 0;
  const counterparties = new Set<string>();
  let totalAmount = 0;

  for (const r of rows) {
    const from = r.from_addr.toLowerCase();
    const to = r.to_addr.toLowerCase();
    if (from !== a && to !== a) continue;
    transferCount += 1;
    totalAmount += Number(r.amount_usd);
    if (from === a) {
      sentVolume += Number(r.amount_usd);
      counterparties.add(to);
    }
    if (to === a) {
      receivedVolume += Number(r.amount_usd);
      counterparties.add(from);
    }
  }

  return {
    sentVolume,
    receivedVolume,
    transferCount,
    distinctCounterparties: counterparties.size,
    avgTransferSize: transferCount ? totalAmount / transferCount : 0,
  };
}
