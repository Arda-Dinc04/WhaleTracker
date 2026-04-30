import Link from 'next/link';
import { Header } from '@/components/Header';

export const metadata = {
  title: 'About · Stablecoin Flow Tracker',
};

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6">
        <article className="prose prose-invert prose-sm max-w-none">
          <h1 className="text-2xl font-semibold tracking-tight">What this is</h1>
          <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
            <span className="text-white">Thesis:</span> This project studies whether
            stablecoin whale volume reflects broad payment usage or concentrated flows
            through exchanges, issuers, bridges, and DeFi contracts.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">
            Stablecoin Flow Tracker is an <span className="text-white">educational</span>{' '}
            analytics dashboard for USDC and USDT on Ethereum mainnet. It is not a trading
            tool, and it is not designed to push real-time alerts. Its purpose is to make
            one structural argument visible: whale-scale stablecoin flow concentrates in
            very few addresses on most days, and the right way to look at stablecoin data
            is structurally, not speculatively.
          </p>

          <h2 className="mt-8 text-lg font-semibold">Why stablecoins are different</h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
            Speculative crypto analysis is built around price, profit, and holding
            behavior. Tools like Whale Alert surface large transfers across ~100 assets so
            traders can react. Stablecoins do not behave like that asset class. A
            stablecoin transfer is a settlement, not a bet. The relevant questions are
            about flow direction, address concentration, time-of-day patterns, and which
            counterparties dominate — not who is sitting on unrealized profits or holding
            for how many days. Metrics like HODL days and profit ratios simply do not
            apply.
          </p>

          <h2 className="mt-8 text-lg font-semibold">What you&apos;re looking at</h2>
          <ul className="mt-2 list-disc space-y-1 pl-6 text-sm leading-relaxed text-[var(--muted)]">
            <li>
              <span className="text-white">Macro strip</span>: Ethereum-side circulating
              supply for USDC and USDT (DefiLlama), plus 7-day whale volume and count.
            </li>
            <li>
              <span className="text-white">Concentration chart</span> (centerpiece): the
              top 20 addresses by total whale volume in the last 7 days, alongside the
              share of all whale volume those 20 addresses account for.
            </li>
            <li>
              <span className="text-white">Hourly flow</span>: a 7-day bar chart showing
              whale volume per hour, split by token.
            </li>
            <li>
              <span className="text-white">Recent whale feed</span>: the 50 most recent
              transfers above $100k, with addresses labeled where known.
            </li>
            <li>
              <span className="text-white">Address classifier</span>: paste any address to
              see whether it&apos;s in our curated label list, plus a transparent heuristic
              guess from its 7-day whale activity.
            </li>
          </ul>

          <h2 className="mt-8 text-lg font-semibold">Methodology</h2>
          <ul className="mt-2 list-disc space-y-1 pl-6 text-sm leading-relaxed text-[var(--muted)]">
            <li>Whale threshold: $100,000 per transfer. Smaller transfers are ignored.</li>
            <li>
              Both USDC and USDT are valued at exactly $1. Peg deviations exist but are
              tiny relative to a $100k threshold.
            </li>
            <li>
              Transfer data comes from the Etherscan API v2 ERC-20 transfer endpoint.
              Macro supply comes from DefiLlama.
            </li>
            <li>The cron ingests on the schedule in <code className="mono text-white">vercel.json</code>. Most dashboard views use a rolling 7-day window of on-chain timestamps; the flow chart buckets all of it by hour.</li>
          </ul>

          <h2 className="mt-8 text-lg font-semibold">Limitations</h2>
          <ul className="mt-2 list-disc space-y-1 pl-6 text-sm leading-relaxed text-[var(--muted)]">
            <li>Ethereum only.</li>
            <li>USDC and USDT only.</li>
            <li>Transfers above $100,000 only.</li>
            <li>Address labels are incomplete.</li>
            <li>On-chain transfers do not reveal real-world intent.</li>
            <li>Stablecoins are treated as $1.</li>
          </ul>

          <h2 className="mt-8 text-lg font-semibold">Source code</h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
            Repository on GitHub: <span className="text-white">{'<add link>'}</span>.
          </p>

          <p className="mt-10 text-xs text-[var(--muted)]">
            <Link href="/" className="hover:text-white">
              ← Back to dashboard
            </Link>
          </p>
        </article>
      </main>
    </div>
  );
}
