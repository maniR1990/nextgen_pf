import { CategoryHierarchyConfigSchema } from '@/components/common/CategoryHierarchy/schemas';
import {
  SETTINGS_DEFAULT_ARIA_LABEL,
  SETTINGS_DEFAULT_TAB_ID,
  SETTINGS_PANEL_TYPES,
} from '@/constants/settings';
import { z } from 'zod';

export const SettingsTabSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1).max(32),
  disabled: z.boolean().optional(),
  crud: z.boolean().default(false),
  panel: z.object({
    type: z.enum(SETTINGS_PANEL_TYPES as unknown as [string, ...string[]]),
    hierarchy: CategoryHierarchyConfigSchema,
  }),
});

export const SettingsPageConfigSchema = z
  .object({
    ariaLabel: z.string().min(1).default(SETTINGS_DEFAULT_ARIA_LABEL),
    defaultTabId: z.string().min(1).default(SETTINGS_DEFAULT_TAB_ID),
    tabs: z.array(SettingsTabSchema).min(1),
  })
  .superRefine((config, ctx) => {
    const tabIds = new Set(config.tabs.map((tab) => tab.id));

    if (!tabIds.has(config.defaultTabId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'defaultTabId must match a tab id',
        path: ['defaultTabId'],
      });
    }
  });

export type SettingsPageConfigJson = z.infer<typeof SettingsPageConfigSchema>;
export type SettingsTabJson = z.infer<typeof SettingsTabSchema>;
