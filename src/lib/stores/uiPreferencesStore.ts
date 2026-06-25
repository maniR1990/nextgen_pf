import { createPersistedStore } from './createStore';

export type UiTheme = 'light' | 'dark' | 'system';
export type UiDensity = 'comfortable' | 'standard' | 'compact';

interface UiPreferencesState {
  theme: UiTheme;
  density: UiDensity;
  setTheme: (theme: UiTheme) => void;
  setDensity: (density: UiDensity) => void;
}

export const useUiPreferencesStore = createPersistedStore<UiPreferencesState>(
  'ui-preferences',
  (set) => ({
    theme: 'system',
    density: 'standard',
    setTheme: (theme) => set({ theme }),
    setDensity: (density) => set({ density }),
  }),
  {
    partialize: (state) => ({ theme: state.theme, density: state.density }) as UiPreferencesState,
  },
);
