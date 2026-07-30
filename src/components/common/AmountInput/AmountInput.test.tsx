import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AmountInput } from './AmountInput';

afterEach(() => cleanup());

describe('AmountInput', () => {
  describe('quick amount chips', () => {
    it('adds the chip value to whatever is already entered', () => {
      const onChange = vi.fn();
      render(<AmountInput value="500" onChange={onChange} />);
      fireEvent.click(screen.getByRole('button', { name: /add ₹1k/i }));
      expect(onChange).toHaveBeenCalledWith('1500');
    });
  });

  describe('clear button', () => {
    it('is not rendered when the field is empty', () => {
      render(<AmountInput value="" onChange={vi.fn()} />);
      expect(screen.queryByRole('button', { name: /clear amount/i })).not.toBeInTheDocument();
    });

    it('appears once an amount is entered', () => {
      render(<AmountInput value="92" onChange={vi.fn()} />);
      expect(screen.getByRole('button', { name: /clear amount/i })).toBeInTheDocument();
    });

    it('resets the value to empty in one click, instead of backspacing digit by digit', () => {
      const onChange = vi.fn();
      render(<AmountInput value="8072" onChange={onChange} />);
      fireEvent.click(screen.getByRole('button', { name: /clear amount/i }));
      expect(onChange).toHaveBeenCalledWith('');
    });

    it('is hidden while the field is disabled', () => {
      render(<AmountInput value="92" onChange={vi.fn()} disabled />);
      expect(screen.queryByRole('button', { name: /clear amount/i })).not.toBeInTheDocument();
    });
  });
});
