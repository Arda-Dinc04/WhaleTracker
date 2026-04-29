export type FlowType = 'issuer' | 'exchange' | 'bridge' | 'defi' | 'unknown';

const PRIORITY: Record<string, number> = {
  issuer: 4,
  bridge: 3,
  exchange: 2,
  defi: 1,
};

export function flowTypeFromCategories(
  fromCategory: string | null,
  toCategory: string | null,
): FlowType {
  const f = fromCategory && PRIORITY[fromCategory] ? fromCategory : null;
  const t = toCategory && PRIORITY[toCategory] ? toCategory : null;
  if (!f && !t) return 'unknown';
  if (f && t) return (PRIORITY[f] >= PRIORITY[t] ? f : t) as FlowType;
  return (f ?? t) as FlowType;
}

export const FLOW_TYPE_LABEL: Record<FlowType, string> = {
  issuer: 'Issuer flow',
  exchange: 'Exchange flow',
  bridge: 'Bridge flow',
  defi: 'DeFi flow',
  unknown: 'Unknown whale flow',
};

export const FLOW_TYPE_COLOR: Record<FlowType, string> = {
  issuer: '#a855f7',
  exchange: '#3b82f6',
  bridge: '#f59e0b',
  defi: '#22c55e',
  unknown: '#6b7280',
};

export const FLOW_TYPE_ORDER: FlowType[] = ['issuer', 'exchange', 'bridge', 'defi', 'unknown'];
