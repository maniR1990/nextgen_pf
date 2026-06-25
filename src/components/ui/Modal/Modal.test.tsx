import { Button } from '@/components/ui/Button';
import { MODAL_CLOSE_LABEL, MODAL_DEMO_BODY, MODAL_DEMO_TITLE } from '@/constants/modal';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Modal } from './Modal';

expect.extend(toHaveNoViolations);

function renderOpenModal(
  props: Partial<React.ComponentProps<typeof Modal>> = {},
  content?: React.ReactNode,
) {
  const onClose = vi.fn();
  const result = render(
    <Modal open onClose={onClose} titleId="modal-title" {...props}>
      {content ?? (
        <>
          <Modal.Header>
            <h2 id="modal-title">{MODAL_DEMO_TITLE}</h2>
            <Modal.CloseButton />
          </Modal.Header>
          <Modal.Body>
            <p>{MODAL_DEMO_BODY}</p>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary">Save</Button>
          </Modal.Footer>
        </>
      )}
    </Modal>,
  );
  return { ...result, onClose };
}

describe('Modal', () => {
  afterEach(() => cleanup());

  it('renders nothing when closed', () => {
    const { container } = render(
      <Modal open={false} onClose={vi.fn()}>
        <Modal.Body>Hidden</Modal.Body>
      </Modal>,
    );
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('portals dialog to document.body when open', () => {
    renderOpenModal();
    const dialog = screen.getByRole('dialog');
    expect(dialog.closest('body')).toBe(document.body);
  });

  it('exposes dialog semantics and aria-labelledby', () => {
    renderOpenModal();
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title');
    expect(screen.getByRole('heading', { level: 2, name: MODAL_DEMO_TITLE })).toBeInTheDocument();
  });

  it('calls onClose when Escape is pressed', async () => {
    const user = userEvent.setup();
    const { onClose } = renderOpenModal();
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when backdrop is clicked', async () => {
    const user = userEvent.setup();
    const { onClose } = renderOpenModal();
    const overlay = document.querySelector('.modal-overlay');
    expect(overlay).toBeTruthy();
    await user.click(overlay as Element);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('does not close when dialog content is clicked', async () => {
    const user = userEvent.setup();
    const { onClose } = renderOpenModal();
    await user.click(screen.getByText(MODAL_DEMO_BODY));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('calls onClose when CloseButton is clicked', async () => {
    const user = userEvent.setup();
    const { onClose } = renderOpenModal();
    await user.click(screen.getByRole('button', { name: MODAL_CLOSE_LABEL }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('applies fullscreen modifier class', () => {
    renderOpenModal({ isFullScreen: true });
    expect(document.querySelector('.modal--fullscreen')).toBeInTheDocument();
  });

  it('renders compound header, body, and footer regions', () => {
    renderOpenModal();
    expect(document.querySelector('.modal__header')).toBeInTheDocument();
    expect(document.querySelector('.modal__body')).toBeInTheDocument();
    expect(document.querySelector('.modal__footer')).toBeInTheDocument();
  });

  it('locks body scroll while open', async () => {
    renderOpenModal();
    await waitFor(() => {
      expect(document.body.style.overflow).toBe('hidden');
      expect(document.body.style.position).toBe('fixed');
    });
  });

  it('returns focus to trigger on close', async () => {
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.textContent = 'Open';
    document.body.appendChild(trigger);
    trigger.focus();

    const triggerRef = { current: trigger };
    const onClose = vi.fn();
    const { rerender } = render(
      <Modal open onClose={onClose} titleId="modal-title" triggerRef={triggerRef}>
        <Modal.Header>
          <h2 id="modal-title">{MODAL_DEMO_TITLE}</h2>
          <Modal.CloseButton />
        </Modal.Header>
        <Modal.Body>{MODAL_DEMO_BODY}</Modal.Body>
      </Modal>,
    );

    rerender(
      <Modal open={false} onClose={onClose} titleId="modal-title" triggerRef={triggerRef}>
        <Modal.Header>
          <h2 id="modal-title">{MODAL_DEMO_TITLE}</h2>
          <Modal.CloseButton />
        </Modal.Header>
        <Modal.Body>{MODAL_DEMO_BODY}</Modal.Body>
      </Modal>,
    );

    await waitFor(
      () => {
        expect(document.activeElement).toBe(trigger);
      },
      { timeout: 3000 },
    );

    trigger.remove();
  });

  it('is accessible — has no a11y violations', async () => {
    renderOpenModal();
    const dialog = screen.getByRole('dialog');
    expect(await axe(dialog)).toHaveNoViolations();
  });
});
