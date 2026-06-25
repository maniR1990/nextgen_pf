import type { Meta, StoryObj } from '@storybook/react';
import { IMAGE_ASPECTS, IMAGE_RADII, type ImageAspect, type ImageRadius } from '@/constants/media';
import {
  chromaticBaseline,
  storyRowStyle,
  storySectionStyle,
  viewportDesktop,
  viewportMobile,
} from '@/components/ui/storyLayout';
import { ImagePlaceholder } from './ImagePlaceholder';
import { MediaImage } from './MediaImage';

const meta: Meta<typeof MediaImage> = {
  title: 'Design System/Images',
  component: MediaImage,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    ...chromaticBaseline,
    docs: {
      description: {
        component:
          'Image treatments — aspect ratios, border radii, striped SVG placeholders, object-fit cover.',
      },
    },
  },
  args: {
    alt: 'Product Image',
    aspect: '3-2',
    radius: 'md',
    placeholderLabel: 'Product Image — 400 × 300',
  },
};

export default meta;
type Story = StoryObj<typeof MediaImage>;

export const Placeholder: Story = {
  parameters: chromaticBaseline,
  render: (args) => (
    <div style={{ maxWidth: 'calc(25 * var(--space-4))' }}>
      <MediaImage {...args} />
    </div>
  ),
};

function AspectRatiosPanel() {
  return (
    <div
      style={{
        ...storySectionStyle,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 12rem), 1fr))',
        padding: 0,
      }}
    >
      {(Object.keys(IMAGE_ASPECTS) as ImageAspect[]).map((aspect) => (
        <div key={aspect}>
          <p className="type-label" style={{ margin: '0 0 var(--space-2)' }}>
            {IMAGE_ASPECTS[aspect].label} ({aspect.replace('-', ':')})
          </p>
          <ImagePlaceholder aspect={aspect} radius="md" label={IMAGE_ASPECTS[aspect].label} />
        </div>
      ))}
    </div>
  );
}

export const AspectRatios: Story = {
  parameters: chromaticBaseline,
  render: () => <AspectRatiosPanel />,
};

export const BorderRadii: Story = {
  parameters: chromaticBaseline,
  render: () => (
    <div style={{ ...storyRowStyle, alignItems: 'flex-end' }}>
      {IMAGE_RADII.map((radius: ImageRadius) => (
        <div key={radius} style={{ width: 'calc(16 * var(--space-4))' }}>
          <p className="type-caption" style={{ margin: '0 0 var(--space-2)', textAlign: 'center' }}>
            {radius}
          </p>
          <ImagePlaceholder aspect="1-1" radius={radius} label={`${radius} radius`} />
        </div>
      ))}
    </div>
  ),
};

export const Mobile: Story = {
  parameters: { ...chromaticBaseline, ...viewportMobile },
  render: () => <AspectRatiosPanel />,
};

export const Desktop: Story = {
  parameters: { ...chromaticBaseline, ...viewportDesktop },
  render: () => <AspectRatiosPanel />,
};
