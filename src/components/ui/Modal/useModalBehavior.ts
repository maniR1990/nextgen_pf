'use client';

import { MODAL_ANIMATION_MS, MODAL_FOCUSABLE_SELECTOR } from '@/constants/modal';
import { useCallback, useEffect, useRef } from 'react';

interface UseModalBehaviorOptions {
  /** Locks body scroll while the portal is mounted (includes exit animation) */
  scrollLocked: boolean;
  /** Enables focus trap, initial focus, and Escape handling */
  interactive: boolean;
  onClose: () => void;
  closeOnEscape?: boolean;
  triggerRef?: React.RefObject<HTMLElement | null>;
  dialogRef: React.RefObject<HTMLDivElement | null>;
}

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(MODAL_FOCUSABLE_SELECTOR)).filter(
    (el) => !el.hasAttribute('disabled') && el.offsetParent !== null,
  );
}

function useBodyScrollLock(locked: boolean) {
  const scrollYRef = useRef(0);

  useEffect(() => {
    if (!locked || typeof document === 'undefined') return;

    const { body, documentElement } = document;
    scrollYRef.current = window.scrollY;

    const previousBodyOverflow = body.style.overflow;
    const previousBodyPosition = body.style.position;
    const previousBodyTop = body.style.top;
    const previousBodyWidth = body.style.width;
    const previousHtmlOverflow = documentElement.style.overflow;

    body.style.overflow = 'hidden';
    documentElement.style.overflow = 'hidden';
    body.style.position = 'fixed';
    body.style.top = `-${scrollYRef.current}px`;
    body.style.width = '100%';

    return () => {
      body.style.overflow = previousBodyOverflow;
      body.style.position = previousBodyPosition;
      body.style.top = previousBodyTop;
      body.style.width = previousBodyWidth;
      documentElement.style.overflow = previousHtmlOverflow;
      try {
        window.scrollTo(0, scrollYRef.current);
      } catch {
        // jsdom does not implement scrollTo
      }
    };
  }, [locked]);
}

export function useModalBehavior({
  scrollLocked,
  interactive,
  onClose,
  closeOnEscape = true,
  triggerRef,
  dialogRef,
}: UseModalBehaviorOptions) {
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useBodyScrollLock(scrollLocked);

  useEffect(() => {
    if (!interactive) return;

    previousFocusRef.current =
      (triggerRef?.current as HTMLElement | null) ?? (document.activeElement as HTMLElement | null);

    const dialog = dialogRef.current;
    if (!dialog) return;

    const focusTarget = getFocusableElements(dialog)[0];
    if (focusTarget) {
      focusTarget.focus();
    } else {
      dialog.setAttribute('tabindex', '-1');
      dialog.focus();
    }

    return () => {
      const returnTarget = triggerRef?.current ?? previousFocusRef.current;
      requestAnimationFrame(() => {
        returnTarget?.focus?.();
      });
    };
  }, [interactive, triggerRef, dialogRef]);

  useEffect(() => {
    if (!interactive || !closeOnEscape) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [interactive, closeOnEscape, onClose]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key !== 'Tab' || !dialogRef.current) return;

      const focusable = getFocusableElements(dialogRef.current);
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [dialogRef],
  );

  return { handleKeyDown, animationMs: MODAL_ANIMATION_MS };
}
