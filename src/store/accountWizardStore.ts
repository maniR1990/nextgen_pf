'use client';

import { createAppStore } from '@/lib/stores/createStore';

export interface AccountWizardState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

// Global trigger so the "Add an account" nudge inside CommonFormFields (used by every
// transaction type form) can open the wizard without threading a callback prop through
// every form component — same reasoning as ExpenseForm reading transactionFormStore
// directly instead of prop-drilling isMultiItem.
export const useAccountWizardStore = createAppStore<AccountWizardState>('accountWizard', (set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));
