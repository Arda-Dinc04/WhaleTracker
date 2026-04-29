import { Header } from '@/components/Header';
import { MainFinding } from '@/components/dashboard/MainFinding';
import { MacroStrip } from '@/components/dashboard/MacroStrip';
import { ConcentrationChart } from '@/components/dashboard/ConcentrationChart';
import { ComparisonTable } from '@/components/dashboard/ComparisonTable';
import { RoleBreakdown } from '@/components/dashboard/RoleBreakdown';
import { FlowChart } from '@/components/dashboard/FlowChart';
import { WhaleFeed } from '@/components/dashboard/WhaleFeed';
import { AddressClassifier } from '@/components/dashboard/AddressClassifier';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-10">
        <section className="mb-3">
          <h1 className="text-xl font-semibold tracking-tight">
            USDC &amp; USDT whale flow on Ethereum
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--muted)]">
            Educational analytics for stablecoin transfers above $100,000. Concentration
            first, flow second, feed last. Read the{' '}
            <a href="/about" className="text-white underline-offset-2 hover:underline">
              about page
            </a>{' '}
            for the thesis.
          </p>
        </section>

        <div className="space-y-6">
          <MainFinding />
          <MacroStrip />
          <ConcentrationChart />
          <ComparisonTable />
          <RoleBreakdown />
          <FlowChart />
          <WhaleFeed />
          <AddressClassifier />
        </div>

        <footer className="mt-12 border-t border-[var(--border)] pt-4 text-xs text-[var(--muted)]">
          Data: Etherscan, DefiLlama. Updated every 15 minutes. Whale threshold: $100,000.
          USDC and USDT treated as $1.
        </footer>
      </main>
    </div>
  );
}
