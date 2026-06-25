import rawConfig from '@/config/settingsPage.json';
import { describe, expect, it } from 'vitest';
import { SettingsPageConfigSchema } from './schemas';

describe('settingsPage.json', () => {
  it('parses with empty accounts hierarchy nodes (API-backed tab)', () => {
    expect(() => SettingsPageConfigSchema.parse(rawConfig)).not.toThrow();
    const config = SettingsPageConfigSchema.parse(rawConfig);
    expect(config.tabs[0]?.id).toBe('accounts');
    expect(config.tabs[0]?.panel.hierarchy.nodes).toEqual([]);
  });
});
