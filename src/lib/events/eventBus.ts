import { EventEmitter } from 'node:events';
import type { AppEvents } from './events.types';

declare global {
  // eslint-disable-next-line no-var
  var __eventBus: TypedEventBus | undefined;
}

class TypedEventBus extends EventEmitter {
  emit<K extends keyof AppEvents>(event: K, payload: AppEvents[K]) {
    return super.emit(event, payload);
  }

  on<K extends keyof AppEvents>(event: K, listener: (payload: AppEvents[K]) => void) {
    return super.on(event, listener);
  }
}

if (!global.__eventBus) {
  global.__eventBus = new TypedEventBus();
}
export const eventBus = global.__eventBus;
