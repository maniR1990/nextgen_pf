import type { Meta, StoryObj } from '@storybook/react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Button, type ButtonVariant } from './Button';

function GearIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  );
}

const VARIANTS: { variant: ButtonVariant; label: string }[] = [
  { variant: 'primary', label: 'Primary' },
  { variant: 'secondary', label: 'Secondary' },
  { variant: 'ghost', label: 'Ghost' },
  { variant: 'danger', label: 'Danger' },
  { variant: 'success', label: 'Success' },
  { variant: 'neutral', label: 'Neutral' },
];

const storyRowStyle = {
  display: 'flex',
  flexWrap: 'wrap' as const,
  gap: 'var(--space-4)',
  alignItems: 'center',
};

const storySectionStyle = {
  display: 'flex',
  flexDirection: 'column' as const,
  gap: 'var(--space-6)',
  padding: 'var(--space-6)',
};

const chromaticBaseline = {
  chromatic: { disableSnapshot: false },
};

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    ...chromaticBaseline,
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost', 'danger', 'success', 'neutral'],
    },
    size: { control: 'radio', options: ['sm', 'md', 'lg', 'icon'] },
    shape: { control: 'radio', options: ['default', 'pill'] },
    visualState: { control: 'select', options: [undefined, 'hover', 'focus'] },
  },
  args: {
    children: 'Button',
    variant: 'primary',
    size: 'md',
    shape: 'default',
    loading: false,
    disabled: false,
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Playground: Story = {
  args: { children: 'Primary' },
};

/** Chromatic baseline — all variants */
export const Variants: Story = {
  parameters: {
    ...chromaticBaseline,
    docs: { description: { story: 'Primary, Secondary, Ghost, Danger, Success, Neutral.' } },
  },
  render: () => (
    <div style={storyRowStyle}>
      {VARIANTS.map(({ variant, label }) => (
        <Button key={variant} variant={variant}>
          {label}
        </Button>
      ))}
    </div>
  ),
};

/** Chromatic baseline — size scale */
export const Sizes: Story = {
  parameters: {
    ...chromaticBaseline,
    docs: { description: { story: 'Small, Medium, Large, Icon-only, Pill.' } },
  },
  render: () => (
    <div style={storyRowStyle}>
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
      <Button size="icon" variant="neutral" aria-label="Settings">
        <GearIcon />
      </Button>
      <Button shape="pill">Pill</Button>
    </div>
  ),
};

/** Chromatic baseline — interaction states */
export const States: Story = {
  parameters: {
    ...chromaticBaseline,
    docs: { description: { story: 'Default, Hover, Focus, Loading, Disabled.' } },
  },
  render: () => (
    <div style={storyRowStyle}>
      <Button>Default</Button>
      <Button visualState="hover">Hover</Button>
      <Button visualState="focus">Focus</Button>
      <Button loading>Loading</Button>
      <Button disabled>Disabled</Button>
    </div>
  ),
};

export const AllVariantsMatrix: Story = {
  parameters: chromaticBaseline,
  render: () => (
    <div style={storySectionStyle}>
      {VARIANTS.map(({ variant, label }) => (
        <div key={variant} style={storyRowStyle}>
          <Button variant={variant} size="sm">
            {label} SM
          </Button>
          <Button variant={variant}>{label}</Button>
          <Button variant={variant} size="lg">
            {label} LG
          </Button>
          <Button variant={variant} disabled>
            Disabled
          </Button>
          <Button variant={variant} loading>
            Loading
          </Button>
        </div>
      ))}
    </div>
  ),
};

export const DarkMode: Story = {
  parameters: {
    ...chromaticBaseline,
    backgrounds: { default: 'dark' },
  },
  decorators: [
    (Story) => (
      <div data-theme="dark" style={{ padding: 'var(--space-6)' }}>
        <Story />
      </div>
    ),
  ],
  render: () => (
    <div style={storyRowStyle}>
      {VARIANTS.map(({ variant, label }) => (
        <Button key={variant} variant={variant}>
          {label}
        </Button>
      ))}
    </div>
  ),
};

export const ClickInteraction: Story = {
  args: { children: 'Submit', onClick: fn() },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button'));
    await expect(args.onClick).toHaveBeenCalledOnce();
  },
};
