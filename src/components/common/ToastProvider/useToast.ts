import type { ToastVariant } from '@/components/ui/Toast';
import { useCallback, useContext, useMemo } from 'react';
import { ToastContext } from './ToastProvider';
import { DEFAULT_TOAST_DURATION, type ToastApi, type ToastOptions } from './toast.types';

function useToastMethod(variant: ToastVariant) {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');

  return useCallback(
    (title: string, options?: ToastOptions): string =>
      ctx.enqueue({
        variant,
        title,
        description: options?.description,
        duration: options?.duration ?? DEFAULT_TOAST_DURATION,
      }),
    [ctx.enqueue, variant],
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');

  const success = useToastMethod('success');
  const error = useToastMethod('error');
  const warning = useToastMethod('warning');
  const info = useToastMethod('info');

  return useMemo(
    () => ({
      success,
      error,
      warning,
      info,
      dismiss: ctx.dismiss,
    }),
    [success, error, warning, info, ctx.dismiss],
  );
}
