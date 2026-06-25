import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { StorybookConfig } from '@storybook/nextjs-vite';
import tsconfigPaths from 'vite-tsconfig-paths';

const storybookDir =
  typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(storybookDir, '..');
const srcPath = path.resolve(projectRoot, 'src');

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-docs', '@chromatic-com/storybook'],
  framework: '@storybook/nextjs-vite',
  staticDirs: ['../public'],
  viteFinal: async (viteConfig) => {
    viteConfig.plugins = [...(viteConfig.plugins ?? []), tsconfigPaths({ root: projectRoot })];

    const aliasEntry = { find: /^@\//, replacement: `${srcPath}/` };
    const existing = viteConfig.resolve?.alias;

    if (Array.isArray(existing)) {
      viteConfig.resolve = {
        ...viteConfig.resolve,
        alias: [aliasEntry, ...existing],
      };
    } else {
      viteConfig.resolve = {
        ...viteConfig.resolve,
        alias: {
          ...(existing && typeof existing === 'object' ? existing : {}),
          '@': srcPath,
        },
      };
    }

    return viteConfig;
  },
};

export default config;
