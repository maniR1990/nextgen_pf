'use client';

import { Children, cloneElement, isValidElement } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';

export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode;
  description?: string;
}

export function Radio({ label, description, className = '', id, ...props }: RadioProps) {
  const radioId = id ?? `radio-${String(label).toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <label
      htmlFor={radioId}
      className={['radio', props.disabled && 'radio--disabled', className]
        .filter(Boolean)
        .join(' ')}
    >
      <input id={radioId} type="radio" className="radio__input" {...props} />
      <span className="radio__dot" aria-hidden />
      <span className="radio__content">
        <span className="radio__label">{label}</span>
        {description && <span className="radio__description">{description}</span>}
      </span>
    </label>
  );
}

export interface RadioGroupProps {
  name: string;
  legend: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  className?: string;
}

export function RadioGroup({
  name,
  legend,
  value,
  onChange,
  children,
  className = '',
}: RadioGroupProps) {
  return (
    <fieldset className={['radio-group', className].filter(Boolean).join(' ')}>
      <legend className="radio-group__legend">{legend}</legend>
      <div className="radio-group__options">
        {Children.map(children, (child) => {
          if (!isValidElement<RadioProps>(child)) return child;
          return cloneElement(child, {
            name,
            checked: child.props.value === value,
            onChange: () => onChange(String(child.props.value)),
          });
        })}
      </div>
    </fieldset>
  );
}
