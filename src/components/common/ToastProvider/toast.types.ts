import type { ToastVariant } from '@/components/ui/Toast';
import type { ReactNode } from 'react';

export const DEFAULT_TOAST_DURATION = 5_000;
export const MAX_TOASTS = 5;

export interface ToastItem {
  id: string;
  variant: ToastVariant;
  title: string;
  description?: ReactNode;
  /** ms until auto-dismiss; 0 = persistent */
  duration: number;
}

export interface ToastOptions {
  description?: ReactNode;
  /** ms until auto-dismiss; defaults to DEFAULT_TOAST_DURATION; 0 = persistent */
  duration?: number;
}

export interface ToastApi {
  success: (title: string, options?: ToastOptions) => string;
  error: (title: string, options?: ToastOptions) => string;
  warning: (title: string, options?: ToastOptions) => string;
  info: (title: string, options?: ToastOptions) => string;
  dismiss: (id: string) => void;
}
