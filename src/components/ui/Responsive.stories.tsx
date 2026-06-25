import type { Meta, StoryObj } from '@storybook/react';
import { BREAKPOINT_ORDER, BREAKPOINTS, MOBILE_DESIGN_WIDTH } from '@/constants/breakpoints';
import {
  chromaticBaseline,
  storySectionStyle,
  viewportDesktop,
  viewportLg,
  viewportMobile,
  viewportTablet,
  viewportXl,
} from '@/components/ui/storyLayout';

const meta: Meta = {
  title: 'Design System/Responsive',
  parameters: {
    layout: 'padded',
    ...chromaticBaseline,
    docs: {
      description: {
        component:
          'Mobile-first responsive system. Build for 375px first, then progressively enhance upward.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

const BP_COLORS: Record<string, string> = {
  xs: 'var(--color-error)',
  sm: 'var(--color-warning)',
  md: 'var(--color-warning)',
  lg: 'var(--color-success)',
  xl: 'var(--color-brand)',
  '2xl': 'var(--color-accent)',
};

function GridBlock({ label }: { label: string }) {
  return (
    <div
      style={{
        padding: 'var(--space-3)',
        borderRadius: 'var(--radius-md)',
        background: 'color-mix(in srgb, var(--color-brand) 18%, var(--color-bg-surface))',
        color: 'var(--color-brand)',
        fontSize: 'var(--font-size-sm)',
        fontWeight: 'var(--font-weight-semibold)',
        textAlign: 'center',
      }}
    >
      {label}
    </div>
  );
}

function BreakpointsTable() {
  return (
    <table className="table" style={{ maxWidth: 'calc(64 * var(--space-4))' }}>
      <thead>
        <tr>
          <th className="table__head-cell">Name</th>
          <th className="table__head-cell">SCSS</th>
          <th className="table__head-cell">Min-width</th>
          <th className="table__head-cell">Target</th>
        </tr>
      </thead>
      <tbody>
        {BREAKPOINT_ORDER.map((name) => (
          <tr key={name} className="table__row">
            <td className="table__cell" style={{ color: BP_COLORS[name] }}>
              {name}
              {name === 'xl' ? ' ★' : ''}
            </td>
            <td className="table__cell table__cell--mono">{`$bp-${name}`}</td>
            <td className="table__cell table__cell--mono">{BREAKPOINTS[name]}px</td>
            <td className="table__cell">
              {name === 'xs' && 'Small phones'}
              {name === 'sm' && 'Large phones'}
              {name === 'md' && 'Tablets'}
              {name === 'lg' && 'Small laptops'}
              {name === 'xl' && 'Desktops (default)'}
              {name === '2xl' && 'Large monitors'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function GridDemos() {
  return (
    <div style={{ ...storySectionStyle, padding: 0 }}>
      <section>
        <h3 className="type-h5" style={{ margin: '0 0 var(--space-3)' }}>
          1 col — full
        </h3>
        <div className="grid">
          <div className="grid__col--full">
            <GridBlock label="full" />
          </div>
        </div>
      </section>

      <section>
        <h3 className="type-h5" style={{ margin: '0 0 var(--space-3)' }}>
          2 cols — 1/2
        </h3>
        <div className="grid">
          <div className="grid__col--half">
            <GridBlock label="1/2" />
          </div>
          <div className="grid__col--half">
            <GridBlock label="1/2" />
          </div>
        </div>
      </section>

      <section>
        <h3 className="type-h5" style={{ margin: '0 0 var(--space-3)' }}>
          3 cols — 1/3
        </h3>
        <div className="grid">
          {[1, 2, 3].map((n) => (
            <div key={n} className="grid__col--third">
              <GridBlock label="1/3" />
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="type-h5" style={{ margin: '0 0 var(--space-3)' }}>
          4 cols — 1/4
        </h3>
        <div className="grid">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="grid__col--quarter">
              <GridBlock label="1/4" />
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="type-h5" style={{ margin: '0 0 var(--space-3)' }}>
          8/4 split — main + aside
        </h3>
        <div className="grid">
          <div className="grid__col--main-8">
            <GridBlock label="main (8)" />
          </div>
          <div className="grid__col--aside-4">
            <GridBlock label="aside (4)" />
          </div>
        </div>
      </section>

      <section>
        <h3 className="type-h5" style={{ margin: '0 0 var(--space-3)' }}>
          Sidebar — 220px + fluid
        </h3>
        <div className="grid--sidebar">
          <aside className="grid__sidebar">
            <GridBlock label="sidebar (220px)" />
          </aside>
          <div className="grid__main">
            <GridBlock label="main content (fluid)" />
          </div>
        </div>
      </section>
    </div>
  );
}

function TypographyScale() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <h1 className="type-h1">Heading 1 — responsive scale</h1>
      <p className="type-caption" style={{ margin: 0 }}>
        Mobile {MOBILE_DESIGN_WIDTH}px: 24px · Tablet md: 28px · Desktop xl: 36px
      </p>
    </div>
  );
}

function ComponentBehavior() {
  return (
    <table className="table">
      <thead>
        <tr>
          <th className="table__head-cell">Component</th>
          <th className="table__head-cell">Mobile (xs–sm)</th>
          <th className="table__head-cell">Tablet (md)</th>
          <th className="table__head-cell">Desktop (lg+)</th>
        </tr>
      </thead>
      <tbody>
        {[
          ['Navigation', 'Bottom tab bar', 'Icon sidebar', 'Full sidebar + labels'],
          ['Grid', '1 column', '2 columns', '3–4 columns + sidebar'],
          ['Data table', 'Horizontal scroll', '4 columns', 'All columns'],
          ['Modals', 'Full-screen sheet', '480px centered', '560px centered'],
          ['Forms', 'Stacked fields', 'Stacked fields', '2-column fields'],
          ['Stats cards', '2×2 grid', '2×2 grid', '4 in a row'],
          ['Typography h1', '24px', '28px', '36px'],
          ['Touch targets', '44×44px min', '36×36px', '32×32px'],
        ].map(([component, mobile, tablet, desktop]) => (
          <tr key={component} className="table__row">
            <td className="table__cell">{component}</td>
            <td className="table__cell">{mobile}</td>
            <td className="table__cell">{tablet}</td>
            <td className="table__cell">{desktop}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Chromatic baseline — breakpoint reference */
export const Breakpoints: Story = {
  parameters: chromaticBaseline,
  render: () => <BreakpointsTable />,
};

/** Chromatic baseline — 12-column grid layouts */
export const Grid: Story = {
  parameters: chromaticBaseline,
  render: () => <GridDemos />,
};

export const Typography: Story = {
  parameters: chromaticBaseline,
  render: () => <TypographyScale />,
};

export const ComponentRules: Story = {
  parameters: chromaticBaseline,
  render: () => <ComponentBehavior />,
};

export const Mobile: Story = {
  parameters: { ...chromaticBaseline, ...viewportMobile },
  render: () => (
    <div style={storySectionStyle}>
      <GridDemos />
      <TypographyScale />
    </div>
  ),
};

export const Tablet: Story = {
  parameters: { ...chromaticBaseline, ...viewportTablet },
  render: () => (
    <div style={storySectionStyle}>
      <GridDemos />
      <TypographyScale />
    </div>
  ),
};

export const Desktop: Story = {
  parameters: { ...chromaticBaseline, ...viewportDesktop },
  render: () => (
    <div style={storySectionStyle}>
      <GridDemos />
      <TypographyScale />
    </div>
  ),
};

export const LargeDesktop: Story = {
  parameters: { ...chromaticBaseline, ...viewportLg },
  render: () => <GridDemos />,
};

export const WideScreen: Story = {
  parameters: { ...chromaticBaseline, ...viewportXl },
  render: () => <GridDemos />,
};
