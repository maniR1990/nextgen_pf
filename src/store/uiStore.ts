import { createAppStore } from '@/lib/stores/createStore';

interface UIState {
  // Add transaction modal
  isAddModalOpen: boolean;
  openAddModal: () => void;
  closeAddModal: () => void;

  // Edit transaction modal — null = closed
  editingTxId: string | null;
  openEditModal: (id: string) => void;
  closeEditModal: () => void;

  // Void confirmation modal — null = closed
  voidingTxId: string | null;
  openVoidModal: (id: string) => void;
  closeVoidModal: () => void;

  // Budget period (YNAB-style: independent of transaction date)
  currentMonth: { year: number; month: number };
  setCurrentMonth: (year: number, month: number) => void;

  // Layout
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;

  // Transaction list search
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export const useUIStore = createAppStore<UIState>('ui', (set) => {
  const now = new Date();

  return {
    isAddModalOpen: false,
    openAddModal: () => set({ isAddModalOpen: true }),
    closeAddModal: () => set({ isAddModalOpen: false }),

    editingTxId: null,
    openEditModal: (id) => set({ editingTxId: id }),
    closeEditModal: () => set({ editingTxId: null }),

    voidingTxId: null,
    openVoidModal: (id) => set({ voidingTxId: id }),
    closeVoidModal: () => set({ voidingTxId: null }),

    currentMonth: { year: now.getFullYear(), month: now.getMonth() + 1 },
    setCurrentMonth: (year, month) => set({ currentMonth: { year, month } }),

    sidebarCollapsed: false,
    toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

    searchQuery: '',
    setSearchQuery: (q) => set({ searchQuery: q }),
  };
});
