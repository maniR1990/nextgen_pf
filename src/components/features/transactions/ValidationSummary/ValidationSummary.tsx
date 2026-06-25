'use client';

import { AlertCircle } from 'lucide-react';
import type { FormErrors } from '@/store/transactionFormStore';

interface ValidationSummaryProps {
  errors: FormErrors;
}

export function ValidationSummary({ errors }: ValidationSummaryProps) {
  const entries = Object.entries(errors).filter(([, v]) => Boolean(v));
  if (entries.length === 0) return null;

  const formError = errors._form;

  return (
    <div className="validation-summary" role="alert" aria-live="assertive">
      <AlertCircle size={14} className="validation-summary__icon" />
      {formError ? (
        <span className="validation-summary__message">{formError}</span>
      ) : (
        <span className="validation-summary__message">
          {entries.length} field{entries.length > 1 ? 's' : ''} need
          {entries.length === 1 ? 's' : ''} attention
        </span>
      )}
    </div>
  );
}
