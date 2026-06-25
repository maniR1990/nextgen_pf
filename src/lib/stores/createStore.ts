import { type StateCreator, create } from 'zustand';
import { type PersistOptions, devtools, persist } from 'zustand/middleware';

type StoreMiddleware = [['zustand/devtools', never]];

export function createAppStore<T extends object>(
  name: string,
  initializer: StateCreator<T, [], StoreMiddleware>,
) {
  return create<T>()(devtools(initializer, { name }));
}

export function createPersistedStore<T extends object>(
  name: string,
  initializer: StateCreator<T, [['zustand/persist', unknown]], StoreMiddleware>,
  persistOptions: Omit<PersistOptions<T>, 'name'>,
) {
  return create<T>()(devtools(persist(initializer, { name, ...persistOptions }), { name }));
}
