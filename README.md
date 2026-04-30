# Stablecoin Flow Tracker

An educational analytics dashboard for USDC and USDT whale flow on Ethereum mainnet. The thesis: stablecoin on-chain data demands a different analytical frame from speculative crypto — flow, concentration, and settlement patterns instead of price and HODL behavior. The centerpiece view shows that over a rolling week a small number of addresses often account for much of whale volume.

This is **not** a trading dashboard and **not** a Whale Alert clone. No push alerts, no live ticker, no other assets.

---

## Setup

```bash
git clone <repo>
cd stablecoin-flow-tracker
npm install                      # or pnpm install
cp .env.local.example .env.local
```

Fill in `.env.local`:

1. **`ETHERSCAN_API_KEY`** — free key at https://etherscan.io/apis.
2. **Supabase** — create a free project at https://supabase.com, copy the URL and `service_role` key into `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
3. **Schema** — open the Supabase SQL editor and run `supabase/schema.sql` once.
4. **`CRON_SECRET`** — any random string. Used to gate `/api/cron/ingest`.

Then backfill the last ~48h of whale transfers and start the dev server:

```bash
npm run backfill
npm run dev
```

Open http://localhost:3000.

## Deploy

1. Push to GitHub.
2. Import the repo into Vercel.
3. Paste the same env vars into the Vercel project.
4. `vercel.json` configures the ingest cron schedule (often daily on Hobby tier; change the expression when upgrading plans).
5. After the first deploy, run `npm run backfill` locally (it writes straight to your hosted Supabase) so the dashboard isn't empty on day one.

## Limitations

- Doesn't track transfers under $100,000 (the whale threshold).
- Ethereum mainnet only. No L2s, no other chains.
- Heuristic classifier is approximate, never authoritative.
- Address labels are manually curated and incomplete; see `NOTES.md` for the verification checklist.
- Treats USDC and USDT as exactly $1. Peg deviations are tiny relative to a $100k threshold but real.

## Credits

- Transfer data: [Etherscan API v2](https://etherscan.io/apis).
- Stablecoin macro supply: [DefiLlama Stablecoins](https://stablecoins.llama.fi).
- Address labels: Etherscan public address labels.
