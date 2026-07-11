import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DateInput } from './DateInput';

afterEach(() => cleanup());

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 6, 15)); // Wed 15 Jul 2026, local time
  // jsdom doesn't implement showPicker — stub it so the picker-trigger test can spy on it.
  if (!('showPicker' in HTMLInputElement.prototype)) {
    // @ts-expect-error — test-only polyfill
    HTMLInputElement.prototype.showPicker = () => {};
  }
});

describe('DateInput', () => {
  it('renders Today, Yesterday, 2 days ago, and a picker trigger — one row, no separate input box', () => {
    render(<DateInput value="2026-07-15" onChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Today' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Yesterday' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '2 days ago' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /pick a date/i })).toBeInTheDocument();
  });

  it('marks the chip matching the current value as active', () => {
    render(<DateInput value="2026-07-15" onChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Today' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Yesterday' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('sets onChange to today/yesterday\'s ISO date when those chips are clicked', () => {
    const onChange = vi.fn();
    render(<DateInput value="2026-07-01" onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: 'Today' }));
    expect(onChange).toHaveBeenCalledWith('2026-07-15');
    fireEvent.click(screen.getByRole('button', { name: 'Yesterday' }));
    expect(onChange).toHaveBeenCalledWith('2026-07-14');
  });

  it('shows the formatted custom date on the picker trigger when the value is not a quick date', () => {
    render(<DateInput value="2026-06-20" onChange={vi.fn()} />);
    // en-IN locale formats as "20 Jun" (day before month) — matches every other
    // date/currency format already used across this app.
    expect(screen.getByRole('button', { name: /pick a date/i })).toHaveTextContent('20 Jun');
  });

  it('does not show a date label on the picker trigger when the value matches a quick chip', () => {
    render(<DateInput value="2026-07-15" onChange={vi.fn()} />);
    const trigger = screen.getByRole('button', { name: /pick a date/i });
    expect(trigger).not.toHaveTextContent('15 Jul');
  });

  it('launches the native date picker when the picker trigger is clicked', () => {
    const showPickerSpy = vi.spyOn(HTMLInputElement.prototype, 'showPicker');
    render(<DateInput value="2026-07-01" onChange={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /pick a date/i }));
    expect(showPickerSpy).toHaveBeenCalled();
  });

  it('still calls onChange when the hidden native input value changes', () => {
    const onChange = vi.fn();
    render(<DateInput value="2026-07-01" onChange={onChange} />);
    const nativeInput = document.querySelector('.date-input__native') as HTMLInputElement;
    fireEvent.change(nativeInput, { target: { value: '2026-05-05' } });
    expect(onChange).toHaveBeenCalledWith('2026-05-05');
  });

  it('passes through error and required to the underlying FormField', () => {
    render(<DateInput value="2026-07-15" onChange={vi.fn()} error="Required" required />);
    expect(screen.getByRole('alert')).toHaveTextContent('Required');
  });
});
