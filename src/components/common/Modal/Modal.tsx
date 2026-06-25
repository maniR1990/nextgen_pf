'use client';

import { X } from 'lucide-react';
import { type ReactNode, createContext, useContext, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface ModalContextValue {
  onClose: () => void;
}

const ModalCtx = createContext<ModalContextValue | null>(null);

function useModalCtx() {
  const ctx = useContext(ModalCtx);
  if (!ctx) throw new Error('Modal compound components must be used inside <Modal>');
  return ctx;
}

// Root

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  'aria-label'?: string;
}

function ModalRoot({ open, onClose, children, size = 'md', 'aria-label': ariaLabel }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  // Keep a stable ref so the effect doesn't re-run (and steal focus) when the
  // parent re-renders and passes a new inline onClose function.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;

    const prev = document.activeElement as HTMLElement | null;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseRef.current();
    };

    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
      prev?.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  return createPortal(
    <ModalCtx.Provider value={{ onClose }}>
      <div
        className="modal-overlay modal-overlay--visible"
        role="presentation"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div
          ref={panelRef}
          className={['modal', 'modal--visible', `modal--${size}`].join(' ')}
          role="dialog"
          aria-modal="true"
          aria-label={ariaLabel}
          tabIndex={-1}
        >
          {children}
        </div>
      </div>
    </ModalCtx.Provider>,
    document.body,
  );
}

// Header

interface ModalHeaderProps {
  title: string;
  subtitle?: string;
  children?: ReactNode;
}

function ModalHeader({ title, subtitle, children }: ModalHeaderProps) {
  const { onClose } = useModalCtx();
  return (
    <div className="modal__header">
      <div className="modal__header-text">
        <h2 className="modal__title">{title}</h2>
        {subtitle && <p className="modal__subtitle">{subtitle}</p>}
      </div>
      {children}
      <button type="button" className="modal__close" onClick={onClose} aria-label="Close modal">
        <X size={20} aria-hidden />
      </button>
    </div>
  );
}

// Body

interface ModalBodyProps {
  children: ReactNode;
  className?: string;
}

function ModalBody({ children, className = '' }: ModalBodyProps) {
  return <div className={['modal__body', className].filter(Boolean).join(' ')}>{children}</div>;
}

// Footer

interface ModalFooterProps {
  children: ReactNode;
}

function ModalFooter({ children }: ModalFooterProps) {
  return <div className="modal__footer">{children}</div>;
}

// Compound export

export const Modal = Object.assign(ModalRoot, {
  Header: ModalHeader,
  Body: ModalBody,
  Footer: ModalFooter,
});
