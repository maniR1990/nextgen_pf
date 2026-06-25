import type { Preview } from '@storybook/react';
import { initialize, mswLoader } from 'msw-storybook-addon';
import { BREAKPOINTS, MOBILE_DESIGN_WIDTH } from '../src/constants/breakpoints';
import '../src/styles/fonts';
import '../src/styles/globals.scss';

initialize();

const preview: Preview = {
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    msw: { handlers: [] },
    chromatic: {
      disableSnapshot: false,
      diffThreshold: 0.2,
    },
    viewport: {
      viewports: {
        xs: {
          name: `xs (${BREAKPOINTS.xs}px)`,
          styles: { width: `${BREAKPOINTS.xs}px`, height: '568px' },
          type: 'mobile',
        },
        mobile375: {
          name: `Mobile (${MOBILE_DESIGN_WIDTH}px)`,
          styles: { width: `${MOBILE_DESIGN_WIDTH}px`, height: '667px' },
          type: 'mobile',
        },
        sm: {
          name: `sm (${BREAKPOINTS.sm}px)`,
          styles: { width: `${BREAKPOINTS.sm}px`, height: '800px' },
          type: 'tablet',
        },
        md: {
          name: `md (${BREAKPOINTS.md}px)`,
          styles: { width: `${BREAKPOINTS.md}px`, height: '1024px' },
          type: 'tablet',
        },
        lg: {
          name: `lg (${BREAKPOINTS.lg}px)`,
          styles: { width: `${BREAKPOINTS.lg}px`, height: '768px' },
          type: 'desktop',
        },
        xl: {
          name: `xl (${BREAKPOINTS.xl}px) ★`,
          styles: { width: `${BREAKPOINTS.xl}px`, height: '800px' },
          type: 'desktop',
        },
        '2xl': {
          name: `2xl (${BREAKPOINTS['2xl']}px)`,
          styles: { width: `${BREAKPOINTS['2xl']}px`, height: '900px' },
          type: 'desktop',
        },
      },
      defaultViewport: 'mobile375',
    },
  },
  loaders: [mswLoader],
};

export default preview;
