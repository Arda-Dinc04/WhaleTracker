'use client';

import { Search } from 'lucide-react';
import { useState } from 'react';
import { ExplainerCard } from './ExplainerCard';
import { AddressLabel } from '@/components/ui/AddressLabel';
import { EXAMPLE_CLASSIFIER_CHIPS } from '@/lib/known-addresses';
import { formatUsd, formatNumber, toChecksumLikeAddress } from '@/lib/format';
import type { ClassifyResponse } from '@/lib/types';

const ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

function classificationLabel(c: ClassifyResponse['classification']): { tag: string; tone: string } {
  if (c.type === 'known') {
    return { tag: `${c.label} (known ${c.category})`, tone: 'text-emerald-400' };
  }
  const map: Record<string, string> = {
    'exchange-like': 'text-blue-400',
    'whale-like': 'text-purple-400',
    'retail-like': 'text-amber-400',
    'unknown': 'text-[var(--muted)]',
  };
  return { tag: `Heuristic: ${c.guess}`, tone: map[c.guess] ?? 'text-[var(--muted)]' };
}

export function AddressClassifier() {
  const [input, setInput] = useState('');
  const [data, setData] = useState<ClassifyResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function classify(value: string) {
    setError(null);
    setData(null);
    if (!ADDRESS_RE.test(value.trim())) {
      setError('Enter a valid Ethereum address (0x + 40 hex chars).');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/classify?address=${encodeURIComponent(value.trim())}`);
      const json = await res.json();
      if (!res.ok) {
        setError(typeof json.error === 'string' ? json.error : `error ${res.status}`);
        return;
      }
      setData(json as ClassifyResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'classify failed');
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    classify(input);
  }

  function pickExample(addr: string) {
    setInput(addr);
    classify(addr);
  }

  const noActivity = data && data.stats24h.transferCount === 0;

  return (
    <ExplainerCard
      title="Address Classifier"
      explainer={
        <>
          Paste any Ethereum address. We look it up in our curated label list. If it&apos;s
          unknown, a transparent heuristic guesses based on its 24h whale activity in our
          window. Heuristic guesses are clearly labeled as such.
        </>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row">
        <div className="flex flex-1 items-center gap-2 rounded-md border border-[var(--border)] bg-[#0c0c0c] px-3">
          <Search size={14} className="text-[var(--muted)]" />
          <input
            type="text"
            spellCheck={false}
            placeholder="0x…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="mono flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-[var(--muted)]"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-md border border-[var(--border)] bg-white/5 px-4 py-2 text-sm font-medium hover:bg-white/10 disabled:opacity-60"
        >
          {loading ? 'Classifying…' : 'Classify'}
        </button>
      </form>

      <div className="mt-3 flex flex-wrap gap-2">
        <span className="text-xs text-[var(--muted)]">Try:</span>
        {EXAMPLE_CLASSIFIER_CHIPS.map((chip) => (
          <button
            key={chip.address}
            type="button"
            onClick={() => pickExample(chip.address)}
            className="rounded-full border border-[var(--border)] px-2.5 py-1 text-xs text-[var(--muted)] hover:bg-white/5 hover:text-white"
          >
            {chip.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mt-4 rounded-md border border-red-900/40 bg-red-900/10 px-3 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      {data && (
        <div className="mt-5 space-y-4">
          <div>
            <div className="text-xs uppercase tracking-wider text-[var(--muted)]">Address</div>
            <div className="mt-1 mono break-all text-sm">
              <AddressLabel address={toChecksumLikeAddress(data.address)} truncate={false} />
            </div>
          </div>

          <div>
            <div className="text-xs uppercase tracking-wider text-[var(--muted)]">Classification</div>
            <div className={`mt-1 text-base font-medium ${classificationLabel(data.classification).tone}`}>
              {classificationLabel(data.classification).tag}
            </div>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {data.classification.type === 'known'
                ? data.classification.reasoning
                : `Reasoning: ${data.classification.reasoning}`}
            </p>
          </div>

          <div>
            <div className="text-xs uppercase tracking-wider text-[var(--muted)]">24h stats (whale-only)</div>
            {noActivity ? (
              <p className="mt-1 text-sm text-[var(--muted)]">
                No whale activity in our 48h window. This address may still be active for
                sub-$100k transfers, which we don&apos;t track.
              </p>
            ) : (
              <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-3">
                <div>
                  <div className="text-xs text-[var(--muted)]">Sent</div>
                  <div className="mono">{formatUsd(data.stats24h.sentVolume)}</div>
                </div>
                <div>
                  <div className="text-xs text-[var(--muted)]">Received</div>
                  <div className="mono">{formatUsd(data.stats24h.receivedVolume)}</div>
                </div>
                <div>
                  <div className="text-xs text-[var(--muted)]">Transfers</div>
                  <div className="mono">{formatNumber(data.stats24h.transferCount)}</div>
                </div>
                <div>
                  <div className="text-xs text-[var(--muted)]">Counterparties</div>
                  <div className="mono">{formatNumber(data.stats24h.distinctCounterparties)}</div>
                </div>
                <div>
                  <div className="text-xs text-[var(--muted)]">Avg. transfer</div>
                  <div className="mono">{formatUsd(data.stats24h.avgTransferSize)}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </ExplainerCard>
  );
}
