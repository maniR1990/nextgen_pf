'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { FormField } from '@/components/common/FormField';

const COMMON_INSTITUTIONS = [
  'HDFC Bank',
  'ICICI Bank',
  'SBI',
  'Axis Bank',
  'Kotak Mahindra Bank',
  'Yes Bank',
  'Punjab National Bank',
  'Bank of Baroda',
  'Canara Bank',
  'IndusInd Bank',
  'IDFC First Bank',
  'Federal Bank',
  'PayTM Payments Bank',
  'Airtel Payments Bank',
  'Zerodha',
  'Groww',
  'Upstox',
  'LIC',
  'HDFC Life',
  'SBI Life',
];

export interface InstitutionSelectorProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function InstitutionSelector({ value, onChange, error }: InstitutionSelectorProps) {
  const [search, setSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filtered = COMMON_INSTITUTIONS.filter((i) =>
    i.toLowerCase().includes(search.toLowerCase()),
  );

  function pick(name: string) {
    onChange(name);
    setSearch('');
    setShowSuggestions(false);
  }

  return (
    <div className="institution-selector">
      <FormField label="Institution (optional)" htmlFor="institution-search" error={error}>
        <div className="institution-selector__wrap">
          <Search size={14} className="institution-selector__icon" aria-hidden />
          <input
            id="institution-search"
            type="text"
            className="institution-selector__input"
            placeholder="Search banks, brokers…"
            value={value || search}
            onChange={(e) => {
              setSearch(e.target.value);
              onChange(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            autoComplete="off"
          />
        </div>
        {showSuggestions && filtered.length > 0 && (
          <ul className="institution-selector__suggestions" role="listbox" aria-label="Institution suggestions">
            {filtered.slice(0, 8).map((name) => (
              <li
                key={name}
                role="option"
                aria-selected={value === name}
                className="institution-selector__suggestion"
                onMouseDown={() => pick(name)}
              >
                {name}
              </li>
            ))}
            <li
              role="option"
              aria-selected={false}
              className="institution-selector__suggestion institution-selector__suggestion--custom"
              onMouseDown={() => {
                onChange(search);
                setShowSuggestions(false);
              }}
            >
              Use "{search || value}" as custom
            </li>
          </ul>
        )}
      </FormField>
    </div>
  );
}
