'use client';

import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Clock, LogIn } from 'lucide-react';
import { useEffect, useState } from 'react';

const TITLE_ID = 'session-expired-title';

export function SessionExpiredModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener('auth:session-expired', handler);
    return () => window.removeEventListener('auth:session-expired', handler);
  }, []);

  function handleSignIn() {
    window.location.href = '/login';
  }

  return (
    <Modal
      open={open}
      onClose={() => {}}
      titleId={TITLE_ID}
      closeOnBackdropClick={false}
      closeOnEscape={false}
    >
      <Modal.Header>
        <div className="session-expired-modal__header">
          <div className="session-expired-modal__icon" aria-hidden>
            <Clock size={28} />
          </div>
          <div>
            <h2 className="modal__title" id={TITLE_ID}>
              Session Expired
            </h2>
            <p className="modal__subtitle">You have been signed out</p>
          </div>
        </div>
      </Modal.Header>
      <Modal.Body>
        <p className="session-expired-modal__message">
          Your session has expired due to inactivity. Sign in again to continue where you left off.
        </p>
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={handleSignIn}>
          <LogIn size={15} aria-hidden /> Sign In to Continue
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
