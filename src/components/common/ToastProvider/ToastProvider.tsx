'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { Toast } from '@/components/ui/Toast';
import { DEFAULT_TOAST_DURATION, MAX_TOASTS, type ToastItem } from './toast.types';

// --- Internal context ---

interface ToastContextValue {
  enqueue: (item: Omit<ToastItem, 'id'>) => string;
  dismiss: (id: string) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

// --- Per-toast entry: owns its own auto-dismiss timer ---

function ToastEntry({ item, onDismiss }: { item: ToastItem; onDismiss: (id: string) => void }) {
  const handleDismiss = useCallback(() => onDismiss(item.id), [item.id, onDismiss]);

  useEffect(() => {
    if (item.duration <= 0) return;
    const timer = setTimeout(handleDismiss, item.duration);
    return () => clearTimeout(timer);
  }, [item.id, item.duration, handleDismiss]);

  return (
    <Toast
      variant={item.variant}
      title={item.title}
      description={item.description}
      onDismiss={handleDismiss}
    />
  );
}

// --- Provider ---

interface ToastProviderProps {
  children: ReactNode;
  maxToasts?: number;
}

export function ToastProvider({ children, maxToasts = MAX_TOASTS }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const enqueue = useCallback(
    (item: Omit<ToastItem, 'id'>): string => {
      const id = crypto.randomUUID();
      setToasts((prev) => {
        const next = [...prev, { ...item, id }];
        return next.length > maxToasts ? next.slice(next.length - maxToasts) : next;
      });
      return id;
    },
    [maxToasts],
  );

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ enqueue, dismiss }}>
      {children}
      <section className="toast-region" aria-label="Notifications">
        <div className="toast-stack">
          {toasts.map((item) => (
            <ToastEntry key={item.id} item={item} onDismiss={dismiss} />
          ))}
        </div>
      </section>
    </ToastContext.Provider>
  );
}

export function useToastContext() {
  return useContext(ToastContext);
}
