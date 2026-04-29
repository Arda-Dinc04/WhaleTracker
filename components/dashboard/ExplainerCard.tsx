import type { ReactNode } from 'react';
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/Card';
import { InfoTooltip } from '@/components/ui/Tooltip';

export function ExplainerCard({
  title,
  explainer,
  right,
  children,
  footer,
}: {
  title: string;
  explainer: ReactNode;
  right?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle>{title}</CardTitle>
          <InfoTooltip content={explainer} />
        </div>
        {right && <div className="flex items-center">{right}</div>}
      </CardHeader>
      <CardBody>{children}</CardBody>
      {footer && (
        <div className="border-t border-[var(--border)] px-5 py-3 text-xs text-[var(--muted)]">
          {footer}
        </div>
      )}
    </Card>
  );
}
