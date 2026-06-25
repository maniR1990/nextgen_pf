import { z } from 'zod';

export const FooterItemSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1).max(32),
  dataKey: z.string().min(1),
  changeKey: z.string().optional(),
  unit: z.string().optional(),
  badge: z.string().optional(),
  format: z.enum(['currency-inr', 'currency-inr-compact', 'days', 'number']).optional(),
  href: z.string().optional(),
});

export const FooterShortcutSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1).max(32),
  key: z.string().min(1).max(8),
  action: z.enum(['commandPalette', 'logTransaction']),
});

export const AppFooterConfigSchema = z.object({
  collapseAfterMs: z.number().int().positive(),
  items: z.array(FooterItemSchema).min(1).max(8),
  shortcuts: z.array(FooterShortcutSchema).min(1).max(4),
});

export type AppFooterConfig = z.infer<typeof AppFooterConfigSchema>;
export type FooterItem = z.infer<typeof FooterItemSchema>;
export type FooterShortcut = z.infer<typeof FooterShortcutSchema>;
