'use client';

import { Info } from 'lucide-react';
import { useState, type ReactNode } from 'react';

export function InfoTooltip({
  content,
  className = '',
}: {
  content: ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <span className={`relative inline-flex ${className}`}>
      <button
        type="button"
        aria-label="Explain"
        className="text-[var(--muted)] hover:text-white transition-colors"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((v) => !v)}
      >
        <Info size={14} />
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute left-1/2 top-full z-30 mt-2 w-64 -translate-x-1/2 rounded-md border border-[var(--border)] bg-[#0f0f0f] p-3 text-xs leading-relaxed text-[var(--foreground)] shadow-lg"
        >
          {content}
        </span>
      )}
    </span>
  );
}
