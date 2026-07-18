import { z } from 'zod';

export const FooterShortcutSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1).max(32),
  key: z.string().min(1).max(8),
  action: z.enum(['commandPalette', 'logTransaction']),
});

// The footer no longer carries its own status metrics — it mirrors the header's
// pulseStrip.metrics (same numbers, same labels) and only becomes visible once the
// pulse strip has scrolled out of view, so it never shows the same figures at once.
export const AppFooterConfigSchema = z.object({
  shortcuts: z.array(FooterShortcutSchema).min(1).max(4),
});

export type AppFooterConfig = z.infer<typeof AppFooterConfigSchema>;
export type FooterShortcut = z.infer<typeof FooterShortcutSchema>;
