/** Rolling window for dashboard aggregates & classification stats. */
export const WHALE_STATS_LOOKBACK_DAYS = 7;

export function whaleStatsSinceIso(now = Date.now()): string {
  const ms = WHALE_STATS_LOOKBACK_DAYS * 24 * 60 * 60 * 1000;
  return new Date(now - ms).toISOString();
}
