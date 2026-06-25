import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { fn } from 'storybook/test';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  chromaticBaseline,
  storySectionStyle,
  viewportMobile,
  viewportTablet,
} from '@/components/ui/storyLayout';
import {
  MODAL_DEMO_BODY,
  MODAL_DEMO_DELETE_BODY,
  MODAL_DEMO_DELETE_TITLE,
  MODAL_DEMO_TITLE,
} from '@/constants/modal';
import { Modal } from './Modal';

const meta: Meta<typeof Modal> = {
  title: 'UI/Modal',
  component: Modal,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen', ...chromaticBaseline },
  args: {
    open: true,
    onClose: fn(),
    titleId: 'modal-demo-title',
  },
};

export default meta;
type Story = StoryObj<typeof Modal>;

function ModalDemoContent({ title = MODAL_DEMO_TITLE }: { title?: string }) {
  return (
    <>
      <Modal.Header>
        <h2 id="modal-demo-title" className="modal__title">
          {title}
        </h2>
        <Modal.CloseButton />
      </Modal.Header>
      <Modal.Body>
        <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>{MODAL_DEMO_BODY}</p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="ghost">Cancel</Button>
        <Button variant="primary">Continue</Button>
      </Modal.Footer>
    </>
  );
}

export const Default: Story = {
  parameters: chromaticBaseline,
  render: (args) => (
    <Modal {...args}>
      <ModalDemoContent />
    </Modal>
  ),
};

export const WithActions: Story = {
  parameters: chromaticBaseline,
  render: (args) => (
    <Modal {...args} titleId="modal-delete-title">
      <Modal.Header>
        <h2 id="modal-delete-title" className="modal__title">
          {MODAL_DEMO_DELETE_TITLE}
        </h2>
        <Modal.CloseButton />
      </Modal.Header>
      <Modal.Body>
        <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>{MODAL_DEMO_DELETE_BODY}</p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="ghost" onClick={args.onClose}>
          Cancel
        </Button>
        <Button variant="danger" onClick={args.onClose}>
          Delete
        </Button>
      </Modal.Footer>
    </Modal>
  ),
};

export const FullScreen: Story = {
  parameters: chromaticBaseline,
  args: { isFullScreen: true },
  render: (args) => (
    <Modal {...args}>
      <ModalDemoContent title="Full-screen modal" />
    </Modal>
  ),
};

export const WithForm: Story = {
  parameters: chromaticBaseline,
  render: (args) => (
    <Modal {...args} titleId="modal-form-title">
      <Modal.Header>
        <h2 id="modal-form-title" className="modal__title">
          Edit budget line
        </h2>
        <Modal.CloseButton />
      </Modal.Header>
      <Modal.Body>
        <form
          style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}
          onSubmit={(event) => event.preventDefault()}
        >
          <Input label="Title" defaultValue="Rent" required />
          <Input label="Planned (minor units)" type="number" defaultValue={185000} min={0} />
          <Input label="Notes" defaultValue="Due on the 1st" />
        </form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="ghost" onClick={args.onClose}>
          Cancel
        </Button>
        <Button variant="primary">Save</Button>
      </Modal.Footer>
    </Modal>
  ),
};

export const Controlled: Story = {
  parameters: chromaticBaseline,
  render: function ControlledModalStory() {
    const [open, setOpen] = useState(false);

    return (
      <div style={{ ...storySectionStyle, minHeight: '20rem' }}>
        <Button variant="primary" onClick={() => setOpen(true)}>
          Open modal
        </Button>
        <Modal open={open} onClose={() => setOpen(false)} titleId="modal-controlled-title">
          <Modal.Header>
            <h2 id="modal-controlled-title" className="modal__title">
              Controlled example
            </h2>
            <Modal.CloseButton />
          </Modal.Header>
          <Modal.Body>
            <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>
              Toggle with the button, Escape, backdrop click, or the close control.
            </p>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Dismiss
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    );
  },
};

export const Closed: Story = {
  args: { open: false },
  render: (args) => (
    <Modal {...args}>
      <ModalDemoContent />
    </Modal>
  ),
};

export const Mobile: Story = {
  parameters: { ...chromaticBaseline, ...viewportMobile },
  render: (args) => (
    <Modal {...args}>
      <ModalDemoContent title="Mobile bottom sheet" />
    </Modal>
  ),
};

export const Tablet: Story = {
  parameters: { ...chromaticBaseline, ...viewportTablet },
  render: (args) => (
    <Modal {...args}>
      <ModalDemoContent />
    </Modal>
  ),
};

export const DarkMode: Story = {
  parameters: chromaticBaseline,
  decorators: [
    (Story) => (
      <div data-theme="dark" style={storySectionStyle}>
        <Story />
      </div>
    ),
  ],
  render: (args) => (
    <Modal {...args}>
      <ModalDemoContent />
    </Modal>
  ),
};
