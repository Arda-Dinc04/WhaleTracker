import type { ReactNode } from 'react';
import { Card } from './Card';
import { InfoTooltip } from './Tooltip';

export function Stat({
  label,
  value,
  hint,
  explainer,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  explainer?: ReactNode;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-1 text-xs uppercase tracking-wider text-[var(--muted)]">
        <span>{label}</span>
        {explainer && <InfoTooltip content={explainer} />}
      </div>
      <div className="mt-2 font-mono text-3xl font-semibold leading-none">{value}</div>
      {hint && <div className="mt-2 text-xs text-[var(--muted)]">{hint}</div>}
    </Card>
  );
}
