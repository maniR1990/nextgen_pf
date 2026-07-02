'use client';

import { MODAL_ANIMATION_MS, MODAL_CLOSE_LABEL } from '@/constants/modal';
import { X } from 'lucide-react';
import {
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
  type RefObject,
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { ModalPortal } from './ModalPortal';
import { useModalBehavior } from './useModalBehavior';

interface ModalContextValue {
  onClose: () => void;
}

const ModalContext = createContext<ModalContextValue | null>(null);

function useModalContext() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('Modal compound components must be used within <Modal>');
  }
  return context;
}

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** ID of the visible title element for `aria-labelledby` */
  titleId?: string;
  /** When true, modal fills the viewport (100vw × 100vh) */
  isFullScreen?: boolean;
  /** Controls modal width — 'lg' uses a wider max-width */
  size?: 'sm' | 'md' | 'lg';
  /** Element to restore focus to on close; defaults to previously focused element */
  triggerRef?: RefObject<HTMLElement | null>;
  closeOnBackdropClick?: boolean;
  closeOnEscape?: boolean;
  className?: string;
}

export function modalClassName({
  isFullScreen = false,
  size,
  isVisible = false,
  className = '',
}: {
  isFullScreen?: boolean;
  size?: 'sm' | 'md' | 'lg';
  isVisible?: boolean;
  className?: string;
}) {
  return [
    'modal',
    isFullScreen && 'modal--fullscreen',
    size === 'lg' && 'modal--lg',
    isVisible && 'modal--visible',
    className,
  ]
    .filter(Boolean)
    .join(' ');
}

export function modalOverlayClassName({
  isVisible = false,
  className = '',
}: {
  isVisible?: boolean;
  className?: string;
}) {
  return ['modal-overlay', isVisible && 'modal-overlay--visible', className]
    .filter(Boolean)
    .join(' ');
}

function ModalRoot({
  open,
  onClose,
  children,
  titleId,
  isFullScreen = false,
  size,
  triggerRef,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  className = '',
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);

  const { handleKeyDown } = useModalBehavior({
    scrollLocked: mounted,
    interactive: open && mounted,
    onClose,
    closeOnEscape,
    triggerRef,
    dialogRef,
  });

  useEffect(() => {
    if (open) {
      setMounted(true);
      const frame = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(frame);
    }

    setVisible(false);
    const timer = window.setTimeout(() => setMounted(false), MODAL_ANIMATION_MS);
    return () => window.clearTimeout(timer);
  }, [open]);

  if (!mounted) return null;

  const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!closeOnBackdropClick) return;
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return (
    <ModalPortal>
      <ModalContext.Provider value={{ onClose }}>
        <div
          className={modalOverlayClassName({ isVisible: visible })}
          onClick={handleBackdropClick}
          data-testid="modal-overlay"
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className={modalClassName({ isFullScreen, size, isVisible: visible, className })}
            onKeyDown={handleKeyDown}
          >
            {children}
          </div>
        </div>
      </ModalContext.Provider>
    </ModalPortal>
  );
}

export interface ModalHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
}

function ModalHeader({ className = '', title, subtitle, children, ...props }: ModalHeaderProps) {
  return (
    <div className={['modal__header', className].filter(Boolean).join(' ')} {...props}>
      {title ? (
        <div className="modal__title-group">
          <h2 className="modal__title">{title}</h2>
          {subtitle && <p className="modal__subtitle">{subtitle}</p>}
        </div>
      ) : (
        children
      )}
    </div>
  );
}

export type ModalBodyProps = HTMLAttributes<HTMLDivElement>;

function ModalBody({ className = '', ...props }: ModalBodyProps) {
  return <div className={['modal__body', className].filter(Boolean).join(' ')} {...props} />;
}

export type ModalFooterProps = HTMLAttributes<HTMLDivElement>;

function ModalFooter({ className = '', ...props }: ModalFooterProps) {
  return <div className={['modal__footer', className].filter(Boolean).join(' ')} {...props} />;
}

export type ModalCloseButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

function ModalCloseButton({ className = '', onClick, ...props }: ModalCloseButtonProps) {
  const { onClose } = useModalContext();

  return (
    <button
      type="button"
      className={['modal__close', className].filter(Boolean).join(' ')}
      aria-label={MODAL_CLOSE_LABEL}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) {
          onClose();
        }
      }}
      {...props}
    >
      <X aria-hidden size={18} />
    </button>
  );
}

export const Modal = Object.assign(ModalRoot, {
  Header: ModalHeader,
  Body: ModalBody,
  Footer: ModalFooter,
  CloseButton: ModalCloseButton,
});
