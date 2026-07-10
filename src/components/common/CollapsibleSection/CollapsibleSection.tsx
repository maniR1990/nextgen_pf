'use client';

import { ChevronDown } from 'lucide-react';
import { useId, useState } from 'react';
import type { ReactNode } from 'react';

interface CollapsibleSectionProps {
  label: string;
  defaultOpen?: boolean;
  children: ReactNode;
}

export function CollapsibleSection({
  label,
  defaultOpen = false,
  children,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentId = useId();

  return (
    <div className="collapsible-section">
      <button
        type="button"
        className="collapsible-section__toggle"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        aria-controls={contentId}
      >
        <span>{label}</span>
        <ChevronDown
          size={14}
          className={
            isOpen
              ? 'collapsible-section__icon collapsible-section__icon--open'
              : 'collapsible-section__icon'
          }
          aria-hidden
        />
      </button>
      {isOpen && (
        <div id={contentId} className="collapsible-section__content">
          {children}
        </div>
      )}
    </div>
  );
}
