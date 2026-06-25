import { AppIcons, Icon } from '@/components/ui/Icon';
import { ImagePlaceholder } from '@/components/ui/MediaImage';
import {
  chromaticBaseline,
  storyGridStyle,
  storySectionStyle,
  viewportMobile,
  viewportTablet,
} from '@/components/ui/storyLayout';
import { IMAGE_ASPECTS } from '@/constants/media';
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta = {
  title: 'Design System/Images, Icons & Illustration',
  parameters: {
    layout: 'padded',
    ...chromaticBaseline,
    docs: {
      description: {
        component: 'Consistent visual language across icons, images, and illustration guidelines.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

function GuidelineCard({
  title,
  tone,
  items,
}: {
  title: string;
  tone: 'do' | 'dont' | 'guide';
  items: string[];
}) {
  const border =
    tone === 'do'
      ? 'var(--color-success)'
      : tone === 'dont'
        ? 'var(--color-error)'
        : 'var(--color-brand)';

  return (
    <section
      style={{
        padding: 'var(--space-4)',
        border: `var(--border-width) solid ${border}`,
        borderRadius: 'var(--radius-lg)',
        background: 'var(--color-bg-surface)',
      }}
    >
      <h3 className="type-h5" style={{ margin: '0 0 var(--space-3)', color: border }}>
        {title}
      </h3>
      <ul
        style={{ margin: 0, paddingLeft: 'var(--space-5)', display: 'grid', gap: 'var(--space-2)' }}
      >
        {items.map((item) => (
          <li key={item} className="type-body" style={{ margin: 0 }}>
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}

function OverviewPanel() {
  return (
    <div style={{ ...storySectionStyle, maxWidth: 'calc(64 * var(--space-4))', padding: 0 }}>
      <section>
        <h2 className="type-h4" style={{ margin: '0 0 var(--space-2)' }}>
          Icon system — Lucide React
        </h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-6)' }}>
          {[
            { label: 'Home', icon: AppIcons.home },
            { label: 'Card', icon: AppIcons.card },
            { label: 'Chart', icon: AppIcons.chart },
            { label: 'Bell', icon: AppIcons.bell },
            { label: 'Settings', icon: AppIcons.settings },
            { label: 'Profile', icon: AppIcons.profile },
          ].map(({ label, icon }) => (
            <div
              key={label}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 'var(--space-2)',
              }}
            >
              <Icon icon={icon} size="md" tone="brand" />
              <span className="type-caption">{label}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="type-h4" style={{ margin: '0 0 var(--space-3)' }}>
          Image treatments
        </h2>
        <div style={storyGridStyle}>
          {(Object.keys(IMAGE_ASPECTS) as (keyof typeof IMAGE_ASPECTS)[]).map((aspect) => (
            <ImagePlaceholder
              key={aspect}
              aspect={aspect}
              radius="md"
              label={IMAGE_ASPECTS[aspect].label}
            />
          ))}
        </div>
      </section>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 16rem), 1fr))',
          gap: 'var(--space-4)',
        }}
      >
        <GuidelineCard
          title="DO"
          tone="do"
          items={[
            'Use Lucide icons consistently',
            'Use semantic token colors for icon tints',
            'Keep 1.5px stroke weight',
            'Use SVG placeholder with text for missing images',
            'Always provide alt text on images',
            'Use object-fit: cover on images',
          ]}
        />
        <GuidelineCard
          title="DON'T"
          tone="dont"
          items={[
            "Don't mix icon libraries",
            "Don't use emojis as functional icons",
            "Don't stretch or distort images",
            "Don't hardcode icon colors — use currentColor",
            "Don't use PNG for UI icons — SVG only",
            "Don't serve images >1200px wide without lazy loading",
          ]}
        />
        <GuidelineCard
          title="GUIDELINES"
          tone="guide"
          items={[
            'Category icons: consistent emoji set or custom SVG',
            'Avatars: initials fallback when image unavailable',
            'Charts: recharts or d3 with brand palette',
            'Loading: skeleton loaders (not spinners except buttons)',
            'Illustrations: flat geometric, brand colors, no gradients',
            'Lazy loading: IntersectionObserver or Next/Image',
          ]}
        />
      </div>
    </div>
  );
}

/** Chromatic baseline — full visual language board */
export const Overview: Story = {
  parameters: chromaticBaseline,
  render: () => <OverviewPanel />,
};

export const Mobile: Story = {
  parameters: { ...chromaticBaseline, ...viewportMobile },
  render: () => <OverviewPanel />,
};

export const Tablet: Story = {
  parameters: { ...chromaticBaseline, ...viewportTablet },
  render: () => <OverviewPanel />,
};
